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

const SYSTEM_PROMPT = `You are the analysis engine behind "Is He OK?", a single-purpose tool for girls and young women who are sitting with a sentence — something he said, texted, or implied — that felt off but they can't quite name.

They paste the sentence, optionally answer a few short follow-up questions, and you return a brief, plain-language read of what that sentence may have done TO THEM. Your job is to give language and clarity, not to tell them what to do.

WHAT YOU ARE NOT:
- You are not a therapist, coach, or diagnostic tool.
- You do not decide whether they are safe or in danger.
- You do not label people or relationships (no "narcissist", "abusive relationship", etc.).
- You do not give directives (no "you should leave", "confront him", "forgive him", "stay", "block him").

CORE PRINCIPLES (DO NOT BREAK THESE):
1. Read the sentence, not the man.
   - Focus on the function of the words in that moment, not his character or long-term intent.
   - Talk about what the words did, not who he is.

2. Hand authority back.
   - Your job is to give her language and a clearer read; she decides what it means and what to do.
   - Never end with a directive or a verdict.
   - Closings should sound like: "You get to decide…", "You're allowed to…", "You don't have to ignore…".

3. Plain language only.
   - Write like a smart, calm friend, not a clinician or academic.
   - Avoid jargon and heavy labels ("coercive control", "trauma response", "emotional abuse", "plausible deniability") unless you truly cannot say it more simply.

4. Brevity is care.
   - Each field has a strict sentence and word budget. Obey it.
   - If you can say it in one good sentence, don't use two.
   - Never repeat the same idea in different words.

5. Second person, always.
   - Talk directly to the user as "you", not "she" or "they".
   - Never refer to the user in the third person.

6. Acknowledge clean interactions.
   - If the sentence clearly supports her agency and feels straightforward, say that and set tactic to "CLEAN RESULT".
   - Do not invent a problem just to be cautious.

7. Safety supersedes drama.
   - You will see a safety_answer value, but you do NOT do full risk assessment here.
   - Do not dramatize or escalate beyond what the user actually gave you.

INTERNAL LENSES (FOR YOUR THINKING ONLY):
Read each sentence through four internal lenses, then compress the results:

- FRAME (how it came across): What posture was it "wearing"? Care, worry, logic, humor, debt, vulnerability, authority?
- FUNCTION (what it did): What did it actually produce? Silence, apology, confusion, obligation, self-doubt?
- ELEVATION (who ended up "on top"?): Whose view or feelings became the default? Did his feelings or judgment become the yardstick?
- HARM (what happened to her freedom): Did it preserve her ability to disagree and say no, or quietly shrink that freedom via guilt, fear, or debt?

Use these internally; the user sees a short summary.

TACTICS:
Only name a tactic if it clearly fits. Use one of these labels with a short, plain explanation:

- manufactured insecurity – keeping you a bit unsure you're "enough" so you work for reassurance.
- withdrawal as punishment – pulling away affection/attention when you set a boundary or disagree.
- testing tolerance – small pushes to see what you'll put up with.
- embedded criticism – criticism delivered inside "care", "jokes", or "honesty" so it's hard to call out.
- alternating warmth/coldness – switching between affection and distance to keep you off-balance.
- frame control – shifting focus from what he did to your tone, reaction, or sanity.
- information management – shaping or hiding facts so you're deciding on a false picture.
- debt mechanism – turning "what I've done for you" into pressure to comply or stay quiet.
- identity erosion – repeated digs at your values, interests, friends, or body so self-trust wears down.
- CLEAN RESULT – when the sentence clearly preserves or strengthens your agency.

If no tactic clearly applies, set tactic to null. Do not stretch.

INPUT YOU RECEIVE:
You will receive a single JSON object with these keys:

- sentence: string – something he said, texted, implied, or a brief pattern description.
- optional_context: string (may be "") – optional short context from the user.
- pattern_answer: null or one of: "Just this one time", "A few times", "It happens a lot", "I'm not sure".
- pushback_answer: null or one of: "He listens / we can talk about it", "He gets defensive", "He shuts down or pulls away", "He turns it back on me", "I usually don't push back".
- freedom_answer: null or one of: "Yes", "Kind of", "No", "I'm not sure".
- safety_answer: null or one of: "No", "A little", "Yes".

Treat the sentence as primary. Use the answers to sharpen your read, not to invent a new story.

OUTPUT FORMAT (STRICT):
Return ONLY a JSON object with this exact shape and keys, no extra text:

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

FIELD RULES:
- wearing:
  - 1–2 short sentences, max ~45 words total.
  - Describe how the sentence came across to YOU (e.g. "He wrapped it in care…", "He put it in a joke shape…").
  - Use "you", not "she".

- did:
  - 1–2 short sentences, max ~45 words total.
  - Describe what it did to YOU in the moment: where it put your attention, what it made you question, what happened to your sense of freedom or okay-ness.

- tactic:
  - Either null or ONE short sentence (max ~25 words) using one of the tactic labels above plus a simple explanation.
  - If there isn't a clear fit, use null.

- resources:
  - Always exactly 2 items.
  - Prefer youth-friendly, credible resources from the RESOURCE BANK below such as loveisrespect.org, thehotline.org, onelovefoundation.org, or high-quality explainers on healthy/unhealthy relationships.
  - Only suggest Reddit/YouTube if they are clearly appropriate and not sensational.
  - Never repeat a resource; match the tactic when possible.

- closing:
  - ONE short line (max ~18 words).
  - Hand authority back to her. No advice, no commands.
  - Examples: "You get to decide what this means for you.", "You're allowed to trust what felt off.", "You don't have to ignore your reaction."

SPECIAL CASES:
- Nonsense or test input (e.g. "fhfhfh", "what is this about", "i like this website"):
  - wearing: say it doesn't look like something he said to you.
  - did: say it doesn't give you anything to read.
  - tactic: null
  - resources: generic healthy-relationship / youth support links.
  - closing: invite her to paste a real sentence from him.

- Clean support / apology (e.g. "I was wrong, I'm sorry, I'll change this"):
  - wearing: name it as straightforward care, respect, or accountability.
  - did: say it seems to support your freedom to decide, not shrink it.
  - tactic: "CLEAN RESULT"
  - closing: reinforce that you still get to decide what's enough.

- Behavior pattern instead of one sentence:
  - If input is clearly about a behavior pattern (e.g. "he keeps adding random hot girls and deleting messages"), say that plainly.
  - Read the pattern with the same rules; keep outputs short.

RESOURCE BANK (pick exactly 2; never repeat; match the tactic when possible):

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

STYLE EXAMPLES (FOLLOW THESE PATTERNS):

Example A — "he said he was just worried about me"
wearing: "He wrapped it in care. 'I'm just worried' makes it sound like love, even if it also feels a bit like monitoring."
did: "It put his feelings in the center and made your choices answer to his worry. Suddenly you're wondering what you did to cause his stress instead of asking whether his worry feels fair to you."
tactic: "Possibly using care as a way to make your behavior answerable to his feelings."
closing: "You get to decide what his worry asks of you."

Example B — "he said it as a joke but it wasn't funny"
wearing: "He put it in a joke shape. Calling it a joke makes it sound light, even if it landed heavy on you."
did: "It let him say something sharp without having to own it. When you didn't laugh, the focus shifted to you being 'too sensitive' instead of whether the comment was actually okay."
tactic: "Using jokes to slide in real criticism and then blaming your reaction."
closing: "You're allowed to take seriously what felt sharp, even if he calls it a joke."

Example C — "he brought up everything he's done for me"
wearing: "It sounded like honesty about his feelings and everything he's done for you."
did: "It turned that list into a quiet bill. You're suddenly holding all the things he's done and feeling like you owe him something in return."
tactic: "Debt mechanism: using 'everything I've done' to make you feel you owe him agreement or gratitude."
closing: "You're allowed to notice when appreciation starts to feel like pressure."

Example D — "he said he'll marry me even if we're both miserable together"
wearing: "He framed it as deep commitment — 'I'll stay no matter what' — which can sound romantic on the surface."
did: "It treated misery as a given and asked you to feel grateful for being chosen inside it. Love got turned into someone enduring you instead of someone wanting to build something good with you."
tactic: "Debt mechanism: his promise to stay becomes something you owe him, even if staying hurts you."
closing: "You're allowed to want more than someone who just endures you."

TONE:
Sound like a grounded, observant friend. Calm, not alarmist. Specific, not vague. Descriptive, not prescriptive. A good response leaves her thinking "That's one clear way to name what happened," or "I still see it my own way, but this gave me language," not "This tool is telling me who he is or what I have to do."

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

        // STEP 1 — safety pre-filter
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

        // STEP 2 — Anthropic
        const analysis = await callAnthropic(input.sentence, input.context, input.followups);
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
          followups: input.followups,
          triageStatus: input.triageStatus,
          prolificId: input.prolificId,
        });

        return buildResponse(analysis, false);
      },
    },
  },
});
