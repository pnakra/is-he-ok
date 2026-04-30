import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getSessionId } from "@/lib/session";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/")({
  component: Index,
});

type AppState = "empty" | "loading" | "output";

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

const LOADING_PHRASES = [
  "Reading it...",
  "Looking at what it did...",
  "Almost...",
];

const FALLBACK_RESOURCES: Resource[] = [
  { label: "National Domestic Violence Hotline", url: "https://www.thehotline.org" },
];

function makeFailureAnalysis(): Analysis {
  return {
    wearing: FAILURE_TEXT,
    did: "",
    tactic: null,
    closing: "Want to try sending it again?",
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
      // After the transition, allow natural growth (e.g. window resize).
      const id = window.setTimeout(() => setMaxHeight("none"), 220);
      return () => window.clearTimeout(id);
    } else {
      // From "none" → fixed px → 0 to animate properly.
      const h = el.scrollHeight;
      setMaxHeight(h + "px");
      requestAnimationFrame(() => setMaxHeight("0px"));
    }
  }, [open]);

  return (
    <div
      style={{
        border: "1px solid #2A2522",
        borderRadius: "4px",
        background: "#1A1714",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        style={{ background: "transparent", border: 0, cursor: "pointer" }}
      >
        <span
          className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {label}
        </span>
        <span
          className="text-[18px] leading-none text-primary"
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
            lineHeight: 1.8,
            padding: "16px",
            paddingTop: "0px",
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
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [submittedSentence, setSubmittedSentence] = useState("");
  
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
    setSubmittedSentence(sentence.trim());
    setState("loading");

    const sessionId = getSessionId();
    track("iho_submission_started", {
      sessionId,
      sentenceLength: sentence.trim().length,
    });

    let result: Analysis = makeFailureAnalysis();
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
      result = makeFailureAnalysis();
    } finally {
      clearTimeout(timeoutId);
    }

    setAnalysis(result);
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
    setSubmittedSentence("");
    setShowEmptyHint(false);
    setShowShortHint(false);
    setTimedOut(false);
    setState("empty");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
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
          {state !== "output" && (
          <div
            className={
              "transition-opacity duration-500 " +
              (inputDimmed ? "opacity-50" : "opacity-100")
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

            {state === "empty" && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="inline-flex min-h-[48px] items-center justify-center bg-primary px-8 py-3 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-[color-mix(in_oklab,var(--color-primary)_88%,white_12%)] disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  is he ok?
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
          )}

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
              {submittedSentence && (
                <blockquote
                  className="font-display italic text-primary"
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.6,
                    borderLeft: "2px solid #C4784A",
                    paddingLeft: "16px",
                    marginBottom: "32px",
                  }}
                >
                  {submittedSentence}
                </blockquote>
              )}
              {/* Cards */}
              <div className="flex flex-col gap-3">
                <Card label="WHAT IT WAS WEARING" defaultOpen>
                  {analysis.wearing}
                </Card>
                {analysis.did && (
                  <Card label="WHAT IT DID">{analysis.did}</Card>
                )}
                {analysis.tactic && (
                  <Card label="WHAT THIS IS">{analysis.tactic}</Card>
                )}
              </div>

              {/* Closing question */}
              {analysis.closing && (
                <p
                  className="font-display text-[20px] leading-[1.4] text-primary [overflow-wrap:break-word] [hyphens:auto]"
                  style={{ marginTop: "32px" }}
                  aria-live="polite"
                >
                  {analysis.closing}
                </p>
              )}

              {/* Resources */}
              {analysis.resources.length > 0 && (
                <section style={{ marginTop: "40px" }}>
                  <h2
                    className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    If You Want to Go Deeper
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {analysis.resources.map((r) => (
                      <a
                        key={r.url}
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-[13px] text-primary no-underline transition-opacity hover:opacity-80"
                        style={{
                          fontFamily: "var(--font-sans)",
                          border: "1px solid #C4784A",
                          borderRadius: "100px",
                          padding: "6px 14px",
                          background: "transparent",
                        }}
                      >
                        <span>{r.label}</span>
                        <span aria-hidden="true">→</span>
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* Safety line + divider */}
              <div style={{ marginTop: "48px" }}>
                <div className="h-px w-full" style={{ backgroundColor: "#2A2522" }} />
                <div className="pt-6 text-center">
                  <p className="text-[11px] leading-[1.6] text-muted-foreground">
                    No account. Nothing saved about you.
                  </p>
                  <p className="text-[11px] leading-[1.6] text-muted-foreground">
                    If you're in immediate danger, call 911 or 1-800-799-7233.
                  </p>
                </div>
              </div>

              {/* Quiet exit — centered text link, 32px below safety line */}
              <div
                className="flex items-center justify-center"
                style={{ marginTop: "32px" }}
              >
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[13px] text-muted-foreground no-underline transition-colors hover:text-foreground hover:underline"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Run another one
                </button>
              </div>
            </article>
          )}
        </section>

        {/* Footer safety line — only on empty/loading states */}
        {state !== "output" && (
          <footer style={{ marginTop: "48px" }}>
            <div
              className="h-px w-full"
              style={{ backgroundColor: "#2A2522" }}
            />
            <div className="pt-6 text-center">
              <p className="text-[11px] leading-[1.6] text-muted-foreground">
                No account. Nothing saved about you.
              </p>
              <p className="text-[11px] leading-[1.6] text-muted-foreground">
                If you're in immediate danger, call 911 or 1-800-799-7233.
              </p>
            </div>
          </footer>
        )}
      </div>
    </main>
  );
}
