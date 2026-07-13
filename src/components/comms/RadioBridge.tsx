import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Phone, Radio, Send } from "lucide-react";

const RadioBridge = () => {
  const activeChannels = [
    { id: "CH-01", name: "Command Center", users: 24, status: "active" },
    { id: "CH-02", name: "JKIA Operations", users: 8, status: "active" },
    { id: "CH-03", name: "Mobile Patrols", users: 12, status: "active" },
    { id: "CH-04", name: "K9 Units", users: 6, status: "active" },
    { id: "CH-05", name: "Investigations", users: 5, status: "idle" },
  ];

  const messages = [
    {
      id: 1,
      sender: "SGT Kamau",
      channel: "Command Center",
      message: "Perimeter check complete at JKIA Terminal 2. All clear.",
      time: "14:52",
      type: "radio",
    },
    {
      id: 2,
      sender: "LT Wanjiru",
      channel: "Command Center",
      message: "Escort mission ESC-2025-042 is 10 minutes from destination.",
      time: "14:48",
      type: "secure",
    },
    {
      id: 3,
      sender: "CPL Njeri",
      channel: "JKIA Operations",
      message: "Requesting backup at Gate 7. Suspicious individual detained.",
      time: "14:45",
      type: "priority",
    },
    {
      id: 4,
      sender: "SGT Omondi",
      channel: "Mobile Patrols",
      message: "Traffic congestion on Mombasa Road. Taking alternate route.",
      time: "14:42",
      type: "radio",
    },
  ];

  const typeConfig = {
    radio: "bg-primary/10 text-primary",
    secure: "bg-accent/10 text-accent",
    priority: "bg-alert-critical/10 text-alert-critical",
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-primary font-semibold">Active Channels</p>
              <p className="text-3xl font-bold text-foreground">5</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3">
            <Radio className="w-8 h-8 text-accent" />
            <div>
              <p className="text-sm text-primary font-semibold">Connected Users</p>
              <p className="text-3xl font-bold text-foreground">55</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3">
            <Phone className="w-8 h-8 text-alert-normal" />
            <div>
              <p className="text-sm text-primary font-semibold">VoIP Calls (24h)</p>
              <p className="text-3xl font-bold text-foreground">187</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-alert-caution" />
            <div>
              <p className="text-sm text-primary font-semibold">Messages (24h)</p>
              <p className="text-3xl font-bold text-foreground">2,341</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Channels List */}
        <Card className="p-4 border-border">
          <h3 className="font-semibold text-foreground mb-4">Communication Channels</h3>
          <div className="space-y-2">
            {activeChannels.map((channel) => (
              <div
                key={channel.id}
                className="p-3 rounded border border-border bg-card hover:bg-accent/5 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground">{channel.name}</span>
                  <Badge
                    variant={channel.status === "active" ? "default" : "outline"}
                    className="text-xs"
                  >
                    {channel.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Radio className="w-3 h-3" />
                  <span>{channel.users} users</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Messages Feed */}
        <Card className="lg:col-span-2 p-4 border-border">
          <h3 className="font-semibold text-foreground mb-4">Live Message Feed</h3>
          <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="p-3 rounded border border-border bg-card"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {msg.sender
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground text-sm">
                        {msg.sender}
                      </span>
                      <span className="text-xs text-muted-foreground">{msg.time}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {msg.channel}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${typeConfig[msg.type as keyof typeof typeConfig]}`}
                      >
                        {msg.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground/90">{msg.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Type a message to broadcast..."
              className="flex-1 border-border"
            />
            <Button size="icon" className="bg-primary hover:bg-primary/90">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-4 border-border">
        <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="outline" className="w-full border-primary/20 hover:border-primary">
            <Phone className="w-4 h-4 mr-2" />
            VoIP Call
          </Button>
          <Button variant="outline" className="w-full border-primary/20 hover:border-primary">
            <Radio className="w-4 h-4 mr-2" />
            Radio Bridge
          </Button>
          <Button variant="outline" className="w-full border-primary/20 hover:border-primary">
            <MessageSquare className="w-4 h-4 mr-2" />
            Secure Chat
          </Button>
          <Button variant="outline" className="w-full border-alert-critical/20 hover:border-alert-critical text-alert-critical">
            <Send className="w-4 h-4 mr-2" />
            Emergency Broadcast
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default RadioBridge;
