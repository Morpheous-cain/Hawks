import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Crown, Shield, Briefcase, Radio, Wrench, 
  Search, GraduationCap, UserCheck, User, Building2
} from "lucide-react";

interface OrgNode {
  role_name: string;
  display_name: string;
  description: string;
  reports_to: string | null;
  department: string;
}

const departmentColors: Record<string, string> = {
  'Executive': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Operations': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Technical': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Control Room': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Investigations': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Training': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

const roleIcons: Record<string, any> = {
  'ceo': Crown,
  'board_director': Building2,
  'coo': Briefcase,
  'operations_manager': Users,
  'technical_manager': Wrench,
  'control_room_chief_controller': Radio,
  'operations_team_manager': UserCheck,
  'investigations_manager': Search,
  'training_deployment_manager': GraduationCap,
  'senior_control_room_operator': Radio,
  'control_room_officer': Radio,
  'operations_officer': Shield,
  'technical_officer': Wrench,
  'field_officer': Shield,
  'site_supervisor': UserCheck,
  'guard': User,
};

// Executive hierarchy (shared at top)
const executiveData: OrgNode[] = [
  { role_name: 'ceo', display_name: 'Chief Executive Officer', description: 'Overall leadership, strategy, client relations', reports_to: null, department: 'Executive' },
  { role_name: 'board_director', display_name: 'Board of Directors', description: 'Oversight, policies, strategic guidance', reports_to: 'ceo', department: 'Executive' },
  { role_name: 'coo', display_name: 'Chief Operations Officer', description: 'Leads Operations, Investigations, Technical', reports_to: 'board_director', department: 'Executive' },
];

// Operations Branch
const operationsBranch: OrgNode[][] = [
  [{ role_name: 'operations_manager', display_name: 'Operations Manager', description: 'Oversees Ops, Control Room, Ops Team, Investigations, Training & Deployment', reports_to: 'coo', department: 'Operations' }],
  [
    { role_name: 'control_room_chief_controller', display_name: 'Control Room Chief Controller', description: 'Leads Control Room Operations', reports_to: 'operations_manager', department: 'Control Room' },
    { role_name: 'operations_team_manager', display_name: 'Operations Team Manager', description: 'Oversees Ops Officers & Field Officers', reports_to: 'operations_manager', department: 'Operations' },
    { role_name: 'investigations_manager', display_name: 'Investigations Manager', description: 'Leads all investigative activities', reports_to: 'operations_manager', department: 'Investigations' },
    { role_name: 'training_deployment_manager', display_name: 'Training & Deployment Manager', description: 'Staff training, skills development, onboarding, deployment scheduling', reports_to: 'operations_manager', department: 'Training' },
  ],
  [
    { role_name: 'senior_control_room_operator', display_name: 'Senior Control Room Operator', description: 'Lead shifts, oversee operations', reports_to: 'control_room_chief_controller', department: 'Control Room' },
    { role_name: 'operations_officer', display_name: 'Operations Officer', description: 'Dispatch, alarms, daily management', reports_to: 'operations_team_manager', department: 'Operations' },
  ],
  [
    { role_name: 'control_room_officer', display_name: 'Control Room Operator', description: 'Monitoring, dispatching', reports_to: 'senior_control_room_operator', department: 'Control Room' },
    { role_name: 'field_officer', display_name: 'Field Officer', description: 'Patrol, checkpoints, incident reporting', reports_to: 'operations_officer', department: 'Operations' },
  ],
  [{ role_name: 'site_supervisor', display_name: 'Site In-Charge / Supervisor', description: 'Supervises guards at assigned sites', reports_to: 'field_officer', department: 'Operations' }],
  [{ role_name: 'guard', display_name: 'Security Guard', description: 'Security staff at sites', reports_to: 'site_supervisor', department: 'Operations' }],
];

// Technical Branch
const technicalBranch: OrgNode[][] = [
  [{ role_name: 'technical_manager', display_name: 'Technical Manager', description: 'Leads Tech Officers, CCTV, alarms, sensors, maintenance', reports_to: 'coo', department: 'Technical' }],
  [{ role_name: 'technical_officer', display_name: 'Technical Officer', description: 'CCTV, alarms, sensors, maintenance', reports_to: 'technical_manager', department: 'Technical' }],
];

const allNodes = [...executiveData, ...operationsBranch.flat(), ...technicalBranch.flat()];

export function OrganizationalChart() {
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);

  const renderNode = (node: OrgNode, showConnector = true) => {
    const Icon = roleIcons[node.role_name] || User;
    const colorClass = departmentColors[node.department] || 'bg-muted text-muted-foreground';
    
    return (
      <div 
        key={node.role_name}
        className="flex flex-col items-center cursor-pointer"
        onClick={() => setSelectedNode(node)}
      >
        {showConnector && node.reports_to && (
          <div className="w-px h-4 bg-border" />
        )}
        <Card className={`w-44 border ${colorClass.split(' ')[2] || 'border-border'} bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all ${selectedNode?.role_name === node.role_name ? 'ring-2 ring-primary' : ''}`}>
          <CardContent className="p-2 text-center">
            <div className={`w-8 h-8 rounded-full ${colorClass.split(' ')[0]} flex items-center justify-center mx-auto mb-1`}>
              <Icon className={`h-4 w-4 ${colorClass.split(' ')[1]}`} />
            </div>
            <h4 className="font-semibold text-xs text-foreground leading-tight">{node.display_name}</h4>
            <Badge variant="outline" className={`mt-1 text-[9px] ${colorClass}`}>
              {node.department}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Organizational Structure
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {/* Executive Level */}
        <div className="flex flex-col items-center space-y-2 mb-6">
          {executiveData.map((node, idx) => renderNode(node, idx > 0))}
        </div>

        {/* Two Branches Side by Side */}
        <div className="flex justify-center gap-12">
          {/* Operations Branch */}
          <div className="flex flex-col items-center border border-blue-500/20 rounded-lg p-4 bg-blue-500/5">
            <h3 className="text-sm font-semibold text-blue-400 mb-4">Operations Division</h3>
            <div className="space-y-3">
              {operationsBranch.map((level, levelIdx) => (
                <div key={levelIdx} className="flex justify-center gap-2 flex-wrap">
                  {level.map(node => renderNode(node, levelIdx > 0))}
                </div>
              ))}
            </div>
          </div>

          {/* Technical Branch */}
          <div className="flex flex-col items-center border border-purple-500/20 rounded-lg p-4 bg-purple-500/5">
            <h3 className="text-sm font-semibold text-purple-400 mb-4">Technical Division</h3>
            <div className="space-y-3">
              {technicalBranch.map((level, levelIdx) => (
                <div key={levelIdx} className="flex justify-center gap-2">
                  {level.map(node => renderNode(node, levelIdx > 0))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
            <h4 className="font-semibold text-foreground">{selectedNode.display_name}</h4>
            <p className="text-sm text-muted-foreground mt-1">{selectedNode.description}</p>
            {selectedNode.reports_to && (
              <p className="text-xs text-muted-foreground mt-2">
                Reports to: {allNodes.find(n => n.role_name === selectedNode.reports_to)?.display_name}
              </p>
            )}
          </div>
        )}

        {/* Department Legend */}
        <div className="mt-6 pt-4 border-t border-border">
          <h4 className="text-sm font-medium mb-3">Departments</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(departmentColors).map(([dept, colorClass]) => (
              <Badge key={dept} className={colorClass}>
                {dept}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
