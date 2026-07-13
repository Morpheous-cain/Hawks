import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HeatmapCell {
  hour: number;
  site: string;
  count: number;
  intensity: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

const intensityColors: Record<string, string> = {
  none: 'bg-muted/30',
  low: 'bg-green-500/20',
  medium: 'bg-green-500/50',
  high: 'bg-primary/50',
  critical: 'bg-primary',
};

const PatrolHeatmap = () => {
  const [cells, setCells] = useState<HeatmapCell[]>([]);
  const [sites, setSites] = useState<string[]>([]);

  useEffect(() => {
    fetchHeatmapData();
  }, []);

  const fetchHeatmapData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: scans } = await supabase
      .from('patrol_checkpoints')
      .select('scanned_at, checkpoints(sites(site_name))')
      .gte('scanned_at', today.toISOString())
      .order('scanned_at');

    if (!scans) return;

    // Aggregate by hour and site
    const hourSiteCounts: Record<string, number> = {};
    const siteSet = new Set<string>();

    scans.forEach((scan: any) => {
      const site = scan.checkpoints?.sites?.site_name || 'Unknown';
      const hour = new Date(scan.scanned_at).getHours();
      siteSet.add(site);
      const key = `${hour}-${site}`;
      hourSiteCounts[key] = (hourSiteCounts[key] || 0) + 1;
    });

    const uniqueSites = Array.from(siteSet);
    setSites(uniqueSites);

    const maxCount = Math.max(...Object.values(hourSiteCounts), 1);
    const result: HeatmapCell[] = [];

    for (let h = 0; h < 24; h++) {
      for (const site of uniqueSites) {
        const count = hourSiteCounts[`${h}-${site}`] || 0;
        const ratio = count / maxCount;
        let intensity: HeatmapCell['intensity'] = 'none';
        if (ratio > 0.75) intensity = 'critical';
        else if (ratio > 0.5) intensity = 'high';
        else if (ratio > 0.25) intensity = 'medium';
        else if (ratio > 0) intensity = 'low';

        result.push({ hour: h, site, count, intensity });
      }
    }

    setCells(result);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="w-5 h-5" />
          Patrol Density Heatmap — Today
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sites.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No patrol data available today</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-1 font-medium text-muted-foreground sticky left-0 bg-background">Site</th>
                  {hours.map(h => (
                    <th key={h} className="p-1 text-center text-muted-foreground min-w-[28px]">
                      {h.toString().padStart(2, '0')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sites.map(site => (
                  <tr key={site}>
                    <td className="p-1 font-medium truncate max-w-[120px] sticky left-0 bg-background">{site}</td>
                    {hours.map(h => {
                      const cell = cells.find(c => c.hour === h && c.site === site);
                      return (
                        <td key={h} className="p-0.5">
                          <div
                            className={`w-6 h-6 rounded-sm ${intensityColors[cell?.intensity || 'none']} flex items-center justify-center`}
                            title={`${site} @ ${h}:00 — ${cell?.count || 0} scans`}
                          >
                            {(cell?.count || 0) > 0 && (
                              <span className="text-[10px] font-bold">{cell?.count}</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
              <span>Density:</span>
              {['none', 'low', 'medium', 'high', 'critical'].map(level => (
                <div key={level} className="flex items-center gap-1">
                  <div className={`w-4 h-4 rounded-sm ${intensityColors[level]}`} />
                  <span className="capitalize">{level}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatrolHeatmap;
