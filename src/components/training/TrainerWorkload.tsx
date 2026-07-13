import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, Calendar, Clock, Award, TrendingUp, Star,
  BookOpen, CheckCircle2, Target, BarChart3
} from "lucide-react";
import { format } from "date-fns";

interface Trainer {
  id: string;
  name: string;
  specializations: string[];
  total_sessions: number;
  upcoming_sessions: number;
  completed_sessions: number;
  students_trained: number;
  avg_rating: number;
  availability: "available" | "busy" | "on_leave";
  certifications: string[];
  next_session?: {
    course: string;
    date: string;
    venue: string;
  };
}

const mockTrainers: Trainer[] = [
  {
    id: "TR-001",
    name: "James Mwangi",
    specializations: ["Security Operations", "Practical Procedures", "Customer Care"],
    total_sessions: 45,
    upcoming_sessions: 3,
    completed_sessions: 42,
    students_trained: 312,
    avg_rating: 4.8,
    availability: "available",
    certifications: ["PSRA Trainer", "First Aid Instructor"],
    next_session: {
      course: "Practical Security Procedures",
      date: "2025-01-15",
      venue: "Training Room A"
    }
  },
  {
    id: "TR-002",
    name: "Peter Njoroge",
    specializations: ["Fire Fighting", "Emergency Response", "Health & Safety"],
    total_sessions: 38,
    upcoming_sessions: 2,
    completed_sessions: 36,
    students_trained: 256,
    avg_rating: 4.6,
    availability: "busy",
    certifications: ["Fire Safety Officer", "H&S Trainer"],
    next_session: {
      course: "Fire Fighting & Emergency",
      date: "2025-01-12",
      venue: "Field Training Ground"
    }
  },
  {
    id: "TR-003",
    name: "Grace Otieno",
    specializations: ["Radio Communication", "Technical Skills"],
    total_sessions: 29,
    upcoming_sessions: 4,
    completed_sessions: 25,
    students_trained: 198,
    avg_rating: 4.9,
    availability: "available",
    certifications: ["Communication Specialist"],
    next_session: {
      course: "Radio Communication",
      date: "2025-01-14",
      venue: "Control Room Training"
    }
  },
  {
    id: "TR-004",
    name: "Dr. Sarah Kimani",
    specializations: ["First Aid", "Medical Emergency", "CPR"],
    total_sessions: 52,
    upcoming_sessions: 5,
    completed_sessions: 47,
    students_trained: 420,
    avg_rating: 4.95,
    availability: "available",
    certifications: ["Medical Doctor", "BLS Instructor", "AED Trainer"],
    next_session: {
      course: "First Aid - DRSABCD",
      date: "2025-01-16",
      venue: "Medical Training Center"
    }
  },
  {
    id: "TR-005",
    name: "Col. (Rtd) David Maina",
    specializations: ["Terrorism Awareness", "Embassy Security", "Surveillance"],
    total_sessions: 24,
    upcoming_sessions: 1,
    completed_sessions: 23,
    students_trained: 145,
    avg_rating: 4.7,
    availability: "on_leave",
    certifications: ["Counter-Terrorism Expert", "Security Consultant"]
  }
];

const TrainerWorkload = () => {
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case "available":
        return <Badge className="bg-alert-normal/20 text-alert-normal">Available</Badge>;
      case "busy":
        return <Badge className="bg-alert-caution/20 text-alert-caution">Busy</Badge>;
      case "on_leave":
        return <Badge className="bg-muted text-muted-foreground">On Leave</Badge>;
      default:
        return <Badge variant="secondary">{availability}</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= Math.round(rating) 
                ? 'fill-amber-400 text-amber-400' 
                : 'text-muted-foreground/30'
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Summary stats
  const totalTrainers = mockTrainers.length;
  const availableTrainers = mockTrainers.filter(t => t.availability === "available").length;
  const totalSessionsThisMonth = mockTrainers.reduce((sum, t) => sum + t.upcoming_sessions, 0);
  const totalStudentsTrained = mockTrainers.reduce((sum, t) => sum + t.students_trained, 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Trainers</p>
                <p className="text-xl font-bold">{totalTrainers}</p>
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
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-xl font-bold text-alert-normal">{availableTrainers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Upcoming Sessions</p>
                <p className="text-xl font-bold">{totalSessionsThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Award className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Students Trained</p>
                <p className="text-xl font-bold">{totalStudentsTrained}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trainer Cards */}
      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
          {mockTrainers.map(trainer => (
            <Card 
              key={trainer.id} 
              className={`bg-card/50 hover:border-primary/50 transition-colors cursor-pointer ${
                selectedTrainer?.id === trainer.id ? 'border-primary' : ''
              }`}
              onClick={() => setSelectedTrainer(trainer)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                        {trainer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{trainer.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getAvailabilityBadge(trainer.availability)}
                        {renderStars(trainer.avg_rating)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Specializations */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Specializations:</p>
                  <div className="flex flex-wrap gap-1">
                    {trainer.specializations.map(spec => (
                      <Badge key={spec} variant="outline" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">{trainer.total_sessions}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-primary/10">
                    <p className="text-lg font-bold text-primary">{trainer.upcoming_sessions}</p>
                    <p className="text-xs text-muted-foreground">Upcoming</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-alert-normal/10">
                    <p className="text-lg font-bold text-alert-normal">{trainer.students_trained}</p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                </div>

                {/* Next Session */}
                {trainer.next_session && (
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Next Session:</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{trainer.next_session.course}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(trainer.next_session.date), 'MMM dd')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {trainer.next_session.venue}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        View
                      </Button>
                    </div>
                  </div>
                )}

                {/* Certifications */}
                <div className="flex flex-wrap gap-1">
                  {trainer.certifications.map(cert => (
                    <Badge 
                      key={cert} 
                      className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30"
                    >
                      <Award className="w-3 h-3 mr-1" />
                      {cert}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TrainerWorkload;
