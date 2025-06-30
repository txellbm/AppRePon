
"use client";

import { useState, useEffect, useRef } from 'react';
import { useReponToast } from "@/hooks/use-repon-toast";

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  isSupported: boolean;
}

const useSpeechRecognition = (options?: { onResult: (transcript: string) => void }): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldKeepListeningRef = useRef(false);
  const { toast } = useReponToast({ audioDisabled: true });

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('El reconocimiento de voz no es compatible en este navegador.');
      toast({ title: "Comandos de voz no compatibles", description: "Tu navegador no es compatible con el reconocimiento de voz.", variant: "destructive" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'es-ES';
    recognition.interimResults = false;

    recognition.onstart = () => {
      console.log("🎤 El reconocimiento de voz ha comenzado.");
      setIsListening(true);
      setTranscript('');
      setError(null);
    };

    recognition.onend = () => {
      console.log("🛑 El reconocimiento de voz ha terminado.");
      setIsListening(false);
      if (shouldKeepListeningRef.current) {
        console.log("🔄 Reiniciando la escucha...");
        try {
          recognition.start();
        } catch (e) {
          console.error("Error al reiniciar el reconocimiento de voz:", e);
          shouldKeepListeningRef.current = false;
        }
      }
    };

    recognition.onerror = (event) => {
      // The 'no-speech' error is not a critical failure. It simply means the user
      // didn't say anything. We can log it for debugging but shouldn't treat it
      // as an application-breaking error. We return early to avoid showing a toast
      // and stopping the recognition loop.
      if (event.error === 'no-speech') {
        console.log("No se detectó voz. El reconocimiento puede continuar o reiniciarse automáticamente.");
        return;
      }

      console.error("💥 Error en el reconocimiento de voz:", event.error, event.message);
      setError(event.error);
       if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        toast({ title: "Permiso denegado", description: "Por favor, permite el acceso al micrófono en la configuración de tu navegador.", variant: "destructive" });
      } else if (event.error === 'audio-capture') {
        toast({ title: "Error de micrófono", description: "No se pudo capturar el audio. Revisa que otro programa no lo esté usando.", variant: "destructive" });
      } else {
        toast({ title: "Error de voz", description: `Ocurrió un error inesperado: ${event.error}`, variant: "destructive" });
      }
      shouldKeepListeningRef.current = false;
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      console.log("💬 Resultado de voz recibido:", event);
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript.trim() + ' ';
        }
      }

      const processedTranscript = finalTranscript.trim();
      console.log("📝 Transcripción final procesada:", processedTranscript);

      if (processedTranscript) {
        setTranscript(processedTranscript);
        if (options?.onResult) {
            options.onResult(processedTranscript);
        }
      }
    };
    
    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        console.log("🧹 Limpiando y deteniendo el reconocimiento de voz.");
        shouldKeepListeningRef.current = false;
        recognitionRef.current.stop();
      }
    };
  }, [options, toast]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        console.log("▶️ Intentando iniciar el reconocimiento de voz...");
        shouldKeepListeningRef.current = true;
        recognitionRef.current.start();
      } catch (err) {
        console.error("Error explícito al llamar a start():", err);
        setError("No se pudo iniciar el reconocimiento de voz.");
        shouldKeepListeningRef.current = false;
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      console.log("⏹️ Deteniendo la escucha manualmente.");
      shouldKeepListeningRef.current = false;
      recognitionRef.current.stop();
    }
  };
  
  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    error,
    isSupported: !!recognitionRef.current,
  };
};

export default useSpeechRecognition;
