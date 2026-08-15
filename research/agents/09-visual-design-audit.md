# TokenGauge visual and product-design audit

Audited 15 August 2026. This is a read-only review of the current working tree plus the deployed application at `https://tokengauge.enby.fish/`.

## Executive verdict

TokenGauge is not visually broken on desktop. The restrained palette, primary-source links, dated price snapshot, explicit caveats, and real calculator give it more substance than a generic landing-page template. The problem is that this substance is wrapped in familiar “AI startup” styling: an oversized dark hero, acid-lime CTA, tiny uppercase monospace labels, a stats/card panel, repeated equal-height cards, and very tight display typography. That combination makes the product feel designed from a style recipe before it feels designed around rate-comparison and cost-analysis tasks.

The highest-value direction is to make TokenGauge look like a compact analyst's workbench. Let the rate data, calculator, provenance, and method protocols provide the identity. Reduce the marketing shell, make mobile genuinely task-complete, and explain the unusual ChatGPT-login-to-Stripe purchase path before asking for trust.

Overall assessment: **credible data, generic framing, and a mobile implementation that currently undermines both.**

## What was inspected

- Repository implementation: home, library, lab, account/checkout panel, pricing directory, calculator, site header, legal pages, and `globals.css`.
- Live desktop viewport: 1440×1000. Full home page measured 5,867px tall.
- Live mobile viewport: 390×844. Full home page measured 9,115px tall.
- Live library at both breakpoints and the signed-out lab at mobile.
- DOM/accessibility snapshots, computed layout dimensions, interactive target dimensions, and console warnings. The signed-out lab produced no console warnings.

The live deployment and worktree are not identical. In particular, the deployed mobile section headings still render as two squeezed columns; the working tree now contains a later media-query correction for `.split-heading`. The home method-grid clipping described below remains in the current worktree cascade and should still be fixed and verified after deployment.

## Keep these strengths

- The source-forward product model is differentiating. “Verified 2026-08-15,” official links, tier/region/effective-date context, and explicit omissions make the directory feel materially useful.
- The calculator labels its output as scenario math rather than a promise and keeps the selected rate/source visible.
- Evidence grades use text as well as colour. The library's “Do / Measure / Watch” structure is a good content primitive.
- Most form controls have real labels; the result uses `aria-live`; focus-visible styling and reduced-motion support exist.
- The purchase section clearly says £9 once, no API credits, connected-plan usage, and no guaranteed savings.

## Findings by area

### Information hierarchy and conversion

The home page tries to sell three products at once: rate directory, calculator, and method library/A/B lab. The hero promises all three, but its primary action goes to rates and its secondary action goes to a login-gated lab. The calculator—the fastest personalized proof of value—comes only after a 38-row directory. The paid offer comes after the directory, calculator, twelve preview cards, and experiment-standard section.

This causes two problems:

1. A new visitor cannot quickly state the product model. “Free rate directory,” “free calculator,” “12 free methods,” “free A/B tests for those methods after connecting ChatGPT,” and “£9 for all 120 methods and full lab coverage” are all present, but not summarized together.
2. Conversion is deferred. On mobile, the actual price card is near the bottom of a 9,115px page. The home preview sends users to “Browse the library,” whose upgrade gate appears only after twelve long cards.

The copy also creates a mild mismatch. “Unlock the full method catalogue and private A/B lab” sounds as though the whole lab is paid, while the lab page says the twelve open methods are testable for free. “Founding access” adds launch-template urgency without explaining a deadline or why the price is temporary.

### Typography

The page loads Geist Sans and Geist Mono, but the body is explicitly Arial/Helvetica while only large headings use Geist. Brand, navigation, body copy, and headings consequently have an accidental rather than designed relationship.

Large headings use very tight tracking (`-.058em` to `-.065em`) and near-solid line height. That supplies much of the generic startup look. At the other end, important metadata is routinely 9–11px: table IDs, region/effective dates, coverage labels, footnotes, selected-rate details, and provider tags. The contrast of the reviewed palette is mostly acceptable, but the type size itself is needlessly demanding.

Mobile inputs inherit their label's font size: directory search is 12px, calculator fields inherit 12px, and library inputs can inherit 10px. This is difficult to read and may trigger automatic page zoom on iOS Safari.

### Density and generic-template signals

The second CSS system appended at the end of `globals.css` successfully restrains the original decorative design, but it does not replace it. There are two `:root` token blocks, old component rules for the removed gauge/metric ribbon, early responsive rules, and later component overrides that can override those responsive rules again. This is a concrete “vibecoded” signal in the implementation and the direct cause of a live mobile regression.

The visible generic signals are:

- dark, oversized hero plus acid-lime CTA;
- tiny tracked monospace eyebrows on nearly every section;
- a three-number “source coverage” card with chip-like provider tags;
- a single-letter rounded-square brand mark;
- repeated bordered, equal-height card grids and badge pills;
- alternation of dark/cream full-width sections with very large headings;
- defensive marketing phrases such as “No fake equivalence” where neutral, specific utility copy would sound more established.

None is fatal alone. Their repetition makes the interface feel assembled from current landing-page conventions. The best corrective is not more decoration; it is greater product specificity and fewer marketing components.

### Rate table and filtering

Desktop is serviceable: search and provider filters are visible, numeric columns use tabular figures, and the sticky header helps inside the 660px nested scroller. The table still lacks sorting, a result count, a caption, units in the column headers, and an obvious indication that the body itself scrolls. All 38 “Official” links also become separate small focus/tap targets.

Mobile is not appropriate for the core task. The table is 1,030px wide inside a 348px scroller. A user must pan across roughly three viewport widths, after which the provider/model identity is no longer visible. There is no scroll affordance, sticky identity column, or mobile row/card layout. The ten provider buttons wrap into a dense block and are 34px high. Active selection is visual only; buttons do not expose `aria-pressed`.

The core mobile acceptance task should be: “Find a model and read input, cache-read, output, context, scope, and source without losing the model identity.” The current design fails that task.

### Method library

The desktop library is clearer than the home preview because it exposes search, category, a result count, and the full “Do / Measure / Watch” protocol. However, three 440px-minimum cards per row make every card a dense mini-document, and the locked offer is below all twelve. The home page repeats all twelve cards even though a dedicated library exists.

On the deployed mobile home, the later `.tips-grid { grid-template-columns: repeat(3, 1fr) }` overrides the earlier one-column mobile rule. Computed width was 725px inside a 350px container. Because `.page-shell` uses `overflow: hidden`, the extra cards are clipped rather than horizontally scrollable. This is lost content, not merely an awkward layout.

### Mobile behavior

- At widths below 900px, all navigation links except “Get access” are hidden. There is no menu, so Calculator, Library, and A/B Lab discovery disappears.
- Deployed split section headings measured approximately 196px/76px and 200px/75px columns in a 350px container. Descriptive copy became a narrow vertical ribbon. The working-tree media query appears to correct this, but deployment verification is required.
- The home method grid is clipped as described above and remains vulnerable in the current cascade.
- The rate table relies on dual-axis nested scrolling.
- Many interactive targets are below 44px: provider filters are 34px; table source links are about 54×14px; several text links are 38px high or less; footer links are roughly 18px high.
- The 49px mobile hero is readable, but the first viewport contains mostly marketing copy and the beginning of a coverage panel rather than a usable product control.

### Accessibility

The semantic baseline is better than the visual issues suggest: there is a real header/nav/main hierarchy, labelled forms, proper button elements, a native table, and readable accessibility names for the sliders.

Remaining issues:

- no skip link;
- hidden mobile navigation with no alternative;
- small touch targets and 9–11px essential text;
- provider filter state is not programmatically exposed;
- filtered result changes are not announced;
- the rate table has no caption, explicit column scopes, or labelled scroll region;
- units are in a footnote after the table rather than in/with the column headers;
- the current page is not identified with `aria-current`;
- new-tab source behavior is conveyed only by a glyph;
- keyboard users must tab through dozens of identical “Official” links.

The reviewed text colours generally pass AA contrast. For example, `#66716e` on the paper background is about 4.96:1 and on cream about 4.61:1; the coral focus ring on paper is about 3.07:1, meeting the 3:1 non-text boundary. Preserve those contrasts while increasing type and target sizes.

### Pricing trust

The visible price, one-time language, refund statement, usage caveat, privacy page, and Stripe disclosure are positive. The trust gap is the flow, not the price. Before a user can see a Stripe purchase button, the page asks them to “Sign in with ChatGPT,” an unfamiliar and high-sensitivity request. The price card does not explain the sequence, permissions, seven-day credential retention, disconnect behavior, or why ChatGPT identity is required for purchase. “One-time payment via Stripe” appears only after authentication.

There is also no visible operator name, contact/support route, or working deletion/refund channel. The privacy copy says a public project support channel will exist “once published,” which reads as unfinished and damages trust more than the polished card helps it. Terms do not tell the user who the merchant is or how to exercise the promised refund.

No fabricated testimonials or logo bars are present, which is good. Trust should be built with a short sample A/B result, linked source methodology, clear account-flow diagram, and real operator/support details instead.

## Prioritized fixes

### P0 — Fix the responsive cascade and lost content

Consolidate `globals.css` into one token system and one intentional rule set. Remove dead gauge/ribbon styles, duplicate `:root`, and the appended override layer. Put responsive rules after the corresponding component rules. Explicitly set `.tips-grid` to one column on small screens, keep `.split-heading` one column below 900px, and do not use page-level `overflow: hidden` to conceal layout bugs.

Acceptance checks:

- At 320, 390, 620, 768, 1024, and 1440px, `document.documentElement.scrollWidth === document.documentElement.clientWidth`.
- At 390px, `.tips-grid.scrollWidth <= .tips-grid.clientWidth`, every public method card is reachable, and no text column is narrower than 240px unless it is intentionally a label/value pair.
- Automated screenshots cover home, library, lab, privacy, and terms at 390×844 and 1440×1000.
- Only one root token block remains; removed markup has no orphan component CSS.

### P0 — Give mobile users a complete navigation and rate-comparison flow

Replace “hide every nav item except Get access” with a compact menu or a small two-row product nav. Redesign mobile rates as stacked disclosure rows/cards, or keep a table with a sticky model column, labelled scroll region, and strong scroll cue. A card layout is preferable because the seven-column record already maps cleanly to labelled values.

Acceptance checks:

- At 390px, Rates, Calculator, Library, Lab, and Upgrade are reachable from the header in two taps or fewer.
- A user can search `gpt-5.6-terra` and see scope, input, cache read, output, context, and source without horizontal panning.
- A user can filter to Google and identify the lowest input rate within 20 seconds in a moderated first-use test.
- All primary controls and row actions are at least 44×44 CSS px; no essential text is below 12px.

### P1 — Reframe the page as a workbench, not a launch template

Reduce the hero to a compact product header: one specific outcome, one sentence, one primary task. Move “verified date / provider count / rate-card count” into a provenance bar attached to the directory, not a bento-style hero card. Let the rate search or calculator enter the first desktop viewport. Use product navigation labels such as “Rates,” “Calculator,” “Methods,” “Lab,” and “Upgrade — £9 once.”

A recommended first-page order is:

1. compact promise plus provenance;
2. task switcher or direct links for Rates / Calculator / Methods;
3. primary workspace (rate directory or calculator);
4. three featured method examples, not all twelve;
5. concise experiment explanation;
6. upgrade block.

Acceptance checks:

- At 1440×900, at least one functional control and live data row/result are visible without scrolling.
- At 390×844, the primary action plus the beginning of its functional UI are visible in the first screen.
- The home page renders no more than three method-preview cards and links clearly to “View all 12 free methods.”
- Five new users can correctly state what is free, what costs £9, and what requires ChatGPT connection after a 30-second scan.

### P1 — Make typography and visual tokens deliberate

Use Geist Sans for body, navigation, and headings; reserve Geist Mono for model IDs, prices, dates, and compact data labels. Reduce display tracking to roughly `-.02em` to `-.035em`, use a 1.05–1.12 display line height, and limit the desktop hero to about 56–64px. Establish a minimum 14px body size, 12px metadata size, and 16px mobile form-control size.

Use lime for primary action/success and coral for warning/error/source emphasis rather than as general decoration. Reduce badge/pill frequency and equal-height bordered card grids. The existing data table, calculator ledger, and test protocol can be the visual language.

Acceptance checks:

- One sans family handles prose and headings; mono appears only on data/metadata.
- No input/select/textarea has computed font size below 16px at mobile widths.
- No meaningful text has computed font size below 12px.
- A token inventory defines type sizes, spacing, radii, border, surface, action, success, warning, and error roles; components do not redefine those roles ad hoc.

### P1 — Improve filtering and comparison utility

Add result count, sort by input/cache/output, and a concise provider control. Put units in headers (`Input, USD / 1M tokens`) and keep the verified date visible while browsing. Expose active filter state, and consider “compare selected models” if comparison is a primary claim. Avoid a 660px nested vertical scroller unless it is keyboard-focusable, labelled, and visually obvious.

Acceptance checks:

- Sorting is available for input, cache read, and output; “—” is consistently sorted last.
- Filter buttons expose `aria-pressed`, and result count updates in a polite live region.
- Table has a caption, `scope="col"`, visible units, and a labelled/focusable scroll container if retained.
- Keyboard-only users can search, filter, sort, read a row, open its source, and leave the directory without focus loss.

### P1 — Make the £9 path explain itself before authentication

Replace “Founding access” with a stable, non-urgent label such as “One-time Pro access” unless a real founding window is defined. Show a three-step flow beside the CTA: connect ChatGPT (no charge), review £9 Stripe checkout, receive access. Explain in one line why ChatGPT connection is needed and link directly to the precise privacy section. Put merchant/operator identity, support email/channel, refund request route, Stripe disclosure, and tax treatment where users evaluate the price.

Resolve the free/paid lab wording explicitly: e.g. “The lab works with 12 free methods; Pro unlocks all 120.” Use one consistent upgrade label across header, home, library, terms, and checkout.

Acceptance checks:

- Before authentication, the price area states exact price, recurring status, included features, free limits, ChatGPT data/retention summary, payment processor, and refund contact.
- The authentication button says that it does not charge the user; the subsequent Stripe button repeats `£9 one time`.
- Privacy and terms identify the operator and provide a working contact route; no placeholder such as “once published” remains.
- A user can reach the upgrade block from the top of the library without scrolling past all free cards.

### P2 — Reduce library fatigue

On the dedicated library, prefer a two-column desktop list or compact rows with optional detail expansion over three fixed-height mini-documents. Keep “Do / Measure / Watch” as real subrows. Show source and verification date in a consistent footer. Let card height follow content rather than forcing 440px.

Acceptance checks:

- Mobile is one column with no clipped content; desktop is at most two dense text columns unless cards contain substantially less copy.
- Expanding/collapsing details works with keyboard and exposes `aria-expanded`.
- Search/category controls remain visible or easily recoverable, and the count always reflects the current result set.

### P2 — Finish the accessibility layer

Add a skip link, `aria-current`, programmatic filter state, announced result counts, table semantics, and explicit new-tab text for source links. Increase source/footer link hit areas. Test 200% zoom and forced-colours in addition to standard contrast.

Acceptance checks:

- Axe reports no serious or critical issues on home, library, lab, privacy, terms, and success pages.
- All tasks are completable with keyboard alone with a visible focus indicator.
- At 200% zoom and 320 CSS px width, content reflows without two-dimensional page scrolling or loss of information.
- In forced-colours mode, selected filters, focus, evidence grades, savings/increase, and errors remain distinguishable without colour alone.

## Suggested design north star

TokenGauge should feel closer to a well-edited pricing ledger than to an AI launch page: compact heading, visible provenance, clear units, sortable rows, small number of purposeful surfaces, and direct explanations of uncertainty. The distinctive product assets already exist—the cross-provider rate model, caveats, test protocols, and paired experiment. Making those assets the interface will do more to remove the “vibecoded” impression than adding bespoke illustration, animation, gradients, or more cards.
