import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Shield, AlertTriangle, CheckCircle2, XCircle, Building2, 
  Users, Search, Download, MapPin, Clock, Flame, Heart,
  Radio, Eye, Target, RefreshCw
} from "lucide-react";

// Site Compliance Requirements from Black Hawk Training Manual
const SITE_TYPE_REQUIREMENTS: Record<string, { name: string; required: string[]; optional: string[] }> = {
  embassy: {
    name: "Embassy/Diplomatic",
    required: ["DIP-101", "TERROR-101", "SEC-105", "COMM-101", "FA-101"],
    optional: ["SURV-101"]
  },
  mall: {
    name: "Shopping Mall",
    required: ["SEC-105", "FIRE-101", "CS-101", "COMM-101", "TERROR-101"],
    optional: ["FA-101", "SURV-101"]
  },
  hotel: {
    name: "Hotel/Hospitality",
    required: ["SEC-105", "FIRE-101", "CS-101", "FA-101", "COMM-101"],
    optional: ["TERROR-101"]
  },
  industrial: {
    name: "Industrial/Warehouse",
    required: ["SEC-105", "FIRE-101", "COMM-101"],
    optional: ["FA-101"]
  },
  residential: {
    name: "Residential Estate",
    required: ["SEC-105", "CS-101", "COMM-101"],
    optional: ["FA-101"]
  },
  office: {
    name: "Office Complex",
    required: ["SEC-105", "FIRE-101", "CS-101", "COMM-101"],
    optional: ["FA-101", "TERROR-101"]
  },
  bank: {
    name: "Bank/Financial",
    required: ["SEC-105", "TERROR-101", "COMM-101", "SURV-101"],
    optional: ["FA-101"]
  }
};

// Mock site compliance data
const mockSites = [
  {
    id: "SITE-001",
    name: "Freedom Airline HQ",
    type: "office",
    address: "Westlands, Nairobi",
    assigned_guards: 8,
    guards: [
      { id: "G1", name: "John Kamau", certifications: ["SEC-105", "FIRE-101", "CS-101", "COMM-101", "FA-101"] },
      { id: "G2", name: "Mary Wanjiku", certifications: ["SEC-105", "FIRE-101", "CS-101", "COMM-101"] },
      { id: "G3", name: "Peter Ochieng", certifications: ["SEC-105", "CS-101", "COMM-101"] },
      { id: "G4", name: "Grace Muthoni", certifications: ["SEC-105", "FIRE-101", "CS-101", "COMM-101", "FA-101", "TERROR-101"] }
    ],
    expiring_soon: ["John Kamau - FIRE-101 (15 days)", "Mary Wanjiku - COMM-101 (30 days)"]
  },
  {
    id: "SITE-002",
    name: "US Embassy Annex",
    type: "embassy",
    address: "Gigiri, Nairobi",
    assigned_guards: 12,
    guards: [
      { id: "G5", name: "Samuel Kipruto", certifications: ["DIP-101", "TERROR-101", "SEC-105", "COMM-101", "FA-101", "SURV-101"] },
      { id: "G6", name: "David Mutua", certifications: ["DIP-101", "TERROR-101", "SEC-105", "COMM-101", "FA-101"] },
      { id: "G7", name: "Jane Nyambura", certifications: ["SEC-105", "COMM-101", "FA-101"] }
    ],
    expiring_soon: []
  },
  {
    id: "SITE-003",
    name: "Sarit Centre Mall",
    type: "mall",
    address: "Westlands, Nairobi",
    assigned_guards: 20,
    guards: [
      { id: "G8", name: "Kevin Otieno", certifications: ["SEC-105", "FIRE-101", "CS-101", "COMM-101", "TERROR-101"] },
      { id: "G9", name: "Alice Wairimu", certifications: ["SEC-105", "FIRE-101", "CS-101", "COMM-101"] },
      { id: "G10", name: "Brian Kimani", certifications: ["SEC-105", "CS-101", "COMM-101"] }
    ],
    expiring_soon: ["Brian Kimani - FIRE-101 (Expired)"]
  }
];

const getCourseIcon = (courseId: string) => {
  const icons: Record<string, React.ElementType> = {
    "SEC-105": Shield,
    "FIRE-101": Flame,
    "COMM-101": Radio,
    "CS-101": Users,
    "FA-101": Heart,
    "DIP-101": Building2,
    "TERROR-101": AlertTriangle,
    "SURV-101": Eye
  };
  return icons[courseId] || Target;
};

const getCourseLabel = (courseId: string) => {
  const labels: Record<string, string> = {
    "SEC-105": "Practical Security",
    "FIRE-101": "Fire Fighting",
    "COMM-101": "Radio Comms",
    "CS-101": "Customer Care",
    "FA-101": "First Aid",
    "DIP-101": "Embassy Security",
    "TERROR-101": "Terrorism Awareness",
    "SURV-101": "Surveillance"
  };
  return labels[courseId] || courseId;
};

const SiteComplianceEngine = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSiteType, setSelectedSiteType] = useState<string | null>(null);

  const calculateSiteCompliance = (site: typeof mockSites[0]) => {
    const requirements = SITE_TYPE_REQUIREMENTS[site.type];
    if (!requirements) return { percentage: 0, missing: [], warnings: [] };

    const missing: string[] = [];
    const warnings: string[] = [];

    // Check if at least one guard has each required certification
    requirements.required.forEach(courseId => {
      const hasQualifiedGuard = site.guards.some(g => g.certifications.includes(courseId));
      if (!hasQualifiedGuard) {
        missing.push(courseId);
      }
    });

    // Check for first-aid trained officer requirement
    if (!site.guards.some(g => g.certifications.includes("FA-101"))) {
      warnings.push("No first-aid trained officer on site");
    }

    // Check embassy requirement
    if (site.type === "embassy") {
      const embassyTrained = site.guards.filter(g => g.certifications.includes("DIP-101")).length;
      if (embassyTrained < 2) {
        warnings.push("Less than 2 embassy-trained officers for diplomatic assignment");
      }
    }

    // Check terrorism awareness for high-risk sites
    if (["embassy", "mall", "hotel", "bank"].includes(site.type)) {
      const terrorTrained = site.guards.filter(g => g.certifications.includes("TERROR-101")).length;
      if (terrorTrained === 0) {
        warnings.push("No terrorism-trained officer for high-risk site");
      }
    }

    const totalRequired = requirements.required.length;
    const met = totalRequired - missing.length;
    const percentage = Math.round((met / totalRequired) * 100);

    return { percentage, missing, warnings };
  };

  const filteredSites = mockSites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         site.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedSiteType || site.type === selectedSiteType;
    return matchesSearch && matchesType;
  });

  // Overall stats
  const totalSites = mockSites.length;
  const compliantSites = mockSites.filter(s => calculateSiteCompliance(s).percentage === 100).length;
  const sitesWithWarnings = mockSites.filter(s => {
    const { warnings, missing } = calculateSiteCompliance(s);
    return warnings.length > 0 || missing.length > 0;
  }).length;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Sites</p>
                <p className="text-xl font-bold">{totalSites}</p>
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
                <p className="text-xs text-muted-foreground">Fully Compliant</p>
                <p className="text-xl font-bold text-alert-normal">{compliantSites}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-alert-caution/10 to-alert-caution/5 border-alert-caution/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-alert-caution/20">
                <AlertTriangle className="w-5 h-5 text-alert-caution" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">With Warnings</p>
                <p className="text-xl font-bold text-alert-caution">{sitesWithWarnings}</p>
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
                <p className="text-xs text-muted-foreground">Guards Deployed</p>
                <p className="text-xl font-bold">{mockSites.reduce((sum, s) => sum + s.assigned_guards, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex gap-3 w-full sm:w-auto flex-1">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search sites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={selectedSiteType === null ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedSiteType(null)}
            >
              All Types
            </Button>
            {Object.entries(SITE_TYPE_REQUIREMENTS).slice(0, 4).map(([key, value]) => (
              <Button
                key={key}
                variant={selectedSiteType === key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSiteType(key)}
              >
                {value.name}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Site Cards */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-4 pr-4">
          {filteredSites.map(site => {
            const { percentage, missing, warnings } = calculateSiteCompliance(site);
            const requirements = SITE_TYPE_REQUIREMENTS[site.type];

            return (
              <Card key={site.id} className="bg-card/50 border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        {site.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{requirements?.name}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {site.address}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className={`text-2xl font-bold ${
                        percentage === 100 ? 'text-alert-normal' : 
                        percentage >= 80 ? 'text-alert-caution' : 'text-alert-critical'
                      }`}>
                        {percentage}%
                      </div>
                      <span className="text-xs text-muted-foreground">Compliance</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Training Requirements Met</span>
                      <span>{requirements?.required.length - missing.length}/{requirements?.required.length}</span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className={`h-2 ${
                        percentage === 100 ? '[&>div]:bg-alert-normal' : 
                        percentage >= 80 ? '[&>div]:bg-alert-caution' : '[&>div]:bg-alert-critical'
                      }`}
                    />
                  </div>

                  {/* Required Certifications */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Required Certifications:</p>
                    <div className="flex flex-wrap gap-2">
                      {requirements?.required.map(courseId => {
                        const Icon = getCourseIcon(courseId);
                        const hasCertified = site.guards.some(g => g.certifications.includes(courseId));
                        return (
                          <Badge 
                            key={courseId}
                            className={hasCertified 
                              ? "bg-alert-normal/20 text-alert-normal border-alert-normal/30" 
                              : "bg-alert-critical/20 text-alert-critical border-alert-critical/30"
                            }
                          >
                            <Icon className="w-3 h-3 mr-1" />
                            {getCourseLabel(courseId)}
                            {hasCertified ? <CheckCircle2 className="w-3 h-3 ml-1" /> : <XCircle className="w-3 h-3 ml-1" />}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Warnings */}
                  {(warnings.length > 0 || missing.length > 0 || site.expiring_soon.length > 0) && (
                    <div className="space-y-2">
                      {missing.length > 0 && (
                        <Alert variant="destructive" className="py-2">
                          <XCircle className="h-4 w-4" />
                          <AlertTitle className="text-sm">Missing Certifications</AlertTitle>
                          <AlertDescription className="text-xs">
                            No guard has: {missing.map(m => getCourseLabel(m)).join(", ")}
                          </AlertDescription>
                        </Alert>
                      )}
                      {warnings.map((warning, idx) => (
                        <Alert key={idx} className="py-2 border-alert-caution/30 bg-alert-caution/5">
                          <AlertTriangle className="h-4 w-4 text-alert-caution" />
                          <AlertDescription className="text-xs">{warning}</AlertDescription>
                        </Alert>
                      ))}
                      {site.expiring_soon.length > 0 && (
                        <Alert className="py-2 border-alert-caution/30 bg-alert-caution/5">
                          <Clock className="h-4 w-4 text-alert-caution" />
                          <AlertTitle className="text-sm">Expiring Soon</AlertTitle>
                          <AlertDescription className="text-xs">
                            {site.expiring_soon.join(", ")}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Staff Summary */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {site.guards.length} of {site.assigned_guards} guards tracked
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                        <RefreshCw className="w-3 h-3" />
                        Rescan
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                        View Details
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

export default SiteComplianceEngine;
