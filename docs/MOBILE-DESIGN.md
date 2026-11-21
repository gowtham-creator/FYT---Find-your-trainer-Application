# FYT mobile app: design direction and screen spec ("Timetable")

Status: Phase 1 of 2 (design). Phase 2 implements this file. No app code is written here.
Target: `apps/mobile` (Expo SDK 58, Expo Router, React Native 0.88, Reanimated 4.7, TanStack Query, Zustand).
Routes live in `apps/mobile/src/app` (not `apps/mobile/app`).

Contents: 0 Read first · 1 Direction · 2 Tokens · 3 Type · 4 Layout, shape, depth · 5 Icons and art · 6 Motion · 7 Accessibility · 8 Navigation · 9 Components · 10 Screens · 11 Copy rules · 12 Fixtures · 13 Dependencies · 14 Implementation order · 15 Acceptance gates

---

## 0. Read first: sources, limits and conflicts

### 0.1 What this spec was built from

- `PRODUCT.md`, `DESIGN.md`, `apps/admin/src/app/globals.css`, `docs/APP-ARCHITECTURE.md`, `docs/firestore-schema.md`, `packages/domain/src`, and `apps/mobile/src` (read from a GitHub clone of `main` while the external SSD was unmounted, then compared byte for byte against the local working tree once it remounted: identical).
- **Not seen:** the screenshot contact sheet (`.../scratchpad/app-screens/contact-sheet.png` was missing; the folder was empty) The critique of the current screens is therefore based on the source code (`theme/tokens.ts`, the four tab screens, `HomeShell`) and the owner's stated problems, not on pixels.
- Skill `high-end-visual-design` could not be loaded (blocked for model invocation). All other requested skills were loaded and applied.

### 0.2 Conflicts between the brief and the signed scope (decided here, flag to the owner)

The Phase 1 contract and `docs/APP-ARCHITECTURE.md` §2.2 exclude payments and price fields, user-submitted reviews, certificates and course hosting. This brief asks for INR pricing, reviews, batches and learning progress. Decision: design all of it, drive it from fixtures, and gate each item behind a flag in `src/config/features.ts` so the contract-only build is one switch away.

| Brief item | Conflict | Decision in this spec | Flag (default) |
|---|---|---|---|
| INR pricing | No price field in `CourseDoc`; payments out of scope | Course **fee is display only** ("Course fee, paid to the institute"). No cart, no checkout, no "Buy". Every bookable session in the app is free | `showFees` (true) |
| Reviews | Only admin-entered `rating` and `reviewSnippets` exist | Show the admin-entered rating and up to 5 quotes, titled "What learners said", with the line "Collected by the FYT team". No review counts, no "write a review" | `showReviews` (true) |
| Batches | Bookings are demo / mentorship / consultation slots | Courses list upcoming batches. "Reserve a seat" creates a free seat request the institute confirms. No fee is taken in the app | `batches` (true) |
| Continue learning, progress | No LMS, no lessons | Progress is **attendance**: sessions attended out of sessions scheduled in a reserved batch. Never a fake percentage of "lessons" | `learningProgress` (true) |
| Mentors and consultants | Brief names only trainers and institutes; schema has provider types `trainer`, `mentor`, `consultant` | One Provider profile template serves all three. Explore has four tabs: Courses, Trainers, Institutes, Mentors (mentors and consultants together) | none |
| Hyderabad | `PRODUCT.md` scopes the marketplace to Hyderabad | Fixtures are Hyderabad institutes and areas; a few trainers teach online from Bengaluru, Pune and Chennai | none |
| Font weights | `APP-ARCHITECTURE` §3.5 says "never 600"; the shipped admin `DESIGN.md` allows 600 | Mobile follows the shipped admin: 400, 500, 600. No 700 | none |
| Old mobile tokens | `APP-ARCHITECTURE` §3.4 and §3.5 still list the cream / marigold / Playfair tokens | This file replaces §3.4 and §3.5 for mobile. Update that doc in Phase 2 | none |

With every flag false the app still works: course detail shows no fee and no batches, the sticky CTA is "Book a free demo", Home drops "Continue learning".

### 0.3 Things that must never ship

- Any gold, amber, marigold, yellow, brown, cream or warm paper tint. Any purple, pink or violet.
- `support@example.com`, lorem ipsum, "coming soon" placeholders, empty sections that say "once the catalog is connected".
- Invented counts ("10,000+ learners", "2.3k reviews", "Trusted by"). Ratings without a source line.
- Emoji as icons or in copy. Em dashes in copy (use commas, colons, full stops).
- Text under 12 px. Touch targets under 44 pt (48 dp on Android).

---

## 1. Direction

### 1.1 Scene

> Ananya, a final-year B.Tech student, stands in the Hyderabad Metro at 8:40 am in hard daylight, phone in her left hand, checking whether tonight's 7:00 pm MERN batch has a Meet link yet. Karthik, a 29-year-old QA engineer, compares weekend DevOps batches on his sofa at 10:30 pm with the lights low.

Both scenes are real, so **both themes are first class** and the app follows the system setting. Light is tuned for glare (high-contrast ink, white surfaces on a cool slate ground). Dark is the admin's deep navy, tuned for a dim room (no pure black, no glowing whites).

### 1.2 The idea: "Timetable"

A training marketplace is, underneath, a timetable: batches start on dates, sessions happen at times, a link becomes live ten minutes before. The current app hides that behind generic cards. The redesign makes **time the organising element**.

- **The time rail** is the signature component. Every session, slot, batch and curriculum week is drawn as a mono time or index on the left, a 2 px rail, and content on the right. It appears on Home (next session), Bookings, Slot picker, Course curriculum and Notifications. One motif, five uses, instantly recognisable.
- **Mono numerals carry the facts.** Times (`7:00 pm`), dates (`Thu 12 Nov`), booking refs (`FYT-7K2M9Q`), fees (`₹38,000`), durations (`16 wk`) are JetBrains Mono, tabular. Words are Open Sauce One. The contrast between the two is the app's typographic voice, and it is the same voice as the operator console.
- **One brand band.** The console's azure sidebar gradient becomes the app's top band: on Splash, Sign-in, the Home header and the Booking-confirmed ticket. Everything else is calm slate. Azure is spent where the learner's next action lives.
- **Blueprint covers.** There is no photography budget and no image generation. Course and category art is procedural: a deep gradient panel, a fine dot grid, and a large mono stack code (`MERN`, `JAVA`, `DS`, `OPS`). It reads as engineering drawing, it is original, and it never needs an asset pipeline. Institutes and trainers that have real photos (`gallery`, `photo`) use them; the procedural art is the fallback, and it is designed to look intentional.

### 1.3 Colour strategy

Restrained ground (tinted slate neutrals plus azure at about 10% of a screen), with **committed** azure on the four brand-band surfaces. A cool secondary, teal, is reserved for *learning progress* (attendance rings, "attended" marks) so progress never competes with the azure action colour. Sky is information. Green, red-orange and rose are status only.

Category reflex check: "edtech" usually produces playful purple gradients and mascot illustration; "edtech that is not playful" usually produces Coursera-blue cards with stock photos. This is neither: it is a timetable instrument with mono numerals, a drawn rail and blueprint covers.

### 1.4 Design read (skill-required declarations)

- Register: product. Platform mode: cross-platform premium neutral, with platform-correct back, sheets and haptics.
- Theme paradigm: pristine light plus deep navy dark. Typography: refined grotesk plus mono numerals. Structure: list-led utility with a media-led Home. Texture: flat, with one textured hero area (the blueprint dot grid). Palette: cool mineral plus one clean accent.
- Signature component set: time rail session card, premium segmented control, bottom action bar, progress ring. Decorative set: fine dot grid, mono stack codes.
- Visual thesis: cool slate surfaces with navy ink, one azure brand band, Open Sauce One 400/500/600 against JetBrains Mono numerals, 20 pt gutters on a 4 pt grid, 16 pt cards with a hairline and a soft navy shadow.
- Interaction thesis: quick and exact (120 to 360 ms), ease-out with no bounce, press scales to 0.97, content fades up 8 pt once on mount, nothing moves because the page scrolled except the Home header collapse; forbidden: parallax, elastic overshoot, looping decoration, scroll-triggered reveals.
- Allowed patterns: mono numerals and labels, hairline rules, the time rail, the dot-grid texture on brand bands and covers, one pulsing "live" dot while a session is joinable, skeleton shimmer while loading.
- MFRI: platform clarity 4, accessibility readiness 4, interaction complexity 2, performance risk 2, offline dependence 2. Score +2 to +4: proceed, keep lists virtualised and animations on the UI thread.

---

## 2. Colour tokens

File: `src/theme/tokens.ts`, exporting `light` and `dark` objects with identical keys. `usePalette()` returns the active one. No colour literal may appear outside this file (lint rule in §15).

### 2.1 Core (identical to the admin console)

| Token | Light | Dark | Use |
|---|---|---|---|
| `paper` | `#F5F7FB` | `#0B0F19` | Screen background |
| `surface` | `#FFFFFF` | `#141926` | Cards, list groups, tab bar, sticky bars |
| `sunken` | `#EEF1F7` | `#0F1420` | Input fill, segmented track, skeleton base, neutral pills |
| `raised` | `#FFFFFF` | `#1C2233` | Sheets, menus, toasts |
| `line` | `#E3E7EF` | `#232A3B` | Hairlines, card borders |
| `lineStrong` | `#CDD3DF` | `#2D364B` | Dividers on `sunken`, unselected chip border |
| `lineField` | `#8A93AB` | `#5A6580` | **New.** Input and unselected slot borders (3:1 against surface) |
| `ink` | `#0F1B3D` | `#F1F3F8` | Primary text |
| `ink2` | `#475472` | `#C6CBDA` | Secondary text |
| `ink3` | `#636B88` | `#8B92A6` | Tertiary text, placeholders, inactive tab |
| `accent` | `#1E4FB8` | `#6FA0FF` | Primary buttons, links, selection, focus ring |
| `accentPressed` | `#1A45A0` | `#8AB3FF` | Pressed primary |
| `accentSoft` | `#E8EFFC` | `#1A2747` | Selected chip, icon tile, active tab pill |
| `onAccentSoft` | `#1A45A0` | `#A9C4FF` | Text and icons on `accentSoft` |
| `accentInk` | `#FFFFFF` | `#0B1530` | Text on `accent` |
| `ok` / `okSoft` / `onOkSoft` | `#059669` / `#E3F5EE` / `#047857` | `#34D399` / `#0F2E26` / `#34D399` | Confirmed, joinable, attended |
| `warn` / `warnSoft` / `onWarnSoft` | `#CF4215` / `#FCEBE6` / `#A83510` | `#FF8A65` / `#3A1719` / `#FF8A65` | Link delayed, few seats left. Status only |
| `bad` / `badSoft` / `onBadSoft` | `#E11D48` / `#FDE8EC` / `#BE123C` | `#FB7185` / `#351822` / `#FB7185` | Errors, destructive, missed |
| `info` / `infoSoft` / `onInfoSoft` | `#0284C7` / `#E3F2FB` / `#0369A1` | `#38BDF8` / `#0E2A3A` / `#38BDF8` | Requested, neutral notices |

### 2.2 Mobile extensions (cool, coherent with the console's chart palette)

| Token | Light | Dark | Use |
|---|---|---|---|
| `brand` → `brand2` | `#1E4FB8` → `#1A45A0` | `#0F1A36` → `#0B1328` | Brand band gradient, top to bottom (the console sidebar) |
| `brandGlow` | `#3A6FD8` | `#23407C` | Highest value inside a band (radial highlight top right) |
| `onBrand` | `#FFFFFF` | `#FFFFFF` | Headlines on the band |
| `onBrandMuted` | `#D6E2FB` | `#B8C6E6` | Secondary text on the band |
| `brandLine` | `rgba(255,255,255,0.14)` | `rgba(255,255,255,0.08)` | Hairlines and dot grid on the band |
| `brandChip` | `rgba(255,255,255,0.12)` | `rgba(255,255,255,0.08)` | Translucent chips on the band |
| `teal` | `#0E9F8E` | `#2DD4BF` | Progress ring stroke, attended tick. Graphics only, never body text in light |
| `tealSoft` / `onTealSoft` | `#E0F5F2` / `#0B6B60` | `#0F2E2B` / `#2DD4BF` | Progress pill, "Attended 6 of 24" label |
| `scrim` | `rgba(15,27,61,0.45)` | `rgba(0,0,0,0.60)` | Behind sheets |
| `shadow` | `#0F1B3D` | `#000000` | Shadow colour (see §4.3) |
| `skeleton` / `skeletonHi` | `#EEF1F7` / `#F7F9FC` | `#1C2233` / `#232A3B` | Skeleton base and shimmer highlight |

### 2.3 Cover palettes (blueprint covers, §5.3)

Each cover is a two-stop vertical gradient plus white mono text. Four families, assigned by category, same values in light and dark (covers are self-contained panels).

| Key | Stops | Categories |
|---|---|---|
| `azure` | `#1E4FB8` → `#163A8A` | Full stack, Web, Java |
| `navy` | `#12224F` → `#0B1530` | DevOps, Cloud, Cybersecurity |
| `teal` | `#0B7F74` → `#075E57` | Data science, AI and ML, Python |
| `sky` | `#0369A1` → `#064E7A` | UI/UX, Mobile, Testing |

White text on the lightest stop of each family is at least 5.0:1.

### 2.4 Measured contrast (WCAG 2.1, computed for this spec)

| Pair | Ratio | Pair | Ratio |
|---|---|---|---|
| ink on paper (L) | 15.7 | ink on paper (D) | 17.3 |
| ink2 on paper (L) | 7.1 | ink2 on surface (D) | 10.8 |
| ink3 on paper / surface / sunken (L) | 4.9 / 5.3 / 4.7 | ink3 on paper / surface / raised (D) | 6.2 / 5.7 / 5.1 |
| white on brand (L) | 7.3 | white on brand (D) | 17.2 |
| white on brandGlow (L) | 4.7 | white on brandGlow (D) | 10.0 |
| onBrandMuted on brand / brand2 (L) | 5.6 / 6.7 | onBrandMuted on brand (D) | 10.0 |
| accentInk on accent (L) | 7.3 | accentInk on accent (D) | 7.0 |
| onAccentSoft on accentSoft (L) | 7.6 | onAccentSoft on accentSoft (D) | 8.4 |
| onTealSoft on tealSoft (L) | 5.6 | teal on tealSoft (D) | 7.8 |
| onOkSoft / onWarnSoft / onBadSoft / onInfoSoft (L) | 4.9 / 5.7 / 5.4 / 5.2 | same (D) | 7.6 / 6.9 / 6.0 / 7.0 |
| lineField on surface (L) | 3.1 | lineField on surface (D) | 3.0 |

Rules: `teal` (3.3:1 on white) and `ok` are never used for text in light mode; use `onTealSoft` and `onOkSoft`. A status is never colour alone: every pill has an icon and a label.

---

## 3. Typography

Families (both SIL OFL 1.1, bundled, never fetched):

- **Open Sauce One**: copy `OpenSauceOne-Regular.ttf`, `-Medium.ttf`, `-SemiBold.ttf` from `apps/admin/src/app/fonts/` to `apps/mobile/assets/fonts/`. Register through the `expo-font` config plugin as `OpenSauceOne-Regular`, `OpenSauceOne-Medium`, `OpenSauceOne-SemiBold`. Do not ship Bold.
- **JetBrains Mono**: `@expo-google-fonts/jetbrains-mono`, `JetBrainsMono_400Regular` and `JetBrainsMono_500Medium`.
- Remove `@expo-google-fonts/inter`, `@expo-google-fonts/playfair-display`, `@expo-google-fonts/geist-mono`.

Android has no synthetic weights for custom fonts: always select weight by family name, never by `fontWeight`.

| Variant | Family | Size / line | Tracking | Use |
|---|---|---|---|---|
| `display` | SemiBold | 32 / 38 | -0.64 | Splash, sign-in headline, booking-confirmed headline |
| `h1` | SemiBold | 26 / 32 | -0.52 | Screen titles (large title) |
| `h2` | SemiBold | 21 / 28 | -0.21 | Section titles, sheet titles, course title on detail |
| `h3` | SemiBold | 17 / 24 | 0 | Card titles, list primary, nav bar title |
| `bodyLg` | Regular | 16 / 24 | 0 | Long-form reading: course description, bio |
| `body` | Regular | 15 / 22 | 0 | Default UI text |
| `label` | Medium | 15 / 20 | 0 | Buttons, field labels, segmented items, chips |
| `meta` | Regular | 14 / 20 | 0 | Secondary lines, descriptions |
| `caption` | Medium | 13 / 18 | 0 | Pills, badges, helper and error text, timestamps. **The floor for mixed-case text** |
| `micro` | Medium | 12 / 16 | +0.72, UPPERCASE | Eyebrows and kickers only |
| `tab` | Medium | 12 / 16 | 0 | Tab bar labels only (the one mixed-case exception at 12) |
| `monoXl` | Mono Medium | 24 / 32 | 0 | OTP digits, countdown |
| `monoLg` | Mono Medium | 18 / 24 | 0 | Time on the time rail, fee on the sticky bar |
| `mono` | Mono Medium | 14 / 20 | 0 | Dates, refs, durations, inline numbers |
| `monoSm` | Mono Regular | 13 / 18 | 0 | Day labels, secondary numbers |

Rules:

- All mono text sets `fontVariant: ["tabular-nums"]`. Times never wrap: render `7:00 pm` with a non-breaking space.
- Nothing renders below 12. Overflow is fixed by wrapping or truncating with an accessible full label, never by shrinking.
- Hierarchy steps are at least 1.2x: 13, 15, 17, 21, 26, 32.
- Dynamic type: never set `allowFontScaling={false}`. `maxFontSizeMultiplier`: 1.3 on `tab`, buttons and the time rail time; 1.6 on single-line rows and chips; unlimited on `bodyLg`, `body`, `meta`. Layouts must hold at 1.3x with no clipped text and at 2.0x with wrapping (§7).
- Rupee amounts: `Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })` so `₹38,000` and `₹1,20,000` group the Indian way.

---

## 4. Layout, shape, depth

### 4.1 Spacing (4 pt grid)

`space = { 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 }` (named `s2` ... `s64`).

- Screen gutter: **20**. On windows narrower than 360 pt: 16.
- Rhythm: 8 inside a group, 12 between related rows, 16 inside cards, 24 between a section header and its neighbour above when tight, **32 between sections**, 40 above the first section after a hero. Do not use one padding everywhere.
- Horizontal carousels bleed to the screen edge: content inset 20, item gap 12, and the next card must peek by at least 24 pt.
- Reading width: `bodyLg` blocks are capped at 560 pt on tablets and foldables.

### 4.2 Radii

| Token | Value | Use |
|---|---|---|
| `r6` | 6 | Tags inside cards, skeleton lines |
| `r12` | 12 | Buttons, inputs, slot cells, icon tiles, segmented track |
| `r16` | 16 | Cards, list groups, covers inside cards |
| `r20` | 20 | Hero covers, the ticket on the confirmed screen |
| `r24` | 24 | Sheet top corners, brand band bottom corners |
| `pill` | 999 | Pills, chips, avatars, the tab indicator |

### 4.3 Elevation

Depth is tone plus a hairline first, shadow second. Shadows are navy-tinted and only in light mode; dark mode uses `raised` plus `line` and no shadow.

| Level | iOS | Android | Use |
|---|---|---|---|
| `e0` | none, 1 px `line` border | elevation 0 | List groups, inputs |
| `e1` | colour `shadow`, opacity 0.06, radius 12, offset 0/4 | elevation 2 | Cards |
| `e2` | opacity 0.10, radius 20, offset 0/-4 (bars) or 0/8 (floating) | elevation 8 | Tab bar, sticky CTA bar, toast |
| `e3` | opacity 0.18, radius 32, offset 0/12 | elevation 16 | Sheets, menus |

Never nest a card inside a card. A card may contain a tinted inset row (`sunken`, `r12`), never a second bordered card.

### 4.4 Screen anatomy

- `Screen` wraps every route: `paper` background, safe-area aware, status bar style from the theme (light content on brand bands).
- Top: either a **brand band** (Home, Sign-in, Splash, Confirmed), a **large title** (tab roots: 26 pt title that collapses into the 17 pt nav title on scroll), or a **nav bar** (56 pt, back chevron 44x44, centred 17 pt title, up to two 44x44 actions).
- Bottom: the tab bar (64 pt plus inset) or a sticky CTA bar (72 pt plus inset). Never both on the same screen. Scroll content always has bottom padding equal to the bar height plus 24.
- Primary actions sit in the bottom third. Destructive actions sit away from the primary and are never the default.

---

## 5. Iconography and art

### 5.1 Icon set: Phosphor

Package: `phosphor-react-native` (3.0.6 on npm at the time of writing) with `react-native-svg`. Chosen over Lucide because its weights give state without a second set: **regular** by default, **fill** for the active tab and selected or on states, **duotone** for 28 pt and larger display glyphs (empty states, category tiles: the 20% secondary layer reads as a cool tint). Never `bold` or `thin`.

All icons go through one file, `src/components/Icon.tsx`, which maps semantic names to Phosphor components (`<Icon name="calendar" weight="regular" size={20} />`). No screen imports Phosphor directly. Verify the export names against the installed version when writing the map (v3 exports with an `Icon` suffix, for example `HouseIcon`).

Sizes: 16 (inline with caption), 20 (rows, buttons, pills), 24 (nav bar, tab bar), 28 (tiles), 40 (empty states). Stroke colour inherits the text colour of its row.

| Semantic name | Phosphor | Semantic name | Phosphor |
|---|---|---|---|
| `home` | House | `explore` | Compass |
| `bookings` | CalendarCheck | `profile` | UserCircle |
| `search` | MagnifyingGlass | `filter` | SlidersHorizontal |
| `bell` | Bell | `back` | CaretLeft |
| `chevron` | CaretRight | `close` | X |
| `clock` | Clock | `calendar` | CalendarBlank |
| `video` | VideoCamera | `pin` | MapPin |
| `course` | BookOpenText | `institute` | Buildings |
| `trainer` | ChalkboardTeacher | `mentor` | Compass |
| `consultant` | Briefcase | `student` | GraduationCap |
| `star` | Star (fill) | `seats` | UsersThree |
| `duration` | Hourglass | `mode-online` | MonitorPlay |
| `mode-offline` | Storefront | `check` | Check |
| `check-circle` | CheckCircle | `warning` | Warning |
| `error` | XCircle | `info` | Info |
| `copy` | Copy | `share` | ShareNetwork |
| `bookmark` | BookmarkSimple | `phone` | Phone |
| `mail` | EnvelopeSimple | `globe` | Globe |
| `settings` | GearSix | `logout` | SignOut |
| `trash` | Trash | `shield` | ShieldCheck |
| `moon` / `sun` | Moon / Sun | `offline` | WifiSlash |
| `refresh` | ArrowClockwise | `external` | ArrowSquareOut |
| `no-show` | UserMinus | `lock` | Lock |

Ratings use an azure filled star (`accent`) with a mono value. Never a yellow or gold star.

### 5.2 The mark

`Wordmark` renders the FYT mark from `brand/logo` in two tones: `azure` on light surfaces and `onBrand` (white) on bands. The gold master brand files are not used in the app. Splash icon background becomes `#1E4FB8` (light) and `#0F1A36` (dark) in `app.config.ts`.

### 5.3 Blueprint cover (`Cover` component)

Drawn with `expo-linear-gradient` plus one `react-native-svg` layer. No bitmap assets.

1. Gradient from the category's cover palette (§2.3), top to bottom.
2. Dot grid: 1.5 pt dots, 16 pt pitch, `rgba(255,255,255,0.10)`, masked so it fades to 0 at the bottom-left third.
3. One quarter-circle arc, 1 pt stroke `rgba(255,255,255,0.16)`, radius 70% of the cover height, centred on the top-right corner.
4. Stack code bottom-left, inset 16: JetBrains Mono Medium, white. Size 28 on cards, 44 on the detail hero. Maximum 5 characters (`MERN`, `JAVA`, `DS`, `OPS`, `PY`, `UX`, `AWS`, `SDET`, `RN`, `GENAI`).
5. Optional top-left kicker in `micro`, `rgba(255,255,255,0.72)`: the category name.

Aspect ratios: 16:10 on carousel cards, 16:9 on the detail hero, 1:1 (56 or 64 pt, `r12`) as a list thumbnail showing only the code at mono 14. When `cover.url` exists, show the photo with `expo-image` (`contentFit="cover"`, 200 ms crossfade, the blueprint as placeholder) and a bottom scrim `rgba(11,21,48,0)` → `rgba(11,21,48,0.72)` under any text.

### 5.4 Avatars and logos

- `Avatar`: circle, sizes 32, 40, 56, 88. Photo if present, else initials (max 2) in `label` on `accentSoft` with `onAccentSoft`. Never a generic silhouette.
- `InstituteLogo`: rounded square `r12`, sizes 40, 56. Logo image if present, else the first letter in `h3` on `sunken` with a `line` border.

---

## 6. Motion

Built with `react-native-reanimated` 4 (already installed) and `react-native-svg`. **No Moti and no Lottie**: every animation here is a transform, an opacity, or an SVG `strokeDashoffset`, all on the UI thread. Personality: corporate-premium. Quick, exact, no bounce.

### 6.1 Tokens (`src/theme/motion.ts`)

| Token | Value | Use |
|---|---|---|
| `dur.instant` | 90 ms | Press-in feedback |
| `dur.quick` | 140 ms | Press-out, chip toggle, icon weight swap, colour change |
| `dur.base` | 220 ms | Fade-up entrance, pill change, segmented thumb, toast in |
| `dur.slow` | 360 ms | Hero entrance, progress ring fill, header collapse settle |
| `dur.story` | 600 ms | Booking-confirmed choreography only |
| `ease.standard` | `Easing.bezier(0.2, 0, 0, 1)` | 80% of all motion (the signature curve) |
| `ease.enter` | `Easing.bezier(0.05, 0.7, 0.1, 1)` | Things arriving |
| `ease.exit` | `Easing.bezier(0.3, 0, 1, 1)` | Things leaving (exits run at 70% of the enter duration) |
| `ease.linear` | `Easing.linear` | Shimmer, countdown bar, spinner only |
| `spring.press` | `{ mass: 1, stiffness: 420, damping: 38 }` | Press release (damping ratio 0.93, no overshoot) |
| `spring.settle` | `{ mass: 1, stiffness: 220, damping: 28 }` | Segmented thumb, tab indicator, date-strip selection |
| `spring.pop` | `{ mass: 1, stiffness: 260, damping: 27 }` | The confirmed tick only (ratio 0.84, under 3% overshoot) |
| `stagger` | 40 ms per item, max 6 items | First-load list entrance |
| `rise` | 8 pt | Translate distance for fade-up |

### 6.2 What animates

| # | Where | Motion |
|---|---|---|
| M1 | Any `Pressable` card, button, chip | Scale to 0.97 (buttons, chips) or 0.985 (cards) in `dur.instant`, release with `spring.press`. Opacity is not used for press |
| M2 | Screen content on first mount | Sections fade up `rise` in `dur.base` `ease.enter`, staggered. Runs once per mount, never on scroll, never when returning from a pushed screen |
| M3 | Tab change | Icon cross-fades regular to fill in `dur.quick`; the `accentSoft` pill behind the icon scales from 0.6 to 1 and fades in with `spring.settle`. Scene change is an 120 ms cross-fade, no slide |
| M4 | Stack push and pop | Native stack defaults (iOS slide with edge swipe, Android platform default). Not overridden |
| M5 | Sheets | Native form sheet (`presentation: "formSheet"`), system animation and grabber |
| M6 | Home header | Brand band collapses from 196 to 96 pt as scroll goes 0 to 100: greeting fades out over the first 60 pt, search field translates up into the band. `useAnimatedScrollHandler`, `interpolate` with clamp. The only scroll-linked motion in the app |
| M7 | Skeletons | Highlight band sweeps left to right, 1200 ms, linear, loop. All skeletons on a screen share one shared value so they sweep in sync |
| M8 | Segmented control, date strip | Selected thumb slides with `spring.settle`; labels cross-fade colour in `dur.quick` |
| M9 | Slot select | Border and fill cross-fade in `dur.quick`; check icon scales 0.6 to 1 with `spring.press`. Selection haptic |
| M10 | Meet link resolve | "Creating your Meet link" row shows a 2 pt indeterminate bar. On `confirmed`: bar completes in `dur.base`, row background cross-fades `infoSoft` to `okSoft`, the label swaps with a 6 pt vertical slide, the icon swaps to a check. Success haptic |
| M11 | Join state arming | When a session enters the 10-minute join window, the secondary "Starts in" chip is replaced by the primary Join button: chip fades out (`dur.quick`), button fades up (`dur.base`). The live dot pulses: scale 1 to 1.8 and opacity 0.5 to 0 on a ring, 1600 ms, ease-out, loop, only while joinable and only while the screen is focused |
| M12 | Progress ring | `strokeDashoffset` from empty to value in `dur.slow` `ease.enter`, once on mount; the number counts up in step |
| M13 | Booking confirmed | Sequence (total 600 ms): 0 ms tick circle scales 0.6 to 1 with `spring.pop` while the tick path draws (`strokeDashoffset`, 280 ms); 120 ms headline fades up; 220 ms ticket card rises 16 pt and fades in (`dur.slow`); 420 ms buttons fade in. Success haptic at 0 ms. No confetti |
| M14 | Toast | Rises 12 pt and fades in (`dur.base`), holds 3.5 s (5 s if it has an action), exits in 150 ms |
| M15 | Inline error | Field border colour cross-fade plus one horizontal shake: 0, -6, 6, -3, 0 over 320 ms. Error haptic. OTP uses the same shake on the whole row |
| M16 | Bookmark | Icon swaps regular to fill with scale 0.8 to 1 `spring.press`. Light impact haptic |
| M17 | Pull to refresh | Platform `RefreshControl`, tinted `accent` |
| M18 | Splash handoff | The native splash (mark on `brand`) is replaced by an identical RN view; the mark translates up 40 pt and scales to 0.8 while the sign-in sheet rises from the bottom (`dur.slow`). When the session is `ready`, cross-fade straight to Home in `dur.base` |

### 6.3 Haptics (`expo-haptics`)

Selection: chips, segments, date and slot picks, tab change (iOS only). Light impact: bookmark, copy link. Success notification: OTP verified, booking confirmed, Meet link ready. Warning notification: cancel confirmed. Error notification: validation shake. Never on scroll, never on navigation push.

### 6.4 Reduced motion

`useReducedMotion()` from Reanimated gates everything: M2, M6, M13, M18 become 120 ms opacity fades with no translation; M7 becomes a static skeleton; M11 pulse stops (the dot stays solid); M12 renders at its final value; M15 shake is dropped (colour and message still change). Haptics stay.

### 6.5 Performance rules

- Animate only `transform` and `opacity` (and SVG dash offset). Never width, height, margin or padding.
- Lists use `@shopify/flash-list` with stable keys and memoised rows. No `ScrollView` for catalog lists.
- At most one looping animation on screen (shimmer or live pulse). Loops stop when the screen loses focus (`useIsFocused`).

---

## 7. Accessibility

- **Contrast:** all text pairs in §2.4 are at least 4.5:1; control boundaries at least 3:1.
- **Targets:** minimum 44x44 pt on iOS, 48x48 dp on Android. Smaller visuals (36 pt chips, 28 pt pills that are tappable, 24 pt icons) use `hitSlop` to reach the minimum. Adjacent targets are at least 8 pt apart.
- **Roles and labels:** every `Pressable` has `accessibilityRole` and a label that reads the whole card, for example "MERN Stack with Projects, Vidyarth Tech Academy, 16 weeks, online and classroom, rated 4.7. Button." Icon-only buttons always have labels. Decorative art (`Cover`, dot grid) is `accessibilityElementsHidden`.
- **State:** selected chips, slots and tabs set `accessibilityState={{ selected }}`; disabled and busy states are set on buttons. Status pills read as "Status: Confirmed".
- **Live regions:** the Meet link row and toast use `accessibilityLiveRegion="polite"` (Android) and `AccessibilityInfo.announceForAccessibility` (iOS) when they change.
- **Dynamic type:** at 1.3x nothing clips. At 2.0x: carousels become vertical lists, two-column stat rows stack, the sticky CTA bar stacks label above button, the time rail time column grows to fit and the rail stays aligned.
- **Focus order** follows visual order; sheets trap focus; closing a sheet returns focus to the opener.
- **Colour independence:** status has icon plus label; selected slots have a check; errors have an icon and text; the progress ring has a text value.
- **Motion:** §6.4. **Timeouts:** the OTP resend timer is announced once at 0; nothing auto-dismisses that the user must read except toasts, which are also written to Notifications when they matter.
- **Forms:** labels are always visible above the field, never placeholder-only. Errors appear below the field, are announced, and say how to fix. Correct `textContentType`, `autoComplete`, `keyboardType` on every field (§10).

---

## 8. Navigation model

### 8.1 Map

```
Root Stack (src/app/_layout.tsx)
├─ index                      S01 Splash
├─ gate/update                S02
├─ gate/maintenance           S03
├─ gate/blocked               S04
├─ auth/phone                 S05 Sign in
├─ auth/otp                   S06 Verify
├─ onboarding/segment         S07
├─ onboarding/details         S08 (student | corporate, 2 steps)
├─ (tabs)                     Tab navigator
│   ├─ home                   S09 (student | corporate)
│   ├─ explore                S10
│   ├─ bookings               S19
│   └─ profile                S22
├─ search                     S11 (fade presentation)
├─ explore/filters            S12 (formSheet)
├─ courses/[id]               S13
├─ providers/[id]             S14 (trainer | mentor | consultant)
├─ institutes/[id]            S15
├─ book/[targetType]/[targetId]   S16 Slot or batch picker
├─ book/confirm               S17 (formSheet)
├─ book/success               S18 (gesture back disabled)
├─ bookings/[id]              S20 Session detail
├─ bookings/[id]/cancel       S20b (formSheet)
├─ notifications              S21
├─ profile/edit               S23
├─ profile/settings           S24
├─ profile/saved              S25
├─ profile/delete             S26
└─ dev/gallery                S27 (non-prod only)
```

Detail routes sit **outside** the tab group, so they cover the tab bar and deep links open full screen. `redirectFor` in `src/session/state.ts` must allow every route from `search` down for the `ready` state (today it allows only the four tabs and `/dev/*`); update its tests.

### 8.2 Tab bar

Four tabs: **Home, Explore, Bookings, Profile**. Docked, `surface` background, top hairline `line`, `e2`, height 64 plus bottom inset. Each item: 24 pt icon inside a 56x32 `pill` that is `accentSoft` when active; `tab` label below (4 pt gap). Active: icon fill weight, icon and label `onAccentSoft`. Inactive: regular weight, `ink3`. The Bookings tab shows a 8 pt `ok` dot at the pill's top right while any session is joinable, and the tab's accessibility label adds "session ready to join". No numeric badges.

### 8.3 Rules

- Back: iOS edge swipe and Android system back always work, except on S18 (success), where back goes to Bookings.
- Sheets (`formSheet`, detents fit-to-content or 0.6 and 1.0, grabber visible, corner radius 24) are used only for: filters, booking confirm, cancel reason. Everything else is a pushed screen or inline. No centred modal dialogs except the OS alert for sign out.
- Notifications is reached from the bell in the Home header and from push deep links. It is a stack screen, not a tab.
- Tapping the active tab scrolls its list to top.
- Deep link allowlist: `/bookings/[id]`, `/notifications`, `/courses/[id]`, `/providers/[id]`, `/institutes/[id]`.

---

## 9. Component inventory

All in `src/components/` unless noted. Every component reads colours from `usePalette()`, type from `Txt` variants, and supports light, dark, pressed, disabled, focus and (where relevant) loading and error. Replace the current `Button`, `Card`, `Chip`, `EmptyState`, `GateScreen`, `Screen`, `SectionHeader`, `TextField`, `Txt`, `Wordmark`.

### 9.1 Foundations

| Component | Spec |
|---|---|
| `Txt` | Props: `variant` (§3), `color` (token key, default `ink`), `mono`, `numberOfLines`, `align`. Applies family, size, line height, tracking, `maxFontSizeMultiplier` per variant |
| `Icon` | §5.1 |
| `Screen` | Props: `top` = `"band" \| "large" \| "nav" \| "none"`, `title`, `onBack`, `actions`, `footer` (sticky bar node), `scroll` (bool), `refreshing`, `onRefresh`. Handles safe areas, keyboard avoidance (footer rides above the keyboard), status bar style |
| `BrandBand` | Gradient `brand` → `brand2`, a radial `brandGlow` highlight (SVG `RadialGradient`, centre 85% / 0%, radius 70%, opacity 0.55), the dot grid (§5.3 step 2 using `brandLine`), bottom corners `r24`. Children render on it in `onBrand` |
| `Pressable` wrapper `Tap` | Implements M1, haptic option, min target, `android_ripple` off (the scale is the feedback) |
| `Divider` | 1 px `line`; `inset` prop (default 0, list rows use 56 or 76 to align with text) |

### 9.2 Actions

**Button.** Heights: `lg` 52, `md` 44, `sm` 36 (with hitSlop). Radius `r12`. Label `label` variant, single line, centred, optional 20 pt leading or trailing icon with 8 pt gap. Horizontal padding 20 (`lg`), 16 (`md`), 12 (`sm`). Full width by default in footers.

| Kind | Rest | Pressed | Disabled |
|---|---|---|---|
| `primary` | fill `accent`, text `accentInk` | fill `accentPressed`, scale 0.97 | fill `sunken`, text `ink3` |
| `secondary` | fill `surface`, 1 px `lineStrong`, text `ink` | fill `sunken` | text `ink3`, border `line` |
| `tonal` | fill `accentSoft`, text `onAccentSoft` | 8% darker overlay | fill `sunken`, text `ink3` |
| `ghost` | no fill, text `accent` | fill `accentSoft` | text `ink3` |
| `danger` | fill `surface`, 1 px `bad`, text `onBadSoft` | fill `badSoft` | as secondary disabled |
| `onBrand` | fill `#FFFFFF`, text `#1E4FB8` (dark: fill `#6FA0FF`, text `#0B1530`) | opacity overlay 8% | 40% opacity |

Loading: label is replaced by a 20 pt spinner (`ActivityIndicator` in the text colour), width is held, `accessibilityState.busy`, taps ignored. One primary button per screen.

**IconButton.** 44x44, icon 24, kinds `plain` (no fill), `tonal` (`sunken` circle 40), `onBrand` (`brandChip` circle 40, white icon). Always has `accessibilityLabel`.

**TextLink.** `label` in `accent`, underlined on press only, min height 44 via padding.

### 9.3 Inputs

**TextField.** Label above (`label`, `ink`, 8 pt gap). Field height 56, radius `r12`, fill `surface`, border 1 px `lineField`; text `bodyLg`; placeholder `ink3`; horizontal padding 16; optional prefix (for example `+91` in `mono`, separated by a 1 px `line` rule) and trailing icon button. Helper text below in `caption` `ink2` (6 pt gap).
States: focus = 2 px `accent` border (no layout shift: border is drawn inside); error = 2 px `bad` border, helper replaced by error icon 16 plus message in `onBadSoft`; disabled = fill `sunken`, text `ink3`; read-only = fill `sunken`, text `ink`, lock icon trailing. Optional fields show "Optional" in `caption` `ink3` right-aligned on the label row.

**OtpInput.** Six cells 48 wide x 56 tall, gap 8, `r12`, `surface`, 1 px `lineField`, digit in `monoXl`. One hidden `TextInput` (`textContentType="oneTimeCode"`, `autoComplete="sms-otp"`, `keyboardType="number-pad"`) drives them. Active cell: 2 px `accent` border and a 2x24 blinking caret. Filled: border `lineStrong`. Error: all borders `bad` plus M15. Success: borders `ok` for 300 ms before navigation. Paste fills all six.

**SearchField.** Height 48, `pill`, fill `surface` (on `paper`) or `brandChip` with white text (on the band), leading `search` icon 20, placeholder `body` `ink3`, clear button when filled. On Home and Explore it is a button that opens S11, not an editable field.

**Chip.** Height 36, `pill`, horizontal padding 14, `label`. Unselected: `surface`, 1 px `lineStrong`, text `ink2`. Selected: `accentSoft`, no border, text `onAccentSoft`, leading check 16. Used for filters, interests, modes. `ChipGroup` wraps with 8 pt gaps; `ChipRow` scrolls horizontally with a 20 pt edge fade.

**Segmented.** Track height 44, `sunken`, `r12`, 4 pt padding; thumb `surface`, radius 8, `e1`; labels `label`, selected `ink`, unselected `ink2`. 2 to 4 segments, equal width. M8.

**SelectCard.** For the segment picker and radio-style choices: `surface`, `r16`, 1 px `line`, padding 20; leading 48 pt icon tile (`accentSoft`, `r12`, duotone icon 28 `onAccentSoft`); title `h3`; description `meta` `ink2`; trailing radio (24 pt ring `lineField`). Selected: 2 px `accent` border, radio filled `accent` with a white check. Whole card is the target.

**ToggleRow.** List row with a platform `Switch` (track on = `accent`).

**Stepper** (years of experience): secondary 44x44 minus and plus buttons around a `monoLg` value.

### 9.4 Display

**StatusPill.** Height 28, `pill`, padding 10, icon 16 plus `caption`. Variants (soft fill and matching on-colour): `requested` (info, `clock`, "Requested"), `confirmed` (ok, `check-circle`, "Confirmed"), `meet_failed` (warn, `warning`, "Link delayed"), `cancelled` (`sunken` and `ink2`, `close`, "Cancelled"), `completed` (teal, `check`, "Attended"), `no_show` (bad, `no-show`, "Missed"), `seat_requested` (info, `clock`, "Seat requested"). Labels come from `@fyt/domain` `STATUS_LABEL`.

**Tag.** Non-interactive, height 24, `r6`, padding 8, `caption`, fill `sunken`, text `ink2`. Used for tech stack words. Max 3 per card, then "+2".

**MetaRow.** A horizontal run of icon 16 plus `caption` items separated by 12 pt, `ink2`. Numbers inside are `monoSm`. Example: `[duration] 16 wk` · `[mode-online] Online` · `[star] 4.7`.

**Rating.** Azure filled star 16, value in `mono` `ink`. With `source` prop on detail screens it adds "FYT rating" in `caption` `ink3`. Hidden when no rating exists (never "0.0" or "New").

**SectionHeader.** Title `h2` left; optional `TextLink` "See all" right (44 pt target); optional one-line `meta` `ink2` caption below. 12 pt gap to content.

**TimeRail.** The signature layout primitive. Props: `time`, `sub`, `state` (`default | live | done | muted`), children.
- Left column: fixed 76 pt, right-aligned text: `time` in `monoLg` `ink` (for example `7:00 pm`), `sub` in `monoSm` `ink3` (for example `Thu 12`).
- Rail: 2 pt wide, 12 pt to the right of the column, full height of the row, `r` pill, colour by state: `default` `lineStrong`, `live` `ok`, `done` `teal`, `muted` `line`. A 10 pt node sits on the rail at the time's baseline: ring 2 pt of the rail colour, filled `surface` (`default`), filled solid (`live`, `done`).
- Content: starts 16 pt right of the rail.
- In a list, rails of consecutive rows join into one continuous line.

**SessionCard** (uses `TimeRail`). `surface`, `r16`, `e1`, padding 16. Content: title `h3` (2 lines max); line 2 `meta` `ink2`: provider or institute name; line 3 `MetaRow`: mode, duration; then the action row (12 pt above), which depends on `joinState`:

| `joinState` | Rail | Action row |
|---|---|---|
| `scheduled` (more than 24 h away) | default | `StatusPill`, right: chevron |
| `today` (under 24 h, over 60 min) | default | `StatusPill` plus "Starts in 3 h 20 min" (`caption`, time in mono) |
| `soon` (60 to 10 min) | default | Tonal chip "Starts in `24:10`" (mono countdown, updates each second) |
| `joinable` (10 min before start until end) | live | Primary `md` button "Join on Google Meet" with `video` icon, full width; above it a row: pulsing `ok` dot plus "Link is live" `caption` `onOkSoft` |
| `requested` | default | Info row: 2 pt indeterminate bar plus "Creating your Meet link" (`caption` `onInfoSoft`) |
| `meet_failed` | default, node `warn` | Warn row: "Link delayed. We are fixing it and will notify you." |
| `offline` (confirmed, classroom) | default | Secondary `md` button "Get directions" with `pin` icon |
| `ended`, `completed`, `no_show`, `cancelled` | done or muted | `StatusPill` only; title in `ink2` for cancelled |

Compact variant (`SessionRow`) for past lists: no card, 72 pt row with the rail, title `label`, one `caption` line, pill right.

**CourseCard** (carousel, 264 wide). `surface`, `r16`, `e1`, 1 px `line`. Top: `Cover` 16:10 with top corners `r16`; bookmark `IconButton onBrand` top right (hit 44). Body padding 16: title `h3` (2 lines, fixed 48 pt block so cards align); institute `meta` `ink2` (1 line); `MetaRow` (duration, mode, rating); divider; footer row: fee (`mono` `ink`, with `caption` `ink3` "course fee" below) left, and right the next batch as `caption` `onAccentSoft` on `accentSoft` tag "Starts `18 Nov`". If `showFees` is false the footer shows only the batch tag.

**CourseRow** (lists, results). Height auto, min 104. Left: `Cover` thumbnail 64 (`r12`). Right: title `h3` (2 lines), institute `meta` `ink2`, `MetaRow`, and a bottom line with fee `mono` left and "Starts `18 Nov`" `caption` `ink2` right. Trailing bookmark icon button. Rows sit in a `surface` `r16` group with inset dividers, or stand alone as cards with 12 pt gaps in results (use the grouped form on detail pages).

**ProviderCard** (carousel, 168 wide). `surface`, `r16`, `e1`, padding 16, centred: `Avatar` 56; name `h3` (1 line); headline `caption` `ink2` (2 lines, fixed block); `Rating`; first two expertise words as `Tag`s. **ProviderRow**: `Avatar` 56 left; name `h3`; headline `meta` `ink2`; `MetaRow` (experience `8 yr`, rating, type label for mentors and consultants); chevron.

**InstituteCard** (carousel, 264 wide): gallery cover 16:9 or a `navy` blueprint with the institute initial; body: `InstituteLogo` 40 overlapping the cover by 20 pt, name `h3`, `MetaRow` (`pin` area, `course` "12 courses" in mono). **InstituteRow**: logo 56, name, area, course count, chevron.

**CategoryTile.** 104 x 96, `surface`, `r16`, 1 px `line`, padding 12: duotone icon 28 `onAccentSoft` on a 44 pt `accentSoft` `r12` tile top-left; name `label` (2 lines) bottom. Home shows a horizontal row; Explore shows a 2-row horizontal grid. Not a 3x3 identical grid.

**ContinueCard** (Home, `learningProgress`). `surface`, `r16`, `e1`, padding 16, row: `ProgressRing` 56 left; right: eyebrow `micro` `onTealSoft` "ATTENDANCE", course title `h3`, `meta` `ink2` "6 of 24 sessions attended", then next session line `caption`: `[calendar]` "Next: `Thu 12 Nov`, `7:00 pm`". Tap opens the batch's next booking.

**ProgressRing.** SVG, sizes 40, 56, 88. Track `sunken` 4 pt (6 pt at 88), progress `teal`, round caps, starts at 12 o'clock. Centre: fraction in `mono` (`6/24`), never a percentage unless at least 4 sessions have happened. Accessible value "6 of 24 sessions attended".

**BatchCard** (course detail, batch picker). `surface`, `r16`, 1 px `line` (selected: 2 px `accent`), padding 16. Row 1: start date `monoLg` ("18 Nov") with `caption` `ink3` "starts" beside it; right: mode `Tag`. Row 2: days and time `mono` `ink2` ("Mon Wed Fri · 7:00 to 8:30 pm"). Row 3: `MetaRow`: trainer name, seats ("12 seats left" in `ink2`; under 6 seats: `warn` icon plus `onWarnSoft` "4 seats left"; 0: "Batch full", card disabled at 60% with no tap).

**DateStrip.** Horizontal, 14 days. Cell 56 x 72, `r12`: weekday `monoSm` `ink3` ("Thu"), day `monoLg` `ink` ("12"), a 4 pt dot `accent` under days with free slots. Selected: fill `accent`, text `accentInk`. Today: 1 px `accent` border when unselected. Days with no slots: text `ink3`, no dot, still tappable (shows the empty state). Month label `micro` `ink3` above the strip, updates as it scrolls.

**SlotCell.** 3-column grid, gap 8, height 48, `r12`, `surface`, 1 px `lineField`, time `mono` `ink` centred. Selected: fill `accentSoft`, 2 px `accent`, text `onAccentSoft`, check 16 at left. Unavailable: fill `sunken`, text `ink3` with strike-through, no border, not focusable, label "7:00 pm, booked". Groups titled `micro` `ink3`: MORNING (before 12), AFTERNOON (12 to 5), EVENING (after 5). All times end with a single "All times in IST" `caption` `ink3` line under the grid.

**InfoRow / KeyValue.** Label `meta` `ink2` left (fixed 112), value `body` `ink` right-aligned or left (prop), mono when numeric. 48 pt min height, inset divider.

**ListGroup + ListRow** (Profile, Settings). Group: `surface`, `r16`, 1 px `line`. Row: 56 min height, leading icon 20 in a 36 pt `sunken` `r12` tile (optional), title `body`, optional value `meta` `ink2` right, chevron 16 `ink3`. Destructive rows: title `onBadSoft`, no chevron.

**ReviewQuote.** No card. A 28 pt `accentSoft` circle with a quote glyph, then quote `bodyLg` `ink` (max 5 lines, "Read more" link), then author `label` and context `caption` `ink2` ("Placed at a Hyderabad fintech, MERN batch of Aug 2026"). Separated by dividers.

**CurriculumItem.** Uses a slim `TimeRail` (column 44): index in `mono` ("01"), title `label`, `caption` `ink2` "2 weeks · 6 sessions". Collapsible: chevron rotates 90 degrees (`dur.quick`), topics appear as a `meta` bullet list (fade only; height is not animated, the list simply reflows).

**StickyCtaBar.** `surface`, top hairline, `e2`, padding 12 / 20, plus bottom inset. Left block (flex): line 1 `monoLg` `ink` (fee or "Free demo" in `h3`), line 2 `caption` `ink2`. Right: primary `lg` button, min width 168. At 2.0x type it stacks.

**NotificationRow.** 72 min height. Leading 40 pt circle tile by type: booking (`accentSoft`, `bookings`), reminder (`okSoft`, `clock`), link (`okSoft`, `video`), alert (`warnSoft`, `warning`), announcement (`infoSoft`, `info`). Title `label` (2 lines), body `meta` `ink2` (2 lines), time `monoSm` `ink3` right-aligned on the title row ("2 h", "Mon"). Unread: 8 pt `accent` dot left of the tile and title in `ink`; read: title `ink2`.

### 9.5 Feedback

**EmptyState.** Centred in the available space, max width 300: 72 pt `accentSoft` circle with a 40 pt duotone icon `onAccentSoft`; title `h2`; body `body` `ink2` (2 to 3 lines) that says why it is empty and what to do; one button (`primary md` if it is the main path, else `tonal`). No illustration, no mascot.

**ErrorState.** Same layout; tile `badSoft`, icon `error` or `offline`; title; body; `secondary md` "Try again" with `refresh`. Below it, `TextLink` "Contact support" where the error is not a network one.

**InlineBanner.** Full width inside the gutter, `r12`, padding 12 / 14, icon 20 plus `meta` text plus optional `TextLink`. Tones: info, ok, warn, bad (soft fill, on-colour text). Used for offline ("You're offline. Showing saved sessions."), link delayed, policy notes.

**Toast.** Bottom, above the tab or CTA bar by 12, max width 420, `raised` in dark and `ink` background with `paper` text in light (inverse), `r12`, `e2`, icon 20, `meta`, optional action `TextLink` in `#A9C4FF`. One at a time.

**Skeleton.** `SkeletonBlock` (rect, `r6` to `r16`), `SkeletonText` (lines 12 pt high at 60 to 90% widths). Each list component exports a matching `.Skeleton` with identical outer dimensions so nothing jumps when data lands.

**GateScreen.** §10 S02 to S04.

### 9.6 Screen states (apply to every data screen)

| State | Rule |
|---|---|
| Loading (first) | Skeleton of the real layout within 100 ms. No full-screen spinners. If data arrives in under 300 ms, skip the skeleton fade |
| Refreshing | Keep content; `RefreshControl` only |
| Empty | `EmptyState` with a next action |
| Error (no cache) | `ErrorState` with retry |
| Error (with cache) | Keep content; `InlineBanner` warn "Couldn't refresh. Showing what we saved earlier." |
| Offline | Keep cached content; `InlineBanner` info; booking actions disabled with helper "Connect to the internet to book" |
| Partial | Sections render independently; a failed section collapses to a one-line retry row, it does not blank the screen |

---

## 10. Screen specs

Format: route, purpose, layout top to bottom, states, copy. `[...]` marks a component from §9. Student and corporate differences are called out where they exist.

### S01 Splash (`/`)

- Purpose: hold while Firebase, `config/public` and auth resolve. Visible spinner never exceeds 2 s.
- Layout: full-screen `BrandBand` (no rounded corners). Centre: `Wordmark` white, 72 pt mark; 16 pt below, "Find Your Trainer" in `h3` `onBrand`. Bottom, 48 pt above the inset: a 2 pt x 120 pt indeterminate bar `brandChip` with a white segment, shown only after 600 ms.
- States: after 8 s without config: replace the bar with `meta` `onBrandMuted` "This is taking longer than usual." and an `onBrand` `md` button "Try again". Offline with a cached session: go straight to Home.
- Motion: M18. Native splash config: background `#1E4FB8`, dark `#0F1A36`, white mark, so there is no flash between native and RN.

### S02 Update required (`/gate/update`)

- `GateScreen`: `paper`; top third a 96 pt `accentSoft` circle with duotone `refresh` 48; `h1` "Update FYT to continue"; `body` `ink2` "This version is no longer supported. Update to keep booking and joining sessions."; `mono` `ink3` "Your version `1.0.0` · Required `1.2.0`". Footer: primary `lg` "Update on the App Store" / "Update on Google Play". No dismiss, back is blocked.

### S03 Maintenance (`/gate/maintenance`)

- `GateScreen`: tile `infoSoft` with duotone `settings`; `h1` "We'll be back shortly"; `body` = `config.maintenance.message` or "FYT is down for scheduled maintenance."; if an end time exists: `InfoRow` "Back by" + `mono` "Today, 11:30 pm IST"; `InlineBanner` info "Sessions already booked are not affected. Use the Meet link from your email or SMS." Footer: secondary `lg` "Check again" (loading state), `TextLink` "Contact support".

### S04 Account blocked (`/gate/blocked`)

- `GateScreen`: tile `badSoft` with duotone `lock`; `h1` "Your account is on hold"; `body` = `blockedReason` or "Our team has paused this account. Contact support and we'll help you sort it out."; `ListGroup`: "Email support" (value = support email, opens mail with subject "Account on hold, +91 XXXXX X1234"), "Call support" (if `supportPhone`). Footer: `ghost` "Sign out".

### S05 Sign in (`/auth/phone`)

- Purpose: phone entry. This is also the welcome: one screen, not a tour.
- Layout:
  1. `BrandBand`, 44% of the screen height: `Wordmark` white top-left at the gutter (32 pt mark); bottom-left of the band, 24 pt above its edge: `display` `onBrand` "Find the right trainer. Book a live session." (max 3 lines), then `body` `onBrandMuted` "Software courses, trainers and institutes in Hyderabad, live on Google Meet or in the classroom."
  2. Form on `paper`, padding 24 / 20: `h2` "Enter your mobile number"; `TextField` label "Mobile number", prefix `+91`, `keyboardType="number-pad"`, `textContentType="telephoneNumber"`, `autoComplete="tel"`, max 10 digits rendered `mono` as `98765 43210`, helper "We'll text you a 6-digit code."
  3. Sticky footer above the keyboard: primary `lg` "Send code" (disabled until 10 valid digits starting 6 to 9); `caption` `ink3` centred: "By continuing you agree to the Terms and Privacy Policy." (two `TextLink`s).
- States: sending (button loading); errors under the field from `messageFor()`: invalid "That number doesn't look right. Enter the 10-digit mobile number."; too many requests; offline. When the keyboard opens the band collapses to 96 pt showing only the wordmark (`dur.base`).
- No social proof, no carousel, no skip.

### S06 Verify code (`/auth/otp`)

- Layout: `nav` top with back and no title. `h1` "Enter the code"; `body` `ink2` "Sent to `+91 98765 43210`." + `TextLink` "Change number". 32 pt. `OtpInput` (autofocus). 24 pt. Resend row: while counting, `meta` `ink2` "Resend code in `0:24`" (mono); at 0, `TextLink` "Resend code". Footer: primary `lg` "Verify" (auto-submits when the sixth digit lands; the button stays for accessibility).
- States: verifying (cells locked, button loading); wrong code: M15, "That code isn't right. Check the SMS and try again.", cells clear and refocus; expired: "That code has expired. Request a new one."; success: cells go `ok`, success haptic, route by session state. Android SMS auto-retrieval fills and submits.

### S07 Choose segment (`/onboarding/segment`)

- Layout: `none` top, 24 pt below the safe area a step indicator: `micro` `ink3` "STEP 1 OF 3" and a 3-segment progress bar (4 pt high, `sunken` track, `accent` fill, gap 4). `h1` "What brings you to FYT?"; `body` `ink2` "We'll tune your home feed. You can change this later in Profile." 24 pt. Two `SelectCard`s, gap 12:
  - Student: icon `student`, title "I'm a student", description "Find courses, institutes and free demo classes that lead to your first job."
  - Corporate: icon `consultant`, title "I'm a working professional", description "Upskill after work with weekend batches, mentors and career consultants."
- Footer: primary `lg` "Continue" (disabled until a choice). No default selection.

### S08 Your details (`/onboarding/details`)

One route, two steps (local state), shared header: back (step 2 goes to step 1; step 1 goes to S07), step bar "STEP 2 OF 3" / "STEP 3 OF 3".

**Step A, "About you".** `h1` "Tell us about you". Fields, 20 pt apart:

| Field | Student | Corporate | Input details |
|---|---|---|---|
| Full name | required | required | `textContentType="name"`, `autoCapitalize="words"`, max 80. Error: "Enter your name as you'd like trainers to see it." |
| Mobile number | read-only | read-only | Prefilled, lock icon |
| College or institution | required | hidden | Max 120. Placeholder "JNTU Hyderabad" |
| Current role | hidden | required | Max 80. Placeholder "QA Engineer" |
| Company | hidden | optional | Max 120 |
| Years of experience | hidden | required | `Stepper` 0 to 50, default 2 |
| Area | optional | optional | Tap opens an inline searchable list of Hyderabad areas (chips of the top 8, then a text filter). Helper "Used to show institutes near you." |
| Email | optional | optional | `keyboardType="email-address"`, helper (student) "For booking confirmations." / (corporate) "Meet invites are sent here too." |

Footer: primary `lg` "Next".

**Step B, "What you want to learn".** `h1` (student) "What do you want to learn?" / (corporate) "Which skills are you building?". `body` `ink2` "Pick at least one. This shapes your home feed."
- `SectionHeader` small (`label`): "Course interests" → `ChipGroup` of categories (max 10 selected).
- "Tech skills" → `ChipGroup` of tech stacks, first 12 shown, `TextLink` "Show all 34" expands (max 15 selected).
- Corporate only: a `Segmented` "When can you attend?" with "Weekday evenings", "Weekends", "Either" (stored locally as `preferredTime`; used as the default Explore filter).
- Counter `caption` `ink3` "3 selected".
- Footer: primary `lg` "Finish setup" (loading while `saveProfile` runs); on failure an `InlineBanner` bad above the button with the mapped message and field errors scrolled into view.
- On success: cross-fade to Home with a toast "You're all set, Ananya."

### S09 Home (`/home`)

Purpose: answer "what is my next session" first, then "what should I look at".

**Header (both segments).** `BrandBand`, expanded 196 pt plus the top inset, collapsing to 96 (M6):
- Row 1: left, `Avatar` 40 (opens Profile); centre-left, `caption` `onBrandMuted` greeting line and `h2` `onBrand` name: "Good evening," / "Ananya". Right: `IconButton onBrand` bell, with an 8 pt `#FFFFFF` dot (2 pt `brand` ring) at its top right when there are unread notifications; label "Notifications, 2 unread".
- Row 2 (fades on collapse): `body` `onBrandMuted`: student "Find a course and book a free demo." / corporate "Pick up where your upskilling plan left off."
- Row 3 (pins on collapse): `SearchField` on-band, placeholder student "Search courses, trainers, institutes" / corporate "Search skills, mentors, courses". Opens S11.

Greeting: "Good morning" before 12:00, "Good afternoon" 12:00 to 16:59, "Good evening" after, IST.

**Body, student order** (32 pt between sections, first section overlaps nothing, 24 pt below the band):

1. **Up next.** Only if a booking exists with status `requested`, `confirmed` or `meet_failed`. `SectionHeader` "Up next" + "All bookings". One `SessionCard` (the soonest). If more than one today: a `TextLink` row under it "2 more sessions today".
2. **Continue learning** (`learningProgress`, only if a reserved batch exists). `SectionHeader` "Continue learning". `ContinueCard` per batch (max 2, vertical).
3. **Browse by category.** `SectionHeader` "Browse by category" + "See all". Horizontal row of `CategoryTile` (8), ordered with the learner's `interests` first.
4. **Featured courses.** `SectionHeader` "Featured courses", caption "Picked by the FYT team". Carousel of `CourseCard` (max 8).
5. **Because you picked {interest}.** Only if a match exists: carousel of `CourseCard` filtered by the first interest. Title example "Because you picked Full stack".
6. **Institutes near you.** Title "Institutes near {area}" when `area` is set, else "Institutes in Hyderabad". Carousel of `InstituteCard` (max 6).
7. **Trainers.** `SectionHeader` "Top-rated trainers", caption "Book a free 1-on-1 demo". Carousel of `ProviderCard`.
8. **Mentors.** `SectionHeader` "Mentors", caption "People who do the job you want". Vertical `ProviderRow` list (3) in one `ListGroup`, with a footer row "See all mentors".
9. **Help strip.** A single `tonal`-style full-width row (`accentSoft`, `r16`, padding 16): `info` icon, `label` "Not sure where to start?", `meta` "Book a free call with a career consultant.", chevron. Opens Explore, Mentors tab, filtered to consultants.

**Body, corporate order:**

1. **Up next** (same).
2. **Continue learning** (same).
3. **Your upskilling plan.** `SectionHeader` "Your upskilling plan" + "Edit". A `surface` `r16` panel: `micro` `ink3` "SKILLS YOU'RE BUILDING", the learner's `skillsToLearn` as `Tag`s (max 6), then a divider and one line `meta` `ink2`: "`4` courses and `3` mentors match these skills." with `TextLink` "View matches" (opens Explore with those stacks pre-selected).
4. **After-work batches.** `SectionHeader` "Batches that fit your week", caption from `preferredTime`: "Weekday evenings after 7 pm" / "Saturday and Sunday" / "Evenings and weekends". Carousel of `CourseCard` whose next batch matches; the batch tag reads "Sat Sun · `10:00 am`".
5. **Mentors.** `SectionHeader` "Mentors for your next role", caption "1-on-1 guidance from senior engineers". Carousel of `ProviderCard` (mentor type shows `currentTitle, organisation` as the headline).
6. **Career consultants.** `ProviderRow` list (3) in a `ListGroup`, title "Career consultants", caption "Role change, salary and upskilling plans".
7. **Trainers.** Carousel of `ProviderCard`, title "Trainers for 1-on-1 sessions".
8. **Browse by category** (row, last).

Corporate has no "Institutes near you" on Home (reachable from Explore); student has no "upskilling plan".

- States: first load: band renders immediately with the cached name; body shows `SessionCard.Skeleton`, then a tile row skeleton and two carousel skeletons. Brand-new learner (no bookings, no batches): sections 1 and 2 are replaced by one **starter card** (`surface`, `r16`, `e1`, padding 20): `micro` `onAccentSoft` "START HERE", `h3` "Book your first free demo", `meta` `ink2` "Sit in on a live class before you commit to a course.", `tonal md` button "Browse courses". Catalog error: sections 3 onward collapse to `ErrorState` (compact) while "Up next" stays. Offline: banner under the band.
- Pull to refresh refetches bookings and catalog.

### S10 Explore (`/explore`)

- Top: `large` title "Explore". Under it, pinned on scroll: `SearchField` (button, opens S11) with a trailing `IconButton tonal` `filter` that opens S12 and shows a count dot `accent` with the number of active filters in `monoSm` white.
- `Segmented`-style scrollable tab strip (text tabs with a 2 pt `accent` underline that slides, `label`, 44 pt high): **Courses, Trainers, Institutes, Mentors**. Swipe between tabs is not enabled (carousels inside would conflict); tap only.
- Quick filter `ChipRow` under the tabs, per tab:
  - Courses: "Online", "Classroom", "Under 3 months", "Weekend batches", "Starts this month", then one chip per learner interest. Corporate: "Weekend batches" or "After 7 pm" is pre-selected from `preferredTime` (visible and removable, never hidden).
  - Trainers: "Online", "Classroom", then top expertise words.
  - Institutes: area chips, nearest first when `area` is set ("Ameerpet", "Madhapur", "Kukatpally", ...).
  - Mentors: "Mentors", "Consultants", then domains ("Backend", "Data", "DevOps", "Career switch").
- Result count line: `caption` `ink3` "`12` courses" left, sort control right (`TextLink` with `chevron` down: "Sort: Recommended"; opens an action sheet: Recommended, Starting soonest, Fee: low to high, Shortest first; fee option hidden when `showFees` is false).
- List (`FlashList`): `CourseRow` cards with 12 pt gaps / `ProviderRow` in grouped cards / `InstituteRow`.
- When no filter and no query is active on the Courses tab, the list is preceded by a 2-row horizontal `CategoryTile` grid titled "Categories".
- States: loading: 6 row skeletons. Empty with filters: `EmptyState` icon `filter`, "No courses match these filters", "Try removing a filter or two.", button `tonal` "Clear filters". Empty catalog (should not happen in fixtures): "Courses are on the way", "The FYT team is adding listings. Check back soon." Error: `ErrorState`.

### S11 Search (`/search`)

- Presentation: fade (150 ms), keyboard up immediately. Top row: editable `SearchField` (autofocus, `returnKeyType="search"`) and `TextLink` "Cancel".
- Empty query: "Recent searches" (max 5 rows with `clock` icon and a clear-all link; stored locally), then "Popular right now" as a `ChipGroup` from fixtures ("MERN Stack", "Java Full Stack", "Data Science", "DevOps with AWS", "Python", "UI/UX Design", "Selenium"). No fake trending counts.
- Typing (debounce 200 ms, client-side over the catalog index): grouped results, each group max 3 with a "See all 9 courses" row: COURSES (`CourseRow` compact: thumbnail 48, title with the matched substring in `ink` SemiBold and the rest in `ink2`), TRAINERS AND MENTORS (`Avatar` 40, name, headline), INSTITUTES (logo 40, name, area), and a top "SKILLS" group of matching tech stacks as chips that open Explore filtered.
- Submit: goes to Explore with the query applied; the search field there shows the query with a clear button.
- No results: `EmptyState` icon `search`: "No matches for \"kubernets\"", "Check the spelling, or search by skill, trainer or institute name.", `tonal` "Browse all courses".

### S12 Filters (`/explore/filters`, form sheet)

- Detents: 0.75 and 1.0. Header: `h2` "Filters" left, `TextLink` "Reset" right (disabled when nothing set).
- Sections (24 pt apart, each a `label` title and a `ChipGroup` or control), for the Courses tab:
  1. Category (multi)
  2. Tech stack (multi, first 10 plus "Show all")
  3. Mode: `Segmented` Any / Online / Classroom
  4. Duration: chips "Under 1 month", "1 to 3 months", "3 to 6 months", "Over 6 months"
  5. Batch timing: chips "Weekday mornings", "Weekday evenings", "Weekends"
  6. Type: `Segmented` Courses / Projects / Both (`CourseDoc.kind`)
  7. Fee (only if `showFees`): chips "Under ₹15,000", "₹15,000 to ₹40,000", "Over ₹40,000"
- Trainers and Mentors tabs: Expertise or Domain, Mode, Experience ("Under 5 yr", "5 to 10 yr", "Over 10 yr"). Institutes: Area, Category, Specialisation.
- Sticky footer: primary `lg` "Show `12` courses" (count updates live; "No matches" disabled state when 0).

### S13 Course detail (`/courses/[id]`)

- Top: transparent nav over the hero: `IconButton onBrand` back left; `share` and `bookmark` right. On scroll past the hero the nav becomes `surface` with the course title in `h3` (cross-fade over 40 pt of scroll, opacity only).
- Layout:
  1. **Hero.** `Cover` 16:9, full bleed, bottom corners `r24`. Kicker = category.
  2. **Title block** (padding 20, 20 pt below hero): `Tag` row: kind ("Course" or "Project") and level if present; `h1` title; institute row: `InstituteLogo` 40, name `label` `accent` (opens S15), area `caption` `ink2`.
  3. **Fact strip.** One `surface` `r16` panel with four equal cells divided by 1 px `line` rules (2x2 at 1.3x type): value in `monoLg`, label in `caption` `ink2`: `16 wk` Duration · `48` Live sessions · `Online + Class` Mode · `4.7` FYT rating (star). Cells with no data are omitted, never dashed.
  4. **About.** `SectionHeader` "About this course". `bodyLg` description clamped to 6 lines with "Read more".
  5. **What you'll be able to do.** Outcomes from `highlights` (max 8): rows with a 20 pt `teal` check and `body` text, 12 pt apart. No card.
  6. **Curriculum.** `SectionHeader` "Curriculum", caption "`8` modules · `16` weeks". `CurriculumItem` list, first open. "Show all 8 modules" after 5.
  7. **Tech you'll use.** `Tag` wrap of `techStack`.
  8. **Your trainer.** `ProviderRow` in a `surface` card with a `tonal sm` button "View profile"; if several, a list.
  9. **Upcoming batches** (`batches`). `SectionHeader` "Upcoming batches", caption "Reserve a seat for free. The institute confirms within one working day." Up to 3 `BatchCard`s, each with a trailing `tonal sm` "Reserve seat" (opens S16 in batch mode with that batch preselected). "See all 5 batches" link.
  10. **What learners said** (`showReviews`). `Rating` with `source`; `caption` `ink3` "Collected by the FYT team". Up to 3 `ReviewQuote`s.
  11. **The institute.** `InstituteCard` full width (cover 16:9) with `MetaRow` and a "View institute" row.
  12. **Good to know.** `ListGroup` of `InfoRow`s: "Demo class" → "Free, `60 min`"; "Certificate" → value from fixture or omitted; "Course fee" → `₹38,000` + `caption` "Paid directly to the institute. FYT does not collect fees."; "Language" → "English, Telugu".
  13. **Similar courses.** Carousel of `CourseCard`.
- `StickyCtaBar`: left `monoLg` `₹38,000` and `caption` "course fee" (if `showFees`; else `h3` "Free demo" and `caption` "`60 min` · online or classroom"). Right: primary `lg` "Book a free demo". If the learner already has an active demo booking for this course, the button becomes `tonal` "View your booking".
- States: skeleton (hero block, 2 text lines, fact strip, 4 lines). Not found or unpublished: `EmptyState` "This course is no longer listed", `tonal` "Browse courses". Error: `ErrorState`. Offline with cache: banner, CTA disabled with helper.

### S14 Provider profile (`/providers/[id]`), trainer, mentor or consultant

- Top: `nav` with back, share, bookmark.
- Layout:
  1. **Header** (padding 20): `Avatar` 88 left; right: name `h1` (2 lines), headline `body` `ink2`; below, full width: `MetaRow` in `caption`: type label with icon ("Trainer" / "Mentor" / "Career consultant"), `8 yr` experience, `Rating`. For mentors with `currentTitle`: a line `label` "Staff Engineer, a Hyderabad product company" above the meta row.
  2. **Session panel** (`accentSoft`, `r16`, padding 16, no border): `micro` `onAccentSoft` by type: "FREE 1-ON-1 DEMO" / "MENTORSHIP SESSION" / "CONSULTATION"; `label` `ink` "`45 min` · Online on Google Meet" (or "Online or in person, Madhapur"); `meta` `ink2` = `session.about`.
  3. **About.** `bodyLg` bio, clamp 6 lines.
  4. **Expertise** (trainers, mentors) or **Specialisations** (consultants): `Tag` wrap.
  5. **Courses by {first name}** (trainers): `CourseRow` group. Mentors: **Can help you with**: bullet rows with `teal` checks ("Backend system design interviews", "Moving from support to development"). Consultants: **How it works**: three numbered rows using the slim `TimeRail` ("01 Share your background", "02 Get a role and skills plan", "03 Pick courses that fit").
  6. **Teaches at** (if linked to institutes): `InstituteRow` group.
  7. **What learners said** (`showReviews`): as S13.
- `StickyCtaBar`: left `h3` "Free" (or `monoLg` fee if a paid session fixture and `showFees`) with `caption` "`45 min` session"; right primary `lg`: trainer "Book 1-on-1 demo", mentor "Book mentorship", consultant "Book consultation".
- Corporate emphasis: for mentors and consultants the session panel is placed above About (as specified). For student viewers of a trainer, "Courses by" moves above About.

### S15 Institute profile (`/institutes/[id]`)

- Top: transparent nav over the gallery.
- Layout:
  1. **Gallery.** Paged horizontal `expo-image` carousel, 16:10, page dots (6 pt, white 40% / 100%) bottom centre, counter `monoSm` white on `rgba(11,21,48,0.6)` pill bottom right ("2/6"). No images: `navy` blueprint with the institute initial.
  2. **Identity** (padding 20): `InstituteLogo` 56 overlapping the gallery by 28; name `h1`; `MetaRow`: `pin` "Ameerpet, Hyderabad", `course` "`12` courses", `Rating` if present.
  3. **Action row.** Three equal `secondary md` buttons with icons: "Call", "Directions", "Website" (omit any that lack data; two buttons then split the width).
  4. **About.** `bodyLg`, clamp 6.
  5. **Courses offered.** `SectionHeader` + category `ChipRow` filter, then `CourseRow` group (5, then "See all 12 courses" opening Explore filtered to this institute).
  6. **Trainers here.** Carousel of `ProviderCard`.
  7. **Specialisations.** `Tag` wrap.
  8. **Visit.** `surface` `r16` panel: address `body`, `caption` `ink2` "Mon to Sat, `9:00 am` to `8:00 pm`" (fixture; omit if unknown), `tonal md` "Open in Maps". No embedded map.
  9. **Contact.** `ListGroup`: phone (`mono`), email, website.
- No sticky bar (an institute is not bookable; its courses are).

### S16 Slot or batch picker (`/book/[targetType]/[targetId]`)

`targetType` is `course`, `provider`, or `batch` (via `?mode=batch&batchId=`).

**Slot mode (demo, mentorship, consultation).**
- Top: `nav`, title "Pick a time".
- Layout:
  1. **Target summary**: a compact row: `Cover` thumbnail 48 or `Avatar` 48; title `label` (1 line); `caption` `ink2`: "Free demo · `60 min`".
  2. **Mode** (only if both modes): `Segmented` "Online" / "Classroom". Under it `caption` `ink2`: online "You'll get a Google Meet link." / classroom "At Vidyarth Tech Academy, Ameerpet."
  3. **DateStrip** (14 days from today, first day with slots preselected).
  4. **Slots**: `SlotCell` groups for the chosen day. "All times in IST".
  5. `InlineBanner` info (once, dismissible, stored): "Sessions run on Google Meet. You don't need the Meet app to join."
- `StickyCtaBar`: left `label` `ink` = selection summary "Thu `12 Nov`, `7:00 pm`" (or `meta` `ink3` "Pick a date and time"); right primary `lg` "Continue" (disabled until a slot is selected). Opens S17.
- States: loading: date strip skeleton plus 9 slot skeletons. Day with no slots: compact `EmptyState` inside the slot area: "No slots on Thu 12 Nov", `TextLink` "Next available: Sat `14 Nov`" (jumps the strip). All 14 days empty: "No slots in the next two weeks", "We'll add more soon. Meanwhile, you can reserve a seat in a batch.", `tonal` "See batches" (courses) or "Contact support". Slot taken while choosing (`SLOT_TAKEN`): the cell turns unavailable with M15 on the grid, toast "That slot was just booked. Pick another time."
- Offline: banner, cells disabled.

**Batch mode.**
- Title "Reserve a seat". Target summary as above with "Free to reserve". Then a vertical list of selectable `BatchCard`s (radio behaviour). `InlineBanner` info: "Reserving is free. The institute will call you to confirm and share fee details."
- `StickyCtaBar`: left = selected batch "Starts `18 Nov` · Mon Wed Fri"; right primary `lg` "Continue".

### S17 Confirm booking (`/book/confirm`, form sheet)

- Detent: fit to content, max 0.9. Header `h2` "Confirm your booking".
- Layout:
  1. **Summary ticket** (`sunken`, `r16`, padding 16): a `TimeRail` row: time `7:00 pm`, sub `Thu 12 Nov`; content: title `h3`, `meta` `ink2` provider or institute, `MetaRow` mode and duration. For batches: time = start date `18 Nov`, sub `starts`, and the content adds "Mon Wed Fri · `7:00` to `8:30 pm`".
  2. `InfoRow`s: "Session type" → "Free demo"; "Where" → "Google Meet (link in the app)" or the address; "Fee" → "Free".
  3. **Email** (online only, if the profile has none): `TextField` "Email for the calendar invite", optional, helper "We'll also show the link in the app."
  4. **Note** (optional): `TextField` multiline, 3 rows, label "Anything the trainer should know?", placeholder "For example: I know basic JavaScript and want to see how the React module is taught.", counter `monoSm` "0/300".
  5. Policy line `caption` `ink2` with `info` icon: "You can cancel up to `4 hours` before the session." (`config.cancelWindowHours`).
- Footer: primary `lg` "Confirm booking" (batch: "Reserve my seat"); `ghost md` "Change time" closes the sheet.
- States: submitting (button loading, sheet not dismissible); `SLOT_TAKEN`: sheet closes, S16 shows the taken state; limit reached: `InlineBanner` warn in the sheet "You already have 3 upcoming demos. Attend or cancel one to book another." (limit from config); network: banner bad with "Try again".
- Success: replace to S18.

### S18 Booking confirmed (`/book/success?bookingId=`)

- Full screen, no nav bar, back goes to Bookings.
- Layout:
  1. `BrandBand` 46% height. Centred: tick badge (72 pt white circle, `accent` tick drawn, M13); `display` `onBrand` "You're booked" (batch: "Seat requested"); `body` `onBrandMuted` online: "We're creating your Google Meet link. It'll appear here and in Bookings." / classroom: "See you at the institute. Directions are in your booking." / batch: "The institute will call you within one working day."
  2. **Ticket** overlapping the band by 40 pt: `surface`, `r20`, `e2`, padding 20. `TimeRail` row (as S17). A dashed 1 px `line` separator with two 16 pt `paper` half-circles cut into the left and right edges (ticket notch). Below: `InfoRow`s "Booking ref" → `mono` `FYT-7K2M9Q` with a `copy` icon button; "Status" → `StatusPill`; and the Meet link row (M10): creating state or "Link ready" with `TextLink` "Copy link".
  3. Tip row `meta` `ink2` with `bell` icon: "We'll remind you `1 hour` and `10 minutes` before." If notifications are off: a `tonal sm` button "Turn on reminders" (this is the just-in-time permission prompt; never ask at launch).
- Footer: primary `lg` "View booking" (to S20); `ghost md` "Back to home".

### S19 Bookings (`/bookings`)

- Top: `large` title "Bookings". `Segmented`: "Upcoming" / "Past".
- **Upcoming**: grouped by day with sticky `micro` `ink3` headers: "TODAY", "TOMORROW", then "THU 12 NOV". Under each, `SessionCard`s whose rails join into one line per day. Reserved batches appear first under a header "YOUR BATCHES" as `ContinueCard`s.
- **Past**: `SessionRow`s grouped by month ("OCTOBER 2026"), each with its pill (Attended, Missed, Cancelled). Tapping opens S20. Attended rows show a `tonal sm` "Book again" on the detail screen, not in the list.
- States: loading: 3 `SessionCard.Skeleton`. Upcoming empty: `EmptyState` icon `bookings`: "No sessions yet", "Book a free demo to see a class before you join a course.", primary `md` "Find a course". Past empty: "Nothing here yet", "Sessions you attend will show up here." (no button). Offline: info banner "You're offline. Showing saved sessions.", cards remain and Join still opens the cached link. Error without cache: `ErrorState`.
- A joinable session pins to the very top above the day groups with the header "HAPPENING NOW".

### S20 Session detail (`/bookings/[id]`)

- Top: `nav`, title "Booking", action `share` (shares date, time and link as text).
- Layout:
  1. **Status header** (padding 20): `StatusPill`; `h1` title; `meta` `ink2` "with Priya Raman · Vidyarth Tech Academy" (names are links).
  2. **When** panel (`surface`, `r16`, padding 16): `TimeRail` large: time `monoXl` `7:00 pm`, sub `mono` "to `8:00 pm` IST"; content: `h3` "Thursday, 12 November", `caption` `ink2` relative: "In 2 days" / "Today, in `3 h 20 min`" / "Started `4 min` ago". `TextLink` "Add to calendar" (creates an `.ics` share via the OS share sheet; no calendar permission).
  3. **Join panel** (online), driven by `joinState`:
     - `requested`: `infoSoft` panel, indeterminate bar, `label` "Creating your Meet link", `meta` "This usually takes under a minute. We'll notify you."
     - `scheduled` / `today` / `soon`: `surface` panel: `video` tile, `label` "Google Meet", `meta` `ink2` "The Join button turns on `10 minutes` before the start."; primary `lg` disabled "Join on Google Meet"; under it `TextLink` "Copy link" (always available once a link exists). In `soon`, the helper becomes a mono countdown "Opens in `14:32`".
     - `joinable`: `okSoft` panel: pulsing dot + `label` `onOkSoft` "Your session is live"; primary `lg` "Join on Google Meet" (opens the link with `Linking.openURL`; never embedded); `TextLink` "Copy link".
     - `meet_failed`: `warnSoft` panel: `label` "Link delayed", `meta` "We couldn't create the Meet link automatically. Our team is on it and you'll get a notification the moment it's ready.", `secondary md` "Contact support".
     - `ended` (past end, no outcome yet): `sunken` panel: "This session has ended."
  4. **Where** (classroom): address `body`, `secondary md` "Get directions", `caption` `ink2` "Reach `10 minutes` early and ask for the front desk."
  5. **Details** `ListGroup`: "Booking ref" (`mono`, copy); "Session type"; "Duration" (`mono`); "Mode"; "Booked on" (`mono`); "Your note" (if any, multi-line).
  6. **Trainer or institute**: `ProviderRow` or `InstituteRow` card.
  7. **Need to change something?** `ListGroup`: "Cancel booking" (destructive row; shown only when `userCanCancel` is true), else a `caption` `ink2` line "Cancellation closed `4 hours` before the session. Contact support if you can't make it."; "Contact support".
  - For `completed`: the join panel is replaced by a `tealSoft` panel "You attended this session." with `tonal md` "Book again" and, for course demos, `primary md` "Reserve a seat in a batch". For `no_show`: `badSoft` panel "You missed this session." with `tonal md` "Book another time". For `cancelled`: `sunken` panel "Cancelled on `10 Nov`" with reason, `tonal md` "Book again".
- **S20b Cancel** (form sheet, fit): `h2` "Cancel this booking?"; summary line; reason chips (single): "Schedule clash", "Booked by mistake", "Found another course", "Other"; optional note; footer: `danger lg` "Cancel booking", `ghost md` "Keep booking". After: sheet closes, toast "Booking cancelled." Warning haptic. No undo (the slot is released), which is why the sheet confirms.
- States: skeleton; not found: `EmptyState` "We couldn't find this booking"; live updates: status changes animate per M10.

### S21 Notifications (`/notifications`)

- Top: `nav`, title "Notifications", action `TextLink` "Mark all read" (hidden when none unread).
- If push permission is off: `InlineBanner` info at top "Reminders are off. Turn on notifications so you don't miss a session." + `TextLink` "Turn on".
- List grouped "TODAY", "EARLIER THIS WEEK", "OLDER": `NotificationRow`s. Tap marks read and opens the linked route. Swipe left reveals "Delete" (also available via long-press menu, so it is not gesture-only).
- Empty: `EmptyState` icon `bell`: "You're all caught up", "Booking updates and session reminders will appear here."

### S22 Profile (`/profile`)

- Top: `large` title "Profile", action `IconButton` `settings`.
- Layout:
  1. **Identity card** (`surface`, `r16`, `e1`, padding 20): `Avatar` 56; name `h2`; `mono` `ink2` phone `+91 98765 43210`; segment `Tag` with icon: "Student" / "Working professional"; trailing `tonal sm` "Edit".
  2. **Profile completeness** (only if under 100%): slim row: 4 pt bar (`sunken` track, `teal` fill), `caption` "Profile `60%` complete" and `TextLink` naming the next step: "Add your education".
  3. **Learning** `ListGroup`: "My bookings" (value: upcoming count in mono), "Saved" (count), "Interests and skills".
  4. **About you**, student: "College" (value), "Education" (count or "Add"), "Area". Corporate: "Current role", "Company", "Experience" (`mono` "`5 yr`"), "Work history", "Area".
  5. **App** `ListGroup`: "Notifications", "Appearance" (value: System / Light / Dark), "Help and support", "About FYT".
  6. `ghost md` "Sign out" (OS alert: "Sign out of FYT?" / "Sign out" / "Cancel").
  7. Footer `monoSm` `ink3` centred: "FYT `1.0.0` (`42`)" plus an environment badge on non-prod.

### S23 Edit profile (`/profile/edit`)

- `nav`: back, title "Edit profile", action `TextLink` "Save" (disabled until dirty; loading state).
- Sections with `label` headers: **Basics** (name, email, area), **Segment** (`Segmented` Student / Working professional; changing it shows an `InlineBanner` info "Your home feed will switch to the {segment} view."), then the segment fields from S08, **Interests** and **Skills** (chip editors with counts), **Education** (student first) and **Experience** (corporate first): each a list of entries (`label` title line, `caption` years in mono) with "Add education" / "Add experience" `tonal md` buttons opening an inline form (institution, degree, field, start and end year as mono number fields; company, title, years, "I work here now" toggle).
- Leaving with unsaved changes: OS alert "Discard changes?" / "Discard" / "Keep editing".
- Save success: toast "Profile updated." Field errors inline from `fieldErrors`.

### S24 Settings (`/profile/settings`)

- `nav` title "Settings". Groups:
  - **Notifications**: `ToggleRow` "Session reminders" (helper "1 hour and 10 minutes before"), "Booking updates", "Announcements". If OS permission is denied: the group is replaced by an explainer row and `tonal md` "Open system settings".
  - **Appearance**: three radio rows: "Match system", "Light", "Dark" (persisted).
  - **Help**: "Contact support" (opens mail to the support address, §12.6), "Call support" (if configured), "Frequently asked questions" (static screen from fixtures).
  - **Legal**: "Terms of use", "Privacy policy" (open in the system browser), "Open-source licences" (lists Open Sauce One and JetBrains Mono, SIL OFL 1.1, and Phosphor Icons, MIT).
  - **Account**: "Delete account" (destructive row).

### S25 Saved (`/profile/saved`)

- `nav` title "Saved". `Segmented` Courses / Trainers / Institutes. Lists of the matching rows with filled bookmarks; un-saving shows a toast "Removed from Saved." with "Undo". Empty: `EmptyState` icon `bookmark`: "Nothing saved yet", "Tap the bookmark on a course or trainer to keep it here.", `tonal` "Explore courses". Saved items are stored locally in this phase.

### S26 Delete account (`/profile/delete`)

- `nav` title "Delete account". `h1` "Delete your FYT account?"; `body` `ink2` "This removes your profile and cancels your upcoming bookings. It can't be undone."; bullet rows with `error` icons in `onBadSoft`: "Your `2` upcoming bookings will be cancelled", "Your saved courses and history will be erased", "You'll need to sign up again to use FYT". `TextField` "Type DELETE to confirm" (`autoCapitalize="characters"`). Footer: `danger lg` "Delete my account" (enabled only on exact match; loading), `ghost md` "Keep my account".

### S27 Design gallery (`/dev/gallery`, non-prod)

- Sections for every token (swatches with hex and measured contrast), type variants, every component in every state, light and dark side by side via a local toggle. This is the visual test bed for §15.

---

## 11. Copy rules

- Sentence case everywhere. Buttons are verb plus object ("Book a free demo", "Reserve seat", "Send code"). Never "Submit", "OK", "Click here".
- Plain, exact, warm without cheerleading. No "Oops", no exclamation marks, no emoji, no em dashes.
- Errors: what happened, then what to do. Blame the system, not the learner. All backend errors go through `messageFor(code)`; never show raw codes.
- Empty states: why it is empty plus the next action.
- Numbers: times as `7:00 pm` (lowercase, non-breaking space), dates as `Thu 12 Nov` (short) or "Thursday, 12 November" (long), durations `16 wk`, `60 min`, `8 yr` in compact places and spelled out in sentences. Currency `₹38,000`. Timezone "IST" stated once per screen that shows times.
- Vocabulary (one word per thing): "session" (a single meeting), "demo" (a free trial session), "batch" (a scheduled run of a course), "booking" (the learner's reservation), "trainer", "mentor", "career consultant", "institute", "course fee". Never "class" and "session" for the same thing on one screen.
- Student voice: first job, demo classes, placement. Corporate voice: upskilling, after work, next role. Same tone, different nouns.
- All strings live in `src/lib/copy.ts` (typed dictionary, `en` only), keyed by screen, so Phase 2 localisation is a file swap.

---

## 12. Fixture data

Location: `src/fixtures/` (one file per entity, plus `index.ts`). Served through a `CatalogRepo` and `BookingsRepo` interface in `src/backend/` with a `fixture` implementation, read by TanStack Query hooks (`useCourses`, `useCourse(id)`, `useProviders`, `useInstitutes`, `useBookings`, `useNotifications`). Each fixture call resolves after a 350 ms delay so skeletons are exercised; a dev menu in S27 can force `empty`, `error` and `offline` per query. Shapes extend the Firestore docs so the real repo is a drop-in.

All names below are fictional. Before release, confirm no institute name collides with a real business.

### 12.1 Types

```ts
type Id = string;
type Mode = "online" | "offline";
type CoverKey = "azure" | "navy" | "teal" | "sky";

interface Category { id: Id; name: string; icon: IconName; cover: CoverKey; code: string }

interface Institute {            // extends InstituteDoc
  id: Id; name: string; area: string; address: string; mapsUrl?: string;
  phone: string; email: string; website?: string; about: string;
  categories: Id[]; specializations: string[];
  gallery: { url: string }[];    // may be empty: blueprint fallback
  hours?: string;                // fixture only
  rating?: number;               // admin-entered, fixture only for institutes
  featured: boolean;
}

interface Provider {             // extends ProviderDoc
  id: Id; type: "trainer" | "mentor" | "consultant";
  name: string; headline: string; bio: string;
  expertise: string[]; domain?: string; specializations?: string[];
  yearsExperience: number; currentTitle?: string; organisation?: string;
  city: string;                  // fixture only
  rating?: number;
  reviewSnippets: { quote: string; author: string; context?: string }[];
  session: { minutes: number; modes: Mode[]; about: string };
  helpsWith?: string[];          // fixture only (mentors)
  instituteIds: Id[]; photoUrl?: string; featured: boolean;
}

interface CurriculumModule { index: number; title: string; weeks: number; sessions: number; topics: string[] }

interface Batch {                // fixture only (flag: batches)
  id: Id; courseId: Id; startDate: string;          // ISO date, IST
  days: ("Mon"|"Tue"|"Wed"|"Thu"|"Fri"|"Sat"|"Sun")[];
  startTime: string; endTime: string;               // "19:00", "20:30" IST
  mode: Mode; trainerId: Id; seatsTotal: number; seatsLeft: number;
  timing: "weekday_morning" | "weekday_evening" | "weekend";
}

interface Course {               // extends CourseDoc
  id: Id; kind: "course" | "project"; title: string; code: string;  // code = cover stack code
  categoryId: Id; instituteId: Id; trainerIds: Id[];
  techStack: string[]; durationWeeks: number; liveSessions: number;
  modes: Mode[]; level: "Beginner" | "Intermediate" | "Advanced";
  description: string; highlights: string[]; curriculum: CurriculumModule[];
  demoMinutes: number; languages: string[];
  feeInr?: number;               // fixture only (flag: showFees)
  certificate?: string;          // fixture only
  rating?: number; reviewSnippets: { quote: string; author: string; context?: string }[];
  coverUrl?: string; featured: boolean;
}

interface Slot { id: Id; targetType: "course" | "provider"; targetId: Id; start: number; end: number; mode: Mode; available: boolean }

type BookingStatus = "requested" | "confirmed" | "meet_failed" | "cancelled" | "completed" | "no_show";
interface Booking {              // extends bookings/{id}
  id: Id; ref: string;           // "FYT-7K2M9Q"
  kind: "demo" | "mentorship" | "consultation" | "batch_seat";
  targetType: "course" | "provider"; targetId: Id; title: string;
  providerId?: Id; instituteId?: Id; batchId?: Id;
  start: number; end: number; mode: Mode; status: BookingStatus;
  meetUrl?: string; venue?: { address: string; area: string; mapsUrl?: string };
  note?: string; createdAt: number; cancelledAt?: number; cancelReason?: string;
}

interface Enrolment { id: Id; courseId: Id; batchId: Id; sessionsTotal: number; sessionsAttended: number; nextSessionStart?: number } // flag: learningProgress

interface AppNotification {
  id: Id; type: "booking" | "reminder" | "link" | "alert" | "announcement";
  title: string; body: string; createdAt: number; read: boolean; route?: string;
}

type JoinState = "requested" | "scheduled" | "today" | "soon" | "joinable" | "ended" | "meet_failed" | "offline";
// joinStateFor(booking, now): pure function in src/features/bookings/joinState.ts, unit tested.
// joinable = online && confirmed && now >= start - 10 min && now < end.
```

Times in fixtures are **relative to now** so the join states are always demonstrable: use `at(dayOffset, "HH:mm")` (IST) and `inMinutes(n)` helpers in `src/fixtures/time.ts`.

### 12.2 Categories (8)

| id | name | code | cover | icon |
|---|---|---|---|---|
| `cat_fullstack` | Full stack development | `MERN` | azure | `course` |
| `cat_java` | Java and backend | `JAVA` | azure | `course` |
| `cat_data` | Data science and AI | `DS` | teal | `course` |
| `cat_python` | Python | `PY` | teal | `course` |
| `cat_devops` | DevOps and cloud | `OPS` | navy | `course` |
| `cat_testing` | Software testing | `SDET` | sky | `course` |
| `cat_design` | UI/UX design | `UX` | sky | `course` |
| `cat_mobile` | Mobile development | `RN` | sky | `course` |

Pick a distinct Phosphor duotone icon per category when building the `Icon` map (for example Stack, Coffee, ChartLineUp, Terminal, CloudArrowUp, Bug, PenNib, DeviceMobile).

### 12.3 Institutes (6)

| id | Name | Area | Phone | Courses | Rating |
|---|---|---|---|---|---|
| `ins_vidyarth` | Vidyarth Tech Academy | Ameerpet | `+91 40 4000 1101` | 4 | 4.6 |
| `ins_codekshetra` | CodeKshetra Institute | Madhapur | `+91 40 4000 1102` | 3 | 4.7 |
| `ins_deccan` | Deccan Data Labs | Gachibowli | `+91 40 4000 1103` | 2 | 4.8 |
| `ins_nexora` | Nexora Cloud School | Kukatpally | `+91 40 4000 1104` | 2 | 4.5 |
| `ins_saraswathi` | Saraswathi Software Training | SR Nagar | `+91 40 4000 1105` | 2 | 4.4 |
| `ins_pixel` | Pixel Patashala Design Studio | Kondapur | `+91 40 4000 1106` | 1 | 4.7 |

Addresses use street and landmark only ("2nd Floor, Aditya Enclave, Ameerpet Main Road, Hyderabad"). Emails use `@example.in` until real listings exist. Hours "Mon to Sat, 9:00 am to 8:00 pm". Areas list for onboarding: Ameerpet, SR Nagar, Madhapur, Hitech City, Gachibowli, Kondapur, Kukatpally, KPHB, Dilsukhnagar, Secunderabad, Begumpet, Uppal.

### 12.4 Providers (10)

| id | Type | Name | Headline | Exp | City | Rating | Session |
|---|---|---|---|---|---|---|---|
| `prv_priya` | trainer | Priya Raman | MERN and system design trainer | 9 yr | Hyderabad | 4.8 | 60 min, online + offline |
| `prv_suresh` | trainer | Suresh Goud | Core Java, Spring Boot and microservices | 14 yr | Hyderabad | 4.7 | 60 min, offline + online |
| `prv_meera` | trainer | Dr. Meera Krishnan | Data science, ML and statistics | 11 yr | Hyderabad | 4.9 | 60 min, online |
| `prv_imran` | trainer | Imran Sheikh | DevOps, AWS and Kubernetes | 10 yr | Pune | 4.6 | 45 min, online |
| `prv_lavanya` | trainer | Lavanya Chowdary | Selenium, Playwright and API testing | 8 yr | Hyderabad | 4.6 | 60 min, online + offline |
| `prv_arjun` | trainer | Arjun Nair | Product design and Figma | 7 yr | Bengaluru | 4.7 | 45 min, online |
| `prv_vikram` | mentor | Vikram Deshpande | Staff Engineer, payments platform | 13 yr | Bengaluru | 4.9 | 45 min, online |
| `prv_sana` | mentor | Sana Farooqui | Senior Data Scientist, healthcare analytics | 9 yr | Hyderabad | 4.8 | 45 min, online |
| `prv_ramesh` | consultant | Ramesh Babu Yadav | Career consultant for freshers and career gaps | 16 yr | Hyderabad | 4.6 | 30 min, online + offline |
| `prv_divya` | consultant | Divya Menon | Mid-career switches into product and data roles | 12 yr | Chennai | 4.7 | 30 min, online |

Each has a 3 to 5 sentence bio, 4 to 6 expertise words, and 2 or 3 review snippets. Example snippets (attributed by first name and initial plus context, never a company name):

- `{ quote: "Priya makes you build the whole app, not copy it. The code reviews were the most useful part.", author: "Sai Teja K.", context: "MERN batch, Aug 2026" }`
- `{ quote: "I finally understood why my Spring services were slow. Suresh sir draws everything out before writing a line.", author: "Harika P.", context: "Java Full Stack, weekend batch" }`
- `{ quote: "One 45 minute call saved me from taking the wrong course. Vikram told me exactly what backend interviews check for.", author: "Karthik I.", context: "QA Engineer, 5 years" }`
- `{ quote: "Ramesh sir helped me explain a two year gap honestly. I got three interview calls in a month.", author: "Nikhitha R.", context: "B.Tech 2023 graduate" }`

Mentor `helpsWith` examples: "Backend system design interviews", "Moving from testing to development", "Planning a 6 month upskilling path", "Reviewing your resume for product companies".

### 12.5 Courses (10) and batches

| id | Title | Code | Category | Institute | Trainer | Weeks | Sessions | Modes | Level | Fee | Rating |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `crs_mern` | MERN Stack with Real Projects | `MERN` | fullstack | Vidyarth | Priya | 16 | 48 | both | Beginner | ₹38,000 | 4.7 |
| `crs_java` | Java Full Stack with Spring Boot | `JAVA` | java | Vidyarth | Suresh | 20 | 60 | both | Beginner | ₹42,000 | 4.6 |
| `crs_ds` | Data Science with Python and ML | `DS` | data | Deccan | Meera | 24 | 72 | online | Intermediate | ₹65,000 | 4.8 |
| `crs_genai` | Generative AI for Developers | `GENAI` | data | Deccan | Meera | 8 | 24 | online | Intermediate | ₹28,000 | 4.8 |
| `crs_devops` | DevOps with AWS and Kubernetes | `OPS` | devops | Nexora | Imran | 12 | 36 | online | Intermediate | ₹35,000 | 4.6 |
| `crs_aws` | AWS Solutions Architect Prep | `AWS` | devops | Nexora | Imran | 8 | 24 | online | Intermediate | ₹22,000 | 4.5 |
| `crs_python` | Python Programming from Scratch | `PY` | python | Saraswathi | Meera | 8 | 24 | both | Beginner | ₹12,000 | 4.5 |
| `crs_sdet` | Automation Testing with Selenium and Playwright | `SDET` | testing | Saraswathi | Lavanya | 12 | 36 | both | Beginner | ₹24,000 | 4.6 |
| `crs_ux` | UI/UX Design with Figma | `UX` | design | Pixel Patashala | Arjun | 12 | 36 | both | Beginner | ₹30,000 | 4.7 |
| `crs_rn` | React Native App Development | `RN` | mobile | CodeKshetra | Priya | 10 | 30 | online | Intermediate | ₹32,000 | 4.6 |

Add two `kind: "project"` entries for the Type filter: "Capstone: Build a Food Delivery App (MERN)" at CodeKshetra (6 wk, ₹15,000) and "Capstone: Churn Prediction on Telecom Data" at Deccan (4 wk, ₹12,000).

`crs_mern` in full (the reference for writing the others):

- Description: "Build and deploy four full stack applications with MongoDB, Express, React and Node.js. You start with JavaScript fundamentals, move to React and REST APIs, and finish with a team capstone reviewed like a real pull request. Classes run live, with recordings for revision and a weekly doubt-clearing session."
- Highlights: "Build and deploy 4 full stack apps", "Write REST APIs with Node.js and Express", "Model data in MongoDB and query it well", "Manage state and routing in React", "Use Git and code review the way teams do", "Prepare for JavaScript and React interviews".
- Curriculum: 01 JavaScript foundations (2 wk, 6 sessions: ES6 syntax, async and promises, DOM, Git basics) · 02 React fundamentals (3 wk, 9: components and props, hooks, forms, routing) · 03 Node.js and Express (3 wk, 9: REST design, middleware, auth with JWT, validation) · 04 MongoDB (2 wk, 6: schema design, aggregation, indexes) · 05 Full stack integration (2 wk, 6: state management, file uploads, payments sandbox) · 06 Testing and deployment (2 wk, 6: Jest, CI, deploying to a cloud VM) · 07 Capstone project (2 wk, 6: team build, code review, demo day).
- Languages: English, Telugu. Certificate: "Course completion certificate from the institute". Demo: 60 min.
- Batches: `18 Nov` Mon Wed Fri 7:00 to 8:30 pm, online, 12 of 30 seats left (weekday_evening) · `22 Nov` Sat Sun 10:00 am to 1:00 pm, classroom, 4 of 25 left (weekend) · `1 Dec` Mon to Fri 8:00 to 9:30 am, classroom, 18 of 25 left (weekday_morning) · `6 Dec` Sat Sun 6:00 to 9:00 pm, online, 0 left (full).

Every course has at least two batches, and at least four courses have a weekend or after-7 pm batch so the corporate Home section is never empty. Batch start dates are generated relative to today (`at(7, ...)`, `at(11, ...)`, `at(20, ...)`).

Slots: generate for each bookable target, for the next 14 days, 3 to 9 slots a day across morning (9:00, 10:00, 11:00), afternoon (2:00, 3:00, 4:00) and evening (6:00, 7:00, 8:00), with about 30% marked unavailable, Sundays empty for institute courses, and day 3 fully empty for `crs_ds` to exercise the empty state. Use a seeded random so screenshots are stable.

### 12.6 Learners, bookings, notifications, support

Learners (dev menu switches between them):

- **Student:** Ananya Reddy, `+91 98765 43210`, JNTU Hyderabad, area Kukatpally, interests Full stack development, Python; skills React, Node.js, MongoDB; education: B.Tech CSE, JNTU Hyderabad, 2023 to 2027.
- **Corporate:** Karthik Iyer, `+91 91234 56780`, QA Engineer, a Hyderabad IT services company, 5 yr, area Madhapur, skills Java, Spring Boot, AWS, Kubernetes; `preferredTime` weekends; experience: QA Engineer 2021 to now.
- A third profile, **new learner** (Sai Charan, student, no bookings, no batches), exercises every empty state.

Bookings for Ananya (statuses chosen to show every join state):

| Ref | Kind | Title | With | Start | Mode | Status | Shows |
|---|---|---|---|---|---|---|---|
| `FYT-7K2M9Q` | demo | MERN Stack with Real Projects | Priya Raman, Vidyarth | `inMinutes(8)` | online | confirmed | `joinable` |
| `FYT-3HX8TD` | mentorship | Mentorship with Vikram Deshpande | Vikram | `at(1, "19:00")` | online | requested | creating link |
| `FYT-9PL4VB` | demo | UI/UX Design with Figma | Arjun, Pixel Patashala | `at(3, "11:00")` | offline | confirmed | directions |
| `FYT-5QD2RW` | demo | Data Science with Python and ML | Meera, Deccan | `at(5, "18:00")` | online | meet_failed | link delayed |
| `FYT-2NB6YC` | batch_seat | MERN Stack, batch of 18 Nov | Vidyarth | batch start | online | requested | seat requested |
| `FYT-8WM1KJ` | demo | Python Programming from Scratch | Meera, Saraswathi | `at(-6, "17:00")` | online | completed | attended |
| `FYT-4TG7ZA` | consultation | Consultation with Ramesh Babu Yadav | Ramesh | `at(-12, "10:00")` | online | no_show | missed |
| `FYT-6CR3LE` | demo | Java Full Stack with Spring Boot | Suresh, Vidyarth | `at(-15, "19:00")` | offline | cancelled | cancelled, reason "Schedule clash" |

Enrolment for Ananya (`learningProgress`): Python Programming from Scratch, 6 of 24 sessions attended, next session `at(1, "07:30")`. Karthik has one enrolment (DevOps with AWS and Kubernetes, 11 of 36) and two upcoming bookings (a consultation with Divya Menon and a demo for Java Full Stack on Saturday).

Notifications (newest first): link ("Your Meet link is ready", "MERN Stack demo starts at 7:00 pm. Tap to open your booking.", 8 min, unread) · reminder ("Starts in 1 hour", "MERN Stack with Real Projects, 7:00 pm today.", 1 h, unread) · booking ("Booking received", "Mentorship with Vikram Deshpande, tomorrow 7:00 pm. We're creating your Meet link.", 3 h, read) · alert ("Link delayed for your Data Science demo", "We're fixing it and will notify you as soon as it's ready.", yesterday, read) · booking ("Seat requested", "Vidyarth Tech Academy will call you within one working day.", Mon, read) · announcement ("New weekend batches for DevOps", "Nexora Cloud School added Saturday and Sunday batches starting next month.", last week, read).

**Support contact.** The address `support@findyourtrainer.in` is **not confirmed**. Create `src/config/support.ts`:

```ts
/** UNCONFIRMED placeholder. Do not ship to production until the owner confirms the address. */
export const SUPPORT_EMAIL_UNCONFIRMED = "support@findyourtrainer.in";
export const SUPPORT_EMAIL_IS_CONFIRMED = false;
/** Runtime value: config/public.supportEmail wins; the constant is the fallback. */
export const supportEmail = (cfg?: { supportEmail?: string }) => cfg?.supportEmail ?? SUPPORT_EMAIL_UNCONFIRMED;
```

Add a jest test that fails when `FYT_ENV === "prod"` and `SUPPORT_EMAIL_IS_CONFIRMED` is false. Remove `help@example.com` from `gates.test.ts` in favour of the constant. No string `example.com` may remain in `apps/mobile/src`.

### 12.7 Feature flags (`src/config/features.ts`)

```ts
export const FEATURES = { showFees: true, showReviews: true, batches: true, learningProgress: true } as const;
```

---

## 13. Dependencies

Install with `npx expo install` from `apps/mobile` so Expo resolves the SDK 58 compatible version of each (do not pin by hand). Versions in the last column are the latest on npm when this was written (11 Nov 2026) and are for reference only. Nothing was installed in this phase.

| Package | Why | npm latest |
|---|---|---|
| `react-native-svg` | Icons, progress ring, tick draw, blueprint grid, band glow | 15.16.1 |
| `phosphor-react-native` | Icon set (peer: `react-native-svg`) | 3.0.6 |
| `expo-linear-gradient` | Brand band and cover gradients, edge fades | 58.0.4 |
| `expo-image` | Cached gallery, avatar and cover images with placeholders | 58.0.18 |
| `expo-haptics` | §6.3 | 58.0.8 |
| `expo-clipboard` | Copy Meet link and booking ref | 58.0.4 |
| `@shopify/flash-list` | Virtualised catalog, bookings and notification lists | 2.3.3 |
| `@expo-google-fonts/jetbrains-mono` | JetBrains Mono 400 and 500 | 0.4.1 |
| `@react-native-async-storage/async-storage` | Appearance choice, recent searches, saved items, dismissed tips (never tokens or PII) | 3.1.1 |

Command: `npx expo install react-native-svg expo-linear-gradient expo-image expo-haptics expo-clipboard @shopify/flash-list @react-native-async-storage/async-storage && npm install phosphor-react-native @expo-google-fonts/jetbrains-mono`, then `npx expo-doctor` and rebuild the dev client (native modules were added).

Remove: `@expo-google-fonts/inter`, `@expo-google-fonts/playfair-display`, `@expo-google-fonts/geist-mono`. `@expo/vector-icons` (Feather) can go once `Icon.tsx` covers every use.

Font files (not a dependency): copy the three Open Sauce One TTFs and `OFL-OpenSauceOne.txt` from `apps/admin/src/app/fonts/` into `apps/mobile/assets/fonts/`.

Deliberately not added: Moti and Lottie (Reanimated 4 covers every animation here), `@gorhom/bottom-sheet` (native form sheets through Expo Router cover the three sheets), a blur library (no glass surfaces), a maps SDK (links open the Maps app), `expo-calendar` (the `.ics` share needs no permission).

Unverified: exact SDK 58 pins were not resolved with `expo install --check` because the repo disk dropped offline during this phase and nothing may be installed. If `expo-doctor` flags `@shopify/flash-list` or `async-storage` majors, take the version it recommends.

---

## 14. Implementation order (for Phase 2)

1. Theme: `tokens.ts`, `typography.ts`, `motion.ts`, `fonts.ts`, splash colours in `app.config.ts`. Delete every warm token.
2. Foundations: `Txt`, `Icon`, `Tap`, `Screen`, `BrandBand`, `Button`, `TextField`, `Chip`, `Segmented`, `StatusPill`, `Skeleton`, `EmptyState`, `ErrorState`, `Toast`. Build S27 alongside.
3. Existing flows re-skinned: S01 to S08, tab bar, gates.
4. Fixtures and repos (§12), `joinState.ts` with tests, feature flags, support constant.
5. Catalog: S09 (both segments), S10 to S12, S13 to S15.
6. Booking: S16 to S18, S19, S20, S20b.
7. S21 to S26.
8. Accessibility and motion pass against §15, both themes, both platforms.

---

## 15. Acceptance gates

Phase 2 is done only when every gate passes. `CHECK` lines run from `apps/mobile`. Manual gates need a screenshot or recording as evidence.

**Tokens and brand**

- G1 No warm or purple colour, no old fonts.
  CHECK: `grep -rniE "#(FCFAF6|F5A32F|FFECCD|4C2905|15120F|F8AC3D)|marigold|playfair|geist|Inter_" src app.config.ts package.json | wc -l`
  EXPECT: `0`
- G2 No colour literal outside the theme and fixtures cover map.
  CHECK: `grep -rnE "#[0-9A-Fa-f]{6}\b|rgba?\(" src --include=*.tsx --include=*.ts | grep -vE "src/theme/|\.test\." | wc -l`
  EXPECT: `0`
- G3 No placeholder support address or lorem ipsum.
  CHECK: `grep -rniE "example\.com|lorem ipsum|once the catalog is connected|coming soon" src | wc -l`
  EXPECT: `0`
- G4 The support address is the named unconfirmed constant.
  CHECK: `grep -rn "SUPPORT_EMAIL_UNCONFIRMED" src/config/support.ts | wc -l`
  EXPECT: at least `1`
- G5 No emoji and no em dash in user-facing strings (`src/lib/copy.ts`, fixtures).
  CHECK: `grep -nP "[\x{2014}\x{1F300}-\x{1FAFF}]" src/lib/copy.ts src/fixtures/*.ts | wc -l`
  EXPECT: `0`
- G6 Light and dark palettes have identical keys (unit test in `src/theme/tokens.test.ts`), and every pair in §2.4 is asserted at or above its threshold by a contrast unit test.

**Type and touch**

- G7 No font size under 12 and no `allowFontScaling={false}`.
  CHECK: `grep -rnE "fontSize:\s*(1[01]|[0-9])\b|allowFontScaling=\{false\}" src | wc -l`
  EXPECT: `0`
- G8 Manual: with OS text size at 130%, no text is clipped on S05, S09, S13, S16, S19, S20 in either theme. At 200%, carousels and the sticky bar reflow as §7 says.
- G9 Manual: every interactive element measures at least 44x44 pt (iOS) and 48x48 dp (Android) including hitSlop, checked in S27 with the element inspector.

**Behaviour**

- G10 `joinStateFor` unit tests cover all eight states including the 10-minute boundary and the end boundary.
- G11 Every data screen renders its loading, empty, error and offline states from the S27 dev menu (manual, one screenshot per state for S09, S10, S13, S16, S19, S20, S21).
- G12 Student and corporate Home differ exactly as S09 specifies (section order, header copy, upskilling plan, after-work batches). Manual, two screenshots.
- G13 With all four `FEATURES` flags false, the app shows no fee, no reviews, no batches and no progress, and no screen has a blank gap (manual walk of S09, S13, S14, S19).
- G14 A booking can be made end to end on fixtures: S13 → S16 → S17 → S18 → S20, and the Meet row moves from creating to ready (M10). Manual recording.
- G15 `redirectFor` allows every route in §8.1 for the `ready` state and its tests pass.
  CHECK: `npm test -- --ci 2>&1 | tail -5`
  EXPECT: `Tests:.*passed` and no `failed`

**Motion and accessibility**

- G16 With Reduce Motion on, no translation or looping animation plays (manual recording of S01, S09, S18).
- G17 VoiceOver and TalkBack: S05 to S08 and the booking flow can be completed without sight; status pills, the Meet link change and toasts are announced (manual).
- G18 Scrolling Explore with 12 fixture rows and the Home carousels holds 60 fps on a mid-range Android device in a release build (manual, Perf Monitor).

**Hygiene**

- G19 `npm run typecheck && npm run lint` pass.
  CHECK: `npm run typecheck && npm run lint && echo GATE_OK`
  EXPECT: `GATE_OK`
- G20 `npx expo-doctor` reports no dependency version problems.

### Self-check of this document (Phase 1 gates, verified when written)

- Every screen in the brief has a spec: splash, phone, OTP, segment, details, home (student and corporate), explore, bookings, profile, three gates, search and filters, course, trainer, institute, slot and batch picker, confirm, success, session detail, notifications, settings, plus saved, edit, delete and the gallery (S01 to S27).
- Tokens have exact light and dark values and measured contrast (§2). Type, spacing, radii, elevation, icons, motion and accessibility each have their own section.
- Every component named in a screen spec is defined in §9.
- Fixture content is Indian-context, rupee-priced and free of lorem ipsum (§12).
- Known gaps are stated in §0.1 (screenshots not viewed, one skill not loaded) and §13 (version pins unverified).
