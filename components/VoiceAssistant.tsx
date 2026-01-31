
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SvgIcons } from '../constants';
import { CARE_ASSISTANT_TOOLS, SYSTEM_INSTRUCTION } from '../geminiService';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

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

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: CARE_ASSISTANT_TOOLS.functionDeclarations }],
          systemInstruction: SYSTEM_INSTRUCTION + ` Current role: ${role}.`,
          inputAudioTranscription: {},
          thinkingConfig: { thinkingBudget: 0 },
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
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
              for (const fc of message.toolCall.functionCalls) {
                const result = onAction({ functionName: fc.name, ...fc.args });
                sessionPromise.then((session) => {
                  session.sendToolResponse({
                    functionResponses: [{
                      id: fc.id,
                      name: fc.name,
                      response: { result: result || "Action verified." },
                    }]
                  });
                });
              }
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
    inCtxRef.current?.close();
    outCtxRef.current?.close();
    sessionPromiseRef.current?.then(s => s.close());
    sessionPromiseRef.current = null;
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] pointer-events-none flex flex-col items-end gap-2">
      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-900 text-white p-4 rounded border border-slate-700 shadow-2xl w-80 pointer-events-auto"
          >
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status === 'listening' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Audio Telemetry Link</span>
              </div>
              <span className="text-[8px] font-bold text-slate-500 uppercase">Encrpyted Channel</span>
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-sm flex items-center justify-center border ${status === 'speaking' ? 'bg-blue-900 border-blue-700' : 'bg-slate-800 border-slate-700'}`}>
                    {status === 'processing' ? (
                       <div className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin rounded-full" />
                    ) : (
                      <SvgIcons.Mic className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1 tracking-tighter">System Interface</p>
                    <p className="text-xs font-bold uppercase tracking-widest">{status}</p>
                  </div>
               </div>
               
               {transcript && (
                 <div className="p-3 bg-slate-800 rounded text-[11px] text-slate-300 font-medium italic border-l-2 border-blue-500">
                   "{transcript}"
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => (isActive ? deactivate() : connect())}
        className={`w-12 h-12 rounded border shadow-lg transition-all active:scale-95 pointer-events-auto flex items-center justify-center ${isActive ? 'bg-rose-700 text-white border-rose-800' : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-50'}`}
        aria-label="Toggle Clinical Audio Interface"
      >
        <AnimatePresence mode="wait">
          {!isActive ? (
            <motion.div key="mic" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SvgIcons.Mic className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div key="close" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
};

export default VoiceAssistant;
