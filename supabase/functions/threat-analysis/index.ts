import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate JWT authentication
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
    
    // Create client with user's auth token to validate
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Validate the user's session
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    
    if (userError || !user) {
      console.error('JWT validation failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log('Authenticated user:', userId);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Starting threat analysis...');

    // Create Supabase client with service role for data access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch recent incidents from the database
    const { data: incidents, error: incidentsError } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (incidentsError) {
      console.error('Error fetching incidents:', incidentsError);
      throw incidentsError;
    }

    console.log(`Fetched ${incidents?.length || 0} incidents for analysis`);

    // Prepare incident summary for AI analysis
    const incidentSummary = incidents?.map(inc => ({
      id: inc.incident_number,
      type: inc.incident_type,
      severity: inc.severity,
      location: inc.location,
      title: inc.title,
      description: inc.description,
      status: inc.status,
      date: inc.occurred_at
    })) || [];

    // Call Lovable AI for threat analysis
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an advanced security threat analyst for Black Hawk SOC-OS. Analyze incident patterns, identify risks, and provide actionable security recommendations. Be specific, data-driven, and focus on actionable intelligence. Format your response as JSON with the following structure:
{
  "threatLevel": "low|medium|high|critical",
  "patterns": [{"pattern": "description", "frequency": number, "severity": "low|medium|high|critical"}],
  "risks": [{"risk": "description", "likelihood": "low|medium|high", "impact": "low|medium|high", "mitigation": "strategy"}],
  "recommendations": [{"priority": "high|medium|low", "action": "description", "rationale": "why"}],
  "trends": {"summary": "overall trend analysis", "hotspots": ["location1", "location2"]},
  "summary": "executive summary of current threat landscape"
}`
          },
          {
            role: 'user',
            content: `Analyze the following ${incidentSummary.length} recent security incidents and provide threat intelligence:

${JSON.stringify(incidentSummary, null, 2)}

Provide detailed threat analysis including:
1. Current threat level
2. Patterns in incident types and locations
3. Identified risks and mitigation strategies
4. Prioritized security recommendations
5. Trend analysis and hotspots
6. Executive summary`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI analysis completed');

    const analysisContent = aiResponse.choices[0].message.content;
    
    // Try to parse JSON from the response
    let analysisData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = analysisContent.match(/```json\n([\s\S]*?)\n```/) || 
                       analysisContent.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : analysisContent;
      analysisData = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      analysisData = {
        threatLevel: 'medium',
        summary: analysisContent,
        patterns: [],
        risks: [],
        recommendations: [],
        trends: { summary: analysisContent, hotspots: [] }
      };
    }

    return new Response(
      JSON.stringify({
        analysis: analysisData,
        incidentCount: incidents?.length || 0,
        analyzedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in threat-analysis function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
