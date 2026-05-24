import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getSessionId } from "@/lib/session";
import { track } from "@/lib/analytics";
import { FeedbackChips } from "@/components/FeedbackChips";
import { logResourceClick } from "@/lib/feedback";

export const Route = createFileRoute("/")({
  component: Index,
});

type AppState = "empty" | "triaging" | "followup" | "loading" | "output";

interface Resource {
  label: string;
  url: string;
}

interface Analysis {
  wearing: string;
  did: string;
  tactic: string | null;
  closing?: string;
  resources: Resource[];
  safetyFlagged: boolean;
}

type FollowupKey = "pattern" | "pushback" | "freedom" | "safety";

interface FollowupQuestion {
  key: FollowupKey;
  prompt: string;
  options: string[];
}

const FOLLOWUP_QUESTIONS: Record<FollowupKey, FollowupQuestion> = {
  pattern: {
    key: "pattern",
    prompt: "Has this happened before, or was it just this one time?",
    options: ["Just this one time", "A few times", "It happens a lot", "I'm not sure"],
  },
  pushback: {
    key: "pushback",
    prompt: "When you push back or disagree, what usually happens?",
    options: [
      "He listens / we can talk about it",
      "He gets defensive",
      "He shuts down or pulls away",
      "He turns it back on me",
      "I usually don't push back",
    ],
  },
  freedom: {
    key: "freedom",
    prompt: "After this, did you still feel free to disagree or say no?",
    options: ["Yes", "Kind of", "No", "I'm not sure"],
  },
  safety: {
    key: "safety",
    prompt: "Did any part of this make you feel scared or unsafe?",
    options: ["No", "A little", "Yes"],
  },
};

interface TriageResponse {
  status: "READY" | "NEEDS_FOLLOWUP" | "SAFETY";
  ask_pattern?: boolean;
  ask_pushback?: boolean;
  ask_freedom?: boolean;
  ask_safety?: boolean;
}

const FAILURE_TEXT =
  "Something didn't work on our end. Please try again in a moment.";

const EMPTY_HINT = "Add the sentence you want to look at.";
const SHORT_HINT = "A little more text helps — what did he actually say?";
const TIMEOUT_HINT = "That's taking longer than it should. Try again?";

const SAID_MAX = 500;
const SAID_COUNTER_AT = 400;
const CONTEXT_MAX = 400;
const REQUEST_TIMEOUT_MS = 20000;

const SUGGESTION_CHIPS: string[] = [
  "You're too sensitive",
  "I was just joking",
  "Why are you making this a big deal?",
  "You always do this",
  "You're overthinking it",
  "Calm down",
];

const LOADING_PHRASES = [
  "Reading it...",
  "Looking at how it landed...",
  "Almost there...",
];

const TRIAGE_PHRASES = ["Reading what you sent..."];

const FALLBACK_RESOURCES: Resource[] = [
  { label: "Healthy vs unhealthy relationship signs — love is respect", url: "https://www.loveisrespect.org/relationship-spectrum/" },
];

function makeFailureAnalysis(): Analysis {
  return {
    wearing: FAILURE_TEXT,
    did: "Want to try sending it again?",
    tactic: null,
    resources: FALLBACK_RESOURCES,
    safetyFlagged: false,
  };
}

function Card({
  label,
  children,
  defaultOpen = false,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [maxHeight, setMaxHeight] = useState<string>(defaultOpen ? "none" : "0px");

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (open) {
      const h = el.scrollHeight;
      setMaxHeight(h + "px");
      const id = window.setTimeout(() => setMaxHeight("none"), 220);
      return () => window.clearTimeout(id);
    } else {
      const h = el.scrollHeight;
      setMaxHeight(h + "px");
      requestAnimationFrame(() => setMaxHeight("0px"));
    }
  }, [open]);

  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "10px",
        background: "var(--color-surface)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        style={{ background: "transparent", border: 0, cursor: "pointer" }}
      >
        <span
          className="text-[15px] font-medium text-foreground"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {label}
        </span>
        <span
          className="text-[18px] leading-none text-muted-foreground"
          aria-hidden="true"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {open ? "−" : "+"}
        </span>
      </button>
      <div
        style={{
          maxHeight,
          overflow: "hidden",
          transition: "max-height 200ms ease",
        }}
      >
        <div
          ref={contentRef}
          className="text-[16px] text-foreground"
          style={{
            fontFamily: "var(--font-sans)",
            lineHeight: 1.65,
            padding: "0 20px 18px",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function Index() {
  const [state, setState] = useState<AppState>("empty");
  const [said, setSaid] = useState("");
  const [optionalContext, setOptionalContext] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [submittedSentence, setSubmittedSentence] = useState("");
  const [usedFollowups, setUsedFollowups] = useState(false);

  const [askedQuestions, setAskedQuestions] = useState<FollowupQuestion[]>([]);
  const [answers, setAnswers] = useState<Partial<Record<FollowupKey, string>>>({});

  const [prolificId, setProlificId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get("prolific_id") ?? params.get("PROLIFIC_PID");
      if (raw) {
        const trimmed = raw.trim();
        if (trimmed.length > 0 && trimmed.length <= 64 && /^[A-Za-z0-9_-]+$/.test(trimmed)) {
          setProlificId(trimmed);
          try {
            window.sessionStorage.setItem("iho_prolific_id", trimmed);
          } catch {
            // ignore
          }
          return;
        }
      }
      const stored = window.sessionStorage.getItem("iho_prolific_id");
      if (stored) setProlificId(stored);
    } catch {
      // ignore
    }
  }, []);

  const [showEmptyHint, setShowEmptyHint] = useState(false);
  const [showShortHint, setShowShortHint] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const outputRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.max(el.scrollHeight, 120) + "px";
  }, [said]);

  useEffect(() => {
    if (state !== "loading" && state !== "triaging") return;
    setPhraseIdx(0);
    if (state === "triaging") return;
    const id = setInterval(() => {
      setPhraseIdx((i) => (i + 1) % LOADING_PHRASES.length);
    }, 1500);
    return () => clearInterval(id);
  }, [state]);

  useEffect(() => {
    if (showEmptyHint && said.trim().length > 0) setShowEmptyHint(false);
  }, [said, showEmptyHint]);

  useEffect(() => {
    const len = said.trim().length;
    setShowShortHint(len > 0 && len < 10);
  }, [said]);

  useEffect(() => {
    if (state === "output" && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state]);

  const isBusy = state === "loading" || state === "triaging";

  async function callAnalyze(
    sentence: string,
    context: string | null,
    followups: Partial<Record<FollowupKey, string>>,
    triageStatus: string,
  ): Promise<Analysis> {
    const sessionId = getSessionId();
    let result: Analysis = makeFailureAnalysis();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const resp = await fetch("/api/public/analyze-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence,
          context,
          sessionId,
          followups,
          triageStatus,
          prolificId,
        }),
        signal: controller.signal,
      });
      const data = (await resp.json()) as {
        analysis?: Partial<Analysis> | null;
        safetyFlagged?: boolean;
      };
      const safetyFlagged = data.safetyFlagged === true;
      const a = data.analysis;
      if (a && typeof a === "object" && typeof a.wearing === "string" && a.wearing.trim().length > 0) {
        result = {
          wearing: a.wearing.trim(),
          did: typeof a.did === "string" ? a.did.trim() : "",
          tactic:
            typeof a.tactic === "string" && a.tactic.trim().length > 0
              ? a.tactic.trim()
              : null,
          closing:
            typeof a.closing === "string" && a.closing.trim().length > 0
              ? a.closing.trim()
              : "",
          resources:
            Array.isArray(a.resources) && a.resources.length > 0
              ? (a.resources as Resource[])
              : FALLBACK_RESOURCES,
          safetyFlagged,
        };
      } else {
        result = { ...makeFailureAnalysis(), safetyFlagged };
      }
      track("iho_submission_received", { sessionId, safetyFlagged, triageStatus });
      if (safetyFlagged) track("iho_safety_flagged", { sessionId });
    } catch (err) {
      const isAbort = (err as { name?: string })?.name === "AbortError";
      track("iho_submission_failed", { sessionId, timeout: isAbort });
      if (isAbort) {
        clearTimeout(timeoutId);
        setTimedOut(true);
        throw new Error("aborted");
      }
      result = makeFailureAnalysis();
    } finally {
      clearTimeout(timeoutId);
    }
    return result;
  }

  async function callTriage(sentence: string, context: string | null): Promise<TriageResponse> {
    try {
      const resp = await fetch("/api/public/triage-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence, context }),
      });
      return (await resp.json()) as TriageResponse;
    } catch {
      return { status: "READY" };
    }
  }

  async function runFlow(sentence: string) {
    setShowEmptyHint(false);
    setTimedOut(false);
    setSubmittedSentence(sentence.trim());
    const ctx = optionalContext.trim() ? optionalContext.trim() : null;

    const sessionId = getSessionId();
    track("iho_submission_started", {
      sessionId,
      sentenceLength: sentence.trim().length,
      hasContext: !!ctx,
    });

    setState("triaging");
    const triage = await callTriage(sentence, ctx);
    track("iho_triage_result", { sessionId, status: triage.status });

    if (triage.status === "NEEDS_FOLLOWUP") {
      const asked: FollowupQuestion[] = [];
      if (triage.ask_pattern) asked.push(FOLLOWUP_QUESTIONS.pattern);
      if (triage.ask_pushback) asked.push(FOLLOWUP_QUESTIONS.pushback);
      if (triage.ask_freedom) asked.push(FOLLOWUP_QUESTIONS.freedom);
      if (triage.ask_safety) asked.push(FOLLOWUP_QUESTIONS.safety);
      const capped = asked.slice(0, 3);
      if (capped.length === 0) {
        await analyzeAndShow(sentence, ctx, {}, "READY", false);
        return;
      }
      setAskedQuestions(capped);
      setAnswers({});
      setState("followup");
      return;
    }

    await analyzeAndShow(sentence, ctx, {}, triage.status, false);
  }

  async function analyzeAndShow(
    sentence: string,
    ctx: string | null,
    followups: Partial<Record<FollowupKey, string>>,
    triageStatus: string,
    used: boolean,
  ) {
    setUsedFollowups(used);
    setState("loading");
    try {
      const result = await callAnalyze(sentence, ctx, followups, triageStatus);
      setAnalysis(result);
      setState("output");
    } catch {
      setState("empty");
    }
  }

  async function handleSubmit() {
    if (isBusy) return;
    if (said.trim().length === 0) {
      setShowEmptyHint(true);
      taRef.current?.focus();
      return;
    }
    await runFlow(said);
  }

  async function handleFollowupSubmit() {
    if (isBusy) return;
    const allAnswered = askedQuestions.every((q) => !!answers[q.key]);
    if (!allAnswered) return;
    const ctx = optionalContext.trim() ? optionalContext.trim() : null;
    await analyzeAndShow(said, ctx, answers, "NEEDS_FOLLOWUP", true);
  }

  function handleRetry() {
    if (isBusy) return;
    void runFlow(said);
  }

  function handleReset() {
    track("iho_reset_clicked", { sessionId: getSessionId() });
    setAnalysis(null);
    setSaid("");
    setOptionalContext("");
    setShowContext(false);
    setSubmittedSentence("");
    setShowEmptyHint(false);
    setShowShortHint(false);
    setTimedOut(false);
    setUsedFollowups(false);
    setAskedQuestions([]);
    setAnswers({});
    setState("empty");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const inputDimmed = isBusy;

  const chipStyleBase: React.CSSProperties = {
    fontFamily: "var(--font-sans)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    padding: "8px 14px",
    background: "var(--color-surface)",
    color: "var(--color-foreground)",
    cursor: "pointer",
    transition: "background 140ms ease, border-color 140ms ease",
  };

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[720px] flex-col px-6 py-8 sm:px-10 sm:py-10">
        {/* Brand */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            onClick={() => {
              // If we're already on home in output state, reset.
              if (state === "output" || state === "followup") handleReset();
            }}
            className="text-[15px] font-medium text-foreground no-underline hover:opacity-80"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            is he ok?
          </Link>
          <Link
            to="/about"
            className="text-[14px] text-muted-foreground no-underline hover:text-foreground hover:underline"
            style={{ fontFamily: "var(--font-sans)", textUnderlineOffset: "3px" }}
          >
            About
          </Link>
        </div>

        {/* Main column */}
        <section
          className={
            state === "empty"
              ? "flex flex-1 flex-col justify-center py-12"
              : "flex flex-1 flex-col py-10"
          }
        >
          {(state === "empty" || state === "triaging") && (
            <div
              className={
                "transition-opacity duration-500 " +
                (inputDimmed ? "opacity-50" : "opacity-100")
              }
              aria-hidden={state === "triaging"}
            >
              {state === "empty" && (
                <header className="mb-8">
                  <h1
                    className="text-foreground"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "30px",
                      lineHeight: 1.2,
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Tell us what he said.
                  </h1>
                  <p
                    className="mt-2"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "15px",
                      lineHeight: 1.6,
                      color: "var(--color-text-faint)",
                    }}
                  >
                    A clearer way to make sense of one sentence.
                  </p>
                </header>
              )}

              <label htmlFor="said" className="sr-only">
                The sentence
              </label>
              <textarea
                id="said"
                ref={taRef}
                value={said}
                onChange={(e) => {
                  const v = e.target.value.slice(0, SAID_MAX);
                  setSaid(v);
                  if (timedOut) setTimedOut(false);
                }}
                disabled={isBusy}
                maxLength={SAID_MAX}
                aria-label="The sentence you want to look at"
                placeholder="e.g. “you’re too sensitive”"
                rows={3}
                className="quiet-input block w-full px-4 py-3 text-[17px] text-foreground min-h-[120px]"
                style={{
                  fontFamily: "var(--font-sans)",
                  lineHeight: 1.6,
                }}
              />

              {said.length >= SAID_COUNTER_AT && (
                <p
                  className="mt-2 text-right text-[13px]"
                  aria-live="polite"
                  style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-faint)" }}
                >
                  {said.length >= SAID_MAX
                    ? "That's enough to work with."
                    : `${SAID_MAX - said.length} characters left`}
                </p>
              )}

              {state === "empty" && (
                <div className="mt-5">
                  <p
                    className="mb-2 text-[14px]"
                    style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-faint)" }}
                  >
                    Or pick one to start:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTION_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          setSaid(chip);
                          taRef.current?.focus();
                        }}
                        className="text-[14px] hover:bg-[var(--color-surface-2)] hover:border-[color-mix(in_oklab,var(--color-foreground)_20%,var(--color-border))]"
                        style={chipStyleBase}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional context */}
              {state === "empty" && (
                <div className="mt-6">
                  {!showContext ? (
                    <button
                      type="button"
                      onClick={() => setShowContext(true)}
                      className="text-[14px] text-muted-foreground hover:text-foreground hover:underline"
                      style={{
                        fontFamily: "var(--font-sans)",
                        background: "transparent",
                        border: 0,
                        padding: 0,
                        cursor: "pointer",
                        textUnderlineOffset: "3px",
                      }}
                    >
                      + Add a little context (optional)
                    </button>
                  ) : (
                    <div>
                      <label
                        htmlFor="ctx"
                        className="block text-[14px]"
                        style={{ fontFamily: "var(--font-sans)", color: "var(--color-muted-foreground)" }}
                      >
                        Add a little context (optional)
                      </label>
                      <p
                        className="mt-1 text-[13px]"
                        style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-faint)" }}
                      >
                        You can include what happened before, how he said it, or what felt off.
                      </p>
                      <textarea
                        id="ctx"
                        value={optionalContext}
                        onChange={(e) =>
                          setOptionalContext(e.target.value.slice(0, CONTEXT_MAX))
                        }
                        disabled={isBusy}
                        maxLength={CONTEXT_MAX}
                        placeholder="One or two lines."
                        rows={2}
                        className="quiet-input mt-2 block w-full px-4 py-2 text-[15px] text-foreground"
                        style={{
                          fontFamily: "var(--font-sans)",
                          lineHeight: 1.6,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {state === "empty" && (
                <div className="mt-8">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isBusy}
                    className="inline-flex min-h-[48px] items-center justify-center bg-primary px-7 py-3 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ fontFamily: "var(--font-sans)", borderRadius: "10px" }}
                  >
                    Read the sentence
                  </button>
                  {showEmptyHint && (
                    <p
                      className="mt-3 text-[14px] leading-[1.5]"
                      role="status"
                      aria-live="polite"
                      style={{ fontFamily: "var(--font-sans)", color: "var(--color-muted-foreground)" }}
                    >
                      {EMPTY_HINT}
                    </p>
                  )}
                  {!showEmptyHint && showShortHint && (
                    <p
                      className="mt-3 text-[14px] leading-[1.5]"
                      aria-live="polite"
                      style={{ fontFamily: "var(--font-sans)", color: "var(--color-muted-foreground)" }}
                    >
                      {SHORT_HINT}
                    </p>
                  )}
                  {timedOut && (
                    <p
                      className="mt-3 text-[14px] leading-[1.5]"
                      role="status"
                      aria-live="polite"
                      style={{ fontFamily: "var(--font-sans)", color: "var(--color-muted-foreground)" }}
                    >
                      {TIMEOUT_HINT}{" "}
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="text-primary hover:underline"
                        style={{ textUnderlineOffset: "3px" }}
                      >
                        Try again
                      </button>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {(state === "triaging" || state === "loading") && (
            <div className="mt-6 min-h-[24px] text-center" aria-live="polite">
              <span
                key={phraseIdx + state}
                className="animate-soft-fade text-[14px]"
                style={{ animationIterationCount: "infinite", color: "var(--color-muted-foreground)" }}
              >
                {state === "triaging" ? TRIAGE_PHRASES[0] : LOADING_PHRASES[phraseIdx]}
              </span>
            </div>
          )}

          {/* Followup */}
          {state === "followup" && (
            <div className="animate-rise-in mx-auto w-full max-w-[600px]">
              <p
                className="text-[15px] leading-[1.6]"
                style={{ fontFamily: "var(--font-sans)", color: "var(--color-muted-foreground)" }}
              >
                {askedQuestions.length >= 3
                  ? "A few quick questions so the read is more grounded."
                  : "Two quick questions so the read is more grounded."}
              </p>

              <div className="mt-6 flex flex-col gap-7">
                {askedQuestions.map((q) => (
                  <div key={q.key}>
                    <p
                      className="text-[16px] leading-[1.5] text-foreground"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {q.prompt}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {q.options.map((opt) => {
                        const selected = answers[q.key] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              setAnswers((prev) => ({ ...prev, [q.key]: opt }))
                            }
                            className="text-[14px]"
                            style={{
                              fontFamily: "var(--font-sans)",
                              border: selected
                                ? "1px solid var(--color-primary)"
                                : "1px solid var(--color-border)",
                              borderRadius: "8px",
                              padding: "8px 14px",
                              background: selected
                                ? "var(--color-accent-soft)"
                                : "var(--color-surface)",
                              color: selected ? "var(--color-accent-hover)" : "var(--color-foreground)",
                              cursor: "pointer",
                            }}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleFollowupSubmit}
                  disabled={
                    isBusy || !askedQuestions.every((q) => !!answers[q.key])
                  }
                  className="inline-flex min-h-[44px] items-center justify-center bg-primary px-6 py-2 text-[14px] font-medium text-primary-foreground transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ fontFamily: "var(--font-sans)", borderRadius: "10px" }}
                >
                  Continue
                </button>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[13px] hover:underline"
                    style={{
                      fontFamily: "var(--font-sans)",
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                      color: "var(--color-muted-foreground)",
                      textUnderlineOffset: "3px",
                    }}
                  >
                    Start over
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Output */}
          {state === "output" && analysis && (
            <article
              ref={outputRef}
              role="region"
              aria-label="Analysis"
              className="animate-rise-in mx-auto w-full max-w-[640px]"
            >
              {submittedSentence && (
                <blockquote
                  className="font-display"
                  style={{
                    fontSize: "18px",
                    lineHeight: 1.55,
                    fontStyle: "italic",
                    color: "var(--color-foreground)",
                    background: "var(--color-surface-2)",
                    borderLeft: "3px solid var(--color-primary)",
                    padding: "14px 18px",
                    borderRadius: "6px",
                    marginBottom: "20px",
                  }}
                >
                  “{submittedSentence}”
                </blockquote>
              )}

              <p
                className="text-[14px]"
                style={{
                  fontFamily: "var(--font-sans)",
                  color: "var(--color-muted-foreground)",
                  marginBottom: "20px",
                }}
              >
                {usedFollowups ? "Read with a little more context" : "Read from the sentence alone"}
              </p>

              <div className="flex flex-col gap-3">
                <Card label="How it came across" defaultOpen>
                  {analysis.wearing}
                  <FeedbackChips
                    sessionId={getSessionId()}
                    component="read"
                    slot="wearing"
                  />
                </Card>
                {analysis.did && (
                  <Card label="What it did to you">
                    {analysis.did}
                    <FeedbackChips
                      sessionId={getSessionId()}
                      component="read"
                      slot="did"
                    />
                  </Card>
                )}
                {analysis.tactic && (
                  <Card label="What may be going on">
                    {analysis.tactic}
                    <FeedbackChips
                      sessionId={getSessionId()}
                      component="read"
                      slot="tactic"
                    />
                  </Card>
                )}
              </div>

              {analysis.closing && (
                <p
                  className="text-foreground"
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "18px",
                    lineHeight: 1.55,
                    marginTop: "32px",
                    fontStyle: "italic",
                  }}
                  aria-live="polite"
                >
                  {analysis.closing}
                </p>
              )}

              {analysis.resources.length > 0 && (
                <section style={{ marginTop: "40px" }}>
                  <h2
                    className="text-[14px] font-medium text-foreground"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    If you want to read further
                  </h2>
                  <ul className="mt-3 flex flex-col gap-2">
                    {analysis.resources.map((r) => (
                      <li key={r.url}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-[15px] no-underline hover:underline"
                          style={{
                            fontFamily: "var(--font-sans)",
                            color: "var(--color-primary)",
                            textUnderlineOffset: "3px",
                          }}
                        >
                          <span>{r.label}</span>
                          <span aria-hidden="true">→</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  <div style={{ marginTop: "14px" }}>
                    <FeedbackChips
                      sessionId={getSessionId()}
                      component="resource"
                      prompt="Was this link useful?"
                    />
                  </div>
                </section>
              )}

              <OverallFeedback sessionId={getSessionId()} />

              <div style={{ marginTop: "48px" }}>
                <div className="h-px w-full" style={{ backgroundColor: "var(--color-divider)" }} />
                <div className="pt-5 text-center">
                  <p
                    className="text-[13px] leading-[1.6]"
                    style={{ color: "var(--color-text-faint)" }}
                  >
                    No account. Nothing saved about you.
                  </p>
                  <p
                    className="text-[13px] leading-[1.6]"
                    style={{ color: "var(--color-text-faint)" }}
                  >
                    If you're in immediate danger, call 911 or 1-800-799-7233.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center" style={{ marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[14px] hover:text-foreground hover:underline"
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: "var(--color-muted-foreground)",
                    textUnderlineOffset: "3px",
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                  }}
                >
                  Read another one
                </button>
              </div>
            </article>
          )}
        </section>

        {state !== "output" && state !== "followup" && (
          <footer style={{ marginTop: "48px" }}>
            <div className="h-px w-full" style={{ backgroundColor: "var(--color-divider)" }} />
            <div className="pt-5 text-center">
              <p
                className="text-[13px] leading-[1.6]"
                style={{ color: "var(--color-text-faint)" }}
              >
                No account. Nothing saved about you.
              </p>
              <p
                className="text-[13px] leading-[1.6]"
                style={{ color: "var(--color-text-faint)" }}
              >
                If you're in immediate danger, call 911 or 1-800-799-7233.
              </p>
            </div>
          </footer>
        )}
      </div>
    </main>
  );
}

function OverallFeedback({ sessionId }: { sessionId: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 1800);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div
      className="animate-rise-in"
      style={{
        marginTop: "40px",
        padding: "16px 18px",
        borderRadius: "10px",
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-divider)",
      }}
    >
      <FeedbackChips
        sessionId={sessionId}
        component="overall"
        prompt="Was this worth your time?"
        emphasis="soft"
        allowNote
      />
    </div>
  );
}
