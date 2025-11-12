import { useState, useRef, useCallback, useEffect } from 'react';
import type { AudioState, Transcription, AppSettings } from '@shared/schema';
import { isQuestion, calculateVolume, sendToWebhook } from '@/lib/audioUtils';

export function useAudioCapture(settings: AppSettings) {
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const [volume, setVolume] = useState(0);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [error, setError] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const questionCountRef = useRef(0);

  // Initialize Web Speech API with microphone
  const initializeRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported. Please use Chrome or Edge.');
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setAudioState('listening');
      setError(null);
    };

    recognition.onresult = async (event: any) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;

      setAudioState('processing');

      const isQuestionDetected = isQuestion(transcript);
      const wordCount = transcript.split(/\s+/).length;
      
      const transcription: Transcription = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        text: transcript.trim(),
        isQuestion: isQuestionDetected,
        questionNumber: isQuestionDetected ? ++questionCountRef.current : undefined,
        wordCount,
        webhookSent: false,
        webhookSuccess: undefined,
        webhookError: undefined,
      };

      // Send to webhook if it's a question
      if (isQuestionDetected && transcription.questionNumber) {
        const result = await sendToWebhook(settings.webhookUrl, transcript.trim(), transcription.questionNumber);
        transcription.webhookSent = true;
        transcription.webhookSuccess = result.success;
        transcription.webhookError = result.error;
      }

      setTranscriptions(prev => [transcription, ...prev]);
      setAudioState('listening');
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Continue listening, this is normal
        return;
      }
      if (event.error !== 'aborted') {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Restart if we're still supposed to be listening
      if (mediaStreamRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // Already started or stopped, ignore
        }
      }
    };

    return recognition;
  }, [settings.webhookUrl]);

  // Visualize audio levels
  const visualizeAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateVolume = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const currentVolume = calculateVolume(dataArray);
      setVolume(currentVolume);

      animationFrameRef.current = requestAnimationFrame(updateVolume);
    };

    updateVolume();
  }, []);

  // Start capturing audio from microphone
  const startCapture = useCallback(async () => {
    try {
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      mediaStreamRef.current = stream;

      // Set up audio context for visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      source.connect(analyser);
      visualizeAudio();

      // Initialize and start speech recognition
      const recognition = initializeRecognition();
      recognitionRef.current = recognition;
      recognition.start();

    } catch (err) {
      const error = err as Error;
      if (error.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow microphone access.');
      } else if (error.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone.');
      } else {
        setError(error.message || 'Failed to start audio capture');
      }
      setAudioState('idle');
    }
  }, [initializeRecognition, visualizeAudio]);

  // Stop capturing audio
  const stopCapture = useCallback(() => {
    // Stop recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      recognitionRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Stop audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop visualization
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    analyserRef.current = null;
    setAudioState('idle');
    setVolume(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    audioState,
    volume,
    transcriptions,
    error,
    startCapture,
    stopCapture,
  };
}
