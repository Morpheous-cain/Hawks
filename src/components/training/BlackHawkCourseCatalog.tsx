import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, Shield, Flame, Radio, Users, AlertTriangle, 
  Heart, Eye, Building2, Target, Search, Clock, Award,
  ChevronRight, CheckCircle2, FileText, GraduationCap
} from "lucide-react";

// Black Hawk 2025 Training Manual - Master Course Catalog
export const BLACK_HAWK_COURSE_CATALOG = [
  {
    id: "SEC-101",
    name: "Introduction to Security",
    category: "security",
    duration_hours: 4,
    is_mandatory: true,
    certification_validity_months: 24,
    delivery_mode: "classroom",
    assessment_type: "written_quiz",
    passing_score: 70,
    icon: Shield,
    objectives: [
      "Understand the definition and principles of security",
      "Learn the duties and roles of security officers",
      "Analyze why people commit crimes (emotional, environmental, mental factors)",
      "Identify security threats and vulnerabilities"
    ],
    materials: ["Black Hawk Security Manual", "Case Study Handbook"],
    modules: [
      { name: "Definition of Security", duration: 60 },
      { name: "Duties & Roles of Officers", duration: 90 },
      { name: "Why People Commit Crimes", duration: 60 },
      { name: "Security Threat Assessment", duration: 30 }
    ]
  },
  {
    id: "SEC-102",
    name: "Qualities of a Professional Guard",
    category: "security",
    duration_hours: 3,
    is_mandatory: true,
    certification_validity_months: 24,
    delivery_mode: "classroom",
    assessment_type: "practical",
    passing_score: 80,
    icon: Users,
    objectives: [
      "Master professional grooming standards",
      "Develop discipline and punctuality",
      "Enhance communication skills",
      "Learn customer handling techniques"
    ],
    materials: ["Uniform Standards Guide", "Communication Handbook"],
    modules: [
      { name: "Grooming & Uniform Standards", duration: 45 },
      { name: "Discipline & Conduct", duration: 45 },
      { name: "Communication Skills", duration: 45 },
      { name: "Customer Interaction", duration: 45 }
    ]
  },
  {
    id: "SEC-103",
    name: "Basic Roles of a Security Officer",
    category: "security",
    duration_hours: 6,
    is_mandatory: true,
    certification_validity_months: 12,
    delivery_mode: "blended",
    assessment_type: "practical",
    passing_score: 75,
    icon: Target,
    objectives: [
      "Master the 4 D's: Detect, Deter, Delay, Report",
      "Understand observation and vigilance techniques",
      "Learn incident response protocols",
      "Practice reporting procedures"
    ],
    materials: ["Patrol SOP", "Incident Report Templates"],
    modules: [
      { name: "Detect - Threat Identification", duration: 90 },
      { name: "Deter - Visible Security Presence", duration: 60 },
      { name: "Delay - Tactical Response", duration: 90 },
      { name: "Report - Documentation Standards", duration: 120 }
    ]
  },
  {
    id: "SEC-104",
    name: "Types of Guards & Deployment",
    category: "security",
    duration_hours: 4,
    is_mandatory: true,
    certification_validity_months: 24,
    delivery_mode: "classroom",
    assessment_type: "written_quiz",
    passing_score: 70,
    icon: Users,
    objectives: [
      "Understand static guard responsibilities",
      "Learn patrol guard procedures",
      "Differentiate site-specific requirements",
      "Master handover protocols"
    ],
    materials: ["Guard Deployment Manual", "Site Assignment Guide"],
    modules: [
      { name: "Static Guard Operations", duration: 90 },
      { name: "Patrol Guard Procedures", duration: 90 },
      { name: "Specialized Deployments", duration: 60 }
    ]
  },
  {
    id: "SEC-105",
    name: "Practical Security Procedures",
    category: "security",
    duration_hours: 8,
    is_mandatory: true,
    certification_validity_months: 12,
    delivery_mode: "practical",
    assessment_type: "drill_evaluation",
    passing_score: 80,
    icon: Shield,
    objectives: [
      "Execute effective patrolling techniques",
      "Conduct thorough searching procedures",
      "Handle suspects professionally",
      "Perform lawful arrest and detention",
      "Complete accurate OB entries"
    ],
    materials: ["Patrol SOP", "Search Protocol Guide", "OB Manual"],
    modules: [
      { name: "Patrolling Techniques", duration: 120 },
      { name: "Search Procedures (Person/Vehicle/Building)", duration: 120 },
      { name: "Suspect Handling", duration: 90 },
      { name: "Arrest & Detention Protocols", duration: 90 },
      { name: "OB Entry Standards", duration: 60 }
    ]
  },
  {
    id: "FIRE-101",
    name: "Fire Fighting & Emergency Response",
    category: "safety",
    duration_hours: 6,
    is_mandatory: true,
    certification_validity_months: 12,
    delivery_mode: "practical",
    assessment_type: "drill_evaluation",
    passing_score: 85,
    icon: Flame,
    objectives: [
      "Understand fire triangle principles",
      "Identify classes of fire (A, B, C, D, K)",
      "Operate fire extinguishers using PASS technique",
      "Execute REACT emergency procedure",
      "Conduct fire drills"
    ],
    materials: ["Fire Safety Manual", "Extinguisher Guide", "Evacuation Plans"],
    modules: [
      { name: "Fire Principles & Triangle", duration: 45 },
      { name: "Classes of Fire", duration: 45 },
      { name: "Fire Extinguishers & PASS Technique", duration: 90 },
      { name: "REACT Procedure", duration: 60 },
      { name: "Fire Drill Execution", duration: 120 }
    ]
  },
  {
    id: "COMM-101",
    name: "Communication & Radio Operations",
    category: "technical",
    duration_hours: 4,
    is_mandatory: true,
    certification_validity_months: 12,
    delivery_mode: "practical",
    assessment_type: "practical",
    passing_score: 80,
    icon: Radio,
    objectives: [
      "Master radio communication protocols",
      "Learn NATO phonetic alphabet",
      "Use whistle and torch signals",
      "Practice clear and concise reporting"
    ],
    materials: ["Radio Operations Manual", "Phonetic Alphabet Chart"],
    modules: [
      { name: "Radio Protocol & Etiquette", duration: 60 },
      { name: "Phonetic Alphabet (Alpha-Zulu)", duration: 45 },
      { name: "Signal Systems (Whistle, Torch)", duration: 45 },
      { name: "Practical Radio Exercises", duration: 90 }
    ]
  },
  {
    id: "CS-101",
    name: "Customer Care & Service Excellence",
    category: "customer_service",
    duration_hours: 4,
    is_mandatory: true,
    certification_validity_months: 24,
    delivery_mode: "classroom",
    assessment_type: "role_play",
    passing_score: 75,
    icon: Users,
    objectives: [
      "Demonstrate professional conduct",
      "Understand customer expectations",
      "Apply Do's and Don'ts of customer service",
      "Handle difficult situations professionally"
    ],
    materials: ["Customer Service Handbook", "Scenario Cards"],
    modules: [
      { name: "Professional Conduct Standards", duration: 60 },
      { name: "Customer Expectations", duration: 45 },
      { name: "Do's and Don'ts", duration: 45 },
      { name: "Role-Play Scenarios", duration: 90 }
    ]
  },
  {
    id: "SURV-101",
    name: "Surveillance & Detection",
    category: "technical",
    duration_hours: 6,
    is_mandatory: false,
    certification_validity_months: 24,
    delivery_mode: "blended",
    assessment_type: "scenario_exam",
    passing_score: 80,
    icon: Eye,
    objectives: [
      "Understand surveillance techniques",
      "Detect surveillance activities",
      "Identify suspicious behavior patterns",
      "Report reconnaissance activities"
    ],
    materials: ["Surveillance Detection Manual", "Video Analysis Guide"],
    modules: [
      { name: "Surveillance Fundamentals", duration: 90 },
      { name: "Counter-Surveillance Techniques", duration: 90 },
      { name: "Behavior Pattern Analysis", duration: 90 },
      { name: "Practical Exercises", duration: 90 }
    ]
  },
  {
    id: "DIP-101",
    name: "Diplomatic & Embassy Security",
    category: "security",
    duration_hours: 8,
    is_mandatory: false,
    certification_validity_months: 12,
    delivery_mode: "blended",
    assessment_type: "practical",
    passing_score: 85,
    icon: Building2,
    objectives: [
      "Master access control procedures",
      "Operate security equipment (X-ray, WTMD, HHMD)",
      "Handle diplomatic protocols",
      "Execute emergency procedures"
    ],
    materials: ["Embassy Security Manual", "Equipment Operation Guide"],
    modules: [
      { name: "Access Control Systems", duration: 120 },
      { name: "Alarm Systems", duration: 60 },
      { name: "X-ray & Metal Detector Operations", duration: 120 },
      { name: "Emergency Procedures", duration: 90 },
      { name: "Diplomatic Protocol", duration: 90 }
    ]
  },
  {
    id: "TERROR-101",
    name: "Terrorism Awareness & Prevention",
    category: "security",
    duration_hours: 6,
    is_mandatory: false,
    certification_validity_months: 12,
    delivery_mode: "classroom",
    assessment_type: "scenario_exam",
    passing_score: 85,
    icon: AlertTriangle,
    objectives: [
      "Identify types of attackers",
      "Recognize behavioral indicators",
      "Detect reconnaissance patterns",
      "Respond to terror threats"
    ],
    materials: ["Counter-Terrorism Manual", "Threat Assessment Guide"],
    modules: [
      { name: "Understanding Terrorism", duration: 60 },
      { name: "Types of Attackers", duration: 60 },
      { name: "Behavioral Indicators", duration: 90 },
      { name: "Reconnaissance Detection", duration: 90 },
      { name: "Response Protocols", duration: 60 }
    ]
  },
  {
    id: "FA-101",
    name: "First Aid - DRSABCD",
    category: "safety",
    duration_hours: 8,
    is_mandatory: true,
    certification_validity_months: 24,
    delivery_mode: "practical",
    assessment_type: "practical",
    passing_score: 90,
    icon: Heart,
    objectives: [
      "Apply DRSABCD protocol",
      "Perform CPR correctly",
      "Use AED equipment",
      "Handle common medical emergencies"
    ],
    materials: ["First Aid Manual", "CPR Guide", "AED Training Kit"],
    modules: [
      { name: "Danger Assessment", duration: 30 },
      { name: "Response Check", duration: 30 },
      { name: "Send for Help", duration: 20 },
      { name: "Airway Management", duration: 60 },
      { name: "Breathing Assessment", duration: 60 },
      { name: "CPR Technique", duration: 120 },
      { name: "Defibrillation (AED)", duration: 90 },
      { name: "Practical Assessment", duration: 70 }
    ]
  }
];

// Practical Drills from Black Hawk Training Manual
export const PRACTICAL_DRILLS = [
  {
    id: "DRILL-PAT",
    name: "Patrol Simulation Drill",
    course_id: "SEC-105",
    duration_minutes: 60,
    checkpoints: [
      "Timed patrol completion",
      "Route variation execution",
      "Incident detection accuracy",
      "Report quality assessment"
    ]
  },
  {
    id: "DRILL-SEARCH",
    name: "Search Drill",
    course_id: "SEC-105",
    duration_minutes: 45,
    checkpoints: [
      "Person search technique",
      "Vehicle search procedure",
      "Building search protocol",
      "Evidence handling"
    ]
  },
  {
    id: "DRILL-FIRE",
    name: "Fire Drill",
    course_id: "FIRE-101",
    duration_minutes: 30,
    checkpoints: [
      "Extinguisher operation (PASS)",
      "Hose reel deployment",
      "Evacuation execution",
      "Assembly point management"
    ]
  },
  {
    id: "DRILL-ARREST",
    name: "Arrest & Detention Drill",
    course_id: "SEC-105",
    duration_minutes: 30,
    checkpoints: [
      "Approach technique",
      "Command presence",
      "Restraint application",
      "Rights notification"
    ]
  }
];

// Assessment Question Bank
export const ASSESSMENT_BANK = [
  {
    course_id: "SEC-101",
    questions: [
      {
        id: "Q1",
        question: "Why do people commit crimes?",
        options: ["Emotional factors", "Environmental factors", "Mental factors", "All of the above"],
        correct: 3,
        type: "multiple_choice"
      },
      {
        id: "Q2",
        question: "What is the primary role of a security officer?",
        options: ["Make arrests", "Protect people and property", "Patrol only", "Monitor CCTV"],
        correct: 1,
        type: "multiple_choice"
      }
    ]
  },
  {
    course_id: "FIRE-101",
    questions: [
      {
        id: "Q1",
        question: "What does REACT stand for in fire emergency?",
        options: [
          "Run, Escape, Alert, Call, Try",
          "Raise alarm, Evacuate, Assess, Call, Try",
          "Report, Evacuate, Assist, Control, Test",
          "Ready, Escape, Alert, Check, Test"
        ],
        correct: 1,
        type: "multiple_choice"
      },
      {
        id: "Q2",
        question: "What does PASS stand for when using a fire extinguisher?",
        options: [
          "Pull, Aim, Squeeze, Sweep",
          "Push, Aim, Spray, Stop",
          "Pull, Assess, Spray, Sweep",
          "Point, Aim, Squeeze, Stop"
        ],
        correct: 0,
        type: "multiple_choice"
      }
    ]
  },
  {
    course_id: "COMM-101",
    questions: [
      {
        id: "Q1",
        question: "What does the phonetic letter 'S' stand for?",
        options: ["Sam", "Sierra", "Sugar", "Simon"],
        correct: 1,
        type: "multiple_choice"
      }
    ]
  },
  {
    course_id: "SEC-105",
    questions: [
      {
        id: "Q1",
        question: "When is a guard authorized to arrest someone?",
        options: [
          "Whenever they feel threatened",
          "When an offence recognizable by law is being committed",
          "Only with police present",
          "Never - only police can arrest"
        ],
        correct: 1,
        type: "multiple_choice"
      }
    ]
  }
];

interface BlackHawkCourseCatalogProps {
  onSelectCourse?: (course: typeof BLACK_HAWK_COURSE_CATALOG[0]) => void;
  onCreateProgram?: (course: typeof BLACK_HAWK_COURSE_CATALOG[0]) => void;
}

const BlackHawkCourseCatalog = ({ onSelectCourse, onCreateProgram }: BlackHawkCourseCatalogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCourses = BLACK_HAWK_COURSE_CATALOG.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: "security", label: "Security Operations", count: BLACK_HAWK_COURSE_CATALOG.filter(c => c.category === "security").length },
    { id: "safety", label: "Health & Safety", count: BLACK_HAWK_COURSE_CATALOG.filter(c => c.category === "safety").length },
    { id: "technical", label: "Technical Skills", count: BLACK_HAWK_COURSE_CATALOG.filter(c => c.category === "technical").length },
    { id: "customer_service", label: "Customer Service", count: BLACK_HAWK_COURSE_CATALOG.filter(c => c.category === "customer_service").length }
  ];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      security: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      safety: "bg-green-500/20 text-green-400 border-green-500/30",
      technical: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      customer_service: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Black Hawk 2025 Training Manual</h3>
          <p className="text-sm text-muted-foreground">Master Course Catalog - 12 Core Programs</p>
        </div>
        <Badge className="bg-primary/20 text-primary border border-primary/30">
          <GraduationCap className="w-3 h-3 mr-1" />
          Official Black Hawk Curriculum
        </Badge>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search courses by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant={selectedCategory === null ? "default" : "outline"} 
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All ({BLACK_HAWK_COURSE_CATALOG.length})
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label} ({cat.count})
            </Button>
          ))}
        </div>
      </div>

      {/* Course Grid */}
      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
          {filteredCourses.map((course) => {
            const Icon = course.icon;
            return (
              <Card 
                key={course.id} 
                className="bg-card/50 border-border/50 hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => onSelectCourse?.(course)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge className={getCategoryColor(course.category)}>
                      {course.category.replace("_", " ")}
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-2 group-hover:text-primary transition-colors">
                    {course.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground font-mono">{course.id}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {course.duration_hours}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Valid {course.certification_validity_months}mo
                    </span>
                  </div>
                  
                  {course.is_mandatory && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Mandatory
                    </Badge>
                  )}

                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">
                      {course.modules.length} modules • {course.assessment_type.replace("_", " ")}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Pass: {course.passing_score}%</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateProgram?.(course);
                        }}
                      >
                        Create Program
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
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

export default BlackHawkCourseCatalog;
