import { useEffect, useRef } from 'react';
import { MessageSquare, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { Transcription } from '@shared/schema';

interface TranscriptionFeedProps {
  transcriptions: Transcription[];
}

export function TranscriptionFeed({ transcriptions }: TranscriptionFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when new transcriptions arrive
  useEffect(() => {
    if (feedRef.current && transcriptions.length > 0) {
      feedRef.current.scrollTop = 0;
    }
  }, [transcriptions]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (transcriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="feed-empty">
        <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Transcriptions Yet</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Start listening to capture and transcribe interview questions in real-time.
          Questions will be automatically detected and sent to your webhook.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={feedRef}
      className="max-h-96 overflow-y-auto space-y-3 pr-2"
      data-testid="feed-transcriptions"
    >
      {transcriptions.map((transcription) => (
        <Card
          key={transcription.id}
          className={`p-4 transition-all ${
            transcription.isQuestion
              ? 'border-primary border-2 bg-accent/30'
              : 'border-card-border hover-elevate'
          }`}
          data-testid={`card-transcription-${transcription.id}`}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground" data-testid="text-timestamp">
                {formatTime(transcription.timestamp)}
              </span>
              {transcription.isQuestion && transcription.questionNumber && (
                <Badge variant="default" className="gap-1" data-testid={`badge-question-${transcription.questionNumber}`}>
                  <HelpCircle className="w-3 h-3" />
                  Q #{transcription.questionNumber}
                </Badge>
              )}
            </div>
            {transcription.webhookSent && (
              <div className="flex items-center gap-1">
                {transcription.webhookSuccess ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" data-testid="icon-webhook-success" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-destructive" data-testid="icon-webhook-error" />
                )}
              </div>
            )}
          </div>

          <p
            className={`leading-relaxed ${
              transcription.isQuestion
                ? 'text-lg font-semibold text-foreground'
                : 'text-base text-foreground'
            }`}
            data-testid="text-transcription"
          >
            {transcription.text}
          </p>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground" data-testid="text-wordcount">
              {transcription.wordCount} words
            </span>
            {transcription.webhookError && (
              <span className="text-xs text-destructive" data-testid="text-webhook-error">
                {transcription.webhookError}
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
