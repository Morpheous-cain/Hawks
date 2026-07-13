import { useEffect, useState } from "react";
import { LogOut, Clock, Calendar, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import NotificationCenter from "@/components/NotificationCenter";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import CommandPalette from "@/components/command/CommandPalette";
import { usePresence } from "@/hooks/usePresence";


const Header = () => {
  const { user, signOut } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { presenceCount } = usePresence();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex-1 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-foreground tracking-tight hidden md:block">Black Hawk SOC-OS</h1>
        <p className="text-xs text-foreground/70 uppercase tracking-wider hidden lg:block">Control Console 2025</p>
      </div>

        <div className="flex items-center gap-4">
          {/* Live Clock Display - Compact on mobile, full on larger screens */}
          <div className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-1.5 md:py-2 rounded-lg bg-secondary/50 border border-primary/20">
            <div className="flex items-center gap-1.5 md:gap-2 text-primary">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="font-mono text-sm md:text-lg font-bold tracking-wider">
                {format(currentTime, "HH:mm:ss")}
              </span>
            </div>
            <div className="hidden sm:block w-px h-5 md:h-6 bg-primary/30" />
            <div className="hidden sm:flex items-center gap-1.5 md:gap-2 text-foreground/80">
              <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="text-xs md:text-sm font-medium">
                {format(currentTime, "EEE, dd MMM yyyy")}
              </span>
            </div>
          </div>

          {user && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaletteOpen(true)}
                className="gap-2 border-primary/30 hover:border-primary/50 hidden md:flex"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="text-xs">Search</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1 ml-1">⌘K</Badge>
              </Button>

              {presenceCount > 0 && (
                <Badge variant="outline" className="hidden lg:flex items-center gap-1 text-alert-normal border-alert-normal/40">
                  <Users className="w-3 h-3" />
                  {presenceCount} online
                </Badge>
              )}

              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-foreground">{user.email}</p>
                <p className="text-xs text-foreground/80 font-medium">Authenticated User</p>
              </div>
              
              <LanguageSwitcher />
              <NotificationCenter />

              <Button 
                variant="outline" 
                size="sm" 
                onClick={signOut}
                className="gap-2 border-primary/30 hover:border-primary/50 hover:shadow-glow transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </>
          )}
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
};

export default Header;
