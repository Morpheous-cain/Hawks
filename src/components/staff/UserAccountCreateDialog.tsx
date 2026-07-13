import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeyRound, Mail, User, Copy, Eye, EyeOff, CheckCircle2, Shield } from "lucide-react";
import { fieldRanks } from "@/pages/Auth";

interface Staff {
  id: string;
  staff_id: string;
  full_name: string;
  phone: string;
  position: string;
}

interface UserAccountCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: Staff | null;
  onSuccess: () => void;
}

export const UserAccountCreateDialog = ({ 
  open, 
  onOpenChange, 
  staff, 
  onSuccess 
}: UserAccountCreateDialogProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldRank, setFieldRank] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
  };

  const generateEmail = () => {
    if (staff) {
      const namePart = staff.full_name.toLowerCase().replace(/\s+/g, '.');
      setEmail(`${namePart}@blackhawk.co.ke`);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!staff || !email || !password || !fieldRank) {
      toast.error("Please fill all required fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("You must be logged in to create accounts");
        setLoading(false);
        return;
      }

      const response = await supabase.functions.invoke('create-user-account', {
        body: {
          email,
          password,
          staff_id: staff.staff_id,
          full_name: staff.full_name,
          field_rank: fieldRank
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create account');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      setCreatedCredentials({ email, password });
      setAccountCreated(true);
      toast.success("User account created successfully");
      onSuccess();

    } catch (error: any) {
      console.error('Error creating user account:', error);
      toast.error(error.message || "Failed to create user account");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setFieldRank("");
    setAccountCreated(false);
    setCreatedCredentials(null);
    onOpenChange(false);
  };

  if (!staff) return null;

  // Success view - show credentials to copy
  if (accountCreated && createdCredentials) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-alert-normal">
              <CheckCircle2 className="w-5 h-5" />
              Account Created Successfully
            </DialogTitle>
            <DialogDescription>
              Share these credentials with {staff.full_name}
            </DialogDescription>
          </DialogHeader>

          <Card className="p-4 bg-muted/50 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="flex items-center gap-2">
                <Input value={createdCredentials.email} readOnly className="font-mono" />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => copyToClipboard(createdCredentials.email, "Email")}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Password</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={createdCredentials.password} 
                  readOnly 
                  type={showPassword ? "text" : "password"}
                  className="font-mono" 
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => copyToClipboard(createdCredentials.password, "Password")}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => {
                const text = `Black Hawk SOC-OS - Field Portal Credentials\n\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\n\nPlease change your password after first login.`;
                copyToClipboard(text, "All credentials");
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy All Credentials
            </Button>
          </Card>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Create Portal Account
          </DialogTitle>
          <DialogDescription>
            Create login credentials for Field Portal access
          </DialogDescription>
        </DialogHeader>

        {/* Staff Info */}
        <Card className="p-3 bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{staff.full_name}</p>
              <p className="text-sm text-muted-foreground">{staff.staff_id} • {staff.position}</p>
            </div>
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@blackhawk.co.ke"
                  className="pl-10"
                  required
                />
              </div>
              <Button type="button" variant="outline" onClick={generateEmail}>
                Generate
              </Button>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pl-10 pr-10"
                  minLength={6}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <Button type="button" variant="outline" onClick={generatePassword}>
                Generate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
          </div>

          {/* Field Rank */}
          <div className="space-y-2">
            <Label>Field Portal Rank *</Label>
            <Select value={fieldRank} onValueChange={setFieldRank} required>
              <SelectTrigger>
                <Shield className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Select rank for Field Portal" />
              </SelectTrigger>
              <SelectContent>
                {fieldRanks.map((rank) => (
                  <SelectItem key={rank.id} value={rank.id}>
                    {rank.name} - {rank.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
