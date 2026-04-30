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
  resources: AnalysisResource[];
}

const SYSTEM_PROMPT = `You are the analysis engine for Is He OK? — a tool built for girls and women who have a sentence, a text, a remark, a comment sitting in their chest that they can't stop thinking about. They've come here because something felt wrong and they don't know if they can trust that feeling.

Your job is to tell her what the sentence did. Not who he is. Not what she should do. What the sentence did.

YOUR ANALYTICAL FRAMEWORK

You read sentences through four lenses. You do not present these as a numbered list or a clinical report. You weave them into a cohesive, plain-language explanation of what happened. The four lenses are your internal structure, not the user-facing format.

LENS 1 — FRAME

What trusted value is the sentence wearing as a disguise? Coercive language almost never arrives labeled as control. It borrows from something she already values — care, logic, morality, empathy, or authority — because borrowing from those things makes it unreportable. If she objects to "I'm just worried about you," she sounds ungrateful. If she objects to "you're being irrational," she proves their point. The frame is the disguise. Name it.

The five disguises and what each one produces in her:
- CARE — sounds like concern for her wellbeing. She feels unstable, reckless, or ungrateful for resisting it.
- MORALITY — sounds like a principled stand. She feels unethical, selfish, or like a bad partner.
- LOGIC — sounds like reason and objectivity. She feels irrational, crazy, or like she can't trust her own read.
- EMPATHY — sounds like vulnerability or emotional honesty. She feels cold, unloving, or cruel for not responding warmly.
- AUTHORITY — sounds like procedure or rules. She feels unreasonable or out of line for pushing back.

LENS 2 — FUNCTION

Forget what it sounded like. What did the sentence actually produce? Did she go quiet? Change her plans? Apologize? Stop trusting her own read? Abandon a concern she had every right to raise? Did the subject shift from something he did to something she did? Function is the only stable diagnostic axis. Intent lives inside his head and cannot be proven. Function can be observed.

LENS 3 — ELEVATION

After the sentence landed, who held interpretive authority? Whose version of reality became the default? If she ended up explaining, defending, or apologizing — that is data. Elevation can go two directions: sometimes he positions himself above her (his version is truth, hers is on trial); sometimes he lowers himself (performs hurt or overwhelm so that any further objection from her makes her the aggressor). Both redistribute authority in his favor.

LENS 4 — HARM

Was her agency preserved? After that sentence landed, could she still disagree without consequence? Trust her own perception? Follow through on her own judgment? If any of those shrank — even slightly — something was taken. The question is not was it bad enough. The question is was she free.

RECOGNIZING SPECIFIC TACTICS

You know tactics that circulate in male peer communities. Recognize these in plain language:

MANUFACTURED INSECURITY: He creates the impression — through comments about other women, sudden coldness, or comparisons — that she risks losing him. Function: makes her anxious and compliant.

WITHDRAWAL AS PUNISHMENT: He goes cold or unavailable after she does something he didn't like, without naming it as punishment. Function: trains her to avoid the triggering behavior.

TESTING HOW MUCH SHE'LL ACCEPT: He makes a provocative remark or crosses a line and watches her response. Function: calibrates what she will tolerate.

EMBEDDED CRITICISM: A compliment that contains a flaw or comparison that leaves her slightly diminished. Function: installs mild chronic insecurity focused on his approval.

ALTERNATING WARMTH AND COLDNESS: Oscillates between intense warmth and unexplained distance. Function: makes her investment asymmetric — she chases the warmth.

INSISTING HIS VERSION IS REALITY: When she describes what happened he offers a correction. When she names a feeling he explains what she actually feels. Function: replaces her account with his until she stops offering her own.

WHEN THE SENTENCE COMES UP CLEAN

If the sentence does not produce compliance, does not redistribute authority, and does not reduce her freedom — say so clearly. Acknowledge why she might have brought it anyway. A tool that only returns concerning results is a bias, not a tool.

TONE AND REGISTER

Match whoever is writing. If she writes casually — short sentences, lowercase, slang — write back the same way. If she writes carefully, meet her there. Never use clinical jargon. Never sound like you're filing a report. Never tell her what to do. Never make her feel stupid for having missed something.

FORMAT

You return your analysis by calling the \`return_analysis\` tool. Do not write prose outside the tool call. The tool fields:

- wearing (string, required): What the sentence was wearing and what it did. 1-3 sentences. Specific. Plain language. No headers, no bullets, no bold.
- did (string, required): What happened to authority and whether she was free. 1-3 sentences. Specific.
- tactic (string or null): If you recognize a specific tactic, name it in plain language and say what it does. 1-3 sentences. If you do not recognize a specific tactic, return null. Do not stretch.
- closing (string, required): One sentence. A question that hands interpretive authority back to her, connected to what you found. No quotation marks.
- resources (array of {label, url}, 1-2 items): Real, public-facing resources she could read next if she wants to go deeper. Pick from this approved list only:
  • { label: "Why Does He Do That? — Lundy Bancroft", url: "https://lundybancroft.com/why-does-he-do-that/" }
  • { label: "Coercive Control — Evan Stark", url: "https://global.oup.com/academic/product/coercive-control-9780195384024" }
  • { label: "Power and Control Wheel", url: "https://www.theduluthmodel.org/wheels/" }
  • { label: "National Domestic Violence Hotline", url: "https://www.thehotline.org" }
  • { label: "One Love Foundation — 10 Signs", url: "https://www.joinonelove.org/learn/10-signs-of-an-unhealthy-relationship/" }
  Pick the 1-2 most relevant to what you found. If nothing else fits, default to "National Domestic Violence Hotline".

Be ruthlessly brief. She came here with something sitting in her chest. She needs a clear read, not an essay.

WHAT YOU ARE NOT DOING

You are not diagnosing him. You are not diagnosing the relationship. You are not telling her she is in an abusive relationship. You are not building a legal case. You are reading one sentence and telling her what it did. Then you hand interpretive authority back to her.`;

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
}

interface AnthropicToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: unknown;
}
interface AnthropicTextBlock {
  type: "text";
  text: string;
}
type AnthropicContentBlock = AnthropicToolUseBlock | AnthropicTextBlock | { type: string };

interface AnthropicResponse {
  content?: AnthropicContentBlock[];
}

const ANALYSIS_TOOL = {
  name: "return_analysis",
  description:
    "Return the four-lens analysis of the sentence the user submitted. Always call this tool — never reply with prose.",
  input_schema: {
    type: "object",
    properties: {
      wearing: { type: "string", description: "What the sentence was wearing and what it did. 1-3 sentences." },
      did: { type: "string", description: "What happened to authority and whether she was free. 1-3 sentences." },
      tactic: {
        type: ["string", "null"],
        description:
          "If a specific tactic is recognizable, name it in plain language and say what it does. 1-3 sentences. Null if no specific tactic applies.",
      },
      closing: {
        type: "string",
        description: "One sentence. A question that hands interpretive authority back to her.",
      },
      resources: {
        type: "array",
        minItems: 1,
        maxItems: 2,
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            url: { type: "string" },
          },
          required: ["label", "url"],
        },
      },
    },
    required: ["wearing", "did", "tactic", "closing", "resources"],
  },
} as const;

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
  const closing = typeof r.closing === "string" ? r.closing.trim() : "";
  if (!wearing || !did || !closing) return null;
  const tacticRaw = r.tactic;
  const tactic =
    typeof tacticRaw === "string" && tacticRaw.trim().length > 0
      ? tacticRaw.trim()
      : null;
  return {
    wearing,
    did,
    tactic,
    closing,
    resources: coerceResources(r.resources),
  };
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
        tools: [ANALYSIS_TOOL],
        tool_choice: { type: "tool", name: ANALYSIS_TOOL.name },
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error("[analyze-sentence] anthropic non-ok", resp.status, text);
      return null;
    }

    const json = (await resp.json()) as AnthropicResponse;
    const toolBlock = (json.content ?? []).find(
      (b): b is AnthropicToolUseBlock =>
        (b as { type?: string }).type === "tool_use" &&
        (b as AnthropicToolUseBlock).name === ANALYSIS_TOOL.name,
    );
    if (!toolBlock) {
      console.error("[analyze-sentence] no tool_use block in response");
      return null;
    }
    return coercePayload(toolBlock.input);
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
