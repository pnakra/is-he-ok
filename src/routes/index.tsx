import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getSessionId } from "@/lib/session";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/")({
  component: Index,
});

type AppState = "empty" | "loading" | "output";

interface Analysis {
  body: string;            // paragraphs leading up to the closing question
  closing: string;         // the closing question, set apart visually
  standardClose: string;   // hotline line shown below the divider
  safetyFlagged: boolean;  // true => safety pre-filter response, no closing q.
}

const FAILURE_TEXT =
  "Something didn't work on our end. Try again in a moment — what you brought here is worth a real read.";

const EMPTY_HINT = "Type something he said — even just a few words.";
const SHORT_HINT = "A little more context helps — what did he say exactly?";
const TIMEOUT_HINT = "That's taking longer than it should. Try again?";

const SAID_MAX = 500;
const SAID_COUNTER_AT = 400;
const CTX_MAX = 300;
const CTX_COUNTER_AT = 250;
const REQUEST_TIMEOUT_MS = 15000;

const SAFETY_LINE =
  "No account. Nothing saved about you. If you're in immediate danger, call 911 or 1-800-799-7233.";

const STANDARD_CLOSE_FALLBACK =
  "If anything you're experiencing ever feels physically unsafe, the National Domestic Violence Hotline is available 24/7 — 1-800-799-7233 or thehotline.org.";

const LOADING_PHRASES = [
  "Reading it...",
  "Looking at what it did...",
  "Almost...",
];

// Detect the standard close (hotline line) and split it off the body.
function splitStandardClose(text: string): { rest: string; standardClose: string } {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) {
    return { rest: text.trim(), standardClose: STANDARD_CLOSE_FALLBACK };
  }
  const last = paragraphs[paragraphs.length - 1];
  if (/1-?800-?799-?7233|thehotline\.org/i.test(last)) {
    return {
      rest: paragraphs.slice(0, -1).join("\n\n"),
      standardClose: last.replace(/^"|"$/g, ""),
    };
  }
  return { rest: paragraphs.join("\n\n"), standardClose: STANDARD_CLOSE_FALLBACK };
}

// Find the last sentence ending in "?" inside `text`, peel it off the body.
function splitClosingQuestion(text: string): { body: string; closing: string } {
  const trimmed = text.trim();
  if (!trimmed) return { body: "", closing: "" };

  const lastQ = trimmed.lastIndexOf("?");
  if (lastQ === -1) return { body: trimmed, closing: "" };

  const tail = trimmed.slice(lastQ + 1).trim();
  if (tail.length > 0) return { body: trimmed, closing: "" };

  // Walk forward to find the start of the sentence containing the last "?".
  let start = 0;
  const boundary = /[.!?]\s+(?=[A-Z"'(])|\n{2,}/g;
  let m: RegExpExecArray | null;
  while ((m = boundary.exec(trimmed)) !== null) {
    if (m.index >= lastQ) break;
    start = m.index + m[0].length;
  }

  const closing = trimmed.slice(start, lastQ + 1).trim();
  const body = trimmed.slice(0, start).trim();

  if (!body || closing.length > 280) {
    return { body: trimmed, closing: "" };
  }
  return { body, closing };
}

function parseAnalysis(text: string, safetyFlagged: boolean): Analysis {
  if (safetyFlagged) {
    // Safety response is one block; it already contains the hotline resources.
    return { body: text.trim(), closing: "", standardClose: "", safetyFlagged: true };
  }
  const { rest, standardClose } = splitStandardClose(text);
  const { body, closing } = splitClosingQuestion(rest);
  return { body, closing, standardClose, safetyFlagged: false };
}

function Index() {
  const [state, setState] = useState<AppState>("empty");
  const [said, setSaid] = useState("");
  const [context, setContext] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [copied, setCopied] = useState(false);
  const [showEmptyHint, setShowEmptyHint] = useState(false);
  const [showShortHint, setShowShortHint] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const outputRef = useRef<HTMLElement | null>(null);

  // Auto-grow primary textarea
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.max(el.scrollHeight, 160) + "px";
  }, [said]);

  // Cycle loading phrases
  useEffect(() => {
    if (state !== "loading") return;
    setPhraseIdx(0);
    const id = setInterval(() => {
      setPhraseIdx((i) => (i + 1) % LOADING_PHRASES.length);
    }, 1500);
    return () => clearInterval(id);
  }, [state]);

  // Hide the empty-state hint as soon as she starts typing.
  useEffect(() => {
    if (showEmptyHint && said.trim().length > 0) setShowEmptyHint(false);
  }, [said, showEmptyHint]);

  // Show short hint when sentence is non-empty but very short.
  useEffect(() => {
    const len = said.trim().length;
    setShowShortHint(len > 0 && len < 10);
  }, [said]);

  // Scroll output card into view on mobile when it appears.
  useEffect(() => {
    if (state === "output" && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state]);

  const isLoading = state === "loading";

  async function runSubmit(sentence: string, ctxRaw: string) {
    setShowEmptyHint(false);
    setTimedOut(false);
    setState("loading");

    const sessionId = getSessionId();
    const ctx = ctxRaw.trim() ? ctxRaw : undefined;
    track("iho_submission_started", {
      sessionId,
      hasContext: Boolean(ctx),
      sentenceLength: sentence.trim().length,
    });

    let analysisText = "";
    let safetyFlagged = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const resp = await fetch("/api/public/analyze-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence, context: ctx, sessionId }),
        signal: controller.signal,
      });
      const data = (await resp.json()) as {
        analysis?: string;
        safetyFlagged?: boolean;
      };
      analysisText = (data.analysis ?? "").trim() || FAILURE_TEXT;
      safetyFlagged = data.safetyFlagged === true;
      track("iho_submission_received", { sessionId, safetyFlagged });
      if (safetyFlagged) track("iho_safety_flagged", { sessionId });
    } catch (err) {
      const isAbort = (err as { name?: string })?.name === "AbortError";
      track("iho_submission_failed", { sessionId, timeout: isAbort });
      if (isAbort) {
        clearTimeout(timeoutId);
        setTimedOut(true);
        setState("empty");
        return;
      }
      analysisText = FAILURE_TEXT;
    } finally {
      clearTimeout(timeoutId);
    }

    setAnalysis(parseAnalysis(analysisText, safetyFlagged));
    setState("output");
  }

  async function handleSubmit() {
    if (isLoading) return;
    if (said.trim().length === 0) {
      setShowEmptyHint(true);
      taRef.current?.focus();
      return;
    }
    await runSubmit(said, context);
  }

  function handleRetry() {
    if (isLoading) return;
    void runSubmit(said, context);
  }

  function handleReset() {
    track("iho_reset_clicked", { sessionId: getSessionId() });
    setAnalysis(null);
    setSaid("");
    setContext("");
    setShowEmptyHint(false);
    setShowShortHint(false);
    setTimedOut(false);
    setState("empty");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleShare() {
    try {
      const url = typeof window !== "undefined" ? window.location.origin + "/" : "";
      await navigator.clipboard.writeText(url);
      setCopied(true);
      track("iho_share_clicked", { sessionId: getSessionId() });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* no-op */
    }
  }

  const inputDimmed = state === "loading";

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col px-10 py-10 sm:px-12">
        {/* Brand */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Is He OK?
          </span>
          <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
            Override Labs
          </span>
        </div>

        {/* Main column */}
        <section
          className={
            state === "empty"
              ? "flex flex-1 flex-col justify-center py-16"
              : "flex flex-1 flex-col py-12"
          }
        >
          {/* Prompt */}
          {state === "empty" && (
            <header className="mb-10 text-center">
              <h1 className="font-display text-[34px] leading-[1.15] text-foreground sm:text-[40px]">
                Something he said is sitting with you.
              </h1>
              <p className="mt-4 font-display text-[18px] italic text-muted-foreground">
                Type it here.
              </p>
            </header>
          )}

          {/* Input area */}
          <div
            className={
              "transition-opacity duration-500 " +
              (inputDimmed ? "opacity-50" : "opacity-100") +
              (state === "output" ? " mb-8" : "")
            }
            aria-hidden={state === "loading"}
          >
            <label htmlFor="said" className="sr-only">
              What he said
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
              disabled={state === "loading"}
              maxLength={SAID_MAX}
              aria-label="Type what he said"
              placeholder="Type or paste what he said..."
              className={
                "w-full resize-none border-0 bg-[var(--color-surface)] px-6 py-5 text-[16px] sm:text-[17px] leading-[1.6] text-foreground outline-none focus:ring-0 " +
                (state === "output" ? "min-h-[96px]" : "min-h-[160px]")
              }
              style={{ fontFamily: "var(--font-sans)" }}
            />
            {said.length >= SAID_COUNTER_AT && (
              <p
                className="mt-1 text-right text-[11px] text-muted-foreground"
                aria-live="polite"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {said.length >= SAID_MAX
                  ? "That's enough to work with."
                  : `${SAID_MAX - said.length} characters left`}
              </p>
            )}

            <div className="mt-3">
              <label htmlFor="context" className="sr-only">
                Optional context
              </label>
              <textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value.slice(0, CTX_MAX))}
                disabled={state === "loading"}
                maxLength={CTX_MAX}
                aria-label="Optional context"
                placeholder="Anything that helps — where you were, what had just happened. Optional."
                rows={2}
                className="w-full resize-none border-0 bg-[var(--color-surface)] px-6 py-4 text-[16px] sm:text-[14px] leading-[1.6] text-muted-foreground outline-none focus:text-foreground focus:ring-0"
                style={{ fontFamily: "var(--font-sans)" }}
              />
              {context.length >= CTX_COUNTER_AT && (
                <p
                  className="mt-1 text-right text-[11px] text-muted-foreground"
                  aria-live="polite"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {context.length >= CTX_MAX
                    ? "That's enough to work with."
                    : `${CTX_MAX - context.length} characters left`}
                </p>
              )}
            </div>

            {state !== "output" && (
              <>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="mt-3 block min-h-[52px] w-full bg-primary px-6 py-4 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-[color-mix(in_oklab,var(--color-primary)_88%,white_12%)] disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  What did this do?
                </button>
                {showEmptyHint && (
                  <p
                    className="mt-3 text-[13px] leading-[1.6] text-muted-foreground"
                    role="status"
                    aria-live="polite"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {EMPTY_HINT}
                  </p>
                )}
                {!showEmptyHint && showShortHint && (
                  <p
                    className="mt-3 text-[13px] leading-[1.6] text-muted-foreground"
                    aria-live="polite"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {SHORT_HINT}
                  </p>
                )}
                {timedOut && (
                  <p
                    className="mt-3 text-[13px] leading-[1.6] text-muted-foreground"
                    role="status"
                    aria-live="polite"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {TIMEOUT_HINT}{" "}
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      Try again
                    </button>
                  </p>
                )}
              </>
            )}
          </div>

          {/* Loading line */}
          {state === "loading" && (
            <div className="mt-6 min-h-[24px] text-center" aria-live="polite">
              <span
                key={phraseIdx}
                className="animate-soft-fade text-[14px] text-muted-foreground"
                style={{ animationIterationCount: "infinite" }}
              >
                {LOADING_PHRASES[phraseIdx]}
              </span>
            </div>
          )}

          {/* Output */}
          {state === "output" && analysis && (
            <article
              ref={outputRef}
              role="region"
              aria-label="Analysis"
              className="animate-rise-in border border-border bg-[var(--color-surface)] p-8 sm:p-10"
            >
              {analysis.body
                .split(/\n{2,}/)
                .filter((p) => p.trim().length > 0)
                .map((para, i) => (
                  <p
                    key={i}
                    className={
                      "text-[16px] leading-[1.7] text-foreground " +
                      (i > 0 ? "mt-5" : "")
                    }
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {para}
                  </p>
                ))}

              {/* Closing question — terracotta, Playfair, 20px, 24px top margin */}
              {analysis.closing && !analysis.safetyFlagged && (
                <p
                  className="font-display text-[20px] leading-[1.35] text-primary"
                  style={{ marginTop: "24px" }}
                >
                  {analysis.closing}
                </p>
              )}

              {/* Standard close — only when not a safety response (the safety
                  message already carries its own resources inline). */}
              {!analysis.safetyFlagged && analysis.standardClose && (
                <>
                  <div className="mt-8 h-px w-full" style={{ backgroundColor: "#2A2522" }} />
                  <p
                    className="mt-4 text-[13px] leading-[1.6] text-muted-foreground"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {analysis.standardClose}
                  </p>
                </>
              )}
            </article>
          )}

          {state === "output" && (
            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="text-[14px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Run another one
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="text-[14px] text-primary transition-colors hover:opacity-80"
              >
                {copied ? "Link copied" : "Share"}
              </button>
            </div>
          )}
        </section>

        {/* Footer safety line — only on empty/loading states */}
        {state !== "output" && (
          <footer className="pt-12">
            <p className="text-[11px] leading-[1.6] text-muted-foreground">
              {SAFETY_LINE}
            </p>
          </footer>
        )}
      </div>
    </main>
  );
}
