# Fix: "i'm gonna rape you in your sleep" was not flagged as safety

## What actually happened

The triage model **did** correctly classify the sentence as `SAFETY` (the DB shows `triage_status = 'SAFETY'`). But the analyze endpoint computes its *own* safety verdict from a keyword pre-filter and **ignores the triage verdict the client passes in**. Its keyword list has gaps, so the response came back in the normal "read the sentence" tone instead of the safety branch with crisis resources, and the row was stored with `safety_flagged = false`.

There are two independent bugs here. We fix both.

## Bug 1 — keyword list misses obvious threats

In `src/routes/api/public/analyze-sentence.ts` (and the mirrored list in `src/routes/api/public/triage-sentence.ts`):

- `SEX_COERCION_PHRASES` matches `raped`, `rape me`, `raping` — but **not** `rape you`, `gonna rape`, or the bare verb `rape`. So "i'm gonna rape you in your sleep" slipped through.
- `SAFETY_KEYWORDS` has no future-tense violent threats (`gonna kill`, `kill you`, `i'll hurt you`, `beat you up`, etc.) — only descriptive past-tense ("hit me", "choked", "threatened").

Fix: broaden both lists. Per the existing comment ("Conservative on purpose — false positives route to RAINN, which is the right place"), it's acceptable to be more aggressive.

Add to the sex-violence bucket:
- Any standalone `rape` / `raping` / `rapes` / `rapist` (word-boundary regex `\brape(s|d|r|rs|ist)?\b` and `\braping\b`). This catches "rape you", "gonna rape", "he raped his ex", etc.

Add a new `THREAT_KEYWORDS` bucket (treated as physical-safety):
- `gonna kill`, `going to kill`, `kill you`, `i'll kill`, `ill kill`
- `gonna hurt you`, `going to hurt you`, `i'll hurt you`, `ill hurt you`
- `beat you`, `gonna beat`, `going to beat`, `i'll beat`
- `break your`, `smash your`, `strangle`, `choke you`
- `i'll find you`, `ill find you` (stalking-style threats)
- `make you pay`, `you'll regret`, `youll regret`

Keep the existing keyword arrays for descriptive past-tense incidents.

## Bug 2 — analyze ignores the triage verdict

The client already calls `/api/public/triage-sentence` first and the model there caught this sentence as `SAFETY`. The client passes `triageStatus: "SAFETY"` to `/api/public/analyze-sentence`, but the POST handler never reads it as a trigger — it only re-runs its own keyword filter.

Fix: in the analyze POST handler, treat `input.triageStatus === "SAFETY"` as a hard override that routes into the safety branch (alongside `physicalSafety || sexCoercion`). This makes the model's nuanced verdict authoritative when our keywords miss. Decide whether to route it as physical-safety or sex-coercion based on which keyword bucket (if any) matches; default to physical-safety crisis resources (`thehotline.org`, `womenslaw.org`) when neither matches but triage said SAFETY — these are the most general-purpose for violent threats.

## Bug 3 (one-time) — backfill the existing row

Update the offending row (`id = 003a3499-...`) to `safety_flagged = true`. This is a single UPDATE so it needs a migration. We leave the stored `analysis` text as-is (it's a historical record of what the user actually saw), but flip the flag so the row shows up correctly in `/admin` filters and any safety review.

## Files changed

- `src/routes/api/public/analyze-sentence.ts` — broaden keyword lists, add `THREAT_KEYWORDS`, switch matchers to regex where needed, honor `triageStatus === "SAFETY"` as a safety-branch trigger.
- `src/routes/api/public/triage-sentence.ts` — mirror the keyword/regex updates so the hard pre-filter also catches these before the model.
- Migration — backfill `iho_submissions.safety_flagged = true` for that one row.

## Out of scope

- Not changing the safety-branch copy or the crisis resource list.
- Not changing the model prompts (triage already got this right; the system prompt for analyze doesn't need changes since the safety addendum is solid — it just wasn't being triggered).
- Not adding a Slack alert tier for safety hits — separate decision worth its own conversation.

## How we verify

After implementing, run the analyze endpoint locally with the exact offending sentence plus a few close variants (`"i'll kill you"`, `"gonna beat you up"`, `"he raped his ex"`) and confirm each routes into the safety branch with crisis resources. Check the DB row for the test submission has `safety_flagged = true`.
