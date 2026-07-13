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
    console.log('Strategic Advisory AI starting for user:', userId);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const currentTime = new Date().toISOString();
    const currentHour = new Date().getHours();
    const dayPeriod = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';

    const systemPrompt = `You are the AI Intelligence Officer for Black Hawk SOC-OS's Real-Time Strategic Advisory & Intelligence System (RTSI).

Your role is to generate realistic, actionable intelligence advisories for Kenya based on current conditions and threat patterns.

CONTEXT FROM RTSI MANUAL:
- You monitor 5 domains: Traffic, Terror, Protest, Weather, Crime
- Traffic: Monitor Nairobi roads (Mombasa Rd, Thika Rd, Waiyaki Way, Uhuru Hwy, etc.)
- Terror: Focus on U.S. Embassy warnings - threats to malls, hotels, transport hubs, govt buildings
- Protest: Track civil unrest in CBD Nairobi, Parliament, key government areas
- Weather: Kenya Met Dept data - rain, floods, heat advisories
- Crime: Track confirmed crimes (robberies, assaults, break-ins), suspicious activities (loitering, suspicious vehicles), and police updates across Kenya

ADVISORY LEVELS:
- NORMAL: Routine monitoring
- CAUTION: Verified concern, increased vigilance
- CRITICAL: Active threat, immediate action required

Generate 2-3 current advisories for EACH domain (Traffic, Terror, Protest, Weather, Crime).
Make them realistic for Kenyan context, use actual location names, and vary the severity levels.

Current time: ${currentTime} (${dayPeriod})

Return ONLY valid JSON in this exact format:
{
  "traffic": [
    {"id": "unique-id", "message": "advisory text", "level": "normal|caution|critical", "time": "HH:MM"}
  ],
  "terror": [
    {"id": "unique-id", "message": "advisory text", "level": "normal|caution|critical", "time": "HH:MM"}
  ],
  "protest": [
    {"id": "unique-id", "message": "advisory text", "level": "normal|caution|critical", "time": "HH:MM"}
  ],
  "weather": [
    {"id": "unique-id", "message": "advisory text", "level": "normal|caution|critical", "time": "HH:MM"}
  ],
  "crime": [
    {"id": "unique-id", "message": "advisory text", "level": "normal|caution|critical", "time": "HH:MM"}
  ]
}`;

    const userPrompt = `Generate fresh strategic intelligence advisories for Black Hawk SOC-OS's operations in Kenya right now (${dayPeriod}). 

Include:
- Traffic: Nairobi road conditions, accidents, congestion
- Terror: Current threat assessments aligned with U.S. Embassy warnings
- Protest: Any civil unrest, demonstrations, political gatherings
- Weather: Current weather impacts on operations
- Crime: Confirmed crimes (robberies, assaults, break-ins at residential/commercial areas), suspicious activities (loitering at malls, suspicious vehicles in parking lots, unidentified persons near ATMs), and police updates/advisories for security operations in Kenya

Make advisories specific, actionable, and realistic for current ${dayPeriod} conditions in Nairobi/Kenya.`;

    console.log('Calling Lovable AI for strategic advisories...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    let advisoryText = aiData.choices[0].message.content;
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = advisoryText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      advisoryText = jsonMatch[1];
    }

    const advisories = JSON.parse(advisoryText);

    console.log('Strategic advisories generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        advisories,
        timestamp: currentTime
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in strategic-advisory function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
