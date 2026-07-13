// Incident Command and Incident Management have been unified into a single
// "Incident Command Centre" module. This file re-exports the unified page so
// every route (/incidents, /platform/*/m/incident-command, prefetch keys) lands
// on the same surface and there is no duplicated incident workflow.
export { default } from "@/pages/IncidentManagement";
