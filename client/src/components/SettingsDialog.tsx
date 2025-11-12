import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AppSettings } from '@shared/schema';

interface SettingsDialogProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  disabled?: boolean;
}

export function SettingsDialog({ settings, onSave, disabled }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onSave(localSettings);
    setOpen(false);
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={disabled}
          data-testid="button-settings"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-settings">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure webhook URL and audio detection parameters
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input
              id="webhook-url"
              value={localSettings.webhookUrl}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, webhookUrl: e.target.value })
              }
              placeholder="https://your-webhook-url.com"
              data-testid="input-webhook-url"
            />
            <p className="text-xs text-muted-foreground">
              Questions will be sent to this URL in JSON format
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-speech">Min Speech (seconds)</Label>
              <Input
                id="min-speech"
                type="number"
                step="0.1"
                value={localSettings.minSpeechDuration}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    minSpeechDuration: parseFloat(e.target.value),
                  })
                }
                data-testid="input-min-speech"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-recording">Max Recording (seconds)</Label>
              <Input
                id="max-recording"
                type="number"
                value={localSettings.maxRecordingDuration}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    maxRecordingDuration: parseInt(e.target.value),
                  })
                }
                data-testid="input-max-recording"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} data-testid="button-cancel">
            Cancel
          </Button>
          <Button onClick={handleSave} data-testid="button-save">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
