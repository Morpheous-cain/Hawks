import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX } from 'lucide-react';
import { useAudioAlerts } from '@/hooks/useAudioAlerts';

export const AudioControlPanel = () => {
  const { enabled, volume, setVolume, toggleEnabled, playAlert } = useAudioAlerts();

  return (
    <Card className="p-4 bg-card/80 backdrop-blur-xl border-2 border-border/50">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Audio Alerts</h3>
          <Button
            variant="glass"
            size="icon"
            onClick={toggleEnabled}
            className="h-8 w-8"
          >
            {enabled ? (
              <Volume2 className="w-4 h-4 text-primary" />
            ) : (
              <VolumeX className="w-4 h-4 text-foreground/70" />
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-foreground/80 font-medium">
            <span>Volume</span>
            <span>{Math.round(volume * 100)}%</span>
          </div>
          <Slider
            value={[volume]}
            onValueChange={(value) => setVolume(value[0])}
            max={1}
            step={0.1}
            disabled={!enabled}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs text-foreground/80 font-medium mb-2">Test Sounds:</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="glass"
              size="sm"
              onClick={() => playAlert('critical')}
              disabled={!enabled}
              className="text-xs"
            >
              Critical
            </Button>
            <Button
              variant="glass"
              size="sm"
              onClick={() => playAlert('sos')}
              disabled={!enabled}
              className="text-xs"
            >
              SOS
            </Button>
            <Button
              variant="glass"
              size="sm"
              onClick={() => playAlert('sla_breach')}
              disabled={!enabled}
              className="text-xs"
            >
              SLA Breach
            </Button>
            <Button
              variant="glass"
              size="sm"
              onClick={() => playAlert('warning')}
              disabled={!enabled}
              className="text-xs"
            >
              Warning
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
