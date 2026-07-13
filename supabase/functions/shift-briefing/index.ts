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
    const { shiftType, siteName } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Gather context data for the briefing
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const [
      { data: incidents },
      { data: alarms },
      { data: attendance },
      { data: advisories },
      { data: dobEntries },
    ] = await Promise.all([
      supabase.from('incidents').select('*').gte('created_at', yesterday.toISOString()).order('created_at', { ascending: false }).limit(10),
      supabase.from('alarm_activations').select('*').gte('triggered_at', yesterday.toISOString()).order('triggered_at', { ascending: false }).limit(10),
      supabase.from('attendance').select('*, staff:staff_id(full_name)').gte('check_in', today.toISOString()).limit(20),
      supabase.from('strategic_advisories').select('*').eq('status', 'Active').limit(5),
      supabase.from('dob_entries').select('*').gte('entry_time', yesterday.toISOString()).limit(10),
    ]);

    const context = {
      date: today.toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      shiftType: shiftType || 'incoming',
      siteName: siteName || 'All Sites',
      recentIncidents: (incidents || []).map((i: any) => `${i.incident_type}: ${i.description?.substring(0, 100)} (${i.status})`),
      activeAlarms: (alarms || []).length,
      alarmSummary: (alarms || []).map((a: any) => `${a.alarm_type} at ${a.location} (${a.status})`).slice(0, 5),
      officersOnDuty: (attendance || []).filter((a: any) => !a.check_out).length,
      officerNames: (attendance || []).filter((a: any) => !a.check_out).map((a: any) => a.staff?.full_name || 'Unknown'),
      activeAdvisories: (advisories || []).map((a: any) => `[${a.threat_level}] ${a.title}`),
      recentDobEntries: (dobEntries || []).map((d: any) => `${d.entry_type}: ${d.description?.substring(0, 80)}`),
    };

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
          content: `You are the Black Hawk SOC-OS Control Room AI assistant generating a shift briefing.

Generate a concise, professional shift briefing for ${context.shiftType} shift on ${context.date} at ${context.siteName}.

CONTEXT:
- Officers currently on duty: ${context.officersOnDuty} (${context.officerNames.join(', ')})
- Active alarms: ${context.activeAlarms}
- Alarm details: ${context.alarmSummary.join('; ')}
- Recent incidents (24h): ${context.recentIncidents.join('; ') || 'None'}
- Active security advisories: ${context.activeAdvisories.join('; ') || 'None'}
- Recent DOB entries: ${context.recentDobEntries.join('; ') || 'None'}

FORMAT:
1. **Situation Overview** (2-3 sentences)
2. **Key Alerts & Warnings** (bullet points)
3. **Officer Deployment Status** (brief summary)
4. **Priority Actions for This Shift** (3-5 items)
5. **Standing Orders** (any ongoing instructions)

Keep it under 300 words. Use professional security operations language.`,
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API returned ${response.status}`);
    }

    const data = await response.json();
    const briefing = data.choices?.[0]?.message?.content || 'Unable to generate briefing.';

    return new Response(JSON.stringify({
      briefing,
      generatedAt: new Date().toISOString(),
      context: {
        officersOnDuty: context.officersOnDuty,
        activeAlarms: context.activeAlarms,
        recentIncidentCount: context.recentIncidents.length,
        activeAdvisoryCount: context.activeAdvisories.length,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Shift briefing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
