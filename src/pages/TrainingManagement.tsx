import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  GraduationCap, BookOpen, Users, Award, Target, Shield,
  ClipboardCheck, Building2, FileQuestion, BarChart3,
  Calendar, Play, UserCheck, Video, AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BlackHawkCourseCatalog from "@/components/training/BlackHawkCourseCatalog";
import CompetencyMatrix from "@/components/training/CompetencyMatrix";
import SiteComplianceEngine from "@/components/training/SiteComplianceEngine";
import AssessmentEngine from "@/components/training/AssessmentEngine";
import CertificationEngine from "@/components/training/CertificationEngine";
import TrainingSessionManager from "@/components/training/TrainingSessionManager";
import TrainerWorkload from "@/components/training/TrainerWorkload";
import ELearningModules from "@/components/training/ELearningModules";
import TrainingAnalytics from "@/components/training/TrainingAnalytics";

const TrainingManagement = () => {
  const [selectedTab, setSelectedTab] = useState("catalog");

  // Fetch training stats from database
  const { data: sessions = [] } = useQuery({
    queryKey: ['training-sessions-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: records = [] } = useQuery({
    queryKey: ['training-records-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_records')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: certifications = [] } = useQuery({
    queryKey: ['staff-certifications-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_certifications')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate real stats
  const totalCourses = 12; // From Black Hawk catalog
  const coreSkills = 7;
  const specializedSkills = 5;
  const activeCertifications = certifications.filter(c => c.status === 'active').length;
  const expiringCerts = certifications.filter(c => {
    if (!c.expiry_date) return false;
    const daysLeft = Math.ceil((new Date(c.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 && daysLeft <= 30;
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training Management"
        description="Black Hawk 2025 Training Manual - Comprehensive training, certification, and compliance management"
        icon={GraduationCap}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Course Catalog</p>
                <p className="text-xl font-bold">{totalCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Core Skills</p>
                <p className="text-xl font-bold">{coreSkills}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Shield className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Specialized</p>
                <p className="text-xl font-bold">{specializedSkills}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Award className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Certifications</p>
                <p className="text-xl font-bold">{activeCertifications || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                {expiringCerts > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                ) : (
                  <Building2 className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expiring Soon</p>
                <p className="text-xl font-bold">{expiringCerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-max lg:w-auto">
            <TabsTrigger value="catalog" className="gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Course Catalog</span>
              <span className="sm:hidden">Catalog</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Sessions</span>
              <span className="sm:hidden">Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="elearning" className="gap-2">
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">E-Learning</span>
              <span className="sm:hidden">E-Learn</span>
            </TabsTrigger>
            <TabsTrigger value="trainers" className="gap-2">
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Trainers</span>
              <span className="sm:hidden">Trainers</span>
            </TabsTrigger>
            <TabsTrigger value="competency" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Competency</span>
              <span className="sm:hidden">Matrix</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Site Compliance</span>
              <span className="sm:hidden">Comply</span>
            </TabsTrigger>
            <TabsTrigger value="assessments" className="gap-2">
              <FileQuestion className="w-4 h-4" />
              <span className="hidden sm:inline">Assessments</span>
              <span className="sm:hidden">Assess</span>
            </TabsTrigger>
            <TabsTrigger value="certifications" className="gap-2">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Certifications</span>
              <span className="sm:hidden">Certs</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="catalog" className="mt-4">
          <Card className="bg-card/50 border-primary/20 p-6">
            <BlackHawkCourseCatalog />
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <TrainingSessionManager />
        </TabsContent>

        <TabsContent value="elearning" className="mt-4">
          <ELearningModules />
        </TabsContent>

        <TabsContent value="trainers" className="mt-4">
          <TrainerWorkload />
        </TabsContent>

        <TabsContent value="competency" className="mt-4">
          <CompetencyMatrix />
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <SiteComplianceEngine />
        </TabsContent>

        <TabsContent value="assessments" className="mt-4">
          <AssessmentEngine />
        </TabsContent>

        <TabsContent value="certifications" className="mt-4">
          <CertificationEngine />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <TrainingAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrainingManagement;
