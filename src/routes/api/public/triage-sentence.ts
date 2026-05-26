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

const SYSTEM_PROMPT = `You are a classifier for "Is He OK?", a tool that helps girls and young women make sense of one sentence that felt off from a guy they are dating, talking to, hooking up with, or in an intimate relationship with.

Your job is to decide one of four things about the input:
1. It is in scope and ready to analyze.
2. It is in scope but too thin — ask 2–3 short follow-ups first.
3. It is in scope but describes acute physical danger or sexual coercion.
4. It is OUT OF SCOPE — the sentence is from someone who is clearly not a romantic / dating / sexual partner (e.g. a boss, coworker, parent, sibling, teacher, friend, stranger on the street, online troll, generic "men say this" commentary).

Be conservative on scope. Default to in-scope when the relationship is unclear or ambiguous — many users won't spell out "my boyfriend". Only mark OFF_DOMAIN when the input itself makes the non-intimate context explicit (named role, workplace setting, family member, public stranger, etc.) or when it is clearly generic commentary about men rather than a specific thing a partner said.

ASK FOLLOW-UP QUESTIONS (status = NEEDS_FOLLOWUP) if:
- the sentence is short and generic (e.g. "he said i always do this", "he was just worried about me", "he said it as a joke")
- the sentence could reflect either ordinary conflict or something more manipulative depending on context
- the sentence points to a pattern-dependent dynamic such as guilt, criticism, worry, jealousy, or "joking"
- the input is a fragment with too little detail to know what it did to her

DO NOT ASK FOLLOW-UP QUESTIONS (status = READY) if:
- the sentence already contains enough specific content to analyze
- the input clearly describes a behavior pattern or event with enough detail
- the input is a test/nonsense message
- the input is a direct insult, demand, or other concrete thing that can be read immediately

SAFETY (status = SAFETY): the input describes explicit violence, threats, coercion, being trapped, weapons, or immediate danger. Do not ask follow-ups.

OFF_DOMAIN (status = OFF_DOMAIN): the input clearly comes from a non-intimate context. Set "reason" to a single bucket word: "workplace" (boss, coworker, manager, client, professor), "family" (parent, sibling, relative), "stranger" (public, online, catcalling, troll), or "generic" (broad commentary about "men" rather than a specific partner). Do not ask follow-ups.

The follow-ups, when needed, only clarify:
1. whether this is a pattern (ask_pattern)
2. what happens when she pushes back (ask_pushback)
3. whether she still felt free to disagree (ask_freedom — optional, only when it would meaningfully sharpen the read)

Never set ask_safety, and never set suggest_optional_context, to true. Never ask about alcohol, drugs, age gap, sex, money, or power unless the message clearly makes them relevant.

You must return valid JSON with this exact shape and nothing else:

{
  "status": "READY" | "NEEDS_FOLLOWUP" | "SAFETY" | "OFF_DOMAIN",
  "reason": "short string under 18 words (for OFF_DOMAIN: one of workplace|family|stranger|generic)",
  "ask_pattern": true | false,
  "ask_pushback": true | false,
  "ask_freedom": true | false,
  "ask_safety": false,
  "suggest_optional_context": false
}

Rules:
- If status is NEEDS_FOLLOWUP, set at least ask_pattern and ask_pushback to true.
- If status is READY, SAFETY, or OFF_DOMAIN, set all ask_* fields to false.
- Return only the JSON object — no prose, no backticks.

Examples of likely READY:
- "he said i was embarrassing myself and he only said it because he cares"
- "if you loved me you'd send me a picture"
- "you're overreacting"

Examples of likely NEEDS_FOLLOWUP:
- "he told me i always do this"
- "he said i was being dramatic"
- "he brought up everything he's done for me"
- "he said he was just worried about me"
- "he said it as a joke"

Examples of likely SAFETY:
- "he threatened me"
- "he blocked the door"
- "he said he'd kill himself if i left"
- "he hit me"

Examples of likely OFF_DOMAIN:
- "my boss said my idea was cute" → workplace
- "a guy on the train told me to smile" → stranger
- "my dad said i'm being dramatic" → family
- "guys are going to only want you for one thing" (no partner context, reads as generic commentary about men) → generic
- "my coworker keeps interrupting me in meetings" → workplace`;

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
  if (SAFETY_KEYWORDS.some((kw) => h.includes(kw))) return true;
  if (SEX_COERCION_PHRASES.some((p) => h.includes(p))) return true;
  const hasSex = SEX_TERMS.some((t) => h.includes(t));
  if (hasSex && COERCION_PATTERNS.some((p) => h.includes(p))) return true;
  return false;
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
