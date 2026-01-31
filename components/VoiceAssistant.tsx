
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SvgIcons } from '../constants';
import { CARE_ASSISTANT_TOOLS, SYSTEM_INSTRUCTION } from '../geminiService';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

interface VoiceAssistantProps {
  onAction: (actionData: any) => any;
  role: string;
}

/**
 * Base64 encoding helper following strict guidelines.
 */
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Base64 decoding helper following strict guidelines.
 */
function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data returned from the API into an AudioBuffer.
 */
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

  /**
   * Resamples input data to 16kHz and creates a PCM Blob for the API.
   */
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

      // Initialize AudioContexts
      // Output: 24kHz as per API default
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      // Input: Hardware default to avoid NotSupportedError when connecting MediaStreamSource
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
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
        },
        callbacks: {
          onopen: () => {
            const source = inCtx.createMediaStreamSource(stream);
            const scriptProcessor = inCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              // Perform manual downsampling to 16kHz
              const pcmBlob = createBlob(inputData, inCtx.sampleRate);
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcription
            if (message.serverContent?.inputTranscription) {
              setTranscript(message.serverContent.inputTranscription.text);
            }

            // Handle Audio Playback
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

            // Handle Tool Calls
            if (message.toolCall) {
              setStatus('processing');
              for (const fc of message.toolCall.functionCalls) {
                const result = onAction({ action: fc.name.toUpperCase(), ...fc.args });
                sessionPromise.then((session) => {
                  session.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result: result || "Action complete." },
                    }
                  });
                });
              }
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              stopAllAudio();
              setStatus('listening');
            }
          },
          onclose: () => deactivate(),
          onerror: (e) => {
            console.error("Voice Assistant Error", e);
            deactivate();
          },
        },
      });

      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error("Connection failed", err);
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
    <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[100] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white p-5 rounded-[36px] shadow-2xl border border-indigo-100 w-60 pointer-events-auto relative overflow-hidden"
          >
            <motion.div 
              animate={{ opacity: status === 'speaking' ? [0.03, 0.1, 0.03] : 0.03 }}
              transition={{ duration: 1, repeat: Infinity }}
              className={`absolute inset-0 ${status === 'speaking' ? 'bg-indigo-600' : 'bg-emerald-500'}`}
            />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${status === 'listening' ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Care Intelligence</span>
              </div>
              
              <div className="relative h-16 w-16 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full blur-2xl opacity-30 ${status === 'speaking' ? 'bg-indigo-600' : 'bg-emerald-400'}`} />
                <div className={`w-full h-full rounded-full border-4 flex items-center justify-center transition-all duration-300 ${status === 'speaking' ? 'bg-indigo-600 border-indigo-200' : 'bg-emerald-500 border-emerald-100 shadow-xl'}`}>
                  {status === 'processing' ? (
                    <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24"><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"></path></svg>
                  ) : (
                    <SvgIcons.Mic className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>

              <div className="text-center w-full min-h-[40px] flex flex-col justify-center">
                <p className="text-[11px] font-black text-slate-900 uppercase italic tracking-tight mb-1">
                  {status === 'speaking' ? 'Clearwater AI' : status === 'listening' ? 'Listening...' : 'Thinking'}
                </p>
                {transcript && (
                  <p className="text-[10px] font-bold text-slate-400 line-clamp-2 leading-tight italic px-2">
                    "{transcript}"
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => (isActive ? deactivate() : connect())}
        className={`w-16 h-16 md:w-20 md:h-20 rounded-[32px] flex items-center justify-center shadow-2xl transition-all active:scale-90 pointer-events-auto border-4 border-white ${isActive ? 'bg-rose-500 rotate-45' : 'bg-indigo-600 hover:bg-indigo-700'}`}
      >
        <AnimatePresence mode="wait">
          {!isActive ? (
            <motion.div key="mic" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <SvgIcons.Mic className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </motion.div>
          ) : (
            <motion.div key="close" initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
              <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
};

export default VoiceAssistant;
