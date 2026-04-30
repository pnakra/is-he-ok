import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getSessionId } from "@/lib/session";

export const Route = createFileRoute("/")({
  component: Index,
});

type AppState = "empty" | "loading" | "output";

interface Analysis {
  body: string;       // paragraphs leading up to the closing question
  closing: string;    // the closing question, set apart visually
  standardClose: string; // hotline line shown below the divider
}

const SAFETY_LINE =
  "No account. Nothing saved about you. If you're in immediate danger, call 911 or 1-800-799-7233.";

const STANDARD_CLOSE_FALLBACK =
  "If anything you're experiencing ever feels physically unsafe, the National Domestic Violence Hotline is available 24/7 — 1-800-799-7233 or thehotline.org.";

const LOADING_PHRASES = [
  "Reading it...",
  "Looking at what it did...",
  "Almost...",
];

// Split the model's text into body / closing question / standard close.
// Heuristic: the standard close is the last paragraph that mentions the hotline
// number; the closing question is the last non-empty paragraph before that
// (preferring one that ends with "?").
function parseAnalysis(text: string): Analysis {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return { body: text.trim(), closing: "", standardClose: STANDARD_CLOSE_FALLBACK };
  }

  let standardClose = STANDARD_CLOSE_FALLBACK;
  let workingParas = paragraphs;
  const last = paragraphs[paragraphs.length - 1];
  if (/1-?800-?799-?7233|thehotline\.org/i.test(last)) {
    standardClose = last.replace(/^"|"$/g, "");
    workingParas = paragraphs.slice(0, -1);
  }

  let closing = "";
  if (workingParas.length > 0) {
    const candidate = workingParas[workingParas.length - 1];
    if (candidate.endsWith("?") || candidate.length < 200) {
      closing = candidate;
      workingParas = workingParas.slice(0, -1);
    }
  }

  return {
    body: workingParas.join("\n\n"),
    closing,
    standardClose,
  };
}

function Index() {
  const [state, setState] = useState<AppState>("empty");
  const [said, setSaid] = useState("");
  const [context, setContext] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [copied, setCopied] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

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

  const canSubmit = said.trim().length > 0 && state !== "loading";

  async function handleSubmit() {
    if (!canSubmit) return;
    setState("loading");

    let analysisText = "";
    try {
      const resp = await fetch("/api/public/analyze-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence: said,
          context: context.trim() ? context : undefined,
          sessionId: getSessionId(),
        }),
      });
      const data = (await resp.json()) as { analysis?: string };
      analysisText =
        data.analysis ??
        "Something didn't work on our end. Try again in a moment — what you brought here is worth a real read.";
    } catch {
      analysisText =
        "Something didn't work on our end. Try again in a moment — what you brought here is worth a real read.";
    }

    setAnalysis(parseAnalysis(analysisText));
    setState("output");
  }

  function handleReset() {
    setAnalysis(null);
    setState("empty");
  }

  async function handleShare() {
    try {
      const url = typeof window !== "undefined" ? window.location.origin + "/" : "";
      await navigator.clipboard.writeText(url);
      setCopied(true);
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
              onChange={(e) => setSaid(e.target.value)}
              disabled={state === "loading"}
              placeholder="Type or paste what he said..."
              className={
                "w-full resize-none border-0 bg-[var(--color-surface)] px-6 py-5 text-[17px] leading-[1.6] text-foreground outline-none focus:ring-0 " +
                (state === "output" ? "min-h-[96px]" : "min-h-[160px]")
              }
              style={{ fontFamily: "var(--font-sans)" }}
            />

            <div className="mt-3">
              <label htmlFor="context" className="sr-only">
                Optional context
              </label>
              <textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                disabled={state === "loading"}
                placeholder="Anything that helps — where you were, what had just happened. Optional."
                rows={2}
                className="w-full resize-none border-0 bg-[var(--color-surface)] px-6 py-4 text-[14px] leading-[1.6] text-muted-foreground outline-none focus:text-foreground focus:ring-0"
                style={{ fontFamily: "var(--font-sans)" }}
              />
            </div>

            {state !== "output" && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="mt-3 block w-full bg-primary px-6 py-4 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-[color-mix(in_oklab,var(--color-primary)_88%,white_12%)] disabled:cursor-not-allowed disabled:opacity-40"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                What did this do?
              </button>
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
            <article className="animate-rise-in border border-border bg-[var(--color-surface)] p-8 sm:p-10">
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

              {analysis.closing && (
                <p className="mt-8 font-display text-[22px] leading-[1.35] text-primary sm:text-[24px]">
                  {analysis.closing}
                </p>
              )}

              <div className="mt-8 h-px w-full bg-border" />

              <p className="mt-4 text-[11px] leading-[1.6] text-muted-foreground">
                {analysis.standardClose}
              </p>
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
