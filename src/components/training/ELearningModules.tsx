import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, BookOpen, Video, FileText, CheckCircle2, Clock, 
  Award, Search, Filter, ChevronRight, Lock, Star
} from "lucide-react";
import { BLACK_HAWK_COURSE_CATALOG } from "./BlackHawkCourseCatalog";

interface ELearningModule {
  id: string;
  course_id: string;
  module_name: string;
  module_type: "video" | "interactive" | "document" | "quiz";
  duration_minutes: number;
  description: string;
  is_locked: boolean;
  is_completed: boolean;
  progress: number;
  order: number;
}

// Generate e-learning modules from course catalog
const generateModules = (): ELearningModule[] => {
  const modules: ELearningModule[] = [];
  
  BLACK_HAWK_COURSE_CATALOG.forEach(course => {
    course.modules.forEach((mod, idx) => {
      modules.push({
        id: `${course.id}-M${idx + 1}`,
        course_id: course.id,
        module_name: mod.name,
        module_type: idx % 4 === 0 ? "video" : idx % 4 === 1 ? "interactive" : idx % 4 === 2 ? "document" : "quiz",
        duration_minutes: mod.duration,
        description: `Learn about ${mod.name.toLowerCase()} as part of ${course.name}`,
        is_locked: idx > 0,
        is_completed: false,
        progress: 0,
        order: idx + 1
      });
    });
  });
  
  // Simulate some progress
  modules[0].is_completed = true;
  modules[0].progress = 100;
  modules[1].is_locked = false;
  modules[1].progress = 65;
  modules[4].is_completed = true;
  modules[4].progress = 100;
  modules[5].is_locked = false;
  modules[5].progress = 30;
  
  return modules;
};

const mockModules = generateModules();

const ELearningModules = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const getModuleIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "interactive":
        return <Play className="w-4 h-4" />;
      case "document":
        return <FileText className="w-4 h-4" />;
      case "quiz":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getModuleTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      video: "bg-primary/20 text-primary",
      interactive: "bg-accent/20 text-accent-foreground",
      document: "bg-alert-caution/20 text-alert-caution",
      quiz: "bg-alert-normal/20 text-alert-normal"
    };
    return (
      <Badge className={styles[type] || "bg-muted text-muted-foreground"}>
        {getModuleIcon(type)}
        <span className="ml-1 capitalize">{type}</span>
      </Badge>
    );
  };

  const filteredModules = mockModules.filter(mod => {
    const matchesSearch = mod.module_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         mod.course_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = !selectedCourse || mod.course_id === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  const groupedModules = filteredModules.reduce((acc, mod) => {
    if (!acc[mod.course_id]) {
      acc[mod.course_id] = [];
    }
    acc[mod.course_id].push(mod);
    return acc;
  }, {} as Record<string, ELearningModule[]>);

  // Stats
  const totalModules = mockModules.length;
  const completedModules = mockModules.filter(m => m.is_completed).length;
  const inProgressModules = mockModules.filter(m => m.progress > 0 && !m.is_completed).length;
  const overallProgress = Math.round((completedModules / totalModules) * 100);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Modules</p>
                <p className="text-xl font-bold">{totalModules}</p>
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
                <p className="text-xl font-bold text-alert-normal">{completedModules}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-alert-caution/10 to-alert-caution/5 border-alert-caution/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-alert-caution/20">
                <Clock className="w-5 h-5 text-alert-caution" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-xl font-bold text-alert-caution">{inProgressModules}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <Award className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overall Progress</p>
                <p className="text-xl font-bold">{overallProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <ScrollArea className="w-full sm:flex-1">
            <div className="flex gap-2 pb-2">
              <Button 
                variant={selectedCourse === null ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedCourse(null)}
              >
                All Courses
              </Button>
              {BLACK_HAWK_COURSE_CATALOG.slice(0, 6).map(course => (
                <Button
                  key={course.id}
                  variant={selectedCourse === course.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCourse(course.id)}
                  className="whitespace-nowrap"
                >
                  {course.id}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </Card>

      {/* Modules List */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-6 pr-4">
          {Object.entries(groupedModules).map(([courseId, modules]) => {
            const course = BLACK_HAWK_COURSE_CATALOG.find(c => c.id === courseId);
            const courseProgress = Math.round(
              (modules.filter(m => m.is_completed).length / modules.length) * 100
            );
            
            return (
              <Card key={courseId} className="bg-card/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        {course?.name || courseId}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {modules.length} modules • {course?.duration_hours} hours total
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${
                        courseProgress === 100 ? 'text-alert-normal' : 'text-primary'
                      }`}>
                        {courseProgress}%
                      </span>
                      <Progress value={courseProgress} className="w-24 h-2 mt-1" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {modules.sort((a, b) => a.order - b.order).map((mod, idx) => (
                      <div
                        key={mod.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          mod.is_locked 
                            ? 'bg-muted/30 border-border/50 opacity-60' 
                            : mod.is_completed
                              ? 'bg-alert-normal/5 border-alert-normal/30'
                              : 'bg-card hover:border-primary/50 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Order Number */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            mod.is_completed 
                              ? 'bg-alert-normal text-alert-normal-foreground' 
                              : mod.is_locked
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-primary/20 text-primary'
                          }`}>
                            {mod.is_completed ? <CheckCircle2 className="w-4 h-4" /> : mod.order}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{mod.module_name}</p>
                              {mod.is_locked && <Lock className="w-3 h-3 text-muted-foreground" />}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              {getModuleTypeBadge(mod.module_type)}
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {mod.duration_minutes} min
                              </span>
                            </div>
                          </div>

                          {/* Progress/Action */}
                          <div className="flex items-center gap-3">
                            {mod.progress > 0 && mod.progress < 100 && (
                              <div className="text-right">
                                <span className="text-xs text-muted-foreground">{mod.progress}%</span>
                                <Progress value={mod.progress} className="w-16 h-1.5 mt-1" />
                              </div>
                            )}
                            {!mod.is_locked && !mod.is_completed && (
                              <Button size="sm" variant="outline" className="h-7 gap-1">
                                {mod.progress > 0 ? "Continue" : "Start"}
                                <ChevronRight className="w-3 h-3" />
                              </Button>
                            )}
                            {mod.is_completed && (
                              <Badge className="bg-alert-normal/20 text-alert-normal">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Complete
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ELearningModules;
