import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, CheckCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

const PWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Install Mobile App"
        description="Install Black Hawk SOC-OS Command Center on your device for quick access"
        icon={Smartphone}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-border">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Progressive Web App</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Install this application on your device for offline access and a native app experience.
              </p>
              
              {isInstalled ? (
                <div className="flex items-center gap-2 text-alert-normal">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">App is installed</span>
                </div>
              ) : isInstallable ? (
                <Button onClick={handleInstall} className="w-full sm:w-auto">
                  <Download className="w-4 h-4 mr-2" />
                  Install App
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Installation is available on mobile devices. Visit this page on your phone to install.
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border">
          <h3 className="font-semibold text-foreground mb-4">Installation Instructions</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">iOS (iPhone/iPad)</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Tap the Share button in Safari</li>
                <li>Scroll and tap "Add to Home Screen"</li>
                <li>Tap "Add" to confirm</li>
              </ol>
            </div>

            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Android</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Tap the menu button (three dots)</li>
                <li>Tap "Add to Home screen" or "Install app"</li>
                <li>Tap "Add" or "Install"</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 border-border">
        <h3 className="font-semibold text-foreground mb-4">Features</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Offline Access', desc: 'Work without internet connection' },
            { title: 'Fast Loading', desc: 'Cached resources for instant access' },
            { title: 'Push Notifications', desc: 'Real-time alerts and updates' },
            { title: 'Native Feel', desc: 'Full-screen app experience' },
          ].map((feature, idx) => (
            <div key={idx} className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-foreground mb-1">{feature.title}</h4>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default PWAInstall;
