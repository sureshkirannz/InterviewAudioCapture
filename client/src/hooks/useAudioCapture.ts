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

  // Initialize Web Speech API
  const initializeRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported in this browser. Please use Chrome or Edge.');
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
      const text = event.results[last][0].transcript;

      setAudioState('processing');

      const isQuestionDetected = isQuestion(text);
      const wordCount = text.split(/\s+/).length;
      
      const transcription: Transcription = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        text: text.trim(),
        isQuestion: isQuestionDetected,
        questionNumber: isQuestionDetected ? ++questionCountRef.current : undefined,
        wordCount,
        webhookSent: false,
        webhookSuccess: undefined,
        webhookError: undefined,
      };

      // Send to webhook if it's a question
      if (isQuestionDetected && transcription.questionNumber) {
        const result = await sendToWebhook(settings.webhookUrl, text.trim(), transcription.questionNumber);
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
      setError(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      if (audioState === 'listening') {
        // Restart if we're still supposed to be listening
        try {
          recognition.start();
        } catch (e) {
          // Already started, ignore
        }
      }
    };

    return recognition;
  }, [audioState, settings.webhookUrl]);

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

  // Start capturing audio
  const startCapture = useCallback(async () => {
    try {
      setError(null);

      // Request screen sharing with system audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        } as any,
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

      // Handle stream ending (user stops sharing)
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopCapture();
      });

    } catch (err) {
      const error = err as Error;
      if (error.name === 'NotAllowedError') {
        setError('Permission denied. Please allow screen sharing with system audio.');
      } else if (error.name === 'NotFoundError') {
        setError('No audio source found. Make sure to select "Share system audio" when sharing your screen.');
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
      recognitionRef.current.stop();
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
