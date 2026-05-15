import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// CORS — public-facing consumer tool, allow all origins.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
} as const;

const SAFETY_KEYWORDS = [
  "hitting",
  "hit me",
  "choked",
  "choking",
  "threatened",
  "weapon",
  "gun",
  "knife",
  "locked in",
  "can't leave",
  "cant leave",
  "trapped",
  "afraid he'll hurt",
  "afraid hell hurt",
  "going to hurt",
  "kill me",
  "hurt me",
];

const SAFETY_RESPONSE: AnalysisPayload = {
  wearing:
    "What you're describing sounds like you may be in immediate danger. This isn't something to read at right now — it's something to act on.",
  did: "Please reach out to someone who can help you tonight. Is there someone you trust you can text right now?",
  tactic: null,
  closing: "",
  resources: [
    {
      label: "The hotline — chat available",
      url: "https://www.thehotline.org",
    },
    {
      label: "r/abusiverelationships",
      url: "https://reddit.com/r/abusiverelationships",
    },
  ],
};

const FAILURE_PAYLOAD: AnalysisPayload = {
  wearing:
    "Something didn't work on our end. Try again in a moment — what you brought here is worth a real read.",
  did: "Want to try sending it again?",
  tactic: null,
  closing: "",
  resources: [
    {
      label: "r/relationships",
      url: "https://reddit.com/r/relationships",
    },
    {
      label: "The hotline — chat available",
      url: "https://www.thehotline.org",
    },
  ],
};

interface AnalysisResource {
  label: string;
  url: string;
}

interface AnalysisPayload {
  wearing: string;
  did: string;
  tactic: string | null;
  closing: string;
  resources: AnalysisResource[];
}

const SYSTEM_PROMPT = `You are the analysis engine behind Is He OK?, a single-purpose web tool for girls and women who are sitting with a sentence — something he said, texted, or implied — that felt off but they can't quite name. They paste the sentence in, and you return a short, plain-language read of what the sentence did.

What you are NOT:
- You are not a therapist, not a relationship coach, and not a diagnostic tool.
- You do not assess him as a person, label the relationship, or tell her what to do.
- You do not give advice, scripts, or next steps.

CORE PRINCIPLES (do not break these):

Read the sentence, not the man.
Focus on function over intent. Describe what the sentence did to her (e.g., shifted authority, created doubt), not what kind of person he is.

Hand authority back.
Do not tell her what to do. Your job is to give her language for what landed, then stop. The output ends with her — she decides what it means.

Plain language only.
No clinical or academic jargon. Write the way a smart, calm friend would talk. Avoid phrases like "trauma response," "emotional abuse," "gaslighting," "somatic," "attachment style," unless the schema specifically calls for them and you can't say it more simply.

Brevity is care.
Short, clear reads. No essays. Each field has a strict sentence budget; obey it.

Acknowledge clean results.
A tool that only flags concern is a bias, not a tool. When a sentence is fine (no pressure, no authority shift, no reduction in her freedom), say so clearly.

Privacy by default.
Assume she is using this alone on her phone. Do not ask for identifying details, locations, or names.

Safety supersedes analysis.
If the sentence contains explicit, immediate harm (violence, threats, weapons, being trapped, etc.), your job is to name that plainly and encourage real-world help, not to over-analyze the dynamics.

INPUT YOU RECEIVE

You will get:
- sentence: one string, up to 4000 characters. It may be: something he said or texted, quoted or paraphrased; a short description of a pattern of behavior; or, sometimes, nonsense.
- context (optional): a short description she may give about what's happening.

Treat the sentence as primary. Use context only to clarify meaning if it's present.

LENSES TO USE (FRAME / FUNCTION / ELEVATION / HARM)

Read every sentence through four lenses:

FRAME (what it was wearing)
What trusted value or posture was the sentence wearing as a disguise?
Common frames:
- CARE — "I'm just worried about you," "I'm saying this because I love you."
- EMPATHY — "I'm just sharing my feelings," "I'm being vulnerable."
- MORALITY — "After everything I've done for you," "You owe me."
- LOGIC — "You're overreacting," "It's not a big deal," "You're being irrational."
- AUTHORITY — "I know better than you," "You're too young/naive to get it."
Sometimes, there is no disguise — it may be a cluster of events or nonsense.

FUNCTION (what it did)
What did the sentence actually produce in her and in the conversation? Did it: create compliance, silence, or apology? Make her abandon a concern? Shift the subject away from what she raised? Put her perception or sanity on trial?

ELEVATION (who's on top)
After it landed, who held interpretive authority? Did he position himself above her as the one who knows what's real, what matters, and what's reasonable? Did he perform vulnerability in a way that neutralized her objection or made it harder to disagree?

HARM (what happened to her freedom)
Was her agency preserved? Could she still disagree, trust her perception, and follow through — or did the sentence quietly reduce her freedom by attaching guilt, obligation, or fear to saying no?

Use these lenses internally; you will summarize their results in the output fields below.

TACTICS LIBRARY (for tactic)

When relevant, map what happened to one of these named tactics:
- MANUFACTURED INSECURITY — Keeping her slightly unsure she's "enough" (attention to other women, comparisons, subtle digs), so she works to earn his reassurance.
- WITHDRAWAL AS PUNISHMENT — Pulling away affection, attention, or presence to punish her for a boundary or disagreement.
- TESTING TOLERANCE — Small boundary pushes to see what she will tolerate, often escalating over time.
- EMBEDDED CRITICISM — Criticism or insults delivered inside "care," "jokes," or "honesty," so they are hard to call out without seeming ungrateful or humorless.
- ALTERNATING WARMTH/COLDNESS — Cycling between affection and distance in a way that keeps her off-balance and focused on regaining warmth.
- FRAME CONTROL — Ignoring what she raised and reframing the conversation around her reaction, sanity, or tone ("you're overreacting," "you're too sensitive").
- INFORMATION MANAGEMENT — Lying, omitting, or reshaping facts so she is making decisions on a false or incomplete picture.
- DEBT MECHANISM — Listing what he's done for her as leverage, to make her feel she owes him compliance or silence.
- IDENTITY EROSION — Repeatedly questioning or belittling core parts of who she is (values, friends, interests, body, culture) so her self-trust erodes.
- CLEAN RESULT — Nothing coercive or undermining happened; the sentence preserved or strengthened her agency.

If no tactic clearly applies, set tactic to null. Do not stretch.

OUTPUT FORMAT AND STRICT LENGTH LIMITS

You must return valid JSON with this exact shape:

{
  "wearing": "string, 2–3 short sentences, max ~80 words",
  "did": "string, 2–3 short sentences, max ~80 words",
  "tactic": "string or null",
  "resources": [
    { "label": "string", "url": "https://..." },
    { "label": "string", "url": "https://..." }
  ]
}

Hard rules about brevity:
- wearing: 2–3 short sentences. Focus on naming the disguise and its immediate emotional effect.
- did: 2–3 short sentences. Focus on what changed for her (authority, subject, freedom), not on his motives.
- tactic: Either null or one short sentence naming the tactic and why it fits (max 30 words).

No bullet points, no headings, no markdown, no ---. Plain text only. Return only the JSON object — no prose before or after, no backticks.

If the input is nonsense (e.g., random characters), say so simply and return neutral, non-alarming text in wearing and did, with tactic: null.

CLEAN RESULTS

When the sentence clearly preserves or strengthens her agency:
Example patterns:
- "It's your call, I'll respect what you decide."
- "I was wrong, I'm sorry, and I'll change this behavior."
- Genuine appreciation without strings.

Then:
- In wearing, say plainly that this looks like straightforward care, respect, or accountability, not a disguise.
- In did, say that it supported her freedom to choose, rather than shrinking it.
- Set tactic to "CLEAN RESULT".

Do not invent problems just to be cautious.

SAFETY AND ESCALATION

If the sentence includes explicit harm or danger (e.g., threats, physical violence, weapons, being trapped, threats of self-harm to control her):
- In wearing, briefly name that this is not about subtle dynamics; it's about safety.
- In did, focus on the immediate impact on her sense of safety and freedom. Keep it clear and calm.
- Choose at least one resource that is about immediate help (e.g., national hotlines, crisis text lines, or youth-friendly relationship abuse sites).
- Still stay within the length limits. Do not sensationalize.

RESOURCE SELECTION

Always return exactly 2 resources, drawn from the curated bank below. At least one should feel immediately accessible to teens/young women (e.g., loveisrespect.org, youth-friendly explainers, or relatable videos). Prioritize resources that match the specific tactic you named; otherwise pick safe, general, youth-friendly options. Never repeat the same resource twice in one response.

RESOURCE BANK:

CARE DISGUISE / SURVEILLANCE / MANUFACTURED WORRY:
{"label": "r/abusiverelationships", "url": "https://reddit.com/r/abusiverelationships"}
{"label": "Is it love or control? — loveisrespect.org", "url": "https://www.loveisrespect.org"}
{"label": "Stephanie Lyn Coaching on YouTube", "url": "https://www.youtube.com/@StephanieLynCoaching"}

MANUFACTURED INSECURITY / DREAD GAME / JEALOUSY TACTICS:
{"label": "r/abusiverelationships", "url": "https://reddit.com/r/abusiverelationships"}
{"label": "Why does he do that? — free PDF", "url": "https://archive.org/details/LundyBancroft_WhyDoesHeDoThat"}
{"label": "Attached — on anxious and avoidant patterns", "url": "https://www.amazon.com/Attached-Science-Adult-Attachment-YouFind/dp/1585429139"}

WITHDRAWAL AS PUNISHMENT / SILENT TREATMENT:
{"label": "r/emotionalabuse", "url": "https://reddit.com/r/emotionalabuse"}
{"label": "The silent treatment — Psychology Today", "url": "https://www.psychologytoday.com/us/blog/invisible-bruises/202101/the-silent-treatment-is-emotional-abuse"}
{"label": "Stephanie Lyn Coaching on YouTube", "url": "https://www.youtube.com/@StephanieLynCoaching"}

EMBEDDED CRITICISM / NEGGING:
{"label": "r/abusiverelationships", "url": "https://reddit.com/r/abusiverelationships"}
{"label": "Love and self-worth — Kati Morton on YouTube", "url": "https://www.youtube.com/@KatiMorton"}
{"label": "Is it love or control? — loveisrespect.org", "url": "https://www.loveisrespect.org"}

MORALITY DISGUISE / DEBT MECHANISM:
{"label": "Why does he do that? — free PDF", "url": "https://archive.org/details/LundyBancroft_WhyDoesHeDoThat"}
{"label": "r/NarcissisticAbuse", "url": "https://reddit.com/r/NarcissisticAbuse"}
{"label": "Lundy Bancroft on entitlement — YouTube", "url": "https://www.youtube.com/watch?v=T3FeVVPMEMk"}

LOGIC DISGUISE / FRAME CONTROL / INFORMATION MANAGEMENT:
{"label": "Why does he do that? — free PDF", "url": "https://archive.org/details/LundyBancroft_WhyDoesHeDoThat"}
{"label": "r/NarcissisticAbuse", "url": "https://reddit.com/r/NarcissisticAbuse"}
{"label": "Gaslighting explained — Psych2Go on YouTube", "url": "https://www.youtube.com/@Psych2Go"}

EMPATHY DISGUISE / GUILT LEDGER / CLOSENESS TEST:
{"label": "r/limerence", "url": "https://reddit.com/r/limerence"}
{"label": "Stephanie Lyn Coaching on YouTube", "url": "https://www.youtube.com/@StephanieLynCoaching"}
{"label": "Anxious attachment — Thais Gibson on YouTube", "url": "https://www.youtube.com/@ThaisGibson"}

AUTHORITY DISGUISE / PROCEDURAL CONTROL:
{"label": "Coercive control explained — Women's Aid", "url": "https://www.womensaid.org.uk/information-support/what-is-domestic-abuse/coercive-control"}
{"label": "r/legaladvice", "url": "https://reddit.com/r/legaladvice"}
{"label": "The hotline — chat available", "url": "https://www.thehotline.org"}

ALTERNATING WARMTH AND COLDNESS / PUSH-PULL:
{"label": "r/BPDlovedones", "url": "https://reddit.com/r/BPDlovedones"}
{"label": "Thais Gibson on attachment — YouTube", "url": "https://www.youtube.com/@ThaisGibson"}
{"label": "Attached — on anxious and avoidant patterns", "url": "https://www.amazon.com/Attached-Science-Adult-Attachment-YouFind/dp/1585429139"}

TESTING TOLERANCE / BOUNDARY PROBING:
{"label": "r/abusiverelationships", "url": "https://reddit.com/r/abusiverelationships"}
{"label": "Is it love or control? — loveisrespect.org", "url": "https://www.loveisrespect.org"}
{"label": "Kati Morton on boundaries — YouTube", "url": "https://www.youtube.com/@KatiMorton"}

IDENTITY EROSION:
{"label": "The hotline — chat available", "url": "https://www.thehotline.org"}
{"label": "Coercive control explained — Women's Aid", "url": "https://www.womensaid.org.uk/information-support/what-is-domestic-abuse/coercive-control"}
{"label": "Love and self-worth — Kati Morton on YouTube", "url": "https://www.youtube.com/@KatiMorton"}

MINOR / TEEN CONTEXT:
{"label": "loveisrespect.org — built for teens", "url": "https://www.loveisrespect.org"}
{"label": "r/teenrelationships", "url": "https://reddit.com/r/teenrelationships"}
{"label": "Break the Cycle — dating abuse resources", "url": "https://www.breakthecycle.org"}

CLEAN RESULT:
{"label": "r/relationships", "url": "https://reddit.com/r/relationships"}
{"label": "Is it love or control? — loveisrespect.org", "url": "https://www.loveisrespect.org"}

ESCALATION / HIGH CONTROL / SAFETY CONCERN:
{"label": "The hotline — chat available 24/7", "url": "https://www.thehotline.org"}
{"label": "Safety planning — womenslaw.org", "url": "https://www.womenslaw.org/about-abuse/safety-planning"}
{"label": "Coercive control explained — Women's Aid", "url": "https://www.womensaid.org.uk/information-support/what-is-domestic-abuse/coercive-control"}

If unsure, choose safe, general resources rather than niche or very clinical ones.

TONE

Speak as a grounded, observant friend: calm, not alarmist; specific, not vague; descriptive, not prescriptive. The goal is for her to finish reading and think: "That's exactly what it did," or "I see it differently, but this gave me language," — not "This tool is telling me what kind of person he is or what I have to do."`;

interface AnalyzeBody {
  sentence?: unknown;
  context?: unknown;
  sessionId?: unknown;
}

interface NormalizedInput {
  sentence: string;
  context: string | null;
  sessionId: string;
}

function normalize(body: AnalyzeBody): NormalizedInput | null {
  const sentence = typeof body.sentence === "string" ? body.sentence.trim() : "";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const ctxRaw = typeof body.context === "string" ? body.context.trim() : "";
  if (!sentence || !sessionId) return null;
  if (sentence.length > 4000) return null;
  if (ctxRaw.length > 4000) return null;
  if (sessionId.length > 128) return null;
  return {
    sentence,
    context: ctxRaw ? ctxRaw : null,
    sessionId,
  };
}

function isSafetyFlagged(sentence: string, context: string | null): boolean {
  const haystack = `${sentence}\n${context ?? ""}`.toLowerCase();
  return SAFETY_KEYWORDS.some((kw) => haystack.includes(kw));
}

async function notifySlack(input: {
  sessionId: string;
  sentence: string;
  context: string | null;
  analysis: string;
  safetyFlagged: boolean;
}): Promise<void> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const slackKey = process.env.SLACK_API_KEY;
  if (!lovableKey || !slackKey) return;

  let parsedAnalysis: unknown = null;
  try {
    parsedAnalysis = JSON.parse(input.analysis);
  } catch {
    parsedAnalysis = input.analysis;
  }

  const text = input.safetyFlagged
    ? "🚨 New IHO submission (safety flagged)"
    : "📝 New IHO submission";

  const blocks = [
    {
      type: "header",
      text: { type: "plain_text", text },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Safety flagged:*\n${input.safetyFlagged ? "Yes" : "No"}` },
        { type: "mrkdwn", text: `*Session:*\n\`${input.sessionId}\`` },
      ],
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Sentence:*\n>>> ${input.sentence.slice(0, 2800)}` },
    },
    ...(input.context
      ? [
          {
            type: "section",
            text: { type: "mrkdwn", text: `*Context:*\n>>> ${input.context.slice(0, 2800)}` },
          },
        ]
      : []),
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Analysis:*\n\`\`\`${JSON.stringify(parsedAnalysis, null, 2).slice(0, 2800)}\`\`\``,
      },
    },
  ];

  try {
    const channel = await resolveSlackChannelId(SLACK_CHANNEL_NAME, lovableKey, slackKey);
    if (!channel) {
      console.error("[analyze-sentence] slack channel not found:", SLACK_CHANNEL_NAME);
      return;
    }
    const resp = await fetch("https://connector-gateway.lovable.dev/slack/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": slackKey,
      },
      body: JSON.stringify({
        channel,
        text,
        blocks,
        unfurl_links: false,
        unfurl_media: false,
      }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.error("[analyze-sentence] slack non-ok", resp.status, body);
    } else {
      const json = (await resp.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (json && json.ok === false) {
        console.error("[analyze-sentence] slack api error", json.error);
      }
    }
  } catch (err) {
    console.error("[analyze-sentence] slack threw", err);
  }
}

const SLACK_CHANNEL_NAME = "iho_submissions";
let cachedChannelId: string | null = null;

async function resolveSlackChannelId(
  name: string,
  lovableKey: string,
  slackKey: string,
): Promise<string | null> {
  if (cachedChannelId) return cachedChannelId;
  const target = name.replace(/^#/, "").toLowerCase();
  let cursor = "";
  for (let i = 0; i < 20; i++) {
    const url = new URL("https://connector-gateway.lovable.dev/slack/api/conversations.list");
    url.searchParams.set("limit", "200");
    url.searchParams.set("types", "public_channel,private_channel");
    if (cursor) url.searchParams.set("cursor", cursor);
    const resp = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": slackKey,
      },
    });
    const json = (await resp.json().catch(() => null)) as
      | { ok?: boolean; error?: string; channels?: Array<{ id: string; name: string }>; response_metadata?: { next_cursor?: string } }
      | null;
    if (!json || json.ok === false) {
      console.error("[analyze-sentence] conversations.list failed", json?.error);
      return null;
    }
    const match = json.channels?.find((c) => c.name?.toLowerCase() === target);
    if (match) {
      cachedChannelId = match.id;
      return match.id;
    }
    cursor = json.response_metadata?.next_cursor ?? "";
    if (!cursor) break;
  }
  return null;
}

async function logSubmission(input: {
  sessionId: string;
  sentence: string;
  context: string | null;
  analysis: string;
  safetyFlagged: boolean;
}): Promise<void> {
  try {
    await supabaseAdmin.from("iho_submissions").insert({
      session_id: input.sessionId,
      sentence: input.sentence,
      context: input.context,
      analysis: input.analysis,
      safety_flagged: input.safetyFlagged,
    });
  } catch (err) {
    console.error("[analyze-sentence] log failed", err);
  }
  // Awaited so the Cloudflare Worker doesn't cancel the request after responding.
  await notifySlack(input);
}

interface AnthropicTextBlock {
  type: "text";
  text: string;
}
type AnthropicContentBlock = AnthropicTextBlock | { type: string };

interface AnthropicResponse {
  content?: AnthropicContentBlock[];
}

function coerceResources(raw: unknown): AnalysisResource[] {
  if (!Array.isArray(raw)) return FAILURE_PAYLOAD.resources;
  const out: AnalysisResource[] = [];
  for (const item of raw) {
    if (item && typeof item === "object") {
      const r = item as Record<string, unknown>;
      const label = typeof r.label === "string" ? r.label.trim() : "";
      const url = typeof r.url === "string" ? r.url.trim() : "";
      if (label && url && /^https?:\/\//i.test(url)) {
        out.push({ label, url });
      }
    }
    if (out.length >= 2) break;
  }
  return out.length > 0 ? out : FAILURE_PAYLOAD.resources;
}

function coercePayload(raw: unknown): AnalysisPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const wearing = typeof r.wearing === "string" ? r.wearing.trim() : "";
  const did = typeof r.did === "string" ? r.did.trim() : "";
  if (!wearing || !did) return null;
  const tacticRaw = r.tactic;
  const tactic =
    typeof tacticRaw === "string" && tacticRaw.trim().length > 0
      ? tacticRaw.trim()
      : null;
  return {
    wearing,
    did,
    tactic,
    resources: coerceResources(r.resources),
  };
}

function extractJsonObject(text: string): unknown | null {
  const trimmed = text.trim();
  // Strip optional code fences
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  // Try direct parse first
  try {
    return JSON.parse(candidate);
  } catch {
    // Fall through to brace scan
  }
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function callAnthropic(
  sentence: string,
  context: string | null,
): Promise<AnalysisPayload | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[analyze-sentence] missing ANTHROPIC_API_KEY");
    return null;
  }

  const userMessage = context
    ? `Sentence: ${sentence}\nContext: ${context}`
    : `Sentence: ${sentence}`;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        temperature: 0.4,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error("[analyze-sentence] anthropic non-ok", resp.status, text);
      return null;
    }

    const json = (await resp.json()) as AnthropicResponse;
    const textBlock = (json.content ?? []).find(
      (b): b is AnthropicTextBlock =>
        (b as { type?: string }).type === "text" &&
        typeof (b as AnthropicTextBlock).text === "string",
    );
    if (!textBlock) {
      console.error("[analyze-sentence] no text block in response");
      return null;
    }
    const parsed = extractJsonObject(textBlock.text);
    if (!parsed) {
      console.error("[analyze-sentence] failed to parse JSON from response", textBlock.text.slice(0, 200));
      return null;
    }
    return coercePayload(parsed);
  } catch (err) {
    console.error("[analyze-sentence] anthropic threw", err);
    return null;
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

interface AnalyzeApiResponse {
  analysis: AnalysisPayload;
  safetyFlagged: boolean;
}

function buildResponse(
  analysis: AnalysisPayload,
  safetyFlagged: boolean,
  status = 200,
): Response {
  const body: AnalyzeApiResponse = { analysis, safetyFlagged };
  return jsonResponse(body, status);
}

export const Route = createFileRoute("/api/public/analyze-sentence")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: CORS_HEADERS }),

      POST: async ({ request }) => {
        let raw: AnalyzeBody;
        try {
          raw = (await request.json()) as AnalyzeBody;
        } catch {
          return buildResponse(FAILURE_PAYLOAD, false);
        }

        const input = normalize(raw);
        if (!input) {
          return buildResponse(FAILURE_PAYLOAD, false);
        }

        // STEP 1 — safety pre-filter
        if (isSafetyFlagged(input.sentence, input.context)) {
          await logSubmission({
            sessionId: input.sessionId,
            sentence: input.sentence,
            context: input.context,
            analysis: JSON.stringify(SAFETY_RESPONSE),
            safetyFlagged: true,
          });
          return buildResponse(SAFETY_RESPONSE, true);
        }

        // STEP 2 — Anthropic
        const analysis = await callAnthropic(input.sentence, input.context);
        if (!analysis) {
          return buildResponse(FAILURE_PAYLOAD, false);
        }

        // STEP 3 — log + return
        await logSubmission({
          sessionId: input.sessionId,
          sentence: input.sentence,
          context: input.context,
          analysis: JSON.stringify(analysis),
          safetyFlagged: false,
        });

        return buildResponse(analysis, false);
      },
    },
  },
});
