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

**E. Rounded portrait with a round sticker badge, but black sketch on white.** The engraved plate (`public/images/plate-2x.png`, white lines on black) must print as black lines on a pure white rounded rectangle: invert, multiply on `#fff`. A small circular sticker overlaps the corner. The badge text is NOT decided (the menu showed a sample "FOUNDER · INDIA"); ask her. The hoodie equation must stay visible (it was an earlier request).

**G. Single centred capture** for the newsletter: one serif headline ("Get the next issue." exists today), one field, one yellow Subscribe button. It replaces the heavy footer block. Keep the existing `NewsletterForm` behaviour (Substack, one-click confirm) and its reassurance line.

**H. Small mono label with one accent dot.** Section eyebrows and metadata, for example "Latest writing / 2026-11-09". The dot is the yellow or a deep olive, small (6px).

**J + K combined: the journey.** One list that merges the dated one-liners and the ruled directory: a row per stop with year (mono), title (serif), one line of role or note (sans), and place (small caps, right). Hairlines between rows, hover tint, the 2025 row shown highlighted as the example. Seven stops, not eight: 2019, 2020, 2021, 2022, 2023, 2025, 2026. Data is `milestones` + `ventures` in `src/lib/content.ts`. Keep the links ("Read the paper", "Open the record"). Keep keyboard access and an ordered list.

**L. Cards with a drawn mark.** Ventures as soft bordered cards with her own line drawings from `src/components/StopArt.tsx` (stars for Genex Space & SpaceCat, ledger for Uduvilla, arm for Neuralzome, braille for Travel Hands UK). She asked "if possible": yes, all SVG, no new assets. Best on the Ventures page and as the homepage hub cards (see T).

**N. Tinted callout card on a faint grid.** One soft panel with a faint 14px grid, eyebrow, serif headline, one sentence, one yellow button. Use for the contact moment or "work with me". The sample words in the menu were placeholders; use "Building something? Let's talk." and "Start a conversation" which already exist.

**O. One line drawing as atmosphere.** A single quiet line illustration (orbit, constellation or the hoodie equation), probably in the footer or beside the close. She asked "if possible": the orbit and constellation exist as SVG; vectorising the hoodie equation is extra work. Decide with her when we reach it.

**R. Four-word identity line.** "Probably from LinkedIn first, I'll fine tune later." LinkedIn blocks automated fetching (HTTP 999), so ask her to paste her headline, or use a logged-in browser. Do not invent the words. Shape: name, then four one-word roles in a muted accent, then one sentence.

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
