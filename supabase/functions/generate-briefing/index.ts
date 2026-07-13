import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      console.error('JWT validation failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating daily intelligence briefing for user:', user.id);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use strategic_advisories as the single source of truth (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: advisories, error } = await supabase
      .from('strategic_advisories')
      .select('*')
      .gte('timestamp_detected', twentyFourHoursAgo)
      .order('timestamp_detected', { ascending: false });

    if (error) {
      console.error('Error fetching advisories:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch advisory data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${advisories?.length || 0} advisories in last 24 hours`);

    // Group by category and severity
    const categories = ['Traffic', 'Terror', 'Protest', 'Weather', 'Crime'];
    const severities = ['CRITICAL', 'CAUTION', 'NORMAL'];

    const grouped: Record<string, Record<string, any[]>> = {};
    for (const cat of categories) {
      grouped[cat.toLowerCase()] = { critical: [], caution: [], normal: [] };
    }

    advisories?.forEach((adv: any) => {
      const cat = adv.category?.toLowerCase();
      const sev = adv.severity?.toLowerCase();
      if (grouped[cat] && grouped[cat][sev]) {
        grouped[cat][sev].push(adv);
      }
    });

    const stats = {
      total: advisories?.length || 0,
      critical: advisories?.filter((a: any) => a.severity === 'CRITICAL').length || 0,
      caution: advisories?.filter((a: any) => a.severity === 'CAUTION').length || 0,
      normal: advisories?.filter((a: any) => a.severity === 'NORMAL').length || 0,
      byCategory: Object.fromEntries(
        categories.map(cat => [cat.toLowerCase(), advisories?.filter((a: any) => a.category === cat).length || 0])
      ),
    };

    const html = generateBriefingHTML(grouped, stats, twentyFourHoursAgo);

    return new Response(
      JSON.stringify({ success: true, html, stats, advisories: grouped }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Briefing generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateBriefingHTML(grouped: any, stats: any, startTime: string): string {
  const now = new Date();
  const reportDate = now.toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const reportTime = now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; padding: 40px; background: #fff; color: #1a1a1a; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0f172a; padding-bottom: 20px; }
    .logo { font-size: 28px; font-weight: bold; color: #0f172a; margin-bottom: 10px; }
    .subtitle { color: #64748b; font-size: 14px; margin-bottom: 5px; }
    .report-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .info-item { display: flex; align-items: center; gap: 10px; }
    .info-label { font-weight: bold; color: #475569; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #0f172a; }
    .stat-card.critical { border-left-color: #dc2626; }
    .stat-card.caution { border-left-color: #f59e0b; }
    .stat-card.normal { border-left-color: #10b981; }
    .stat-number { font-size: 32px; font-weight: bold; color: #0f172a; }
    .stat-label { color: #64748b; font-size: 12px; text-transform: uppercase; margin-top: 5px; }
    .section { margin-bottom: 30px; page-break-inside: avoid; }
    .section-header { background: #0f172a; color: white; padding: 12px 15px; border-radius: 6px 6px 0 0; font-size: 16px; font-weight: bold; text-transform: uppercase; }
    .section-content { border: 1px solid #e2e8f0; border-top: none; padding: 15px; border-radius: 0 0 6px 6px; }
    .alert-item { padding: 10px; margin-bottom: 10px; border-radius: 4px; border-left: 4px solid; background: #f8fafc; }
    .alert-item.critical { border-left-color: #dc2626; background: #fef2f2; }
    .alert-item.caution { border-left-color: #f59e0b; background: #fffbeb; }
    .alert-item.normal { border-left-color: #10b981; background: #f0fdf4; }
    .alert-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-right: 10px; }
    .badge-critical { background: #dc2626; color: white; }
    .badge-caution { background: #f59e0b; color: white; }
    .badge-normal { background: #10b981; color: white; }
    .alert-time { color: #64748b; font-size: 11px; margin-left: 10px; }
    .alert-message { margin-top: 5px; color: #1e293b; line-height: 1.5; }
    .no-alerts { text-align: center; color: #94a3b8; padding: 20px; font-style: italic; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; }
    @media print { body { padding: 20px; } .section { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🛡️ BLACK HAWK SOC-OS</div>
    <div class="subtitle">REAL-TIME STRATEGIC INTELLIGENCE (RTSI) SYSTEM</div>
    <div class="subtitle">24-Hour Daily Intelligence Briefing</div>
  </div>

  <div class="report-info">
    <div class="info-item"><span class="info-label">Report Date:</span><span>${reportDate}</span></div>
    <div class="info-item"><span class="info-label">Generated:</span><span>${reportTime}</span></div>
    <div class="info-item"><span class="info-label">Period:</span><span>Last 24 Hours</span></div>
    <div class="info-item"><span class="info-label">Classification:</span><span>INTERNAL USE ONLY</span></div>
  </div>

  <div class="stats-grid">
    <div class="stat-card"><div class="stat-number">${stats.total}</div><div class="stat-label">Total Advisories</div></div>
    <div class="stat-card critical"><div class="stat-number">${stats.critical}</div><div class="stat-label">Critical Alerts</div></div>
    <div class="stat-card caution"><div class="stat-number">${stats.caution}</div><div class="stat-label">Caution Alerts</div></div>
    <div class="stat-card normal"><div class="stat-number">${stats.normal}</div><div class="stat-label">Normal Advisories</div></div>
  </div>

  ${generateCategorySection('Traffic Intelligence', grouped.traffic)}
  ${generateCategorySection('Terror Intelligence', grouped.terror)}
  ${generateCategorySection('Protest Monitor', grouped.protest)}
  ${generateCategorySection('Weather Advisory', grouped.weather)}
  ${generateCategorySection('Crime Intelligence', grouped.crime)}

  <div class="footer">
    <p><strong>BLACK HAWK SOC-OS</strong> | RTSI Daily Intelligence Briefing</p>
    <p>This report is confidential and intended for internal security operations only.</p>
    <p>Generated automatically by the Real-Time Strategic Intelligence System</p>
  </div>
</body>
</html>
  `;
}

function generateCategorySection(title: string, data: any): string {
  if (!data) return '';
  const allAlerts = [...(data.critical || []), ...(data.caution || []), ...(data.normal || [])];

  if (allAlerts.length === 0) {
    return `
      <div class="section">
        <div class="section-header">${title}</div>
        <div class="section-content"><div class="no-alerts">No advisories in the last 24 hours</div></div>
      </div>
    `;
  }

  const alertsHTML = allAlerts
    .map((alert: any) => {
      const severity = (alert.severity || 'NORMAL').toLowerCase();
      const time = new Date(alert.timestamp_detected).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
      const date = new Date(alert.timestamp_detected).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });

      return `
        <div class="alert-item ${severity}">
          <div>
            <span class="alert-badge badge-${severity}">${severity}</span>
            <span class="alert-time">${date} ${time}</span>
          </div>
          <div class="alert-message">${alert.title}</div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="section">
      <div class="section-header">
        ${title}
        <span style="float: right; font-size: 14px; font-weight: normal;">
          ${allAlerts.length} advisory${allAlerts.length !== 1 ? 'ies' : ''} 
          (${(data.critical || []).length} critical, ${(data.caution || []).length} caution)
        </span>
      </div>
      <div class="section-content">${alertsHTML}</div>
    </div>
  `;
}
