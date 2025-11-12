import { useState, useEffect } from 'react';
import { Play, Square, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AppHeader } from '@/components/AppHeader';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { TranscriptionFeed } from '@/components/TranscriptionFeed';
import { StatisticsPanel } from '@/components/StatisticsPanel';
import { SettingsDialog } from '@/components/SettingsDialog';
import { useAudioCapture } from '@/hooks/useAudioCapture';
import type { SessionStats, AppSettings } from '@shared/schema';
import { DEFAULT_SETTINGS } from '@shared/schema';

export default function InterviewAssistant() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const stored = localStorage.getItem('interviewAssistantSettings');
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  });

  const [sessionStats, setSessionStats] = useState<SessionStats>({
    questionsDetected: 0,
    totalTranscriptions: 0,
    webhookSuccessCount: 0,
    webhookFailCount: 0,
    sessionStartTime: null,
    elapsedTime: 0,
  });

  const {
    audioState,
    volume,
    transcriptions,
    error,
    startCapture,
    stopCapture,
  } = useAudioCapture(settings);

  // Update statistics when transcriptions change
  useEffect(() => {
    const questions = transcriptions.filter((t) => t.isQuestion).length;
    const webhookSuccess = transcriptions.filter((t) => t.webhookSuccess === true).length;
    const webhookFail = transcriptions.filter((t) => t.webhookSuccess === false).length;

    setSessionStats((prev) => ({
      ...prev,
      questionsDetected: questions,
      totalTranscriptions: transcriptions.length,
      webhookSuccessCount: webhookSuccess,
      webhookFailCount: webhookFail,
    }));
  }, [transcriptions]);

  // Track session start time
  useEffect(() => {
    if (audioState === 'listening' && !sessionStats.sessionStartTime) {
      setSessionStats((prev) => ({
        ...prev,
        sessionStartTime: new Date(),
      }));
    } else if (audioState === 'idle') {
      setSessionStats((prev) => ({
        ...prev,
        sessionStartTime: null,
      }));
    }
  }, [audioState, sessionStats.sessionStartTime]);

  // Save settings to localStorage
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('interviewAssistantSettings', JSON.stringify(newSettings));
  };

  const handleToggleCapture = () => {
    if (audioState === 'idle') {
      startCapture();
    } else {
      stopCapture();
    }
  };

  const isActive = audioState !== 'idle';

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        audioState={audioState}
        sessionStartTime={sessionStats.sessionStartTime}
        webhookUrl={settings.webhookUrl}
      />

      <main className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Control Panel */}
        <div className="py-8 flex flex-col items-center gap-4">
          <Button
            size="lg"
            variant={isActive ? 'destructive' : 'default'}
            onClick={handleToggleCapture}
            className="px-8 py-4 text-base font-semibold"
            data-testid="button-toggle-capture"
          >
            {isActive ? (
              <>
                <Square className="w-5 h-5 mr-2" />
                Stop Listening
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Start Listening
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <SettingsDialog
              settings={settings}
              onSave={handleSaveSettings}
              disabled={isActive}
            />
          </div>

          {!isActive && (
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Click "Start Listening" to begin transcribing audio from your microphone.
              Turn up your speakers so the microphone can pick up the interviewer's voice.
              Questions will be automatically detected and sent to your webhook.
            </p>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <Alert variant="destructive" data-testid="alert-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Audio Visualizer */}
        <div className="mb-6">
          <AudioVisualizer volume={volume} audioState={audioState} />
        </div>

        {/* Transcription Feed */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4" data-testid="heading-transcriptions">
            Transcriptions
          </h2>
          <TranscriptionFeed transcriptions={transcriptions} />
        </div>

        {/* Statistics */}
        <div className="pb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4" data-testid="heading-statistics">
            Session Statistics
          </h2>
          <StatisticsPanel stats={sessionStats} />
        </div>

        {/* Footer */}
        <footer className="py-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Audio is not stored. All processing happens in your browser.
          </p>
        </footer>
      </main>
    </div>
  );
}
