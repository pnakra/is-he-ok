# Storyboard — "Is He Ok?" product/demo walkthrough

A single Remotion video (1920×1080, 30fps, ~90s) that walks through the product with on-screen captions and callout boxes explaining what's happening and *why*. Three back-to-back user scenarios (no-context, with-context, safety-flagged) so viewers see the range of behavior.

Style matches the existing Remotion project (warm cream palette, serif accents, browser chrome, animated cursor) so it slots alongside the other scenes. Captions are lower-third cards; callouts are floating boxes with a thin connector line to the UI element they describe.

---

## Act 1 — What this is (≈10s)

**Scene A · Title + one-liner (5s)**
- Serif "Is He Ok?" mark, subtitle: *"A sentence-level anti-coercion tool for girls."*
- Kicker: *"90-second product walkthrough."*

**Scene B · The premise (5s)**
- Split card: left = "One sentence he said" (quote bubble). Right = "What it actually did to you" (analysis card preview).
- Caption: *"Girls 16–24 often can't name manipulation in the moment. This tool reads one sentence and names the pattern."*

---

## Act 2 — Scenario 1: no context (≈20s)

**Scene C · Landing + suggestion chip**
- Cursor lands on homepage, hovers a suggestion chip ("You're too sensitive"), clicks it.
- **Callout on textarea:** *"Suggestion chips = zero-friction start. Chips disappear once text is in the box."*
- **Callout on 'Add context':** *"Optional. Most first-time users skip it."*
- Cursor clicks "Read the sentence."

**Scene D · Result (no context)**
- Three analysis cards render: *How it came across / What it did to you / What may be going on.*
- **Callout:** *"Three angles, never a verdict. Voice rules: hedged, specific, user is the expert."*
- **Callout on resources:** *"2–3 links, picked by regex-matched situation (gaslighting bank here). All verified, no dead links."*
- Feedback thumbs briefly highlighted. **Callout:** *"Per-card 👍/👎. 👎 opens a popover for reasons — logged to Slack."*

---

## Act 3 — Scenario 2: with context (≈20s)

**Scene E · Typing a real sentence + context**
- Cursor clears input, types: *"he said i owe him for dinner"* and opens "Add context": *"we've only been on 2 dates."*
- **Callout:** *"Context sharpens the read — the model uses it to name the specific tactic."*

**Scene F · Result (financial/coercive framing)**
- Cards render; third resource link is financial-abuse specific.
- **Callout on 3rd resource:** *"Situation detector matched 'owe / money' → surfaced a targeted resource on top of the two tactic links."*
- **Callout on tone:** *"No questions in the output — statements only, so the user never feels like the tool expects a reply."*

---

## Act 4 — Scenario 3: safety flag (≈20s)

**Scene G · Safety input**
- Cursor types a threat-style sentence (softened stand-in, e.g. *"he said he'd hurt me if i left"*).
- **Callout:** *"Two-stage pipeline: Triage classifies first. SAFETY status hard-overrides the analysis branch."*

**Scene H · Safety result**
- Result view shows the analysis (naming minimization/threat), but resources are locked to crisis lines (loveisrespect, 988, RAINN as relevant).
- **Callout:** *"Regex + keyword pre-filter + model triage. Even if one misses, the other catches. Backfilled real prod misses (e.g. future-tense threats)."*
- **Callout on footer:** *"'If you're in immediate danger…' line always visible in safety mode."*

---

## Act 5 — Why the resources (≈10s)

**Scene I · Resource philosophy card**
- Static-ish card with 3 bullets, each with a small callout:
  - *"30 verified deep links, not homepages."*
  - *"Mapped to tactic labels (DARVO, minimization, weaponized concern, financial, sexual coercion)."*
  - *"Situation detector adds a 3rd contextual link when keywords match."*

---

## Act 6 — Close (≈5s)

**Scene J · Outro**
- Serif "is he ok?" wordmark. Line: *"Private. Anonymous. No account."*
- Small footer: *"Override Labs · Young Futures — Girl on Fire."*

---

## Captions & callouts — visual system

- **Lower-third caption bar:** warm cream card, serif italic label + sans body, fades in/out with each beat. Used for narrator-style commentary.
- **Callout box:** rounded rectangle (border `COLORS.border`, bg `COLORS.surface`), 18–20px sans copy, small serif label ("WHY", "HOW", "SAFETY"), thin connector line pointing to the UI element it explains.
- **Highlight ring:** soft `COLORS.accentSoft` glow around the element being called out.
- Cursor + click ripples reused from existing `Shared.tsx`.

## Technical plan

- New Remotion composition `walkthrough` (kept separate from existing `main` so nothing else changes).
- Files: `remotion/src/Walkthrough.tsx` (composition wrapper) + `remotion/src/scenes/walkthrough/Scene{A–J}.tsx` + `remotion/src/components/Callout.tsx` + `remotion/src/components/CaptionBar.tsx`.
- Registered in `Root.tsx` as a second `<Composition id="walkthrough" …>` — the existing `main` video stays untouched.
- Rendered via existing `scripts/render-remotion.mjs` (parameterized to accept comp id) to `/mnt/documents/is-he-ok-walkthrough.mp4`.
- All animation frame-based (`useCurrentFrame` + `interpolate`/`spring`), following the project's existing patterns.

---

## Open questions before I build

1. Total length target — **~90s** as above, or do you want a shorter (~60s) cut for social vs a longer (~2min) for demo day?
2. Voiceover or text-only? Current plan is silent + captions (matches existing videos). ElevenLabs VO is possible if you want it.
3. Safety scenario wording — I'll use a softened stand-in like *"he said he'd hurt me if i left."* OK, or want me to use a real anonymized submission from the DB?
4. Any callouts you want *added* (e.g. session_id/visitor tracking, admin dashboard) or *removed*?
