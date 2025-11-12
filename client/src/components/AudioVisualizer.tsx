import { useEffect, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import type { AudioState } from '@shared/schema';

interface AudioVisualizerProps {
  volume: number;
  audioState: AudioState;
}

export function AudioVisualizer({ volume, audioState }: AudioVisualizerProps) {
  const [bars, setBars] = useState<number[]>(new Array(40).fill(0));

  useEffect(() => {
    if (audioState === 'listening' || audioState === 'recording') {
      // Create animated bars based on volume
      const newBars = bars.map(() => Math.random() * volume / 255 * 100);
      setBars(newBars);
    } else {
      setBars(new Array(40).fill(0));
    }
  }, [volume, audioState]);

  const getStatusText = () => {
    switch (audioState) {
      case 'listening':
        return 'Listening for speech...';
      case 'recording':
        return 'Recording audio';
      case 'processing':
        return 'Processing transcription...';
      default:
        return 'Ready to start';
    }
  };

  const isActive = audioState !== 'idle';

  return (
    <div className="w-full h-32 bg-card border border-card-border rounded-lg p-6 flex flex-col justify-between" data-testid="audio-visualizer">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isActive ? (
            <>
              <div className="relative">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse" data-testid="indicator-recording" />
                <div className="absolute inset-0 w-3 h-3 bg-primary rounded-full animate-ping" />
              </div>
              <span className="text-sm font-medium text-foreground" data-testid="text-status">
                {getStatusText()}
              </span>
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground" data-testid="text-status">
                {getStatusText()}
              </span>
            </>
          )}
        </div>
        <div className="text-xs font-medium text-muted-foreground" data-testid="text-volume">
          Vol: {Math.round(volume)}
        </div>
      </div>

      <div className="flex items-end gap-1 h-12" data-testid="visualizer-bars">
        {bars.map((height, i) => (
          <div
            key={i}
            className="flex-1 bg-primary rounded-sm transition-all duration-300 ease-in-out"
            style={{
              height: `${Math.max(height, 2)}%`,
              opacity: isActive ? 0.6 + (height / 100) * 0.4 : 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}
