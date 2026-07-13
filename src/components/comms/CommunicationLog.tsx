import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket, Phone, MessageCircle, Mail, Search, Eye } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

const CommunicationLog = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["communication-tickets", statusFilter, channelFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("communication_tickets")
        .select("*, assigned_to:profiles!communication_tickets_assigned_to_fkey(full_name)")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as "new" | "assigned" | "in_progress" | "escalated" | "resolved" | "closed");
      }
      if (channelFilter !== "all") {
        query = query.eq("channel", channelFilter as "phone" | "whatsapp" | "sms" | "email" | "web_form" | "radio" | "internal");
      }
      if (searchTerm) {
        query = query.or(`sender_name.ilike.%${searchTerm}%,subject.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  const channelIcons = {
    phone: Phone,
    whatsapp: MessageCircle,
    sms: MessageCircle,
    email: Mail,
    web_form: Mail,
    radio: Phone,
    internal: MessageCircle,
  };

  const statusColors = {
    new: "bg-alert-caution text-alert-caution",
    assigned: "bg-alert-normal text-alert-normal",
    in_progress: "bg-primary text-primary",
    escalated: "bg-alert-critical text-alert-critical",
    resolved: "bg-muted text-muted-foreground",
    closed: "bg-muted text-muted-foreground",
  };

  const priorityColors = {
    low: "bg-muted text-muted-foreground",
    normal: "bg-alert-normal text-alert-normal",
    high: "bg-alert-caution text-alert-caution",
    emergency: "bg-alert-critical text-alert-critical",
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          Communication Tickets Log
        </h3>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="web_form">Web Form</SelectItem>
            <SelectItem value="radio">Radio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket #</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Loading tickets...
                </TableCell>
              </TableRow>
            ) : tickets?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  No tickets found
                </TableCell>
              </TableRow>
            ) : (
              tickets?.map((ticket) => {
                const ChannelIcon = channelIcons[ticket.channel as keyof typeof channelIcons];
                return (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-sm">{ticket.ticket_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ChannelIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize">{ticket.channel}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{ticket.sender_name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground font-mono">{ticket.sender_contact}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[ticket.status as keyof typeof statusColors]}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{ticket.assigned_to?.full_name || "Unassigned"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(ticket.created_at), "MMM dd, HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default CommunicationLog;