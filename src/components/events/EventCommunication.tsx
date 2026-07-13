import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, Send, AlertTriangle, Radio, Megaphone,
  Users, Bell, Check, Clock, User
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Message {
  id: string;
  sender: string;
  senderRole: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'alert' | 'broadcast';
  read: boolean;
}

interface EventCommunicationProps {
  eventId: string;
  eventName: string;
  assignments?: any[];
}

const EventCommunication = ({ eventId, eventName, assignments = [] }: EventCommunicationProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'Control Room',
      senderRole: 'operator',
      content: 'All units, security check-in confirmed. Maintain positions.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      type: 'broadcast',
      read: true
    },
    {
      id: '2',
      sender: 'John Kamau',
      senderRole: 'Team Leader',
      content: 'Gate A secure. VIP arriving in 10 minutes.',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      type: 'message',
      read: true
    },
    {
      id: '3',
      sender: 'System',
      senderRole: 'system',
      content: '⚠️ Crowd density alert at Section B. Deploy additional personnel.',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      type: 'alert',
      read: false
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [recipient, setRecipient] = useState("all");
  const [messageType, setMessageType] = useState("message");

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: 'Control Room',
      senderRole: 'operator',
      content: newMessage,
      timestamp: new Date(),
      type: messageType as 'message' | 'alert' | 'broadcast',
      read: false
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");
    
    if (messageType === 'broadcast') {
      toast.success('Broadcast sent to all field units');
    } else if (messageType === 'alert') {
      toast.success('Emergency alert dispatched');
    } else {
      toast.success('Message sent');
    }
  };

  const getMessageStyle = (type: string) => {
    switch (type) {
      case 'alert':
        return 'bg-alert-critical/10 border-alert-critical/30';
      case 'broadcast':
        return 'bg-primary/10 border-primary/30';
      default:
        return 'bg-muted/50 border-border';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-alert-critical" />;
      case 'broadcast':
        return <Megaphone className="w-4 h-4 text-primary" />;
      default:
        return <MessageSquare className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chat Panel */}
      <Card className="lg:col-span-2 bg-card/50 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            Event Communications
            <Badge variant="secondary" className="ml-2">{messages.filter(m => !m.read).length} unread</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px] p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`p-3 rounded-lg border ${getMessageStyle(msg.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/20 text-primary">
                        {msg.sender.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{msg.sender}</span>
                        <Badge variant="outline" className="text-xs">{msg.senderRole}</Badge>
                        {getTypeIcon(msg.type)}
                        {!msg.read && (
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(msg.timestamp, 'HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <div className="flex gap-2 mb-3">
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Units</SelectItem>
                  <SelectItem value="leaders">Team Leaders</SelectItem>
                  <SelectItem value="guards">Guards Only</SelectItem>
                  <SelectItem value="vip">VIP Team</SelectItem>
                </SelectContent>
              </Select>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">Message</SelectItem>
                  <SelectItem value="broadcast">Broadcast</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1"
              />
              <Button onClick={handleSend} className="gap-2">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions & Active Personnel */}
      <div className="space-y-6">
        {/* Quick Actions */}
        <Card className="bg-card/50 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 border-alert-critical/30 text-alert-critical hover:bg-alert-critical/10"
              onClick={() => {
                setMessageType('alert');
                setNewMessage('EMERGENCY ALERT: ');
              }}
            >
              <AlertTriangle className="w-4 h-4" />
              Emergency Alert
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => {
                setMessageType('broadcast');
                setNewMessage('');
              }}
            >
              <Megaphone className="w-4 h-4" />
              Broadcast Message
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => toast.success('Roll call initiated')}
            >
              <Users className="w-4 h-4" />
              Roll Call Check
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => toast.success('Position check requested')}
            >
              <Check className="w-4 h-4" />
              Request Status Check
            </Button>
          </CardContent>
        </Card>

        {/* Active Personnel */}
        <Card className="bg-card/50 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Active Personnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {assignments.length === 0 ? (
                  <>
                    {/* Demo data */}
                    {[
                      { name: 'John Kamau', role: 'Team Leader', status: 'online' },
                      { name: 'Mary Wanjiku', role: 'Access Control', status: 'online' },
                      { name: 'Peter Ochieng', role: 'VIP Protection', status: 'busy' },
                      { name: 'James Mwangi', role: 'Patrol Officer', status: 'online' },
                    ].map((person, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/20 text-primary">
                              {person.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                            person.status === 'online' ? 'bg-green-500' : 'bg-amber-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{person.name}</p>
                          <p className="text-xs text-muted-foreground">{person.role}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MessageSquare className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </>
                ) : (
                  assignments.map((assignment: any) => (
                    <div key={assignment.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                          {assignment.staff?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{assignment.staff?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{assignment.role}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MessageSquare className="w-3 h-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventCommunication;
