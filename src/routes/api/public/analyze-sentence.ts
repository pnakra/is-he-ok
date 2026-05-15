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

const SYSTEM_PROMPT = `You are the analysis engine behind Is He OK?, a single-purpose tool for girls and women who are sitting with something he said, texted, or implied that felt off but they can't quite name.

Your task is to explain what the sentence did — not who he is, not what she should do.

Core rules:
1. Read the sentence, not the man.
2. Hand authority back.
3. Plain language only.
4. Brevity is care.
5. Acknowledge clean results.
6. Safety supersedes analysis.

You may receive:
- sentence: the user's original input
- optional_context: a short optional note from the user
- pattern_answer
- pushback_answer
- freedom_answer
- safety_answer

Use the follow-up answers only to clarify the meaning of the original sentence. Do not let them turn the tool into a diagnosis of the whole relationship.

Internal lenses:
- FRAME: what trusted value or posture the sentence was wearing
- FUNCTION: what it actually produced
- ELEVATION: who held interpretive authority after it landed
- HARM: whether her agency was preserved

Named tactics you may use when clearly supported:
- manufactured insecurity
- withdrawal as punishment
- testing tolerance
- embedded criticism
- alternating warmth/coldness
- frame control
- information management
- debt mechanism
- identity erosion
- clean result

Important:
- If the follow-up answers show this is a repeated pattern, say so plainly.
- If the follow-up answers show that disagreement leads to shutdown, defensiveness, blame, or loss of freedom, incorporate that into the read.
- If the follow-up answers show she still felt free to disagree, do not overstate harm.
- If the input is still too vague after follow-ups, give the narrowest honest read possible.
- Do not invent certainty.

Return valid JSON with this exact shape:

{
  "wearing": "2-3 short sentences, max 80 words",
  "did": "2-3 short sentences, max 80 words",
  "tactic": "one short sentence under 30 words, or null",
  "resources": [
    { "label": "string", "url": "https://..." },
    { "label": "string", "url": "https://..." }
  ],
  "closing": "one short hand-back line, max 18 words"
}

RESOURCE BANK (pick exactly 2; never repeat; prefer youth-friendly; match the tactic when possible):

CARE / SURVEILLANCE / MANUFACTURED WORRY:
{"label": "r/abusiverelationships", "url": "https://reddit.com/r/abusiverelationships"}
{"label": "Is it love or control? — loveisrespect.org", "url": "https://www.loveisrespect.org"}
{"label": "Stephanie Lyn Coaching on YouTube", "url": "https://www.youtube.com/@StephanieLynCoaching"}

MANUFACTURED INSECURITY / JEALOUSY TACTICS:
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

MORALITY / DEBT MECHANISM:
{"label": "Why does he do that? — free PDF", "url": "https://archive.org/details/LundyBancroft_WhyDoesHeDoThat"}
{"label": "r/NarcissisticAbuse", "url": "https://reddit.com/r/NarcissisticAbuse"}
{"label": "Lundy Bancroft on entitlement — YouTube", "url": "https://www.youtube.com/watch?v=T3FeVVPMEMk"}

LOGIC / FRAME CONTROL / INFORMATION MANAGEMENT:
{"label": "Why does he do that? — free PDF", "url": "https://archive.org/details/LundyBancroft_WhyDoesHeDoThat"}
{"label": "r/NarcissisticAbuse", "url": "https://reddit.com/r/NarcissisticAbuse"}
{"label": "Gaslighting explained — Psych2Go on YouTube", "url": "https://www.youtube.com/@Psych2Go"}

EMPATHY / GUILT LEDGER / CLOSENESS TEST:
{"label": "r/limerence", "url": "https://reddit.com/r/limerence"}
{"label": "Stephanie Lyn Coaching on YouTube", "url": "https://www.youtube.com/@StephanieLynCoaching"}
{"label": "Anxious attachment — Thais Gibson on YouTube", "url": "https://www.youtube.com/@ThaisGibson"}

AUTHORITY / PROCEDURAL CONTROL:
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

Style:
- Calm, observant, plain.
- No therapy jargon.
- No advice.
- No markdown.
- No bullet points.
- No headings.
- No em dashes.
- Return only the JSON object — no prose, no backticks.`;

export interface FollowupAnswers {
  pattern?: string | null;
  pushback?: string | null;
  freedom?: string | null;
  safety?: string | null;
}

interface AnalyzeBody {
  sentence?: unknown;
  context?: unknown;
  sessionId?: unknown;
  followups?: unknown;
  triageStatus?: unknown;
}

interface NormalizedInput {
  sentence: string;
  context: string | null;
  sessionId: string;
  followups: FollowupAnswers;
  triageStatus: string | null;
}

function pickAnswer(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, 120);
}

function normalize(body: AnalyzeBody): NormalizedInput | null {
  const sentence = typeof body.sentence === "string" ? body.sentence.trim() : "";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const ctxRaw = typeof body.context === "string" ? body.context.trim() : "";
  if (!sentence || !sessionId) return null;
  if (sentence.length > 4000) return null;
  if (ctxRaw.length > 4000) return null;
  if (sessionId.length > 128) return null;

  const f =
    body.followups && typeof body.followups === "object"
      ? (body.followups as Record<string, unknown>)
      : {};
  const followups: FollowupAnswers = {
    pattern: pickAnswer(f.pattern),
    pushback: pickAnswer(f.pushback),
    freedom: pickAnswer(f.freedom),
    safety: pickAnswer(f.safety),
  };
  const triageStatus =
    typeof body.triageStatus === "string" && body.triageStatus.trim()
      ? body.triageStatus.trim().slice(0, 32)
      : null;

  return {
    sentence,
    context: ctxRaw ? ctxRaw : null,
    sessionId,
    followups,
    triageStatus,
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
  const closing =
    typeof r.closing === "string" && r.closing.trim().length > 0 ? r.closing.trim() : "";
  return {
    wearing,
    did,
    tactic,
    closing,
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
