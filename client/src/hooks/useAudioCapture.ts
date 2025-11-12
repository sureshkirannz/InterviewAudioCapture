import { useState, useRef, useCallback, useEffect } from 'react';
import type { AudioState, Transcription, AppSettings } from '@shared/schema';
import { isQuestion, calculateVolume, sendToWebhook } from '@/lib/audioUtils';

export function useAudioCapture(settings: AppSettings) {
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const [volume, setVolume] = useState(0);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [error, setError] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const questionCountRef = useRef(0);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastVolumeRef = useRef<number>(0);

  // Transcribe audio using Google Speech API (same as Python script)
  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    try {
      setAudioState('processing');
      
      // Convert blob to base64 for API
      const reader = new FileReader();
      
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      // Use Google's unofficial Speech API (same as Python speech_recognition library)
      const response = await fetch(
        `https://www.google.com/speech-api/v2/recognize?client=chromium&lang=en-US&key=AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'audio/x-flac; rate=16000',
          },
          body: audioBlob,
        }
      );

      if (!response.ok) {
        throw new Error(`Google API returned ${response.status}`);
      }

      const text = await response.text();
      const lines = text.trim().split('\n');
      
      // Parse response (format: multiple JSON objects separated by newlines)
      for (const line of lines) {
        if (line.trim()) {
          try {
            const result = JSON.parse(line);
            if (result.result && result.result.length > 0) {
              const transcript = result.result[0].alternative[0].transcript;
              
              if (transcript && transcript.length >= 10) {
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
                  const webhookResult = await sendToWebhook(
                    settings.webhookUrl,
                    transcript.trim(),
                    transcription.questionNumber
                  );
                  transcription.webhookSent = true;
                  transcription.webhookSuccess = webhookResult.success;
                  transcription.webhookError = webhookResult.error;
                }

                setTranscriptions(prev => [transcription, ...prev]);
              }
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }

      setAudioState('listening');
    } catch (err) {
      console.error('Transcription error:', err);
      setError('Transcription failed. Please try again.');
      setAudioState('listening');
    }
  }, [settings.webhookUrl]);

  // Visualize audio levels and handle silence detection
  const visualizeAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateVolume = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const currentVolume = calculateVolume(dataArray);
      setVolume(currentVolume);
      lastVolumeRef.current = currentVolume;
      
      // Handle silence detection for automatic recording
      handleSilenceDetection();

      animationFrameRef.current = requestAnimationFrame(updateVolume);
    };

    updateVolume();
  }, [handleSilenceDetection]);

  // Handle recording chunks based on silence detection
  const handleSilenceDetection = useCallback(() => {
    const currentVolume = lastVolumeRef.current;
    
    // If volume is above threshold, we have speech
    if (currentVolume > settings.silenceThreshold) {
      // Clear any existing silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      
      // If not already recording, start recording
      if (audioState === 'listening' && mediaRecorderRef.current?.state === 'inactive') {
        audioChunksRef.current = [];
        recordingStartTimeRef.current = Date.now();
        mediaRecorderRef.current?.start();
        setAudioState('recording');
      }
    } 
    // Volume below threshold (silence)
    else if (audioState === 'recording') {
      // Start silence timeout if not already started
      if (!silenceTimeoutRef.current) {
        silenceTimeoutRef.current = setTimeout(() => {
          // Stop recording after silence duration
          if (mediaRecorderRef.current?.state === 'recording') {
            const duration = (Date.now() - recordingStartTimeRef.current) / 1000;
            
            // Only process if duration is within acceptable range
            if (duration >= settings.minSpeechDuration && duration <= settings.maxRecordingDuration) {
              mediaRecorderRef.current?.stop();
            } else {
              // Too short or too long, discard
              audioChunksRef.current = [];
              mediaRecorderRef.current?.stop();
              setAudioState('listening');
            }
          }
          silenceTimeoutRef.current = null;
        }, settings.silenceDuration * 1000);
      }
    }
    
    // Max duration check
    if (audioState === 'recording') {
      const duration = (Date.now() - recordingStartTimeRef.current) / 1000;
      if (duration >= settings.maxRecordingDuration) {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current?.stop();
        }
      }
    }
  }, [audioState, settings]);

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

      // Check if audio track exists
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio track found. Make sure to check "Share system audio" when sharing your screen.');
      }

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

      // Set up MediaRecorder for capturing audio chunks
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioChunksRef.current = [];
          
          // Transcribe the recorded audio
          await transcribeAudio(audioBlob);
        }
        
        // Resume listening if still active
        if (audioState !== 'idle') {
          setAudioState('listening');
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      setAudioState('listening');

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
  }, [visualizeAudio, transcribeAudio, audioState]);

  // Stop capturing audio
  const stopCapture = useCallback(() => {
    // Stop media recorder
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    // Clear silence timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
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
    audioChunksRef.current = [];
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
