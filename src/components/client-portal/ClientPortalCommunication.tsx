import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  Send,
  Phone,
  Mail,
  Clock,
  User,
  Shield,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface ClientPortalCommunicationProps {
  clientId?: string;
}

const ClientPortalCommunication = ({ clientId }: ClientPortalCommunicationProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = useCallback(async () => {
    if (!clientId) return;
    
    try {
      const { data } = await supabase
        .from('communication_tickets')
        .select('*')
        .eq('client_id', clientId)
        .eq('channel', 'web_form')
        .order('created_at', { ascending: true });

      setMessages(data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      fetchMessages();
    }
  }, [clientId, fetchMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel('portal-messages-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'communication_tickets'
        },
        () => fetchMessages()
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, fetchMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('communication_tickets')
        .insert([{
          client_id: clientId,
          subject: 'Portal Message',
          message: newMessage.trim(),
          sender_contact: 'client-portal',
          ticket_number: `TKT-${Date.now()}`,
          channel: 'web_form' as const,
          status: 'new' as const,
          priority: 'normal' as const
        }]);

      if (error) throw error;

      setNewMessage("");
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Live Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-alert-normal animate-pulse' : 'bg-muted-foreground'}`} />
          <span className="text-sm text-muted-foreground">
            {isLive ? 'Live updates enabled' : 'Connecting...'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="w-3 h-3" />
          {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Contact Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Account Manager</p>
                <p className="text-xs text-muted-foreground">John Kamau</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-alert-normal/10 rounded-lg">
                <Phone className="w-5 h-5 text-alert-normal" />
              </div>
              <div>
                <p className="text-sm font-medium">Direct Line</p>
                <p className="text-xs text-muted-foreground">+254 700 123 456</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Email Support</p>
                <p className="text-xs text-muted-foreground">support@blackhawk.co.ke</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface */}
      <Card className="border-border">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Messages
            </CardTitle>
            <Badge variant="outline" className="gap-1">
              <span className="w-2 h-2 bg-alert-normal rounded-full animate-pulse" />
              Online
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Messages Area */}
          <ScrollArea className="h-[400px] p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-pulse text-muted-foreground">Loading messages...</div>
              </div>
            ) : messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message, idx) => {
                  const isFromClient = !message.response;
                  return (
                    <div 
                      key={message.id || idx}
                      className={`flex ${isFromClient ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start gap-2 max-w-[80%] ${isFromClient ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className={isFromClient ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                            {isFromClient ? 'Y' : <Shield className="w-4 h-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`space-y-1 ${isFromClient ? 'text-right' : ''}`}>
                          <div 
                            className={`p-3 rounded-lg ${
                              isFromClient 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(message.created_at), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground">Start a conversation with our team</p>
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="min-h-[44px] max-h-32 resize-none"
                rows={1}
                maxLength={1000}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={sending || !newMessage.trim()}
                size="icon"
                className="shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send • Average response time: 5 minutes
            </p>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { q: "How do I request additional guards?", a: "Go to the Requests tab and select 'Additional Guards' to submit a request." },
            { q: "Where can I view my monthly reports?", a: "Monthly reports are available in the Dashboard under 'View Reports'." },
            { q: "How do I report an emergency?", a: "Use the 'Report Emergency' button at the bottom of any page or call our 24/7 hotline." },
            { q: "Can I change my site's patrol schedule?", a: "Yes, submit a 'Schedule Change' request in the Requests section." }
          ].map((faq, idx) => (
            <div key={idx} className="p-4 bg-muted/30 rounded-lg border border-border">
              <p className="text-sm font-medium text-foreground mb-1">{faq.q}</p>
              <p className="text-sm text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientPortalCommunication;
