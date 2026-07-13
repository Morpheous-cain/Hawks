import VisitorAccessModule from "@/components/visitor-access/VisitorAccessModule";
import PageHeader from "@/components/PageHeader";

const VisitorAccess = () => (
  <div className="container mx-auto px-4 py-6 space-y-6">
    <PageHeader
      title="Visitor & Access Management"
      description="Pre-clearance, badge issue/return, on-site visitors and watchlist screening."
    />
    <VisitorAccessModule />
  </div>
);

export default VisitorAccess;
