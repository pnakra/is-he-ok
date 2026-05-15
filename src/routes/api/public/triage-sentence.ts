import { createFileRoute } from "@tanstack/react-router";

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
  "blocked the door",
  "kill himself if",
  "kill me",
  "hurt me",
  "going to hurt",
];

const SYSTEM_PROMPT = `You are the triage layer for Is He OK?, a web tool that reads one sentence at a time and explains what the sentence did.

Your job is NOT to analyze the sentence in depth.
Your only job is to decide whether the user's input is clear enough to analyze as-is, or whether 1-3 short follow-up questions are needed first.

Principles:
- Default to analyzing as-is when reasonably possible.
- Only ask follow-up questions when the missing context would materially change the meaning.
- Never ask unnecessary questions.
- Never ask more than 3 follow-up questions.
- If the user already included the answer in their message, do not ask that question again.
- Prefer structured follow-up questions over open-ended ones.
- Ask about pattern, what happens after disagreement, and freedom to say no/disagree before anything else.
- Do not ask about alcohol, drugs, age gap, sex, money, or power unless the message clearly makes those relevant.
- If the message contains explicit violence, threats, coercion, being trapped, weapons, or immediate danger, mark it as SAFETY and do not ask follow-ups.

You must return valid JSON with this exact shape:

{
  "status": "READY" | "NEEDS_FOLLOWUP" | "SAFETY",
  "reason": "short string",
  "ask_pattern": true | false,
  "ask_pushback": true | false,
  "ask_freedom": true | false,
  "ask_safety": true | false,
  "suggest_optional_context": true | false
}

Guidance:
- READY: the input is specific enough to analyze now.
- NEEDS_FOLLOWUP: the input is too vague, too context-dependent, or describes a pattern/cluster where the meaning depends on recurrence or what happened after.
- SAFETY: the input indicates explicit harm or danger and should go to the safety response.

Examples of likely READY:
- "he said i was embarrassing myself and he only said it because he cares"
- "if you loved me you'd send me a picture"
- "you're overreacting"

Examples of likely NEEDS_FOLLOWUP:
- "he told me i always do this"
- "he said i was being dramatic"
- "he brought up everything he's done for me"
- "he did this again"
- "he added his ex and lied"

Examples of likely SAFETY:
- "he threatened me"
- "he blocked the door"
- "he said he'd kill himself if i left"
- "he hit me"

Return only the JSON object — no prose, no backticks.`;

export type TriageStatus = "READY" | "NEEDS_FOLLOWUP" | "SAFETY";

export interface TriageResult {
  status: TriageStatus;
  reason: string;
  ask_pattern: boolean;
  ask_pushback: boolean;
  ask_freedom: boolean;
  ask_safety: boolean;
  suggest_optional_context: boolean;
}

const DEFAULT_READY: TriageResult = {
  status: "READY",
  reason: "default",
  ask_pattern: false,
  ask_pushback: false,
  ask_freedom: false,
  ask_safety: false,
  suggest_optional_context: false,
};

interface TriageBody {
  sentence?: unknown;
  context?: unknown;
}

function isSafetyFlagged(text: string): boolean {
  const h = text.toLowerCase();
  return SAFETY_KEYWORDS.some((kw) => h.includes(kw));
}

interface AnthropicTextBlock {
  type: "text";
  text: string;
}
interface AnthropicResponse {
  content?: Array<AnthropicTextBlock | { type: string }>;
}

function extractJson(text: string): unknown | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const c = (fenced ? fenced[1] : text).trim();
  try {
    return JSON.parse(c);
  } catch {
    /* fall through */
  }
  const s = c.indexOf("{");
  const e = c.lastIndexOf("}");
  if (s === -1 || e <= s) return null;
  try {
    return JSON.parse(c.slice(s, e + 1));
  } catch {
    return null;
  }
}

function coerce(raw: unknown): TriageResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const status = r.status;
  if (status !== "READY" && status !== "NEEDS_FOLLOWUP" && status !== "SAFETY") return null;
  return {
    status,
    reason: typeof r.reason === "string" ? r.reason.slice(0, 200) : "",
    ask_pattern: r.ask_pattern === true,
    ask_pushback: r.ask_pushback === true,
    ask_freedom: r.ask_freedom === true,
    ask_safety: r.ask_safety === true,
    suggest_optional_context: r.suggest_optional_context === true,
  };
}

async function callTriage(sentence: string, context: string | null): Promise<TriageResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
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
        max_tokens: 300,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error("[triage] non-ok", resp.status, text);
      return null;
    }
    const json = (await resp.json()) as AnthropicResponse;
    const tb = (json.content ?? []).find(
      (b): b is AnthropicTextBlock => (b as { type?: string }).type === "text",
    );
    if (!tb) return null;
    return coerce(extractJson(tb.text));
  } catch (err) {
    console.error("[triage] threw", err);
    return null;
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export const Route = createFileRoute("/api/public/triage-sentence")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        let raw: TriageBody;
        try {
          raw = (await request.json()) as TriageBody;
        } catch {
          return jsonResponse(DEFAULT_READY);
        }
        const sentence =
          typeof raw.sentence === "string" ? raw.sentence.trim().slice(0, 4000) : "";
        const context =
          typeof raw.context === "string" && raw.context.trim()
            ? raw.context.trim().slice(0, 4000)
            : null;
        if (!sentence) return jsonResponse(DEFAULT_READY);

        // Hard safety pre-filter — bypass model.
        if (isSafetyFlagged(`${sentence}\n${context ?? ""}`)) {
          return jsonResponse({
            ...DEFAULT_READY,
            status: "SAFETY",
            reason: "keyword",
          } satisfies TriageResult);
        }

        const result = await callTriage(sentence, context);
        return jsonResponse(result ?? DEFAULT_READY);
      },
    },
  },
});
