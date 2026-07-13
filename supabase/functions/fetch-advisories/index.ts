import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const NAIROBI_LAT = -1.2921;
const NAIROBI_LON = 36.8219;

// ========== HELPERS ==========

/** Strip ALL markdown artifacts and common web junk: links, images, bold, social buttons, paywall text, etc. */
function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')          // ![alt](url)
    .replace(/\[([^\]]*)\]\([^)]*(?:\s+"[^"]*")?\)/g, '$1') // [text](url "title")
    .replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1')      // [text][ref]
    .replace(/\*\*([^*]+)\*\*/g, '$1')              // **bold**
    .replace(/__([^_]+)__/g, '$1')                  // __bold__
    .replace(/\*([^*]+)\*/g, '$1')                  // *italic*
    .replace(/_([^_]+)_/g, '$1')                    // _italic_
    .replace(/#{1,6}\s*/g, '')                      // headings
    .replace(/!\[.*$/gm, '')                        // broken image tags
    // Strip social media sharing buttons and prompts
    .replace(/WhatsApp\s*Channel\s*Telegram\s*Google\s*News\s*YouTube\s*X\s*\(Twitter\)\s*Facebook\s*TikTok/gi, '')
    .replace(/(Share|Follow|Subscribe|Join)\s*(on|via|us|our)?\s*(WhatsApp|Telegram|Facebook|Twitter|X|Instagram|YouTube|TikTok|newsletter|channel)/gi, '')
    .replace(/Read\s*More\s*$/gm, '')
    // Strip paywall/subscription prompts
    .replace(/Your\s*(subscription|premium\s*access).*?(Renew|Subscribe|Sign\s*up)[^.]*\./gis, '')
    .replace(/Don'?t\s*miss\s*out\s*on.*?Nation\.Africa[^.]*\./gis, '')
    .replace(/(Sign\s*up|Log\s*in|Register)\s*(for|to)\s*(free|our|the)?\s*(newsletter|account|premium|access)[^.]*\./gi, '')
    // Strip navigation elements
    .replace(/^\s*(Back\s*to\s*top|Next\s*»|«\s*Previous|1\s+2\s+3\s+4\s+5.*?Next\s*»)/gm, '')
    .replace(/\n{3,}/g, '\n\n')                     // excessive newlines
    .trim();
}

/** Clean a title: strip markdown, truncate */
function cleanTitle(raw: string): string {
  return stripMarkdown(raw).slice(0, 120);
}

// Block non-news domains (social media, video platforms, maps, aggregators)
const BLOCKED_DOMAINS = [
  'youtube.com', 'youtu.be', 'facebook.com', 'fb.com', 'instagram.com',
  'tiktok.com', 'reddit.com', 'linkedin.com', 'pinterest.com',
  'nairobiaccidentmap.com', 'wikipedia.org', 'quora.com',
  'x.com', 'twitter.com', // social media, not verified news
];

function isBlockedDomain(url: string): boolean {
  return BLOCKED_DOMAINS.some(d => url.includes(d));
}

/** Reject generic non-article pages */
function isJunkTitle(title: string): boolean {
  const t = title.trim();
  if (t.length < 20) return true;
  const junk = [
    /^home$/i, /^about/i, /^contact/i, /^privacy/i, /^news$/i,
    /^latest\s*(news)?$/i, /^kenya\s*(news)?$/i,
    /^menu$/i, /^search$/i, /^login$/i, /^sign\s*(up|in)/i,
    /^ntsa\s*\|/i, /^kenha\s*\|/i, /^kura\s*\|/i,
    /road\s*safety\s*action\s*plan/i, /privately\s*initiated/i,
    /^works?\s*\(maintenance\)/i, /^on\s*going\s*projects?$/i,
    /^our\s*(services|projects|mission|vision|team)/i,
    /^(services|projects|publications|downloads|tenders|careers|vacancies)$/i,
    /^\w+\s*\(@\w+\)\s*\/\s*(posts|x|twitter)/i,
    /^@?\w+_?\w*\s*on\s*(x|twitter)/i,
    /^dci\s*kenya.*posts/i,
    /^category:/i, /^tag:/i, /^archive/i, /^page\s*\d+/i,
    /cookie/i, /gdpr/i, /terms\s*(of|and)\s*(use|service)/i,
    /^\w+\s*\|?\s*(official\s*website|homepage|portal)/i,
    /^BREAKING\s*NEWS!/i, // clickbait patterns
    /Nairobi Accident Map/i,
  ];
  return junk.some(p => p.test(t));
}

/** Must contain actual article content with real sentences */
function isArticleContent(text: string): boolean {
  if (!text || text.length < 50) return false;
  const verbs = /\b(said|reported|killed|arrested|injured|warned|announced|confirmed|happened|occurred|found|attacked|crashed|struck|blocked|closed|fled|seized|rescued|deployed|died|nabbed|charged|detained|recovered|impounded|robbed|shot|stabbed|abducted|raped|assaulted|sentenced|convicted|revealed|disclosed|uncovered|investigated|suspected)\b/i;
  return verbs.test(text) || (text.includes('. ') && text.length > 100);
}

/** Map severity strings */
function mapSeverity(level: string) {
  switch (level) { case 'critical': return 'CRITICAL'; case 'caution': return 'CAUTION'; default: return 'NORMAL'; }
}

/** Generate incident ID */
function genId(cat: string, idx: number) {
  return `${cat.toUpperCase().slice(0, 3)}-${Date.now().toString(36).toUpperCase()}-${idx}`;
}

/** Priority classification */
function classifyPriority(level: string, category: string, content: string): string {
  const lc = content.toLowerCase();
  if (level === 'critical' && /ongoing|active|currently|dead|fatal|shoot|hostage|explosion|bomb/i.test(lc)) return 'P1';
  if (category === 'Terror' && level === 'critical') return 'P1';
  if (level === 'critical') return 'P2';
  if (level === 'caution' && /clash|tear gas|injur|armed|violent/i.test(lc)) return 'P2';
  if (level === 'caution') return 'P3';
  return 'P4';
}

/** Extract structured incident details */
function extractDetails(title: string, desc: string, area: string, category: string) {
  const content = `${title} ${desc}`.toLowerCase();

  let when = 'Time not specified';
  const datePats = [
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{4})/i,
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4}/i,
    /(\d{4}-\d{2}-\d{2})/,
    /(today|yesterday|this morning|this evening|this afternoon|last night|overnight)/i,
  ];
  for (const p of datePats) { const m = (title + ' ' + desc).match(p); if (m) { when = m[0]; break; } }
  const timeM = (title + ' ' + desc).match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm|hrs|EAT)?)/i);
  if (timeM) when += ` at ${timeM[1]}`;
  if (content.includes('ongoing')) when = 'Ongoing now';
  if (content.includes('currently')) when = 'Currently active';

  let where = area || 'Nairobi';
  const locWords = ['along', 'near', 'junction', 'roundabout', 'estate', 'opposite', 'road', 'highway'];
  for (const loc of locWords) {
    const m = (title + ' ' + desc).match(new RegExp(`${loc}\\s+([A-Z][a-zA-Z\\s]{2,25})`, 'i'));
    if (m) { where = `${m[0].trim()}, ${area}`; break; }
  }

  let what = category;
  const whatMap: Record<string, string[]> = {
    'Road accident with fatalities': ['fatal', 'dead', 'killed', 'death toll'],
    'Multi-vehicle collision': ['pileup', 'multiple vehicles', 'collision'],
    'Road closure': ['closed', 'blocked', 'closure', 'impassable'],
    'Traffic congestion': ['congestion', 'jam', 'gridlock'],
    'Violent protest': ['riot', 'violent', 'tear gas', 'clash', 'water cannon'],
    'Planned demonstration': ['planned', 'scheduled'],
    'Workers strike': ['strike', 'industrial action', 'go-slow'],
    'Armed robbery': ['armed robbery', 'carjack', 'gunpoint'],
    'Murder': ['murder', 'killed', 'homicide', 'body found'],
    'Police operation': ['arrest', 'nab', 'busted', 'seized'],
    'Terror threat': ['terror', 'security alert', 'embassy advisory'],
    'Heavy rainfall': ['flood', 'heavy rain', 'waterlogging'],
    'Thunderstorm': ['thunderstorm', 'lightning'],
  };
  for (const [d, kws] of Object.entries(whatMap)) { if (kws.some(k => content.includes(k))) { what = d; break; } }

  let how = 'Details under investigation';
  const howMap: [RegExp, string][] = [
    [/overturned?\s*(truck|lorry|trailer|bus|matatu)/i, 'Vehicle overturned'],
    [/head[- ]on\s*collision/i, 'Head-on collision'],
    [/hit[- ]and[- ]run/i, 'Hit-and-run incident'],
    [/(gunfire|gunshot|shot\s*fired)/i, 'Gunfire reported'],
    [/(teargas|tear\s*gas)/i, 'Police used tear gas'],
    [/(blocked?\s*roads?|barricade)/i, 'Roads barricaded'],
    [/(heavy\s*rain|downpour|flooding)/i, 'Heavy rainfall'],
  ];
  for (const [p, d] of howMap) { if (p.test(title + ' ' + desc)) { how = d; break; } }

  return { when, where, what, how };
}

/** Try to extract a real occurrence timestamp from metadata or text */
function extractOccurrenceTime(result: any, title: string, desc: string): string | null {
  // Try metadata first
  for (const key of ['publishedDate', 'date']) {
    if (result.metadata?.[key]) try { const d = new Date(result.metadata[key]); if (!isNaN(d.getTime())) return d.toISOString(); } catch {}
  }
  if (result.metadata?.og?.article?.published_time) try { return new Date(result.metadata.og.article.published_time).toISOString(); } catch {}
  if (result.publishedDate) try { return new Date(result.publishedDate).toISOString(); } catch {}

  // Try text patterns — search through full text including enriched description
  const text = `${title} ${desc}`;
  
  // Strip ordinal suffixes (1st, 2nd, 3rd, 4th, etc.) for easier parsing
  const normalizedText = text.replace(/(\d{1,2})(st|nd|rd|th)\s/gi, '$1 ');
  
  const datePatterns = [
    // "Published on: February 04, 2026 05:45" or "on February 04, 2026"
    /(?:Published\s*(?:on)?:?\s*|on\s+)((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4})/i,
    // "Friday 30 January, 2026" or "Wednesday, 7 January 2026"  
    /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s*(\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?),?\s+\d{4})/i,
    // "4 February 2026" or "30 January 2026"
    /(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})/i,
    // "February 04, 2026" or "January 30, 2026"
    /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(\d{4})/i,
    // ISO date "2026-02-04"
    /(\d{4})-(\d{2})-(\d{2})/,
  ];
  
  for (const p of datePatterns) {
    for (const t of [normalizedText, text]) {
      const m = t.match(p);
      if (m) {
        try {
          const dateStr = m[1] && m[1].match(/[A-Z]/i) ? m[1] + (m[2] && m[3] ? ` ${m[2]} ${m[3]}` : '') : m[0];
          const parsed = new Date(dateStr.replace(/,/g, '').trim());
          if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2024) {
            // Try to extract time component near the date match (e.g., "05:45 (EAT)" or "14:30")
            const matchEnd = (m.index || 0) + m[0].length;
            const afterDate = t.substring(matchEnd, matchEnd + 30);
            const timeMatch = afterDate.match(/\s*(\d{1,2}):(\d{2})\s*(?:\(?\s*(?:EAT|UTC|GMT|hrs)\s*\)?)?/i);
            if (timeMatch) {
              const hours = parseInt(timeMatch[1]);
              const minutes = parseInt(timeMatch[2]);
              // EAT is UTC+3; store as UTC
              const isEAT = afterDate.match(/EAT/i);
              parsed.setUTCHours(isEAT ? hours - 3 : hours, minutes, 0, 0);
            } else {
              // No time found — set to end-of-day (23:59 EAT = 20:59 UTC) so dated stories rank high
              parsed.setUTCHours(20, 59, 0, 0);
            }
            console.log(`[DATE] Extracted "${parsed.toISOString()}" from text: "${m[0]}"${timeMatch ? ` + time ${timeMatch[0].trim()}` : ' (default EOD)'}`);
            return parsed.toISOString();
          }
        } catch {}
      }
    }
  }
  return null;
}

// ========== MAIN ==========

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('=== Starting advisory fetch cycle ===');
    const now = new Date();
    const currentTime = now.toISOString();

    // Auto-archive old advisories
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: archived } = await supabase
        .from('strategic_advisories')
        .update({ status: 'Archived' })
        .lt('timestamp_detected', cutoff)
        .eq('status', 'Active')
        .select('id');
      if (archived?.length) console.log(`[ARCHIVE] Archived ${archived.length} stale advisories`);
    } catch (e) { console.error('[ARCHIVE]', e); }

    // ── Firecrawl helpers ──
    // IMPORTANT: Firecrawl search works best with simple, natural-language queries
    // Do NOT use complex boolean operators or multiple site: filters
    const firecrawlSearch = async (query: string, limit = 5): Promise<any[]> => {
      try {
        const resp = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${FIRECRAWL_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, limit, lang: 'en', country: 'ke' }),
        });
        if (!resp.ok) { console.error(`[SEARCH] Failed (${resp.status}): "${query}"`); return []; }
        const data = await resp.json();
        return data.data || [];
      } catch (e) { console.error(`[SEARCH] Error: "${query}"`, e); return []; }
    };

    const firecrawlScrape = async (url: string): Promise<string> => {
      try {
        const resp = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${FIRECRAWL_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
        });
        if (!resp.ok) return '';
        const data = await resp.json();
        return data.data?.markdown || data.markdown || '';
      } catch (e) { return ''; }
    };

    // Helper: enrich short descriptions by scraping the full article
    const MAX_DESC_LENGTH = 5000;
    let enrichScrapeCount = 0;
    const MAX_ENRICHMENTS = 15; // Budget for full-article scrapes
    
    const isJunkParagraph = (p: string): boolean => {
      const lc = p.toLowerCase();
      return isJunkTitle(p.slice(0, 50)) ||
        /subscribe|newsletter|sign\s*up|log\s*in|cookie|premium|paywall/i.test(lc) ||
        /whatsapp|telegram|facebook|twitter|tiktok|instagram|youtube/i.test(lc) ||
        /read\s*more|related\s*(stories|articles)|also\s*read|trending/i.test(lc) ||
        /^\d+\s*comments?/i.test(lc) ||
        /share\s*(this|on|via)|follow\s*us|join\s*(our|the)/i.test(lc) ||
        /renew\s*(now|your)|unlock\s*(exclusive|premium)|within\s*reach/i.test(lc) ||
        /advertisement|sponsored|promoted/i.test(lc) ||
        /copyright\s*©|all\s*rights\s*reserved/i.test(lc) ||
        /^\s*(photo|image|video|watch)[\s:\/]/i.test(lc) ||
        p.trim().length < 40;
    };

    const enrichDescription = async (rawDesc: string, articleUrl: string): Promise<string> => {
      // ALWAYS try to scrape the full article for complete coverage
      const cleanedRaw = stripMarkdown(rawDesc).slice(0, MAX_DESC_LENGTH);
      
      // Cap the number of full-article scrapes per cycle
      if (enrichScrapeCount >= MAX_ENRICHMENTS) return cleanedRaw;
      
      // Don't scrape blocked domains
      if (!articleUrl || isBlockedDomain(articleUrl)) return cleanedRaw;
      
      try {
        enrichScrapeCount++;
        console.log(`[ENRICH] Scraping full article (${enrichScrapeCount}/${MAX_ENRICHMENTS}): ${articleUrl}`);
        const fullContent = await firecrawlScrape(articleUrl);
        if (fullContent && fullContent.length > 100) {
          const cleaned = stripMarkdown(fullContent);
          // Extract substantial paragraphs, skipping nav/social/paywall junk
          const paragraphs = cleaned.split(/\n\n+/).filter(p => p.length > 50 && !isJunkParagraph(p));
          if (paragraphs.length > 0) {
            // Take up to 12 paragraphs for full incident coverage (3000-5000 chars)
            return paragraphs.slice(0, 12).join('\n\n').slice(0, MAX_DESC_LENGTH);
          }
        }
      } catch (e) { console.error(`[ENRICH] Failed for ${articleUrl}:`, e); }
      
      return cleanedRaw;
    };

    const advisories: any[] = [];

    // ═══════════ 1. TRAFFIC ═══════════
    // Use separate simple queries per source for better results
    try {
      console.log('[TRAFFIC] Fetching...');
      const queries = [
        'Kenya road accident today Nairobi',
        'Nairobi traffic crash accident 2026',
        'NTSA Kenya road crash fatality latest',
      ];
      const allResults: any[] = [];
      for (const q of queries) {
        const r = await firecrawlSearch(q, 5);
        console.log(`[TRAFFIC] "${q}" → ${r.length} results`);
        allResults.push(...r);
      }
      // Deduplicate by URL
      const seen = new Set<string>();
      const unique = allResults.filter(r => { const u = r.url || ''; if (seen.has(u)) return false; seen.add(u); return true; });

      for (const result of unique) {
        const title = result.title || '';
        const rawDesc = stripMarkdown(result.description || result.markdown || '');
        const url = result.url || '';
        const content = `${title} ${rawDesc}`.toLowerCase();

        if (isBlockedDomain(url)) continue;
        if (isJunkTitle(title)) continue;
        if (!isArticleContent(rawDesc) && !isArticleContent(title + '. ' + rawDesc)) continue;

        const incidentWords = ['accident', 'crash', 'collision', 'overturned', 'fatal', 'dead', 'killed', 'injured', 'blocked', 'closed', 'jam', 'fire', 'matatu', 'lorry', 'boda boda'];
        if (!incidentWords.some(w => content.includes(w))) continue;

        // Must be Kenya-related
        if (!['kenya', 'nairobi', 'mombasa', 'thika', 'nakuru', 'kisumu', 'eldoret', 'naivasha', 'nyeri', 'kiambu'].some(w => content.includes(w))) continue;

        const fullDesc = await enrichDescription(rawDesc, url);
        const occurredAt = extractOccurrenceTime(result, title, fullDesc);

        let level: 'normal' | 'caution' | 'critical' = 'normal';
        let sub = 'General';
        const roadMap: Record<string, string> = {
          'mombasa road': 'Mombasa Road', 'thika road': 'Thika Road', 'waiyaki way': 'Waiyaki Way',
          'uhuru highway': 'Uhuru Highway', 'ngong road': 'Ngong Road', 'langata road': 'Langata Road',
          'jogoo road': 'Jogoo Road', 'eastern bypass': 'Eastern Bypass', 'nairobi expressway': 'Nairobi Expressway',
        };
        let area = 'Nairobi';
        for (const [k, v] of Object.entries(roadMap)) { if (content.includes(k)) { area = v; break; } }

        if (['fatal', 'dead', 'killed', 'closed', 'blocked', 'overturned', 'fire'].some(w => content.includes(w))) {
          level = 'critical'; sub = 'Major Incident';
        } else if (['accident', 'crash', 'collision', 'congestion'].some(w => content.includes(w))) {
          level = 'caution'; sub = 'Traffic Incident';
        }

        advisories.push({
          category: 'Traffic', sub_category: sub, title: cleanTitle(title),
          raw_description: fullDesc, level, occurred_at: occurredAt,
          source: getSourceName(url), url, area, confidence: 0.8,
          action: level === 'critical' ? `URGENT: Avoid ${area}. Use alternate routes.` : `Expect delays on ${area}. Plan alternate routes.`,
        });
      }
      console.log(`[TRAFFIC] Final valid: ${advisories.filter(a => a.category === 'Traffic').length}`);
    } catch (e) { console.error('[TRAFFIC]', e); }

    // ═══════════ 2. PROTESTS ═══════════
    try {
      console.log('[PROTEST] Fetching...');
      const queries = [
        'Kenya protest demonstration today 2026',
        'Nairobi strike maandamano latest',
        'Kenya workers strike protest latest news',
      ];
      const allResults: any[] = [];
      for (const q of queries) {
        const r = await firecrawlSearch(q, 5);
        console.log(`[PROTEST] "${q}" → ${r.length} results`);
        allResults.push(...r);
      }
      const seen = new Set<string>();
      const unique = allResults.filter(r => { const u = r.url || ''; if (seen.has(u)) return false; seen.add(u); return true; });

      const protestWords = ['protest', 'demonstration', 'strike', 'march', 'picket', 'riot', 'tear gas', 'clash', 'unrest', 'boycott', 'shutdown', 'maandamano', 'demos'];
      const excludeWords = ['safari rally', 'wrc', 'motorsport', 'world rally'];

      for (const result of unique) {
        const title = result.title || '';
        const rawDesc = stripMarkdown(result.description || result.markdown || '');
        const url = result.url || '';
        const content = `${title} ${rawDesc}`.toLowerCase();

        if (isBlockedDomain(url)) continue;
        if (isJunkTitle(title)) continue;
        if (excludeWords.some(w => content.includes(w))) continue;
        if (!protestWords.some(w => content.includes(w))) continue;
        if (!['kenya', 'nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret'].some(w => content.includes(w))) continue;
        if (!isArticleContent(rawDesc) && rawDesc.length < 80) continue;

        const fullDesc = await enrichDescription(rawDesc, url);
        const occurredAt = extractOccurrenceTime(result, title, fullDesc);

        let level: 'normal' | 'caution' | 'critical' = 'caution';
        let sub = 'Demonstration';
        let area = 'Nairobi CBD';
        const locMap: Record<string, string> = {
          'parliament': 'Parliament Road', 'uhuru park': 'Uhuru Park', 'cbd': 'CBD Nairobi',
          'mombasa': 'Mombasa', 'kisumu': 'Kisumu', 'nakuru': 'Nakuru', 'eldoret': 'Eldoret',
          'westlands': 'Westlands', 'kibera': 'Kibera',
        };
        for (const [k, v] of Object.entries(locMap)) { if (content.includes(k)) { area = v; break; } }

        if (['violent', 'tear gas', 'clash', 'riot', 'injur', 'dead'].some(w => content.includes(w))) {
          level = 'critical'; sub = 'Violent Protest';
        } else if (['ongoing', 'currently'].some(w => content.includes(w))) {
          level = 'critical'; sub = 'Active Demonstration';
        } else if (['planned', 'tomorrow', 'scheduled'].some(w => content.includes(w))) {
          level = 'caution'; sub = 'Planned Demonstration';
        }

        advisories.push({
          category: 'Protest', sub_category: sub, title: cleanTitle(title),
          raw_description: fullDesc, level, occurred_at: occurredAt,
          source: getSourceName(url), url, area, confidence: 0.85,
          action: level === 'critical' ? `URGENT: Avoid ${area}. Relocate units.` : `Monitor situation in ${area}.`,
        });
      }
      console.log(`[PROTEST] Final valid: ${advisories.filter(a => a.category === 'Protest').length}`);
    } catch (e) { console.error('[PROTEST]', e); }

    // ═══════════ 3. CRIME (DCI Kenya sourced) ═══════════
    try {
      console.log('[CRIME] Fetching DCI Kenya crime intelligence...');
      const allCrimeResults: any[] = [];

      // Strategy 1: Scrape DCI Kenya website directly for press releases
      try {
        console.log('[CRIME] Scraping dci.go.ke for press releases...');
        const dciMarkdown = await firecrawlScrape('https://www.dci.go.ke/press-releases');
        if (dciMarkdown && dciMarkdown.length > 100) {
          // Parse DCI press releases from markdown content
          const sections = dciMarkdown.split(/(?=##?\s|(?:\n|\r\n)(?=[A-Z][A-Z\s]{10,}))/);
          for (const section of sections) {
            const headMatch = section.match(/##?\s*(.+)|^([A-Z][A-Z\s,]{15,})/m);
            const rawTitle = headMatch ? (headMatch[1] || headMatch[2] || '').trim() : '';
            if (!rawTitle || rawTitle.length < 20) continue;

            const cleanDesc = stripMarkdown(section.replace(/##?\s*.+\n?/, '').trim());
            if (cleanDesc.length < 50) continue;

            allCrimeResults.push({
              title: rawTitle,
              description: cleanDesc.slice(0, MAX_DESC_LENGTH),
              url: 'https://www.dci.go.ke/press-releases',
              source: 'DCI Kenya',
              fromDCI: true,
            });
          }
          console.log(`[CRIME] DCI scrape → ${allCrimeResults.length} press releases found`);
        } else {
          console.log('[CRIME] DCI scrape returned insufficient content, trying alternate pages...');
          // Try alternate DCI pages
          for (const path of ['https://www.dci.go.ke/news', 'https://www.dci.go.ke']) {
            const altMarkdown = await firecrawlScrape(path);
            if (altMarkdown && altMarkdown.length > 200) {
              const sections = altMarkdown.split(/(?=##?\s)/);
              for (const section of sections) {
                const headMatch = section.match(/##?\s*(.+)/);
                const rawTitle = headMatch ? headMatch[1].trim() : '';
                if (!rawTitle || rawTitle.length < 20) continue;
                const cleanDesc = stripMarkdown(section.replace(/##?\s*.+\n?/, '').trim());
                if (cleanDesc.length < 50) continue;
                allCrimeResults.push({
                  title: rawTitle,
                  description: cleanDesc.slice(0, MAX_DESC_LENGTH),
                  url: path,
                  source: 'DCI Kenya',
                  fromDCI: true,
                });
              }
              console.log(`[CRIME] DCI alt scrape (${path}) → found content`);
              break;
            }
          }
        }
      } catch (e) { console.error('[CRIME] DCI scrape error:', e); }

      // Strategy 2: Search for news articles ABOUT DCI Kenya operations
      const crimeQueries = [
        '"DCI Kenya" arrest operation 2026',
        '"DCI Kenya" suspect nabbed crime',
        'DCI detectives arrest Nairobi crime today',
        'Kenya police crime arrest robbery shooting latest',
        'Nairobi armed robbery carjacking attack latest news',
      ];
      for (const q of crimeQueries) {
        const r = await firecrawlSearch(q, 5);
        console.log(`[CRIME] "${q}" → ${r.length} results`);
        for (const result of r) {
          allCrimeResults.push({
            ...result,
            fromDCI: false,
          });
        }
      }

      // Deduplicate by URL
      const seen = new Set<string>();
      const unique = allCrimeResults.filter(r => {
        const u = r.url || '';
        if (seen.has(u)) return false;
        seen.add(u);
        return true;
      });
      console.log(`[CRIME] Total unique results: ${unique.length}`);

      const crimeWords = ['robbery', 'attack', 'murder', 'killed', 'arrest', 'theft', 'stolen', 'suspect', 'gang', 'assault', 'kidnap', 'shoot', 'stab', 'armed', 'carjack', 'nab', 'busted', 'seized', 'gunpoint', 'machete', 'detained', 'trafficking', 'fraud', 'counterfeit', 'drug', 'narcotic', 'cybercrime', 'wanted', 'fugitive', 'operation', 'recovered', 'impounded', 'raided'];

      // Extra filter: reject DCI generic/nav pages
      const dciJunkPatterns = [
        /^dci\s*(news|kenya)?\s*\|/i, /directorate\s*of\s*criminal/i,
        /^events?$/i, /^press\s*releases?$/i, /^about\s*us$/i,
        /^our\s*services/i, /^contact/i, /^home$/i,
      ];

      for (const result of unique) {
        const title = result.title || '';
        const rawDesc = stripMarkdown(result.description || result.markdown || '');
        const url = result.url || '';
        const content = `${title} ${rawDesc}`.toLowerCase();

        // Block social media
        if (isBlockedDomain(url) && !url.includes('dci.go.ke')) continue;

        // Skip DCI generic pages
        if (dciJunkPatterns.some(p => p.test(title.trim()))) {
          console.log(`[CRIME] Skipping DCI junk page: "${title}"`);
          continue;
        }
        if (isJunkTitle(title)) continue;

        // For DCI direct scrapes, be more lenient on keyword matching
        if (!result.fromDCI) {
          if (!crimeWords.some(w => content.includes(w))) continue;
        }

        // Must be Kenya-related
        if (!result.fromDCI && !['kenya', 'nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret', 'kiambu', 'thika', 'machakos', 'dci'].some(w => content.includes(w))) continue;

        if (!isArticleContent(rawDesc) && rawDesc.length < 80 && !result.fromDCI) continue;

        // Skip politics-only stories
        if (['election', 'campaign', 'manifesto'].some(w => content.includes(w)) &&
            !['arrest', 'suspect', 'robbery', 'murder', 'armed'].some(w => content.includes(w))) continue;

        const fullDesc = await enrichDescription(rawDesc, url);
        const occurredAt = extractOccurrenceTime(result, title, fullDesc);

        let level: 'normal' | 'caution' | 'critical' = 'normal';
        let sub = 'General';
        let area = 'Nairobi';
        const locMap: Record<string, string> = {
          'westlands': 'Westlands', 'cbd': 'CBD', 'eastleigh': 'Eastleigh', 'kibera': 'Kibera',
          'mombasa': 'Mombasa', 'kisumu': 'Kisumu', 'nakuru': 'Nakuru', 'kasarani': 'Kasarani',
          'kilimani': 'Kilimani', 'langata': 'Langata', 'kiambu': 'Kiambu', 'kayole': 'Kayole',
          'ruiru': 'Ruiru', 'juja': 'Juja', 'kitengela': 'Kitengela', 'ongata rongai': 'Ongata Rongai',
          'umoja': 'Umoja', 'embakasi': 'Embakasi', 'dandora': 'Dandora', 'mathare': 'Mathare',
          'south b': 'South B', 'south c': 'South C', 'industrial area': 'Industrial Area',
        };
        for (const [k, v] of Object.entries(locMap)) { if (content.includes(k)) { area = v; break; } }

        if (['armed', 'shoot', 'murder', 'killed', 'kidnap', 'carjack', 'gunfire', 'bomb', 'explosion'].some(w => content.includes(w))) {
          level = 'critical'; sub = 'Violent Crime';
        } else if (['arrest', 'nab', 'robbery', 'theft', 'gang', 'assault', 'busted', 'trafficking', 'fraud', 'raided'].some(w => content.includes(w))) {
          level = 'caution'; sub = 'Crime Operation';
        } else if (result.fromDCI) {
          level = 'caution'; sub = 'DCI Press Release';
        }

        const sourceName = result.fromDCI ? 'DCI Kenya' : getSourceName(url);

        // fullDesc already enriched above

        advisories.push({
          category: 'Crime', sub_category: sub, title: cleanTitle(title),
          raw_description: fullDesc, level, occurred_at: occurredAt,
          source: sourceName, url, area, confidence: result.fromDCI ? 0.95 : 0.8,
          action: level === 'critical' ? `URGENT: Alert field units in ${area}. Coordinate with police.` : `Monitor DCI updates for ${area}.`,
        });
      }
      console.log(`[CRIME] Final valid: ${advisories.filter(a => a.category === 'Crime').length}`);
    } catch (e) { console.error('[CRIME]', e); }

    // ═══════════ 4. TERROR ═══════════
    try {
      console.log('[TERROR] Fetching US Embassy alerts...');
      const markdown = await firecrawlScrape('https://ke.usembassy.gov/category/alert/');
      if (markdown && markdown.length > 50) {
        const sections = markdown.split(/(?=##?\s)/);
        for (const section of sections) {
          const sectionLc = section.toLowerCase();
          if (!['security alert', 'security message', 'travel advisory', 'demonstration alert'].some(w => sectionLc.includes(w))) continue;

          const headMatch = section.match(/##?\s*(.+)/);
          const title = headMatch ? cleanTitle(headMatch[1]) : '';
          if (!title || title.length < 15 || isJunkTitle(title)) continue;

          const occurredAt = extractOccurrenceTime({}, title, section);
          const cleanDesc = stripMarkdown(section.replace(/##?\s*.+\n?/, '').trim()).slice(0, MAX_DESC_LENGTH);

          let level: 'normal' | 'caution' | 'critical' = 'caution';
          if (['attack', 'bomb', 'explosion', 'hostage', 'active shooter'].some(w => sectionLc.includes(w))) level = 'critical';

          advisories.push({
            category: 'Terror', sub_category: 'Security Advisory', title,
            raw_description: cleanDesc, level, occurred_at: occurredAt,
            source: 'U.S. Embassy Kenya', url: 'https://ke.usembassy.gov',
            area: 'Nationwide', confidence: 0.9,
            action: 'Increase security posture. Brief field teams on heightened vigilance.',
          });
        }
      }
      console.log(`[TERROR] Final valid: ${advisories.filter(a => a.category === 'Terror').length}`);
    } catch (e) { console.error('[TERROR]', e); }

    // ═══════════ 5. WEATHER ═══════════
    try {
      console.log('[WEATHER] Fetching Kenya Met...');
      const queries = [
        'Kenya weather warning alert today',
        'Nairobi heavy rain flood warning 2026',
      ];
      for (const q of queries) {
        const r = await firecrawlSearch(q, 3);
        console.log(`[WEATHER] "${q}" → ${r.length} results`);
        for (const result of r) {
          const title = result.title || '';
          const rawDesc = stripMarkdown(result.description || result.markdown || '');
          const content = `${title} ${rawDesc}`.toLowerCase();

          if (isBlockedDomain(result.url || '')) continue;
          if (isJunkTitle(title)) continue;
          if (!['rain', 'flood', 'storm', 'thunder', 'warning', 'alert', 'advisory', 'wind', 'hail'].some(w => content.includes(w))) continue;
          if (!['kenya', 'nairobi', 'coast', 'western', 'rift valley', 'central', 'eastern'].some(w => content.includes(w))) continue;

          const fullDesc = await enrichDescription(rawDesc, result.url || '');
          const occurredAt = extractOccurrenceTime(result, title, fullDesc);

          let level: 'normal' | 'caution' | 'critical' = 'normal';
          let sub = 'Weather Update';
          if (['flood', 'severe', 'danger', 'emergency'].some(w => content.includes(w))) { level = 'critical'; sub = 'Severe Weather'; }
          else if (['warning', 'alert', 'heavy rain', 'thunderstorm'].some(w => content.includes(w))) { level = 'caution'; sub = 'Weather Warning'; }

          advisories.push({
            category: 'Weather', sub_category: sub, title: cleanTitle(title),
            raw_description: fullDesc, level, occurred_at: occurredAt,
            source: 'Kenya Met / News', url: result.url || 'https://meteo.go.ke',
            area: 'Kenya', confidence: 0.75,
            action: level === 'critical' ? 'URGENT: Suspend outdoor patrols. Alert all field teams.' : 'Monitor conditions. Prepare for potential disruptions.',
          });
        }
      }
      console.log(`[WEATHER] Final valid: ${advisories.filter(a => a.category === 'Weather').length}`);
    } catch (e) { console.error('[WEATHER]', e); }

    // ═══════════ FRESHNESS FILTER ═══════════
    const freshnessCutoff = Date.now() - 48 * 60 * 60 * 1000;
    const freshAdvisories = advisories.filter(a => {
      if (a.occurred_at) {
        const ts = new Date(a.occurred_at).getTime();
        if (!isNaN(ts) && ts < freshnessCutoff) {
          console.log(`[FRESHNESS] Skipping stale: "${a.title}" (${a.occurred_at})`);
          return false;
        }
      }
      return true;
    });
    console.log(`[FRESHNESS] ${advisories.length} total → ${freshAdvisories.length} fresh`);

    // ═══════════ DEDUPLICATION ═══════════
    let newAdvisories = freshAdvisories;
    if (freshAdvisories.length > 0) {
      try {
        // Use created_at (insertion time) for dedup — NOT timestamp_detected which may be pushed back
        const { data: existing } = await supabase
          .from('strategic_advisories')
          .select('title')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(500);

        if (existing?.length) {
          const existingTitles = new Set(existing.map((e: any) => e.title?.toLowerCase().trim()));
          newAdvisories = freshAdvisories.filter(a => !existingTitles.has(a.title?.toLowerCase().trim()));
          console.log(`[DEDUP] ${freshAdvisories.length} fresh → ${newAdvisories.length} new (${freshAdvisories.length - newAdvisories.length} dups skipped)`);
        }
      } catch (e) { console.error('[DEDUP]', e); }
    }

    // ═══════════ SAVE ═══════════
    if (newAdvisories.length > 0) {
      const records = newAdvisories.map((alert, idx) => {
        const details = extractDetails(alert.title, alert.raw_description || '', alert.area || 'Nairobi', alert.category);
        const priority = classifyPriority(alert.level, alert.category, `${alert.title} ${alert.raw_description || ''}`);

        // Use clean narrative text directly — no structured prefixes
        const cleanDesc = (alert.raw_description || alert.title).slice(0, MAX_DESC_LENGTH);

        return {
          incident_id: genId(alert.category, idx),
          tenant_id: 'BLACKHAWK',
          category: alert.category,
          sub_category: alert.sub_category || null,
          title: alert.title,
          description: cleanDesc,
          severity: mapSeverity(alert.level),
          priority,
          confidence_score: alert.confidence || 0.75,
          status: 'Active',
          // Use extracted occurrence date; undated stories get pushed 48h back so dated stories always rank higher
          timestamp_detected: alert.occurred_at || new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          timestamp_updated: currentTime,
          location_lat: NAIROBI_LAT + (Math.random() - 0.5) * 0.1,
          location_lon: NAIROBI_LON + (Math.random() - 0.5) * 0.1,
          location_scope_hierarchy: ['Africa', 'Kenya', 'Nairobi', alert.area || 'CBD'],
          proximate_poi: null,
          sources: [{ name: alert.source, reliability: 'verified', url: alert.url || null }],
          recommended_action: alert.action || 'Monitor and assess situation.',
          sla_target_minutes: priority === 'P1' ? 10 : priority === 'P2' ? 20 : priority === 'P3' ? 30 : 60,
          sla_deadline: new Date(Date.now() + (priority === 'P1' ? 10 : priority === 'P2' ? 20 : priority === 'P3' ? 30 : 60) * 60000).toISOString(),
        };
      });

      const { error: insertError } = await supabase.from('strategic_advisories').insert(records);
      if (insertError) {
        console.error('[SAVE] Error:', insertError);
      } else {
        console.log(`[SAVE] Inserted ${records.length} new advisories`);
      }
    } else {
      console.log('[SAVE] No new advisories to insert');
    }

    console.log('=== Advisory fetch cycle complete ===');

    return new Response(
      JSON.stringify({
        success: true,
        count: newAdvisories.length,
        total_found: advisories.length,
        duplicates_skipped: advisories.length - newAdvisories.length,
        timestamp: currentTime,
        sources: ['NTSA', 'KeNHA', 'Kenya Met', 'US Embassy', 'DCI Kenya', 'Citizen Digital', 'KTN', 'NTV', 'K24', 'KBC', 'Nation', 'Standard'],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ========== SOURCE NAME MAPPER ==========
function getSourceName(url: string): string {
  const map: Record<string, string> = {
    'dci.go.ke': 'DCI Kenya', 'citizen.digital': 'Citizen Digital',
    'ktnhome.co.ke': 'KTN News', 'ntv.co.ke': 'NTV Kenya',
    'nation.africa': 'Nation Africa', 'standardmedia.co.ke': 'The Standard',
    'k24tv.co.ke': 'K24 TV', 'k24.digital': 'K24 Digital',
    'the-star.co.ke': 'The Star', 'kbc.co.ke': 'KBC News',
    'ntsa.go.ke': 'NTSA Kenya', 'kenha.co.ke': 'KeNHA',
    'ke.usembassy.gov': 'U.S. Embassy Kenya', 'meteo.go.ke': 'Kenya Met',
    'capitalfm.co.ke': 'Capital FM', 'pulselive.co.ke': 'Pulse Live',
  };
  for (const [domain, name] of Object.entries(map)) {
    if (url.includes(domain)) return name;
  }
  if (url.includes('x.com') || url.includes('twitter.com')) return 'X/Twitter';
  return 'Kenya News';
}
