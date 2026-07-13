import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PatrolComplianceScore {
  officerId: string;
  officerName: string;
  siteName: string;
  totalExpectedCheckpoints: number;
  completedCheckpoints: number;
  missedCheckpoints: number;
  hitRate: number; // percentage
  avgTimeBetweenScans: number; // minutes
  onTimeScans: number;
  lateScans: number;
  timingScore: number; // percentage
  overallScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  lastScanTime: string | null;
}

const calculateGrade = (score: number): 'A' | 'B' | 'C' | 'D' | 'F' => {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
};

export const usePatrolCompliance = (dateRange?: { from: string; to: string }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = dateRange?.from || today.toISOString();
  const to = dateRange?.to || new Date().toISOString();

  return useQuery({
    queryKey: ['patrol-compliance', from, to],
    queryFn: async (): Promise<PatrolComplianceScore[]> => {
      // Get all patrol checkpoints scanned in date range
      const { data: scans } = await supabase
        .from('patrol_checkpoints')
        .select('*, patrols(guard_id, site_name)')
        .gte('scanned_at', from)
        .lte('scanned_at', to)
        .order('scanned_at', { ascending: true });

      // Get all active checkpoints per site
      const { data: checkpoints } = await supabase
        .from('checkpoints')
        .select('*, sites(site_name)')
        .eq('is_active', true);

      // Get staff names
      const { data: staff } = await supabase
        .from('staff')
        .select('id, full_name, current_site')
        .eq('status', 'active');

      if (!scans || !checkpoints || !staff) return [];

      // Group scans by guard
      const guardScans: Record<string, any[]> = {};
      scans.forEach((scan: any) => {
        const guardId = scan.patrols?.guard_id || 'unknown';
        if (!guardScans[guardId]) guardScans[guardId] = [];
        guardScans[guardId].push(scan);
      });

      // Calculate compliance per officer
      const scores: PatrolComplianceScore[] = staff.map((officer) => {
        const officerScans = guardScans[officer.id] || [];
        const siteName = officer.current_site || 'Unassigned';
        
        // Expected checkpoints for this site
        const siteCheckpoints = checkpoints.filter(
          (cp: any) => cp.sites?.site_name === siteName
        );
        const totalExpected = Math.max(siteCheckpoints.length, 1);
        const completed = officerScans.length;
        const missed = Math.max(0, totalExpected - completed);
        const hitRate = totalExpected > 0 ? Math.round((completed / totalExpected) * 100) : 0;

        // Calculate timing compliance
        let totalTimeDiff = 0;
        let onTime = 0;
        let late = 0;
        const EXPECTED_INTERVAL_MINS = 60; // Expected scan every 60 min

        for (let i = 1; i < officerScans.length; i++) {
          const diff = (new Date(officerScans[i].scanned_at).getTime() -
            new Date(officerScans[i - 1].scanned_at).getTime()) / 60000;
          totalTimeDiff += diff;
          if (diff <= EXPECTED_INTERVAL_MINS * 1.2) {
            onTime++;
          } else {
            late++;
          }
        }

        const avgTime = officerScans.length > 1
          ? Math.round(totalTimeDiff / (officerScans.length - 1))
          : 0;
        const timingScore = (onTime + late) > 0
          ? Math.round((onTime / (onTime + late)) * 100)
          : 100;

        const overallScore = Math.round((hitRate * 0.6) + (timingScore * 0.4));

        return {
          officerId: officer.id,
          officerName: officer.full_name,
          siteName,
          totalExpectedCheckpoints: totalExpected,
          completedCheckpoints: completed,
          missedCheckpoints: missed,
          hitRate: Math.min(hitRate, 100),
          avgTimeBetweenScans: avgTime,
          onTimeScans: onTime,
          lateScans: late,
          timingScore,
          overallScore: Math.min(overallScore, 100),
          grade: calculateGrade(overallScore),
          lastScanTime: officerScans.length > 0
            ? officerScans[officerScans.length - 1].scanned_at
            : null,
        };
      });

      return scores.sort((a, b) => b.overallScore - a.overallScore);
    },
    staleTime: 60000,
  });
};

export default usePatrolCompliance;
