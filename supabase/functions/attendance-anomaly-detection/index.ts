import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch recent attendance data (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*, staff:staff_id(full_name, position)')
      .gte('check_in', sevenDaysAgo)
      .order('check_in', { ascending: false });

    if (!attendance || attendance.length === 0) {
      return new Response(JSON.stringify({
        anomalies: [],
        summary: 'No attendance data in the last 7 days to analyze.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Analyze patterns locally (no AI needed for basic detection)
    const anomalies: any[] = [];
    const staffClockIns: Record<string, any[]> = {};

    attendance.forEach((record: any) => {
      const staffId = record.staff_id;
      if (!staffClockIns[staffId]) staffClockIns[staffId] = [];
      staffClockIns[staffId].push(record);
    });

    for (const [staffId, records] of Object.entries(staffClockIns)) {
      const staffName = records[0]?.staff?.full_name || 'Unknown';

      // Check for suspiciously short shifts (< 2 hours)
      records.forEach((r: any) => {
        if (r.check_out) {
          const hours = (new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / 3600000;
          if (hours < 2) {
            anomalies.push({
              type: 'short_shift',
              severity: 'warning',
              staffId,
              staffName,
              detail: `Suspiciously short shift: ${hours.toFixed(1)} hours on ${new Date(r.check_in).toLocaleDateString()}`,
              timestamp: r.check_in,
            });
          }
        }
      });

      // Check for missing biometric verification
      records.forEach((r: any) => {
        if (r.notes && !r.notes.includes('Selfie: captured') && !r.notes.includes('Biometric: verified')) {
          anomalies.push({
            type: 'no_verification',
            severity: 'high',
            staffId,
            staffName,
            detail: `Clock-in without selfie or biometric verification at ${r.site}`,
            timestamp: r.check_in,
          });
        }
      });

      // Check for excessive clock-ins in one day
      const dailyCounts: Record<string, number> = {};
      records.forEach((r: any) => {
        const day = new Date(r.check_in).toLocaleDateString();
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      });

      for (const [day, count] of Object.entries(dailyCounts)) {
        if (count > 3) {
          anomalies.push({
            type: 'excessive_clockins',
            severity: 'critical',
            staffId,
            staffName,
            detail: `${count} clock-ins on ${day} — possible proxy fraud`,
            timestamp: records[0].check_in,
          });
        }
      }
    }

    // If AI key available, use AI for deeper analysis
    let aiInsight = '';
    if (lovableApiKey && anomalies.length > 0) {
      try {
        const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{
              role: 'user',
              content: `You are a security operations analyst. Analyze these attendance anomalies and provide a brief executive summary with recommendations:\n\n${JSON.stringify(anomalies.slice(0, 20), null, 2)}\n\nProvide: 1) Risk assessment, 2) Top 3 recommendations, 3) Officers requiring immediate investigation. Keep response under 200 words.`,
            }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiInsight = data.choices?.[0]?.message?.content || '';
        }
      } catch (aiError) {
        console.error('AI analysis failed:', aiError);
      }
    }

    return new Response(JSON.stringify({
      anomalies: anomalies.sort((a, b) => {
        const sev = { critical: 0, high: 1, warning: 2 };
        return (sev[a.severity as keyof typeof sev] || 3) - (sev[b.severity as keyof typeof sev] || 3);
      }),
      totalRecordsAnalyzed: attendance.length,
      staffAnalyzed: Object.keys(staffClockIns).length,
      aiInsight,
      summary: `Found ${anomalies.length} anomalies across ${Object.keys(staffClockIns).length} officers from ${attendance.length} records.`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Anomaly detection error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
