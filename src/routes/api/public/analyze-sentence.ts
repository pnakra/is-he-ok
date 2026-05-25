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

// Sex-coercion detection. We flag when a sex term co-occurs with a
// coercion / refusal / incapacity pattern, OR when a specific phrase appears.
// Conservative on purpose — false positives route to RAINN, which is the
// right place even when the situation turns out to be merely confusing.
const SEX_TERMS = [
  "sex",
  "sexual",
  "blowjob",
  "blow job",
  "oral",
  "intercourse",
  "fuck me",
  "finger me",
  "go down on",
  "hook up",
  "hooked up",
  "sleep with",
  "slept with",
];

const COERCION_PATTERNS = [
  "couldn't say no",
  "couldnt say no",
  "couldn't not",
  "couldnt not",
  "had to",
  "made me",
  "forced me",
  "wouldn't stop",
  "wouldnt stop",
  "didn't stop",
  "didnt stop",
  "kept going",
  "after i said no",
  "even though i said no",
  "wouldn't take no",
  "wouldnt take no",
  "owed him",
  "owe him",
  "guilted me into",
  "pressured me",
  "talked me into",
  "passed out",
  "blacked out",
  "too drunk",
  "asleep",
];

const SEX_COERCION_PHRASES = [
  "raped",
  "rape me",
  "raping",
  "assaulted me",
  "sexually assaulted",
  "non-consensual",
  "nonconsensual",
  "without my consent",
  "without consent",
];

// Canned fallbacks — only used when the model call fails. The live SAFETY
// path now runs the model with a safety addendum so the read is actually
// done; these stay in place purely as no-questions, statement-only defaults.

const SAFETY_CRISIS_RESOURCES: AnalysisResource[] = [
  { label: "The hotline — chat available 24/7", url: "https://www.thehotline.org" },
  { label: "Safety planning — womenslaw.org", url: "https://www.womenslaw.org/about-abuse/safety-planning" },
];

const SEX_COERCION_RESOURCES: AnalysisResource[] = [
  { label: "RAINN — 24/7 hotline & chat", url: "https://www.rainn.org" },
  { label: "loveisrespect.org", url: "https://www.loveisrespect.org" },
];

const SAFETY_RESPONSE: AnalysisPayload = {
  wearing:
    "What you described includes physical harm. The aftermath — the apology, the explanation that he didn't mean it that hard — is a familiar pattern that often follows incidents like this, not proof that it won't happen again.",
  did: "Reading his words again won't change what his hands did. The crisis line below is staffed 24/7 by people trained for exactly this, and reaching out doesn't commit you to leaving, reporting, or doing anything you aren't ready to do.",
  tactic:
    "minimization after harm — framing what happened as an accident or misjudgment ('I didn't think it was too hard,' 'I panicked') shifts the focus from his action to his intent.",
  closing: "What he did counts as what he did. You're allowed to name it that way.",
  resources: SAFETY_CRISIS_RESOURCES,
};

const SEX_COERCION_RESPONSE: AnalysisPayload = {
  wearing:
    "What you described sounds like it crossed into sexual coercion — being pushed, guilted, or unable to say no. The framing he used afterward doesn't undo what happened in the moment.",
  did: "RAINN is staffed 24/7 by people trained specifically for this. Talking to them is free, confidential, and doesn't commit you to reporting or to any next step.",
  tactic:
    "consent erosion — pressure, debt, or incapacity used to override a no, then reframed afterward as something you went along with.",
  closing: "What you felt about it counts. You're allowed to call it what it was.",
  resources: SEX_COERCION_RESOURCES,
};

const FAILURE_PAYLOAD: AnalysisPayload = {
  wearing:
    "Something didn't work on our end, so the read didn't come through. What you brought here is worth a real response — sending it again usually clears it up.",
  did: "In the meantime, the resources below are good standing options regardless of what the sentence turns out to mean.",
  tactic: null,
  closing: "",
  resources: [
    { label: "loveisrespect.org", url: "https://www.loveisrespect.org" },
    { label: "The hotline — chat available", url: "https://www.thehotline.org" },
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

const SYSTEM_PROMPT = `You power "Is He OK?", a small web tool for girls and young women who are unsure how to read one thing a boy said.

They paste a sentence, sometimes answer a couple of short follow-up questions, and you return a brief read of what the sentence may have done to them. Your job is to help them name what happened in that moment, not to decide the relationship or tell them what to do.

You must follow these rules:

1. Focus on the sentence.
   - Read what the words did in that moment.
   - Talk about their effect on the user, not about his entire character.

2. Keep authority with her.
   - She decides what this means and what to do next.
   - Do not tell her to stay, leave, confront him, forgive him, block him, or anything similar.

3. Use plain language.
   - Sound like a calm, grounded friend.
   - Avoid heavy jargon if there is a simpler way to say it.
   - You can name patterns like "joking as a cover for criticism" or "bringing up everything he has done" in simple language.

4. Be brief.
   - Each field has a short word budget.
   - Avoid repeating the same idea in new words.

5. Speak directly to her.
   - Use "you", not "she" or "they".

6. Acknowledge clean moments.
   - If the sentence clearly respects her agency, say that.
   - Do not invent a problem if the sentence looks supportive.

You will receive a JSON object with these keys:

- sentence: string
- optional_context: string (may be empty)
- pattern_answer: null or "Just this one time" / "A few times" / "It happens a lot" / "I'm not sure"
- pushback_answer: null or "He listens and we can talk about it" / "He gets defensive" / "He shuts down or pulls away" / "He turns it back on me" / "I usually don't push back"
- freedom_answer: null or "Yes" / "Kind of" / "No" / "I'm not sure"
- safety_answer: null or "No" / "A little" / "Yes"

Treat the sentence as the main source of truth. Use the answers only to sharpen the read if they really matter.

Internal lenses (for your thinking):

- How it came across: Was it framed as care, honesty, worry, humor, debt, loyalty, vulnerability?
- What it did: What reaction did it invite? Silence, apology, confusion, doubt, gratitude, effort?
- Who held authority after: Whose feelings or judgment became the standard?
- What happened to her freedom: Did her ability to disagree, say no, or hold her view shrink, stay steady, or grow?

From this, you must produce a compact JSON object with this exact shape:

{
  "wearing": "string",
  "did": "string",
  "tactic": "string or null",
  "resources": [
    { "label": "string", "url": "https://..." },
    { "label": "string", "url": "https://..." }
  ],
  "closing": "string"
}

Field instructions:

- wearing:
  - 1–2 sentences, about 30–45 words total.
  - Describe how the sentence came across to her.
  - Example style: "He put it in a joke. Calling it a joke makes it sound light, even if it landed heavy on you."

- did:
  - 1–2 sentences, about 30–45 words total.
  - Describe what it did to her attention and her sense of freedom.
  - Example style: "It let him say something sharp without having to own it. When you didn't laugh, the focus slid to you being 'too sensitive' instead of whether the comment was okay."

- tactic:
  - Either null or a short sentence (up to 25 words) that names a clear pattern using one of these labels:
    - "manufactured insecurity"
    - "withdrawal as punishment"
    - "testing tolerance"
    - "embedded criticism"
    - "alternating warmth and coldness"
    - "frame control"
    - "information management"
    - "debt mechanism"
    - "identity erosion"
    - "CLEAN RESULT"
  - Add a short explanation in plain language.
  - Use "CLEAN RESULT" only when the sentence clearly supports her agency.
  - If nothing fits cleanly, use null.

- resources:
  - Always return exactly 2 items.
  - Prefer:
    - loveisrespect.org
    - joinonelove.org
    - thehotline.org
  - Choose resources that match the seriousness of the sentence. For lower-level confusion, lean toward healthy vs unhealthy relationship explainer pages. For heavier control, include pages about abuse and support.
  - You may pick from the RESOURCE BANK below when a more specific match helps; never repeat a resource.

- closing:
  - One short line, up to about 16–18 words.
  - Hand the decision back to her.
  - Example styles:
    - "You get to decide what this means for you."
    - "You are allowed to trust your own reaction."
    - "You do not have to ignore what felt off."

Use follow-up answers as follows:

- If pattern_answer is "It happens a lot", you can lean more on pattern-based readings.
- If pushback_answer shows shutdown, defensiveness, or turning it back on her, you can mention that disagreement seems costly.
- If freedom_answer is "No" or "Kind of", you can highlight how free she felt to disagree.

Do not list these answers back to her. Only use them if they change how you read the sentence.

Special cases:

- If the input is nonsense or clearly not about a relationship, say that you do not have enough to read and keep tactic = null.
- If the sentence is clearly an apology that takes responsibility and keeps her freedom intact, reflect that and set tactic to "CLEAN RESULT".

RESOURCE BANK (optional — pick exactly 2; never repeat; match the tactic when possible):

CARE / SURVEILLANCE / MANUFACTURED WORRY:
{"label": "Is it love or control? — loveisrespect.org", "url": "https://www.loveisrespect.org"}
{"label": "One Love Foundation", "url": "https://www.joinonelove.org"}

MANUFACTURED INSECURITY / JEALOUSY TACTICS:
{"label": "One Love — signs of unhealthy relationships", "url": "https://www.joinonelove.org/learn/10-signs-of-an-unhealthy-relationship"}
{"label": "Is it love or control? — loveisrespect.org", "url": "https://www.loveisrespect.org"}

WITHDRAWAL AS PUNISHMENT / SILENT TREATMENT:
{"label": "The silent treatment — Psychology Today", "url": "https://www.psychologytoday.com/us/blog/invisible-bruises/202101/the-silent-treatment-is-emotional-abuse"}
{"label": "loveisrespect.org", "url": "https://www.loveisrespect.org"}

EMBEDDED CRITICISM / NEGGING:
{"label": "One Love — 10 signs of an unhealthy relationship", "url": "https://www.joinonelove.org/learn/10-signs-of-an-unhealthy-relationship"}
{"label": "loveisrespect.org", "url": "https://www.loveisrespect.org"}

DEBT MECHANISM / GUILT LEDGER:
{"label": "loveisrespect.org", "url": "https://www.loveisrespect.org"}
{"label": "The hotline — chat available", "url": "https://www.thehotline.org"}

FRAME CONTROL / INFORMATION MANAGEMENT:
{"label": "Gaslighting — The hotline", "url": "https://www.thehotline.org/resources/what-is-gaslighting"}
{"label": "loveisrespect.org", "url": "https://www.loveisrespect.org"}

ALTERNATING WARMTH AND COLDNESS:
{"label": "One Love — healthy vs unhealthy", "url": "https://www.joinonelove.org/learn/10-signs-of-an-unhealthy-relationship"}
{"label": "loveisrespect.org", "url": "https://www.loveisrespect.org"}

TESTING TOLERANCE / BOUNDARY PROBING:
{"label": "loveisrespect.org", "url": "https://www.loveisrespect.org"}
{"label": "One Love Foundation", "url": "https://www.joinonelove.org"}

IDENTITY EROSION:
{"label": "The hotline — chat available", "url": "https://www.thehotline.org"}
{"label": "loveisrespect.org", "url": "https://www.loveisrespect.org"}

CLEAN RESULT:
{"label": "One Love — signs of a healthy relationship", "url": "https://www.joinonelove.org/learn/10-signs-of-a-healthy-relationship"}
{"label": "loveisrespect.org", "url": "https://www.loveisrespect.org"}

ESCALATION / HIGH CONTROL / SAFETY CONCERN:
{"label": "The hotline — chat available 24/7", "url": "https://www.thehotline.org"}
{"label": "Safety planning — womenslaw.org", "url": "https://www.womenslaw.org/about-abuse/safety-planning"}

OUTPUT RULES:
- No markdown, no bullet points, no headings.
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
  prolificId?: unknown;
}

interface NormalizedInput {
  sentence: string;
  context: string | null;
  sessionId: string;
  followups: FollowupAnswers;
  triageStatus: string | null;
  prolificId: string | null;
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

  let prolificId: string | null = null;
  if (typeof body.prolificId === "string") {
    const t = body.prolificId.trim();
    if (t.length > 0 && t.length <= 64 && /^[A-Za-z0-9_-]+$/.test(t)) {
      prolificId = t;
    }
  }

  return {
    sentence,
    context: ctxRaw ? ctxRaw : null,
    sessionId,
    followups,
    triageStatus,
    prolificId,
  };
}

function isSafetyFlagged(sentence: string, context: string | null): boolean {
  const haystack = `${sentence}\n${context ?? ""}`.toLowerCase();
  return SAFETY_KEYWORDS.some((kw) => haystack.includes(kw));
}

function isSexCoercionFlagged(sentence: string, context: string | null): boolean {
  const haystack = `${sentence}\n${context ?? ""}`.toLowerCase();
  if (SEX_COERCION_PHRASES.some((p) => haystack.includes(p))) return true;
  const hasSex = SEX_TERMS.some((t) => haystack.includes(t));
  if (!hasSex) return false;
  return COERCION_PATTERNS.some((p) => haystack.includes(p));
}

// Map a model-named tactic onto the canonical resource pair from the
// RESOURCE BANK above. Keeps links honest to the read instead of whatever
// the model happened to grab.
const TACTIC_RESOURCES: Record<string, AnalysisResource[]> = {
  "manufactured insecurity": [
    { label: "One Love — signs of an unhealthy relationship", url: "https://www.joinonelove.org/learn/10-signs-of-an-unhealthy-relationship" },
    { label: "Is it love or control? — loveisrespect.org", url: "https://www.loveisrespect.org" },
  ],
  "withdrawal as punishment": [
    { label: "The silent treatment — Psychology Today", url: "https://www.psychologytoday.com/us/blog/invisible-bruises/202101/the-silent-treatment-is-emotional-abuse" },
    { label: "loveisrespect.org", url: "https://www.loveisrespect.org" },
  ],
  "testing tolerance": [
    { label: "loveisrespect.org", url: "https://www.loveisrespect.org" },
    { label: "One Love Foundation", url: "https://www.joinonelove.org" },
  ],
  "embedded criticism": [
    { label: "One Love — 10 signs of an unhealthy relationship", url: "https://www.joinonelove.org/learn/10-signs-of-an-unhealthy-relationship" },
    { label: "loveisrespect.org", url: "https://www.loveisrespect.org" },
  ],
  "alternating warmth and coldness": [
    { label: "One Love — healthy vs unhealthy", url: "https://www.joinonelove.org/learn/10-signs-of-an-unhealthy-relationship" },
    { label: "loveisrespect.org", url: "https://www.loveisrespect.org" },
  ],
  "frame control": [
    { label: "Gaslighting — The hotline", url: "https://www.thehotline.org/resources/what-is-gaslighting" },
    { label: "loveisrespect.org", url: "https://www.loveisrespect.org" },
  ],
  "information management": [
    { label: "Gaslighting — The hotline", url: "https://www.thehotline.org/resources/what-is-gaslighting" },
    { label: "loveisrespect.org", url: "https://www.loveisrespect.org" },
  ],
  "debt mechanism": [
    { label: "loveisrespect.org", url: "https://www.loveisrespect.org" },
    { label: "The hotline — chat available", url: "https://www.thehotline.org" },
  ],
  "identity erosion": [
    { label: "The hotline — chat available", url: "https://www.thehotline.org" },
    { label: "loveisrespect.org", url: "https://www.loveisrespect.org" },
  ],
  "clean result": [
    { label: "One Love — signs of a healthy relationship", url: "https://www.joinonelove.org/learn/10-signs-of-a-healthy-relationship" },
    { label: "loveisrespect.org", url: "https://www.loveisrespect.org" },
  ],
};

function alignResourcesToTactic(payload: AnalysisPayload): AnalysisPayload {
  if (!payload.tactic) return payload;
  // The tactic field is "<label> — explanation". Grab the label half.
  const head = payload.tactic.split(/[—:\-]/)[0]?.trim().toLowerCase() ?? "";
  if (!head) return payload;
  for (const [key, resources] of Object.entries(TACTIC_RESOURCES)) {
    if (head.includes(key)) {
      return { ...payload, resources };
    }
  }
  return payload;
}

async function notifySlack(input: {
  sessionId: string;
  sentence: string;
  context: string | null;
  analysis: string;
  safetyFlagged: boolean;
  prolificId?: string | null;
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
        ...(input.prolificId
          ? [{ type: "mrkdwn", text: `*Prolific ID:*\n\`${input.prolificId}\`` }]
          : []),
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

  // Strategy 1: users.conversations — channels the bot is a member of (incl. private).
  // Works without groups:read; only requires standard channel scopes.
  let cursor = "";
  for (let i = 0; i < 20; i++) {
    const url = new URL(
      "https://connector-gateway.lovable.dev/slack/api/users.conversations",
    );
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
      | {
          ok?: boolean;
          error?: string;
          channels?: Array<{ id: string; name: string }>;
          response_metadata?: { next_cursor?: string };
        }
      | null;
    if (!json || json.ok === false) {
      console.error(
        "[analyze-sentence] users.conversations failed",
        json?.error,
      );
      break;
    }
    console.log(
      "[analyze-sentence] users.conversations returned",
      json.channels?.length ?? 0,
      "channels:",
      json.channels?.map((c) => c.name).join(", "),
    );
    const match = json.channels?.find((c) => c.name?.toLowerCase() === target);
    if (match) {
      cachedChannelId = match.id;
      return match.id;
    }
    cursor = json.response_metadata?.next_cursor ?? "";
    if (!cursor) break;
  }

  // Strategy 2 (fallback): conversations.list — needs channels:read + groups:read.
  cursor = "";
  for (let i = 0; i < 20; i++) {
    const url = new URL(
      "https://connector-gateway.lovable.dev/slack/api/conversations.list",
    );
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
      | {
          ok?: boolean;
          error?: string;
          channels?: Array<{ id: string; name: string }>;
          response_metadata?: { next_cursor?: string };
        }
      | null;
    if (!json || json.ok === false) {
      console.error(
        "[analyze-sentence] conversations.list failed",
        json?.error,
      );
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
  followups?: FollowupAnswers | null;
  triageStatus?: string | null;
  prolificId?: string | null;
}): Promise<void> {
  try {
    await supabaseAdmin.from("iho_submissions").insert({
      session_id: input.sessionId,
      sentence: input.sentence,
      context: input.context,
      analysis: input.analysis,
      safety_flagged: input.safetyFlagged,
      followups: (input.followups ?? null) as never,
      triage_status: input.triageStatus ?? null,
      prolific_id: input.prolificId ?? null,
    } as never);
  } catch (err) {
    console.error("[analyze-sentence] log failed", err);
  }
  await notifySlack({
    sessionId: input.sessionId,
    sentence: input.sentence,
    context: input.context,
    analysis: input.analysis,
    safetyFlagged: input.safetyFlagged,
    prolificId: input.prolificId ?? null,
  });
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
  followups: FollowupAnswers,
): Promise<AnalysisPayload | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[analyze-sentence] missing ANTHROPIC_API_KEY");
    return null;
  }

  const lines: string[] = [`sentence: ${sentence}`];
  if (context) lines.push(`optional_context: ${context}`);
  if (followups.pattern) lines.push(`pattern_answer: ${followups.pattern}`);
  if (followups.pushback) lines.push(`pushback_answer: ${followups.pushback}`);
  if (followups.freedom) lines.push(`freedom_answer: ${followups.freedom}`);
  if (followups.safety) lines.push(`safety_answer: ${followups.safety}`);
  const userMessage = lines.join("\n");

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

        // STEP 1a — physical-danger safety pre-filter
        if (isSafetyFlagged(input.sentence, input.context)) {
          await logSubmission({
            sessionId: input.sessionId,
            sentence: input.sentence,
            context: input.context,
            analysis: JSON.stringify(SAFETY_RESPONSE),
            safetyFlagged: true,
            followups: input.followups,
            triageStatus: input.triageStatus ?? "SAFETY",
            prolificId: input.prolificId,
          });
          return buildResponse(SAFETY_RESPONSE, true);
        }

        // STEP 1b — sex-coercion pre-filter (routes to RAINN)
        if (isSexCoercionFlagged(input.sentence, input.context)) {
          await logSubmission({
            sessionId: input.sessionId,
            sentence: input.sentence,
            context: input.context,
            analysis: JSON.stringify(SEX_COERCION_RESPONSE),
            safetyFlagged: true,
            followups: input.followups,
            triageStatus: input.triageStatus ?? "SAFETY",
            prolificId: input.prolificId,
          });
          return buildResponse(SEX_COERCION_RESPONSE, true);
        }

        // STEP 2 — Anthropic
        const rawAnalysis = await callAnthropic(input.sentence, input.context, input.followups);
        if (!rawAnalysis) {
          return buildResponse(FAILURE_PAYLOAD, false);
        }
        const analysis = alignResourcesToTactic(rawAnalysis);

        // STEP 3 — log + return
        await logSubmission({
          sessionId: input.sessionId,
          sentence: input.sentence,
          context: input.context,
          analysis: JSON.stringify(analysis),
          safetyFlagged: false,
          followups: input.followups,
          triageStatus: input.triageStatus,
          prolificId: input.prolificId,
        });

        return buildResponse(analysis, false);
      },
    },
  },
});
