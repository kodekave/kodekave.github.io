# Founder redesign: notes for building

Written 2026-11-16 from the conversation with Komal. Read this at the start of every build step. Nothing here has been built yet. Work on branch `design/founder-redesign` (from `main` at ab34bae). Do not merge or deploy until she says so.

## What she wants

Redesign kodekave.github.io from scratch with a less-is-more approach and the elegant vibe of a founder, using the reference sites below. Iterate as we go.

**Do not carry over the 80s-machine details.** She said: "Let's start by not transferring the ATS [80s] details right now. Let's start the design from scratch and iterate it as we go." That means no dot-matrix numerals, no opcode listing (`0x2025 CALL us_entry`), no status-strip-as-instrument, no scanlines, no Halt and Catch Fire, no POST/boot, no ink-green screen. The dark "quiet machine" design (PR 18, live at ab34bae) is being replaced. She may bring one nerdy detail back later; ask first.

## Reference sites (all opened and screenshotted)

| Site | Palette and type, measured | What it teaches |
|---|---|---|
| hackingdemand.com (blog post) | paper `#f6f5ef`, ink `#20201e`, muted `#686861`, line `#d9d9cf`, blue `#1f4fd1`, lavender `#dbe5ff`, lime `#d6f676`. Space Grotesk 500 headlines (70px, -0.05em), DM Sans body 17px/1.7, IBM Plex Mono 11px uppercase labels in blue | Warm off-white, one cool accent, mono eyebrow labels with a dot, a tinted callout card on a faint blueprint grid |
| southparkcommons.com/companies | page `#fff`, ink `#293532`, panel `#f1f2eb`, yellow `#f7ef96` on the one button, ink tints at 15/50/60%. Hb Hue Beta light serif 300 (70px) headlines, Atlas Grotesk 300 body 18px, 14px small caps labels. Both fonts are proprietary: use substitutes | Floating rounded nav panel plus a separate yellow button, a statement hero with one outlined arrow button, a thin ink rule, bordered cards, a ruled searchable directory |
| prateekboga.com | bg `#111714`, cream `#eeeede`, sage `#cad9a9`, muted `#a8b1a7`, card `#19211c`. Manrope 500 headlines (58px, -0.055em), DM Sans body | Four-word identity line, editorial split layout (numbered mono label left, text right), four doors as soft cards with tags and an arrow, figures with "View source", centred close with profile links |
| jamesclear.com | warm cream, centred hero, one email field and yellow button | Single centred capture |
| sethgodin.com | warm peach page, black "S" mark, terracotta pill, serif section heads with a short terracotta rule | Calm nav with one pill |
| ellyhsieh.com | white, navy, large sans headline, rounded photo with a rotating circular sticker, numbered "01 Work" sections | Portrait with badge, numbered labels |
| claudio guglieri (guglieri.com) | full-bleed project colour, "Local time, 02:58 San Francisco" line | Live local time beside the name |
| patrickcollison.com, sive.rs, harukimurakami.com, marieforleo.com | extreme restraint, dated one-liners, line-art on black, italic accent word | See "Not chosen" |

## Draft design tokens (from the menu page; adjust as we iterate)

- Colour: paper `#f6f5ef`, panel `#eceadf`, ink `#1f2b27` (a green-tinted ink, close to her old forest), muted `#66695f`, line `#d9d9cf`, one accent yellow `#f7ef96` (buttons and small marks only). Text on paper must pass WCAG AA; check muted and any yellow-on-paper text (yellow is a fill, not a text colour).
- Type: light serif for display (Newsreader 300, optical size on, letter-spacing about -0.02em), DM Sans 300/400 for body and UI, IBM Plex Mono 11px uppercase with 0.12em tracking for labels only. Newsreader and Plex are already loaded by the site; DM Sans is new and Archivo goes away.
- Shape: radius 4 to 6px, hairlines instead of boxes, soft panel tint for cards and the nav, no shadows.
- One idea per section, one moving thing at most, nothing loops, all motion off under `prefers-reduced-motion`.

## Her picks, with how to build each

**A. Floating panel nav + one yellow button.** A rounded bar (panel colour, about 52px high, 6px radius) floating 20px below the top, wordmark left (serif), links centre, yellow "Get in touch" right. Links today: Ventures, Research, About, Writing, plus a LinkedIn icon in the old nav (decide whether to keep it). Mobile: a menu button.

**B. Name, live local time, one line.** Under or beside the name: "Local time, 14:22, India" updated live in India time (IST, Asia/Kolkata), and one line of her words. Replaces the old ONLINE / UTC / BASE strip. The one line needs her copy; use the existing tagline until she says otherwise.

**D. Light serif statement with one outlined arrow button** as the hero. Current copy: "Helping founders build from idea to execution." (her line from the first redesign), button "Start a conversation" with an arrow. Her new page title is "Helping Visionaries Build Ideas For The World": ask which sentence leads the hero. Do not change copy without approval.

**E. Rounded portrait with a round sticker badge, but black sketch on white.** The engraved plate (`public/images/plate-2x.png`, white lines on black) must print as black lines on a pure white rounded rectangle: invert, multiply on `#fff`. A small circular sticker overlaps the corner. Badge text DECIDED: "Bridging founders and operations" (her words: "or something like that", so keep it that unless she changes it). About 32 characters, set once around the ring with a small centre mark. The hoodie equation must stay visible (it was an earlier request).

**G. Single centred capture** for the newsletter: one serif headline ("Get the next issue." exists today), one field, one yellow Subscribe button. It replaces the heavy footer block. Keep the existing `NewsletterForm` behaviour (Substack, one-click confirm) and its reassurance line.

**H. Small mono label with one accent dot.** Section eyebrows and metadata, for example "Latest writing / 2026-11-09". The dot is the yellow or a deep olive, small (6px).

**J + K combined: the journey.** One list that merges the dated one-liners and the ruled directory: a row per stop with year (mono), title (serif), one line of role or note (sans), and place (small caps, right). Hairlines between rows, hover tint, the 2025 row shown highlighted as the example. Seven stops, not eight: 2019, 2020, 2021, 2022, 2023, 2025, 2026. Data is `milestones` + `ventures` in `src/lib/content.ts`. Keep the links ("Read the paper", "Open the record"). Keep keyboard access and an ordered list.

**L. Cards with a drawn mark.** Ventures as soft bordered cards with her own line drawings from `src/components/StopArt.tsx` (stars for Genex Space & SpaceCat, ledger for Uduvilla, arm for Neuralzome, braille for Travel Hands UK). She asked "if possible": yes, all SVG, no new assets. Best on the Ventures page and as the homepage hub cards (see T).

**N. Tinted callout card on a faint grid.** One soft panel with a faint 14px grid, eyebrow, serif headline, one sentence, one yellow button. Use for the contact moment or "work with me". The sample words in the menu were placeholders; use "Building something? Let's talk." and "Start a conversation" which already exist.

**O. One line drawing as atmosphere.** A single quiet line illustration (orbit, constellation or the hoodie equation), probably in the footer or beside the close. She asked "if possible": the orbit and constellation exist as SVG; vectorising the hoodie equation is extra work. Decide with her when we reach it.

**R. Identity line: DECIDED, three words.** "Startups-Operator. Maker. Explorer." (her words and her hyphen). She wants it founder-oriented, pointing at the founder's journey or the shared part of it, because her current work is mostly for hire but she is heading to founding. Shape: name, then the three roles in a muted accent, then one sentence (the sentence is the hero question below).

**S. Editorial split layout.** For every section: a small numbered mono label in the left margin (for example "01 / Context") and the statement and text to its right. Generous empty space.

**T. Four doors as soft cards.** The homepage hub: four cards, each with a number, a title, one line, a row of three small-caps tags and an arrow. Pages: Ventures, Research, Writing, Contact (matching the sample in the menu). The one-liners and tags are placeholders: take them from existing copy or ask.

**U. Big figures with a source link.** The six readings as serif numerals with a tiny label and "View source ↗" under each, linking to the venture record (`/work#<slug>`). Values must not change: 250% (Uduvilla), 4+ (Neuralzome), 100% (Neuralzome), 17 (Uduvilla), 5,000+ (Genex Space & SpaceCat), 10+ (Uduvilla). Labels from `stats` in `content.ts` (`tag`, `label`, `source`). The dot-matrix numerals are gone.

**V. Centred close with one button and a row of profiles.** One statement ("Building something? Let's talk."), one yellow button, then a quiet row of profile links. Her profiles: LinkedIn `https://www.linkedin.com/in/komalkedarnath`, GitHub `https://github.com/kodekave`, ORCID `https://orcid.org/0000-0003-4980-5945`, and the Zenodo paper `https://zenodo.org/records/24120078` (concept DOI 10.5281/zenodo.6044897). Keep `rel="me"` on profile links.

## Not chosen (do not build)

C plain index, F italic accent word, I numbered section labels over a rule (S covers numbering), M venture tints, P authorship line, Q announcement strip, W periodic-table monogram, X motto footer. Also dropped by decision: the boot sequence, sticky "Start a conversation" button, section rail, dot-matrix numerals, opcodes, the world map.

## Constraints carried over from earlier work

- **Never rewrite her copy.** List every text change and removal for approval before merging. Her new page title is "Helping Visionaries Build Ideas For The World" (live since PR 19). The meta description, `schemaDescription`, About page title ("Cross-Border Startup Operator") and the hero tagline still use the older wording: ask before touching.
- **Positioning:** she is a founder. Add nothing that reads as for-hire or job-seeking. Open question from before: the Register's four "What I bring" rows linking to /services; she has not decided whether the services list stays.
- **Do not touch** `/admin`, the content pipeline (`scripts/validate-content.mjs`), or `content/posts` beyond inheriting styles. The admin console uses the `.stamp` and `adm-*` styles, so check it still renders after the CSS changes.
- **Quality floors** (from the last measured build): Lighthouse mobile 78 and desktop 98, accessibility, best practices and SEO 100; console clean; no horizontal scroll; `npm run build`, `tsc` and ESLint clean. WCAG AA contrast. Fully keyboard operable; visible focus; reduced motion respected.
- **Process:** one section at a time, screenshot at 1440, 1024 and 390 after each, show her, then continue. Open a PR for review; merge only when she says "merge". GateGuard asks for facts before each new file: state them and retry.
- **Brand assets to redo at the end:** `scripts/brand-assets/card.html.tmpl` and `favicon.html.tmpl` (run `npm run build` first, then `python3 scripts/brand-assets/build.py`), and the inner pages (about, work, research, blog, services, bookshelf, guides) must inherit the new type, colour and nav.
- **Existing code worth reusing:** `StopArt.tsx` (drawings), `content.ts` data, `Plate.tsx` (portrait), `NewsletterForm.tsx`, `Footer.tsx` links, `src/lib/seo.ts`. The old components `Journey`, `DotMatrix`, `UtcClock`, `Reveal`, `Masthead` and `Nav` will be reworked or removed.

## Where things are

- The visual menu with all lettered tiles: https://claude.ai/artifact/DgsxHMABGRJdQaqazjsET5 (private to Komal).
- The first mock (hero, readings, journey, register, signal in the draft palette) was never rendered; rebuild it from this file.
- Last live design: PR 18 at ab34bae (dark, quiet machine). The title change is PR 19.

## Open questions for her

1. Which sentence leads the hero: "Helping founders build from idea to execution." or her title "Helping Visionaries Build Ideas For The World"?
2. The words for the portrait sticker badge (E) and her four identity words (R).
3. Keep or drop the LinkedIn icon in the nav; keep or drop the Register services list.
4. Footer drawing (O): orbit, constellation or the hoodie equation?
5. Light only, or also a dark mode later?

## Facts gathered 2026-11-16 (from her logged-in LinkedIn, read in the built-in browser)

- Headline now: "Founder's Office Operator | AI consulting & integration, investor readiness, data rooms, finance ops & GTM | 4 Ventures, 4 Countries | CERN Webfest winner". Location Bengaluru. Current employer shown: Travel Hands. Profile banner says "Open to work, Recruiters only" (a for-hire signal; her call).
- Her recent post: she built an events-ranking tool as a side project and is "opening it up soon for 0→1 companies". A repost says Neuralzome Cybernetics is now Osmos Robotics. Check both with her before they appear on the site.
- R (identity words): not yet chosen. Draft options to show her, from her own phrases: "Operator. GTM. Finance. Fundraising." or "Operator. Builder. Researcher. Explorer." She decides.
- E (badge): she suggested her own line "Helping visionaries build ideas for the world" for the badge text. If the hero also carries that line, the badge should say something else (for example "4 ventures · 4 countries · 6+ years").
- Register "What I bring" rows: Founder's office (Ongoing), Go-to-market execution (Project), Cross-border market entry (Project), Fundraise support (Project); full text in `engagements` in `src/lib/content.ts` and on /services. Still undecided whether they stay.

## Decisions from her, 2026-11-16 (supersede anything above that conflicts)

- Identity line: "Startups-Operator. Maker. Explorer." Three words, founder-oriented, pointing at the founder's journey.
- Badge text: "Bridging founders and operations".
- Register "What I bring": keep the four rows, each with its "Project" or "Ongoing" label, and make them plain text with NO links to /services. Open: whether the "How it works" link and the footer "Work with me" link to /services stay (ask before removing).
- Still open: which sentence leads the hero ("Helping founders build from idea to execution." or "Helping visionaries build ideas for the world"), nav LinkedIn icon, the footer drawing (O), and whether to mention the new events-ranking tool or the Osmos Robotics rename.

## Background patterns: ACCEPTED 2026-11-16

She accepted the pattern gallery. **Core picks: A (Schotter), E (Halftone sweep), H (Rule 90), I (Voronoi), J (Plus grid).** The other eight (B contours, C potential flow, D moiré, F Truchet arcs, G guilloche rosette, K orbit field, L punched tape, M ripples) are to be used across pages "as they seem fit". Visual references, with working code, are saved here so they survive the session:

- `docs/redesign/reference/patterns-gallery.html`: the whole gallery. Open it in a browser. All 13 pattern functions (`P.A` to `P.M`) are in its script, drawn on a canvas with a seeded random function (`rng`), value noise (`noiseFn`, `fbm`) and a marching-squares helper (`iso`). Ink is `rgba(31,43,39, alpha)` on paper `#f6f5ef`.
- `docs/redesign/reference/elements-menu.src.html`: the lettered elements menu (A to X). The `{{PLATE}}` placeholder stands for the portrait image.
- `docs/redesign/reference/first-mock-unrendered.html`: the first homepage mock in the draft palette.

**The feeling she wants:** vintage tech and neo-modernist, futuristic and very minimal, at once. Subtle: noticed on a second look, never flashing or standing out. Complex, interesting, generated differently on different pages.

**How to build them (my plan, to confirm when we get there):**
1. Port the pattern functions to a build script (`scripts/generate-patterns.mjs`) that writes static SVGs into `public/patterns/`, one per page, from a seed. Pure SVG, no JavaScript, nothing animated, so it costs almost nothing and needs no reduced-motion handling. Voronoi in the gallery is a pixel trick; in SVG use proper cell edges.
2. Apply as a CSS background on the page wrapper, positioned to a corner and faded with a mask (`radial-gradient`, strongest around 88% across and 12% down, gone by 85%), so text areas stay clean. Default strength 70% of the gallery's drawing alpha, opacity about 0.85 of that. Keep every text colour at WCAG AA against the paper even where the pattern is strongest; check it.
3. Layer: **J (plus grid) at about 3% everywhere** as the base, plus **one accent pattern per page**.
4. Each page gets its own seed, so the same pattern looks different on different pages.

**Proposed page mapping (mine, adjust freely):** Home A (Schotter) over J; Ventures I (Voronoi); About H (Rule 90); Writing E (Halftone sweep); Research C (potential flow, her CFD physics) or B (contours); Contact M (ripples); venture cards faint A; the round portrait badge could carry G (guilloche rosette); footer J. K (orbit field) and L (punched tape) are spare for the space-tech venture page and the Writing/blog index.

## Background patterns, round two (advanced) 2026-11-16

She asked whether the patterns could be more complex; I made eleven advanced samples. Working code is in `docs/redesign/reference/patterns-gallery-round2.html` (functions `P[1]` to `P[11]`; it reuses `plus`, `rule90`, `voronoi` and `iso` from round one). Numbers, not letters, to avoid clashing with the A to M of round one: 1 Chladni figure, 2 Clifford attractor, 3 Reaction-diffusion (Gray-Scott coral), 4 Ridge lines, 5 Hilbert curve, 6 Penrose tiling, 7 Circle packing, 8 Julia set contours, 9 Harmonograph, 10 Layered (Rule 90 + Voronoi + plus grid), 11 The journey as geometry (rings for 2019 to 2026, a point per stop, spiral order, dotted lines within a country).

Her choice from round two is NOT yet made. Guidance if she picks: one complex pattern per page as the hero, always faded from the text; pre-render heavy ones (3, 2, 6) to a compressed image at build time (about 40 to 120 KB); keep text contrast at AA; no motion. Number 11 is the only one drawn from her own data and is the most distinctive.

## Round two picks: 1, 2, 4, 6, 8 and especially 9 (2026-11-16)

She liked these from the advanced gallery (`docs/redesign/reference/patterns-gallery-round2.html`, functions `P[n]`):

- **9 Harmonograph: her favourite, "especially".** A long decaying pendulum line: x = A(sin(2.01 t) e^(-0.0042 t) + 0.62 sin(3.0 t + 1) e^(-0.003 t)), y = A(sin(3.0 t + 0.5) e^(-0.003 t) + 0.62 sin(2.0 t) e^(-0.0042 t)), t from 0 to 110 in steps of 0.005, line width 0.5, alpha about 0.26, centred near 70% across. It is the strongest candidate for the home page hero pattern. Several variants (different frequency ratios and phases) can give each page its own harmonograph from a seed.
- **1 Chladni figure:** nodal lines of mixed plate modes, marching squares at several levels with the zero line strongest.
- **2 Clifford attractor:** 420,000 iterations of x' = sin(a y) + c cos(a x), y' = sin(b x) + d cos(b y) with a=-1.4, b=1.6, c=1.0, d=0.7, accumulated into a density map and drawn with soft alpha (the final softer setting, density factor 0.14, alpha cap 165).
- **4 Ridge lines:** 34 stacked, occluding terrain slices with bumps concentrated in the middle band.
- **6 Penrose tiling:** five-fold aperiodic tiling from Robinson-triangle subdivision, six generations, fading out towards the text.
- **8 Julia set:** contour lines of the smooth escape count for c = -0.4 + 0.6i, levels 3 to 30, soft alpha.

So her pattern shortlist is now: round one **A, E, H, I, J**; round two **1, 2, 4, 6, 8, 9**. Remaining open: which pattern goes on which page, and whether number 11 (her journey as geometry) is wanted. Heavy ones (2, 6) should be pre-rendered at build time; keep one hero pattern per page, faded from the text, no motion, text contrast at AA.

## Build log, round 1: foundation and home (2026-11-17)

Branch `design/founder-redesign`. First build pass, to iterate from.

**Built**
- Tokens (`globals.css`): paper `#f6f5ef`, mist `#eceadf` (panel), ink `#1f2b27`, yellow `#f7ef96` (fills only), deep olive `#55633a` (label dot, small accent text). Old token names are kept (`ink`, `paper`, `mist`, `chalk`, `brass`, `brass-deep`, `hair`) with new values, so inner pages and `/admin` inherit without edits. A plus grid at about 3% is the body background; `.on-paper` is transparent so it shows.
- Fonts (`layout.tsx`): Newsreader (upright, opsz, preloaded) for display; Newsreader italic as a separate on-demand face (blog prose, one research line); DM Sans for body and controls; Plex Mono 400 for labels only. Archivo is gone.
- Components: floating panel `Nav` plus the yellow "Get in touch" button (A); `Footer` is the centred newsletter capture (G) then name, pages and profiles; `Masthead` is light, with optional `plate` (portrait card) and `pattern`; `PortraitCard` is the black sketch on a white rounded card with the round sticker (E); `LocalTime` (B, IST, to the minute); `JourneyList` (J+K); `SectionLabel` is now "01 / Figures" (S); `Pattern` + `src/lib/patterns.ts` (canvas patterns). Deleted: `DotMatrix`, `UtcClock`, old `Journey`.
- Home (`(site)/page.tsx`): opening (H label with live time, name, "Startups-Operator. Maker. Explorer.", the existing tagline, outlined arrow button, portrait with badge) over a harmonograph; four doors (T, with L drawings from `StopArt`); 01 Figures (U, "View source ↗" to `/work#slug`); 02 Journey (7 stops); 03 Register (What I bring as plain text with Project/Ongoing, plus Latest writing); 04 Contact (N callout, one yellow button, profile row V).

**Deviation from the plan: patterns are canvas, not SVG.** The static SVG I first generated (71 KB) was counted by Chrome as the page's largest paint and pushed mobile Lighthouse to 76. A canvas is never a largest-paint candidate and downloads nothing, so `src/lib/patterns.ts` draws each pattern once after paint (seeded, no motion). `scripts/generate-patterns.mjs` was removed. Heavy patterns (Clifford, Penrose) can be drawn the same way, or pre-rendered at low resolution if drawing time matters.

**Measured on the production build (local, no gzip):** Lighthouse mobile 78, desktop 97; accessibility, best practices and SEO 100; CLS 0; no console errors; no horizontal scroll at 390 or 1440. Floors were mobile 78 and desktop 98, so desktop is one point under. `/admin` sign-in renders correctly in the new palette.

**Copy changes on the home page, for her approval (nothing else was reworded)**
- Removed: the status strip ("Online", "UTC hh:mm:ss", "Base · India"); the heading "The journey, one instruction at a time." (80s wording; kept as a hidden "The journey" heading); the Signal buttons "Connect on LinkedIn" and "Email me" (LinkedIn is now in the profile row and the nav).
- Section names: Telemetry, Register, Trace, Signal became Figures, Register (kept), Journey, Contact. The door and figure words are existing copy.
- Added: "Local time, hh:mm, India" (live); "Startups-Operator. Maker. Explorer."; the badge words; "View source ↗"; ORCID in the footer profiles.
- Doors reuse existing lines: "4 ventures, 4 countries.", "One published study, and the research programmes around it.", "Notes from the founder's office.", "Building something? Let's talk." Tags are from existing copy too ("4 ventures · 4 countries · 6+ years", "Paper · OpenFOAM · Zenodo", the newsletter's three topics, "Email · LinkedIn · India"); confirm them.

## Site audit: where the design can still change (2026-11-17)

- **Every inner page** now gets the light masthead, nav, footer and plus grid automatically. Next for them: a pattern each (`<Masthead pattern=...>`), once more patterns are ported to `patterns.ts` (page mapping in the patterns section above).
- **/work:** the ruled numbered list works. Add L (venture cards with `StopArt` marks) and the journey list's tint; Neuralzome is the venture the repost says is now Osmos Robotics (ask before changing).
- **/research:** the paper section is fine. `ResearchPhone` is a dark terminal object with a caret and `$` commands; it is an 80s-feeling detail she may want redrawn light or kept (ask).
- **/about:** now shows the portrait card; the page's old title "A founder's-office operator across four countries." and body are untouched.
- **/services:** its closing block is still a dark `on-ink` panel; convert to the callout. The Register on home no longer links here; the "How it works" link and the footer "Work with me" still do (decision pending).
- **/blog, /blog/[slug], /bookshelf, the three guides:** inherit the type and colour; blog prose keeps the serif.
- **Not yet done:** page-by-page patterns; footer line drawing (O); LinkedIn "Open to work" banner; hero sentence choice; brand assets (`card.html.tmpl`, `favicon.html.tmpl`, then `npm run build` and `python3 scripts/brand-assets/build.py`); meta description, About title and `schemaDescription` wording (ask first); dark mode.
