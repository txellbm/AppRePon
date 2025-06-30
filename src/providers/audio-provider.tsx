"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { textToSpeechAction } from '@/lib/actions';

interface AudioContextType {
  isAudioEnabled: boolean;
  toggleAudio: () => void;
  playAudio: (text: string, onEnd?: () => void) => void;
}

interface AudioQueueItem {
    text: string;
    onEnd?: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

// Helper function to decode Base64 to ArrayBuffer
const base64ToArrayBuffer = (base64: string) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};


export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [queue, setQueue] = useState<AudioQueueItem[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Load user preference from localStorage once on mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('repon-audio-enabled');
      if (saved !== null) {
        setIsAudioEnabled(JSON.parse(saved));
      }
    } catch (error) {
      console.warn("Could not access localStorage for audio settings");
    }
  }, []);

  // Function to initialize or resume the AudioContext.
  // This must be called after a user gesture.
  const initOrResumeAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!audioContextRef.current) {
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.", e);
        }
    }
    
    // If the context is suspended, try to resume it.
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }
  }, []);

  // Effect to add a one-time event listener for the first user interaction.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('click', initOrResumeAudioContext, { once: true });
    window.addEventListener('touchend', initOrResumeAudioContext, { once: true });

    return () => {
      window.removeEventListener('click', initOrResumeAudioContext);
      window.removeEventListener('touchend', initOrResumeAudioContext);
    }
  }, [initOrResumeAudioContext]);


  const toggleAudio = useCallback(() => {
    setIsAudioEnabled(prev => {
      const newState = !prev;
      try {
         localStorage.setItem('repon-audio-enabled', JSON.stringify(newState));
      } catch (error) {
        console.warn("Could not access localStorage for audio settings");
      }
      if (!newState) {
          // If disabling, clear the queue
          setQueue([]);
      }
      return newState;
    });
  }, []);

  const playAudio = useCallback((text: string, onEnd?: () => void) => {
     // Ensure the context is active when we try to play.
    initOrResumeAudioContext();
    if (isAudioEnabled) {
      setQueue(q => [...q, { text, onEnd }]);
    } else {
      // If audio is disabled, call onEnd immediately.
      onEnd?.();
    }
  }, [isAudioEnabled, initOrResumeAudioContext]);
  
  useEffect(() => {
    if (isPlaying || queue.length === 0 || !isAudioEnabled) {
      return;
    }

    const processQueue = async () => {
      // Double check everything before processing
      if (queue.length === 0 || isPlaying || !audioContextRef.current) return;

       // If the context got suspended again, try to resume it.
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // If it's still not running, we can't play audio.
      if (audioContextRef.current.state !== 'running') {
        console.warn("AudioContext is not running. Cannot play audio.");
        setQueue(q => q.slice(1)); // Discard the item
        return;
      }

      setIsPlaying(true);
      const { text, onEnd } = queue[0];
      
      const cleanup = () => {
        setQueue(q => q.slice(1));
        setIsPlaying(false);
        onEnd?.();
      };
      
      try {
        const result = await textToSpeechAction({ text });
        const audioDataUri = result?.audioDataUri;
        
        if (!audioDataUri || !audioContextRef.current) {
          cleanup();
          return;
        }

        const base64Data = audioDataUri.split(',')[1];
        const pcmDataArrayBuffer = base64ToArrayBuffer(base64Data);

        // Gemini TTS returns 1-channel, 16-bit PCM audio at a 24000Hz sample rate.
        const sampleRate = 24000;
        const numberOfChannels = 1;
        
        // Create an Int16Array view on the ArrayBuffer
        const pcmData = new Int16Array(pcmDataArrayBuffer);
        
        // Create a new AudioBuffer
        const audioBuffer = audioContextRef.current.createBuffer(
            numberOfChannels,
            pcmData.length,
            sampleRate
        );

        // Get the channel data
        const channelData = audioBuffer.getChannelData(0);

        // Copy and normalize the PCM data to Float32
        for (let i = 0; i < pcmData.length; i++) {
            // Normalize from [-32768, 32767] to [-1.0, 1.0]
            channelData[i] = pcmData[i] / 32768.0;
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = cleanup;
        source.start();

      } catch (error) {
        console.error("Error generating or playing audio:", error);
        cleanup();
      }
    };
    
    processQueue();
  }, [queue, isPlaying, isAudioEnabled]);
  
  const value = { isAudioEnabled, toggleAudio, playAudio };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
