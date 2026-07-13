import { Shield } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import CheckpointManager from "@/components/CheckpointManager";
import PatrolCheckpointFeed from "@/components/PatrolCheckpointFeed";
const PatrolCheckpoints = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Patrol Checkpoints" 
        description="Manage checkpoint verification system"
        icon={Shield}
      />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        <CheckpointManager />
        <PatrolCheckpointFeed />
      </main>
    </div>
  );
};

export default PatrolCheckpoints;