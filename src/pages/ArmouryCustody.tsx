import ArmouryCustodyModule from "@/components/armoury/ArmouryCustodyModule";
import PageHeader from "@/components/PageHeader";

const ArmouryCustody = () => (
  <div className="container mx-auto px-4 py-6 space-y-6">
    <PageHeader
      title="Asset & Armoury Custody"
      description="Chain-of-custody for firearms, radios, body cams and field equipment."
    />
    <ArmouryCustodyModule />
  </div>
);

export default ArmouryCustody;
