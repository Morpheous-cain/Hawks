import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileQuestion, CheckCircle2, XCircle, Clock, Award, 
  Play, ChevronRight, ChevronLeft, RotateCcw, Trophy,
  ClipboardList, Target, BookOpen
} from "lucide-react";
import { ASSESSMENT_BANK, PRACTICAL_DRILLS } from "./BlackHawkCourseCatalog";

interface Question {
  id: string;
  question: string;
  options: string[];
  correct: number;
  type: string;
}

interface ExamSession {
  courseId: string;
  courseName: string;
  questions: Question[];
  currentQuestion: number;
  answers: Record<string, number>;
  completed: boolean;
  score: number;
  passed: boolean;
  passingScore: number;
}

const AssessmentEngine = () => {
  const [activeExam, setActiveExam] = useState<ExamSession | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [drillChecklist, setDrillChecklist] = useState<Record<string, boolean>>({});

  const getCourseQuestions = (courseId: string): Question[] => {
    const bank = ASSESSMENT_BANK.find(b => b.course_id === courseId);
    return bank?.questions || [];
  };

  const startExam = (courseId: string, courseName: string, passingScore: number = 70) => {
    const questions = getCourseQuestions(courseId);
    if (questions.length === 0) {
      // Generate sample questions if no bank exists
      const sampleQuestions: Question[] = [
        {
          id: "sample-1",
          question: `What is the primary objective of ${courseName}?`,
          options: ["Safety", "Security", "Efficiency", "All of the above"],
          correct: 3,
          type: "multiple_choice"
        },
        {
          id: "sample-2",
          question: "Which of the following is a core responsibility?",
          options: ["Report incidents", "Maintain vigilance", "Follow SOPs", "All of the above"],
          correct: 3,
          type: "multiple_choice"
        }
      ];
      setActiveExam({
        courseId,
        courseName,
        questions: sampleQuestions,
        currentQuestion: 0,
        answers: {},
        completed: false,
        score: 0,
        passed: false,
        passingScore
      });
    } else {
      setActiveExam({
        courseId,
        courseName,
        questions,
        currentQuestion: 0,
        answers: {},
        completed: false,
        score: 0,
        passed: false,
        passingScore
      });
    }
    setShowResults(false);
  };

  const answerQuestion = (questionId: string, answerIndex: number) => {
    if (!activeExam) return;
    setActiveExam({
      ...activeExam,
      answers: { ...activeExam.answers, [questionId]: answerIndex }
    });
  };

  const nextQuestion = () => {
    if (!activeExam) return;
    if (activeExam.currentQuestion < activeExam.questions.length - 1) {
      setActiveExam({ ...activeExam, currentQuestion: activeExam.currentQuestion + 1 });
    }
  };

  const prevQuestion = () => {
    if (!activeExam) return;
    if (activeExam.currentQuestion > 0) {
      setActiveExam({ ...activeExam, currentQuestion: activeExam.currentQuestion - 1 });
    }
  };

  const submitExam = () => {
    if (!activeExam) return;
    
    let correct = 0;
    activeExam.questions.forEach(q => {
      if (activeExam.answers[q.id] === q.correct) {
        correct++;
      }
    });

    const score = Math.round((correct / activeExam.questions.length) * 100);
    const passed = score >= activeExam.passingScore;

    setActiveExam({
      ...activeExam,
      completed: true,
      score,
      passed
    });
    setShowResults(true);
  };

  const resetExam = () => {
    setActiveExam(null);
    setShowResults(false);
  };

  const toggleDrillItem = (drillId: string, checkpointIdx: number) => {
    const key = `${drillId}-${checkpointIdx}`;
    setDrillChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Available courses for assessment
  const assessmentCourses = [
    { id: "SEC-101", name: "Introduction to Security", passingScore: 70 },
    { id: "FIRE-101", name: "Fire Fighting & Emergency", passingScore: 85 },
    { id: "COMM-101", name: "Radio Communication", passingScore: 80 },
    { id: "SEC-105", name: "Practical Security Procedures", passingScore: 80 },
    { id: "CS-101", name: "Customer Care", passingScore: 75 },
    { id: "FA-101", name: "First Aid - DRSABCD", passingScore: 90 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-primary" />
            Assessment Engine
          </h3>
          <p className="text-sm text-muted-foreground">
            Quizzes, exams, and practical evaluation checklists
          </p>
        </div>
        <Badge className="bg-primary/20 text-primary">
          Black Hawk 2025 Standards
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Written Assessments */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Written Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
                {assessmentCourses.map(course => {
                  const questions = getCourseQuestions(course.id);
                  return (
                    <Card 
                      key={course.id} 
                      className="p-4 hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{course.name}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileQuestion className="w-3 h-3" />
                              {questions.length > 0 ? `${questions.length} questions` : 'Sample quiz'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              Pass: {course.passingScore}%
                            </span>
                          </div>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              className="gap-1"
                              onClick={() => startExam(course.id, course.name, course.passingScore)}
                            >
                              <Play className="w-3 h-3" />
                              Start
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh]">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-primary" />
                                {activeExam?.courseName} Assessment
                              </DialogTitle>
                            </DialogHeader>
                            
                            {activeExam && !showResults && (
                              <div className="space-y-6">
                                {/* Progress */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Question {activeExam.currentQuestion + 1} of {activeExam.questions.length}</span>
                                    <span className="text-muted-foreground">
                                      {Object.keys(activeExam.answers).length} answered
                                    </span>
                                  </div>
                                  <Progress 
                                    value={((activeExam.currentQuestion + 1) / activeExam.questions.length) * 100} 
                                    className="h-2"
                                  />
                                </div>

                                {/* Question */}
                                <Card className="p-6">
                                  <p className="text-lg font-medium mb-6">
                                    {activeExam.questions[activeExam.currentQuestion].question}
                                  </p>
                                  
                                  <RadioGroup
                                    value={activeExam.answers[activeExam.questions[activeExam.currentQuestion].id]?.toString()}
                                    onValueChange={(value) => answerQuestion(
                                      activeExam.questions[activeExam.currentQuestion].id,
                                      parseInt(value)
                                    )}
                                  >
                                    {activeExam.questions[activeExam.currentQuestion].options.map((option, idx) => (
                                      <div 
                                        key={idx} 
                                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                                          activeExam.answers[activeExam.questions[activeExam.currentQuestion].id] === idx
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/50'
                                        }`}
                                      >
                                        <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                                        <Label 
                                          htmlFor={`option-${idx}`} 
                                          className="flex-1 cursor-pointer"
                                        >
                                          {option}
                                        </Label>
                                      </div>
                                    ))}
                                  </RadioGroup>
                                </Card>

                                {/* Navigation */}
                                <div className="flex items-center justify-between">
                                  <Button
                                    variant="outline"
                                    onClick={prevQuestion}
                                    disabled={activeExam.currentQuestion === 0}
                                  >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Previous
                                  </Button>

                                  {activeExam.currentQuestion === activeExam.questions.length - 1 ? (
                                    <Button 
                                      onClick={submitExam}
                                      disabled={Object.keys(activeExam.answers).length < activeExam.questions.length}
                                    >
                                      Submit Exam
                                      <CheckCircle2 className="w-4 h-4 ml-1" />
                                    </Button>
                                  ) : (
                                    <Button onClick={nextQuestion}>
                                      Next
                                      <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Results */}
                            {showResults && activeExam && (
                              <div className="text-center space-y-6 py-6">
                                <div className={`inline-flex p-6 rounded-full ${
                                  activeExam.passed ? 'bg-alert-normal/20' : 'bg-alert-critical/20'
                                }`}>
                                  {activeExam.passed ? (
                                    <Trophy className="w-16 h-16 text-alert-normal" />
                                  ) : (
                                    <XCircle className="w-16 h-16 text-alert-critical" />
                                  )}
                                </div>

                                <div>
                                  <h3 className={`text-3xl font-bold ${
                                    activeExam.passed ? 'text-alert-normal' : 'text-alert-critical'
                                  }`}>
                                    {activeExam.score}%
                                  </h3>
                                  <p className="text-lg mt-2">
                                    {activeExam.passed ? 'Congratulations! You passed!' : 'Unfortunately, you did not pass.'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Required: {activeExam.passingScore}%
                                  </p>
                                </div>

                                <div className="flex justify-center gap-3">
                                  <Button variant="outline" onClick={resetExam}>
                                    <RotateCcw className="w-4 h-4 mr-1" />
                                    Try Again
                                  </Button>
                                  {activeExam.passed && (
                                    <Button>
                                      <Award className="w-4 h-4 mr-1" />
                                      View Certificate
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Practical Drills */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Practical Drills & Evaluations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4 pr-4">
                {PRACTICAL_DRILLS.map(drill => {
                  const completedItems = drill.checkpoints.filter(
                    (_, idx) => drillChecklist[`${drill.id}-${idx}`]
                  ).length;
                  const progress = Math.round((completedItems / drill.checkpoints.length) * 100);

                  return (
                    <Card key={drill.id} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{drill.name}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {drill.duration_minutes} minutes
                              <Badge variant="outline" className="text-xs">
                                {drill.course_id}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-lg font-bold ${
                              progress === 100 ? 'text-alert-normal' : 'text-muted-foreground'
                            }`}>
                              {progress}%
                            </span>
                            <Progress value={progress} className="w-20 h-2 mt-1" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground font-medium">Evaluation Checkpoints:</p>
                          {drill.checkpoints.map((checkpoint, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center space-x-3 p-2 rounded border border-border/50 hover:border-primary/50"
                            >
                              <Checkbox
                                id={`${drill.id}-${idx}`}
                                checked={drillChecklist[`${drill.id}-${idx}`] || false}
                                onCheckedChange={() => toggleDrillItem(drill.id, idx)}
                              />
                              <Label 
                                htmlFor={`${drill.id}-${idx}`}
                                className="flex-1 text-sm cursor-pointer"
                              >
                                {checkpoint}
                              </Label>
                            </div>
                          ))}
                        </div>

                        {progress === 100 && (
                          <Button size="sm" className="w-full gap-1">
                            <Award className="w-4 h-4" />
                            Record Completion
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssessmentEngine;
