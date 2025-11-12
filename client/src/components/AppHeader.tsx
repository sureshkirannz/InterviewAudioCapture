import { useEffect, useState } from 'react';
import { Mic, Link as LinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatElapsedTime } from '@/lib/audioUtils';
import type { AudioState } from '@shared/schema';

interface AppHeaderProps {
  audioState: AudioState;
  sessionStartTime: Date | null;
  webhookUrl: string;
}

export function AppHeader({ audioState, sessionStartTime, webhookUrl }: AppHeaderProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!sessionStartTime) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const getStatusBadge = () => {
    switch (audioState) {
      case 'listening':
      case 'recording':
        return (
          <Badge variant="default" className="gap-1" data-testid="badge-status">
            <div className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse" />
            LIVE
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary" data-testid="badge-status">
            PROCESSING
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" data-testid="badge-status">
            IDLE
          </Badge>
        );
    }
  };

  const truncateUrl = (url: string) => {
    if (url.length <= 50) return url;
    return url.substring(0, 47) + '...';
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border" data-testid="header">
      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
              <Mic className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground" data-testid="text-title">
                Interview Assistant
              </h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <LinkIcon className="w-3 h-3" />
                <span data-testid="text-webhook-url">{truncateUrl(webhookUrl)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {sessionStartTime && (
              <div className="hidden sm:block font-mono text-sm text-muted-foreground" data-testid="text-elapsed-time">
                {formatElapsedTime(elapsedTime)}
              </div>
            )}
            {getStatusBadge()}
          </div>
        </div>
      </div>
    </header>
  );
}
