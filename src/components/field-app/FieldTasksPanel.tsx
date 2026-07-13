import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClipboardList, CheckCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  category: string | null;
  created_at: string;
  completed_at: string | null;
}

const FieldTasksPanel = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('field-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .in('status', ['pending', 'in_progress'])
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: userData.user?.id
        })
        .eq('id', taskId);

      if (error) throw error;
      toast.success("Task completed");
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error("Failed to complete task");
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'in_progress' })
        .eq('id', taskId);

      if (error) throw error;
      toast.success("Task started");
      fetchTasks();
    } catch (error) {
      console.error('Error starting task:', error);
      toast.error("Failed to start task");
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: "text-red-500 border-red-500/30",
      medium: "text-amber-500 border-amber-500/30",
      low: "text-blue-500 border-blue-500/30",
    };
    return colors[priority] || colors.medium;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: React.ElementType }> = {
      pending: { color: "bg-amber-500/20 text-amber-500", icon: Clock },
      in_progress: { color: "bg-blue-500/20 text-blue-500", icon: RefreshCw },
      completed: { color: "bg-green-500/20 text-green-500", icon: CheckCircle },
    };
    return badges[status] || badges.pending;
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card/50 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingTasks.length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressTasks.length}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* In Progress Tasks */}
      {inProgressTasks.length > 0 && (
        <Card className="border-blue-500/20 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-500">
              <RefreshCw className="h-5 w-5" />
              In Progress ({inProgressTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inProgressTasks.map((task) => (
                <Card key={task.id} className="bg-blue-500/5 border-blue-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        onCheckedChange={() => handleCompleteTask(task.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{task.title}</p>
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Started {format(new Date(task.created_at), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Tasks */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Pending Tasks ({pendingTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : pendingTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="font-medium">All Caught Up!</p>
                <p className="text-sm text-muted-foreground">No pending tasks</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map((task) => {
                  const StatusIcon = getStatusBadge(task.status).icon;
                  return (
                    <Card key={task.id} className="bg-card/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{task.title}</p>
                              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground">
                                {task.description}
                              </p>
                            )}
                            {task.category && (
                              <Badge variant="secondary" className="mt-2 text-xs">
                                {task.category}
                              </Badge>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Assigned {format(new Date(task.created_at), 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleStartTask(task.id)}
                          >
                            Start
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default FieldTasksPanel;
