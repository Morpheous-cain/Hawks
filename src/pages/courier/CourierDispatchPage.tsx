import PageHeader from "@/components/PageHeader";
import { Activity } from "lucide-react";
import { DispatchBoard } from "@/components/courier/DispatchBoard";

const CourierDispatchPage = () => (
  <div className="space-y-6">
    <PageHeader
      title="Courier Dispatch Board"
      description="Live last-mile dispatch — accept jobs, assign riders, route and clear the queue."
      icon={Activity}
    />
    <DispatchBoard />
  </div>
);

export default CourierDispatchPage;
