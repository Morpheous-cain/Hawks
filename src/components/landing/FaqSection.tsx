import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = [
  {
    q: "Where is our data stored, and who owns it?",
    a: "Data is stored in encrypted, tenant-isolated databases. The client retains full ownership; Black Hawk acts as data processor. On-premise and hybrid deployments are available for sovereignty-sensitive clients.",
  },
  {
    q: "What happens when a field officer goes offline?",
    a: "The MDT and Field App queue all entries (DOB, patrols, SOS, evidence) in encrypted local storage and sync the moment connectivity returns. SOS is delivered via SMS fallback when data is unavailable.",
  },
  {
    q: "Which CCTV and hardware vendors are supported?",
    a: "Native integration with Dahua and Hikvision via ONVIF/RTSP, Tramigo GPS, INRICO and Motorola radios. Any ONVIF-compliant device works out of the box. Custom integrations are available on request.",
  },
  {
    q: "How long does training take?",
    a: "Control room operators reach proficiency in 2–3 days using built-in tabletop simulations. Field officers complete the MDT certification in under 90 minutes. Supervisors receive structured 1-week onboarding.",
  },
  {
    q: "Can we migrate from spreadsheets or our existing system?",
    a: "Yes. We provide a guided migration covering staff registers, client sites, patrol routes, and historical incident logs. Most migrations complete within the first deployment week.",
  },
  {
    q: "What is the SLA for critical alarms and SOS events?",
    a: "Critical alarms surface in Control Room within 2 seconds. SOS triggers a multi-channel alert (audio, push, SMS) with built-in 30-second auto-escalation if unacknowledged.",
  },
  {
    q: "Does the system run on cellular networks across Kenya?",
    a: "Yes. The Field App and MDT are optimized for 3G/4G with aggressive payload compression, and degrade gracefully to SMS for SOS. Coverage tested across Nairobi, Mombasa, Kisumu, Nakuru, and rural deployments.",
  },
  {
    q: "How are evidence and chain-of-custody handled?",
    a: "Every body-cam clip and uploaded artifact is SHA-256 hashed, watermarked with timestamp + officer ID + GPS, and access-logged. Locked evidence cannot be edited or deleted — only exported with full audit trail.",
  },
  {
    q: "What does support look like after deployment?",
    a: "24/7 operations support, dedicated client success manager, quarterly business reviews, and access to the Black Hawk Co-Pilot AI assistant. Emergency response within 15 minutes for system-down incidents.",
  },
  {
    q: "Can clients see their own sites in real time?",
    a: "Yes. The white-label Client Portal gives clients live status, incident feeds, patrol proof, advisories, and service requests scoped only to their estate — with no visibility into other tenants.",
  },
];

export const FaqSection = () => (
  <Accordion type="single" collapsible className="w-full">
    {FAQ.map((item, i) => (
      <AccordionItem
        key={i}
        value={`item-${i}`}
        className="border border-border/50 rounded-lg mb-3 px-5 bg-card/40 backdrop-blur-md hover:border-primary/40 transition-colors"
      >
        <AccordionTrigger className="text-left hover:no-underline py-5 text-base font-semibold">
          {item.q}
        </AccordionTrigger>
        <AccordionContent className="text-foreground/70 leading-relaxed pb-5">
          {item.a}
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
);
