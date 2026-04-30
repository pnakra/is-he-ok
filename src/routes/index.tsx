import { createFileRoute, Link } from "@tanstack/react-router";
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
const REQUEST_TIMEOUT_MS = 15000;

const SUGGESTION_CHIPS: string[] = [
  "something he said felt off",
  "he said it as a joke but it wasn't",
  "he said this over text",
  "something he does keeps happening",
  "i can't stop thinking about what he said",
];

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

  async function runSubmit(sentence: string) {
    setShowEmptyHint(false);
    setTimedOut(false);
    setState("loading");

    const sessionId = getSessionId();
    track("iho_submission_started", {
      sessionId,
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
        body: JSON.stringify({ sentence, sessionId }),
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
    await runSubmit(said);
  }

  function handleRetry() {
    if (isLoading) return;
    void runSubmit(said);
  }

  function handleReset() {
    track("iho_reset_clicked", { sessionId: getSessionId() });
    setAnalysis(null);
    setSaid("");
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
          <span className="text-[11px] font-medium normal-case tracking-[0.22em] text-muted-foreground">
            is he ok?
          </span>
          <Link
            to="/about"
            className="text-[13px] text-muted-foreground no-underline hover:underline"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            About
          </Link>
        </div>

        {/* Main column */}
        <section
          className={
            state === "empty"
              ? "flex flex-1 flex-col justify-center py-16"
              : "flex flex-1 flex-col py-12"
          }
        >
          {/* Input area — feels like writing on a dark page, not a form */}
          <div
            className={
              "transition-opacity duration-500 " +
              (inputDimmed ? "opacity-50" : "opacity-100") +
              (state === "output" ? " mb-8" : "")
            }
            aria-hidden={state === "loading"}
          >
            {state === "empty" && (
              <div className="mb-6 flex flex-wrap gap-2">
                {SUGGESTION_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setSaid(chip);
                      taRef.current?.focus();
                    }}
                    className="text-[13px] text-muted-foreground transition-colors hover:text-foreground hover:border-muted-foreground"
                    style={{
                      fontFamily: "var(--font-sans)",
                      border: "1px solid #3A3532",
                      borderRadius: "100px",
                      padding: "6px 14px",
                      background: "transparent",
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

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
              placeholder="Type or paste what he said, or pick one above to start..."
              rows={4}
              className={
                "quiet-input block w-full px-0 py-3 text-[17px] text-foreground min-h-[120px]"
              }
              style={{
                fontFamily: "var(--font-sans)",
                lineHeight: 1.8,
                // Cap visible height at ~6 lines (17px * 1.8 ≈ 30.6px) before scrolling.
                maxHeight: `calc(${17 * 1.8 * 6}px + 1.5rem)`,
                overflowY: "auto",
              }}
            />
            {said.length >= SAID_COUNTER_AT && (
              <p
                className="mt-2 text-right text-[11px] text-muted-foreground"
                aria-live="polite"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {said.length >= SAID_MAX
                  ? "That's enough to work with."
                  : `${SAID_MAX - said.length} characters left`}
              </p>
            )}

            {state !== "output" && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="quiet-action"
                >
                  What did this do?
                </button>
                {showEmptyHint && (
                  <p
                    className="mt-4 text-[13px] leading-[1.6] text-muted-foreground"
                    role="status"
                    aria-live="polite"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {EMPTY_HINT}
                  </p>
                )}
                {!showEmptyHint && showShortHint && (
                  <p
                    className="mt-4 text-[13px] leading-[1.6] text-muted-foreground"
                    aria-live="polite"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {SHORT_HINT}
                  </p>
                )}
                {timedOut && (
                  <p
                    className="mt-4 text-[13px] leading-[1.6] text-muted-foreground"
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
              </div>
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

          {/* Output — sits directly on the page, no card */}
          {state === "output" && analysis && (
            <article
              ref={outputRef}
              role="region"
              aria-label="Analysis"
              className="animate-rise-in mx-auto w-full max-w-[520px]"
            >
              {analysis.body
                .split(/\n{2,}/)
                .filter((p) => p.trim().length > 0)
                .map((para, i) => (
                  <p
                    key={i}
                    className="text-[17px] text-foreground"
                    style={{
                      fontFamily: "var(--font-sans)",
                      lineHeight: 1.9,
                      marginBottom: "28px",
                    }}
                  >
                    {para}
                  </p>
                ))}

              {/* Closing question — Playfair, 20px, terracotta, alone on its lines */}
              {analysis.closing && !analysis.safetyFlagged && (
                <p
                  className="font-display text-[20px] leading-[1.4] text-primary [overflow-wrap:break-word] [hyphens:auto]"
                  style={{ marginTop: "40px" }}
                  aria-live="polite"
                >
                  {analysis.closing}
                </p>
              )}

              {/* Standard close — hairline divider, secondary text */}
              {!analysis.safetyFlagged && analysis.standardClose && (
                <>
                  <div
                    className="h-px w-full"
                    style={{ backgroundColor: "#2A2522", marginTop: "40px" }}
                  />
                  <p
                    className="text-[13px] leading-[1.6] text-muted-foreground"
                    style={{ fontFamily: "var(--font-sans)", marginTop: "16px" }}
                  >
                    {analysis.standardClose}
                  </p>
                </>
              )}

              {/* Quiet exit — text links, 48px below standard close */}
              <div
                className="flex items-center gap-6"
                style={{ marginTop: "48px" }}
              >
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[13px] text-muted-foreground no-underline transition-colors hover:text-foreground hover:underline"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Run another one
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="text-[13px] text-muted-foreground no-underline transition-colors hover:text-foreground hover:underline"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {copied ? "Link copied" : "Share"}
                </button>
              </div>
            </article>
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
