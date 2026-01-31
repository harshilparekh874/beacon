
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SvgIcons } from '../constants';
import { CARE_ASSISTANT_TOOLS, SYSTEM_INSTRUCTION } from '../geminiService';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { store } from '../db';

interface VoiceAssistantProps {
  onAction: (actionData: any) => any;
  role: string;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onAction, role }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
  const [transcript, setTranscript] = useState('');

  // Critical Ref to avoid stale closures in the WebSocket callbacks
  const onActionRef = useRef(onAction);
  useEffect(() => {
    onActionRef.current = onAction;
  }, [onAction]);

  const outCtxRef = useRef<AudioContext | null>(null);
  const inCtxRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);

  const stopAllAudio = () => {
    sourcesRef.current.forEach(s => {
      try { s.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const createBlob = (data: Float32Array, inputRate: number): Blob => {
    const targetRate = 16000;
    const ratio = inputRate / targetRate;
    const resampledLength = Math.round(data.length / ratio);
    const int16 = new Int16Array(resampledLength);

    for (let i = 0; i < resampledLength; i++) {
      const index = Math.floor(i * ratio);
      int16[i] = Math.max(-1, Math.min(1, data[index])) * 32768;
    }

    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const connect = async () => {
    try {
      setIsActive(true);
      setStatus('listening');

      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      outCtxRef.current = outCtx;
      inCtxRef.current = inCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const isDoctorActive = store.getState().systemConfig.virtualDoctorActive;
      const instruction = SYSTEM_INSTRUCTION + (isDoctorActive ? "\n\nACTING PERSONA: Virtual Medical Doctor. Be clinical and diagnostic." : "\n\nACTING PERSONA: Care Coordination Assistant. Be brief and logistical.");

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: CARE_ASSISTANT_TOOLS.functionDeclarations }],
          systemInstruction: instruction + ` SESSION_ROLE: ${role}.`,
          inputAudioTranscription: {},
          thinkingConfig: { thinkingBudget: 0 },
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: isDoctorActive ? 'Fenrir' : 'Zephyr' } },
          },
        },
        callbacks: {
          onopen: () => {
            const source = inCtx.createMediaStreamSource(stream);
            const scriptProcessor = inCtx.createScriptProcessor(2048, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData, inCtx.sampleRate);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              setTranscript(message.serverContent.inputTranscription.text);
            }
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              setStatus('speaking');
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(audioData), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outCtx.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
            if (message.toolCall) {
              setStatus('processing');
              const functionResponses = [];
              for (const fc of message.toolCall.functionCalls) {
                // Use Ref current to get latest closure
                const result = onActionRef.current({ functionName: fc.name, ...fc.args });
                functionResponses.push({
                  id: fc.id,
                  name: fc.name,
                  response: { result: result || "Action recorded." },
                });
              }
              sessionPromise.then((session) => {
                session.sendToolResponse({ functionResponses });
              });
            }
          },
          onclose: () => deactivate(),
          onerror: (e) => deactivate(),
        },
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      deactivate();
    }
  };

  const deactivate = () => {
    setIsActive(false);
    setStatus('idle');
    stopAllAudio();
    
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;

    // Fixed: Check state and clear ref to prevent double closing
    const inCtx = inCtxRef.current;
    if (inCtx) {
      inCtxRef.current = null;
      if (inCtx.state !== 'closed') {
        inCtx.close().catch(() => {});
      }
    }

    const outCtx = outCtxRef.current;
    if (outCtx) {
      outCtxRef.current = null;
      if (outCtx.state !== 'closed') {
        outCtx.close().catch(() => {});
      }
    }

    sessionPromiseRef.current?.then(s => {
      try { s.close(); } catch (e) {}
    });
    sessionPromiseRef.current = null;
  };

  const isMD = store.getState().systemConfig.virtualDoctorActive;

  return (
    <div className="fixed bottom-4 right-4 z-[100] pointer-events-none flex flex-col items-end gap-2">
      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-4 rounded border shadow-2xl w-80 pointer-events-auto transition-all duration-300 ${isMD ? 'bg-blue-900 border-blue-700 text-white' : 'bg-slate-900 border-slate-700 text-white'}`}
          >
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status === 'listening' ? 'bg-emerald-500 animate-pulse' : status === 'processing' ? 'bg-amber-500 animate-spin' : 'bg-blue-400'}`} />
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">
                  {isMD ? 'Virtual Doctor Console' : 'Operational AI link'}
                </span>
              </div>
              <span className="text-[8px] font-bold opacity-30 uppercase">Secure</span>
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-sm flex items-center justify-center border transition-colors ${status === 'speaking' ? 'bg-blue-600 border-blue-400' : 'bg-white/5 border-white/10'}`}>
                    {status === 'processing' ? (
                       <div className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin rounded-full" />
                    ) : (
                      <SvgIcons.Mic className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold opacity-40 uppercase leading-none mb-1 tracking-tighter">AI Processing</p>
                    <p className="text-xs font-bold uppercase tracking-widest">{status}</p>
                  </div>
               </div>
               
               {transcript && (
                 <div className={`p-3 rounded text-[11px] font-medium italic border-l-2 transition-all ${isMD ? 'bg-blue-800 border-white' : 'bg-slate-800 border-blue-500'}`}>
                   "{transcript}"
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => (isActive ? deactivate() : connect())}
        className={`w-14 h-14 rounded-full border shadow-xl transition-all active:scale-95 pointer-events-auto flex items-center justify-center ${isActive ? 'bg-rose-700 text-white border-rose-800' : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-50'}`}
      >
        <AnimatePresence mode="wait">
          {!isActive ? (
            <motion.div key="mic" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SvgIcons.Mic className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="close" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
};

export default VoiceAssistant;
