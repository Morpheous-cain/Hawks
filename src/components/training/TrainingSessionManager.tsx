import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar, Clock, Users, MapPin, Plus, Play, CheckCircle2, 
  XCircle, Search, Download, UserPlus, Edit, Trash2, BookOpen
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BLACK_HAWK_COURSE_CATALOG } from "./BlackHawkCourseCatalog";

interface TrainingSession {
  id: string;
  session_id: string;
  program_id: string;
  trainer_name: string;
  venue: string;
  session_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  enrolled_count: number;
  status: string;
  notes?: string;
  created_at: string;
}

const TrainingSessionManager = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    program_id: "",
    trainer_name: "",
    venue: "",
    session_date: "",
    start_time: "09:00",
    end_time: "17:00",
    max_capacity: 15,
    notes: ""
  });

  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['training-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .order('session_date', { ascending: true });
      
      if (error) throw error;
      return data as TrainingSession[];
    }
  });

  const createSession = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('training_sessions').insert([{
        program_id: data.program_id,
        trainer_name: data.trainer_name,
        venue: data.venue,
        session_date: data.session_date,
        start_time: data.start_time,
        end_time: data.end_time,
        max_capacity: data.max_capacity,
        notes: data.notes,
        status: 'scheduled',
        enrolled_count: 0
      } as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
      toast.success("Training session scheduled successfully");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to schedule session: " + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      program_id: "",
      trainer_name: "",
      venue: "",
      session_date: "",
      start_time: "09:00",
      end_time: "17:00",
      max_capacity: 15,
      notes: ""
    });
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.trainer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.venue?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.session_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-primary/20 text-primary">Scheduled</Badge>;
      case 'in_progress':
        return <Badge className="bg-alert-caution/20 text-alert-caution">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-alert-normal/20 text-alert-normal">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-alert-critical/20 text-alert-critical">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCourseById = (programId: string) => {
    return BLACK_HAWK_COURSE_CATALOG.find(c => c.id === programId);
  };

  // Stats
  const scheduledCount = sessions.filter(s => s.status === 'scheduled').length;
  const inProgressCount = sessions.filter(s => s.status === 'in_progress').length;
  const completedCount = sessions.filter(s => s.status === 'completed').length;
  const totalEnrolled = sessions.reduce((sum, s) => sum + (s.enrolled_count || 0), 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
                <p className="text-xl font-bold">{scheduledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-alert-caution/10 to-alert-caution/5 border-alert-caution/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-alert-caution/20">
                <Play className="w-5 h-5 text-alert-caution" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-xl font-bold text-alert-caution">{inProgressCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-alert-normal/10 to-alert-normal/5 border-alert-normal/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-alert-normal/20">
                <CheckCircle2 className="w-5 h-5 text-alert-normal" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-xl font-bold text-alert-normal">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Enrolled</p>
                <p className="text-xl font-bold">{totalEnrolled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Schedule Session
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Schedule Training Session
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); createSession.mutate(formData); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Training Program</Label>
                    <Select value={formData.program_id} onValueChange={(v) => setFormData({ ...formData, program_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLACK_HAWK_COURSE_CATALOG.map(course => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.id} - {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Trainer Name</Label>
                      <Input
                        value={formData.trainer_name}
                        onChange={(e) => setFormData({ ...formData, trainer_name: e.target.value })}
                        placeholder="Enter trainer name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Venue</Label>
                      <Input
                        value={formData.venue}
                        onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                        placeholder="Training room/location"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={formData.session_date}
                        onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Max Participants</Label>
                    <Input
                      type="number"
                      value={formData.max_capacity}
                      onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) })}
                      min={1}
                      max={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Any additional notes..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createSession.isPending}>
                      {createSession.isPending ? "Scheduling..." : "Schedule Session"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>

      {/* Sessions Table */}
      <Card className="bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Training Sessions
            <Badge variant="secondary" className="ml-2">{filteredSessions.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session ID</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Trainer</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="animate-pulse text-muted-foreground">Loading sessions...</div>
                    </TableCell>
                  </TableRow>
                ) : filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No sessions found</p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Schedule First Session
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessions.map(session => {
                    const course = getCourseById(session.program_id);
                    const enrollmentPercent = session.max_capacity 
                      ? Math.round((session.enrolled_count / session.max_capacity) * 100) 
                      : 0;
                    
                    return (
                      <TableRow key={session.id}>
                        <TableCell>
                          <span className="font-mono text-xs">{session.session_id}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{course?.name || session.program_id}</p>
                            <p className="text-xs text-muted-foreground">{session.program_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                                {session.trainer_name?.split(' ').map(n => n[0]).join('') || 'TR'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{session.trainer_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm">{format(new Date(session.session_date), 'MMM dd, yyyy')}</p>
                              <p className="text-xs text-muted-foreground">
                                {session.start_time} - {session.end_time}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{session.venue}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm">{session.enrolled_count}/{session.max_capacity}</span>
                            </div>
                            <Progress value={enrollmentPercent} className="h-1.5 w-16" />
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(session.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <UserPlus className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingSessionManager;
