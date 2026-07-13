import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Lock, Eye, EyeOff, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/black-hawk-logo.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Only allow the form when Supabase fires PASSWORD_RECOVERY (the magic-link
    // token has been exchanged). A plain SIGNED_IN session should NOT be able
    // to change passwords here — redirect those users away.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      } else if (event === "SIGNED_IN") {
        // Authenticated user navigated here without a recovery link — send them home.
        navigate("/management");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Weak password", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      await supabase.auth.signOut();
      sessionStorage.setItem("explicit_auth_visit", "true");
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Black Hawk SOC-OS" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-2xl font-bold">Reset Your Password</h1>
          <p className="text-sm text-muted-foreground">
            {ready ? "Enter your new password below." : "Validating reset link..."}
          </p>
        </div>

        {ready ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 w-4 h-4" />
                <Input
                  id="new-password"
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 w-4 h-4" />
                <Input
                  id="confirm-password"
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        ) : (
          <div className="flex justify-center py-8">
            <Shield className="w-8 h-8 text-muted-foreground animate-pulse" />
          </div>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;
