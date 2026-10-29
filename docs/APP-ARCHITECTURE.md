# FYT mobile app and Firebase back end: architecture plan

Date: 2026-10-28, revised 2026-10-29 (mobile stack: React Native with Expo instead of Flutter) · Status: DRAFT for build · Session TRN-20260928-c20456ad
Companion: `docs/firestore-schema.md`, which holds the collections, fields, indexes, security rules and the rules test matrix.

**Inputs:**
- the signed agreement (`~/Downloads/signed agreement of training project.pdf`, read in full: §1–§11);
- `PRODUCT.md`, `DESIGN.md`, `docs/DESIGN-v2.md`, `docs/INTEGRATION-PLAN.md` and `brand/`;
- the admin's de facto spec: `apps/admin/src/lib/{data/*, rbac.ts, storage/*}` and `packages/domain/src/slots.ts` (moved out of the admin on 2026-10-29).

**Precedence:** contract > INTEGRATION-PLAN > this doc > DESIGN-v2. **One exception, recorded below:** the owner chose React Native (Expo) over the contract's "Flutter-based Mobile App" on 2026-10-29.

**Audience:** the agent or developer who builds `apps/mobile`, `functions/`, `packages/domain` and the Firebase config. Section 12 has the Milestone 1 checklist and its status.

---

## Decision: React Native (Expo) instead of Flutter (2026-10-29)

The owner decided on 2026-10-29 to build the FYT mobile app with **React Native and Expo** instead of Flutter. This overrides the contract's "Flutter-based Mobile App" wording (§1); the deliverable (one Android + iOS learner app with the §2 features) is unchanged. Reasons:

1. **One language across the stack.** The app, the Next.js admin and Cloud Functions are all TypeScript. One toolchain, one lint and test setup, one set of reviewers.
2. **Shared domain code.** `packages/domain` (types, zod schemas, slot generation, the booking status machine, error codes) runs unchanged in the app, the admin and Functions. The Flutter plan needed hand-mirrored Dart models held together by JSON fixtures.
3. **Faster delivery.** The schedule is compressed (§12). Reusing the admin's tested logic and the team's React skills removes the Dart learning and mirroring cost.
4. **Over-the-air updates.** EAS Update ships JS fixes to installed apps without a store review, which matters during UAT and the first weeks live.
5. **Lighter local setup.** No Flutter upgrade, no local Android/iOS toolchain for day-to-day work: EAS Build compiles the native dev client in the cloud, and the JS runs from Metro.

What did **not** change: one learner app with Student and Corporate segments, no trainer login, phone OTP only, reads straight from Firestore and writes only through versioned callables, transactional bookings with a seat ledger, IST everywhere, `demo-fyt` emulator → our dev project → the client's prod in `asia-south1`, and no real config or secrets in the public repo.

---

## 0. Key decisions

1. **One app with one signed-in role (learner) and two segments (student, corporate).** There is no trainer login in Phase 1: the contract has every listing created by the admin, and trainers receive the Meet link by calendar email.
2. **Phone OTP is the only sign-in** (contract §2.1). There is no email or Google sign-in, which also keeps Sign in with Apple off the iOS checklist.
3. **Stack:** Expo SDK 58 (React Native 0.88, React 19.3) with Expo Router (file-based routing), TypeScript strict, TanStack Query for server state and Zustand for the small session store, zod schemas shared with the admin and Functions through `packages/domain`.
4. **Firebase on device is React Native Firebase** (`@react-native-firebase/*` 27, modular API). Phone auth needs its native modules, so the app runs in a **development build** (`expo-dev-client`, compiled by EAS Build), **not in Expo Go**. A dev-only auth bypass (§3.11) lets the UI run in Expo Go without Firebase.
5. **Fonts are bundled through `@expo-google-fonts/*` and `expo-font`:** Inter 400/500, Playfair Display 500, Geist Mono 400/500. Nothing is fetched at runtime.
6. **The app reads Firestore directly and writes only through versioned callables (`…V1`).** The admin runs the same `packages/domain` code through the Admin SDK.
7. **Learner authorization** comes from uid ownership plus the `users/{uid}` document. Custom claims are used only for operators (`fytRole`).
8. **Browse and search read one `catalogIndex` document per kind** and filter on the client. No composite catalog indexes are needed.
9. **Slots are generated on read** by `packages/domain/src/slots.ts` (moved out of the admin, which now imports it). Seats are tracked in per-day `slotLedgers`. Each booking is one Firestore transaction with a deterministic ID and a reserved human ref (`BK-XXXXXX`).
10. **There is no pre-booking hold in Phase 1**, because there is no payment step. The `requested` state is the hold, with `holdExpiresAt` and a sweeper.
11. **Time:** stored as epoch ms. Every rule, slot and displayed time is Asia/Kolkata (fixed +05:30).
12. **Meet links** come from Calendar API `events.insert` with `conferenceData`, run by a Cloud Tasks worker with retries and a dead-letter path. Recommended identity: Google Workspace with domain-wide delegation.
13. **Firebase:** region `asia-south1`, Node 24 functions, projects `demo-fyt` (emulator), dev, staging and prod.
14. **The repo is public**, so no real-project Firebase config, secrets or client data are committed. Native Firebase files come from gitignored local files or EAS file environment variables; JS config comes from `EXPO_PUBLIC_*` variables (§10.2).
15. **Repo layout:** one npm workspace: `apps/admin`, `apps/mobile`, `packages/domain`, `functions`, `tests/rules`, with `firebase.json`, rules and indexes at the root (§11).
16. **Delivery:** EAS Build (dev client, internal and store builds), EAS Submit (store uploads) and EAS Update (over-the-air JS updates per channel).

---

## 1. Local toolchain (checked 2026-10-29 on this Mac) and the slow-disk plan

| Tool | Found | Needed | Status |
|---|---|---|---|
| Node / npm | v24.13.1 / 11.8.0 (nvm) | Node 24 (functions runtime `nodejs24`; `@firebase/rules-unit-testing` 6 needs ≥ 24.12) | OK. `.nvmrc` pins 24 |
| Expo CLI | per project (`npx expo`, from `expo` 58.0.21) | | OK. Nothing global |
| EAS CLI | not installed | `eas-cli` ≥ 16, run as `npx eas-cli@latest` | Needs the owner's Expo login (`npx eas-cli login`) for cloud builds |
| Firebase CLI | 15.x global (nvm); repo pins `firebase-tools` 15.34.2 | 15.34.2 via `npx firebase` | OK. Always `source ~/.fyt-cloud/env.sh` first so the CLI never uses this Mac's global logins (they belong to other clients) |
| Java | **none.** `/usr/bin/java` is the macOS stub | **JDK 21+**: firebase-tools 15 refuses to start emulators below Java 21 | **Missing. Blocks the emulators, the rules tests and the functions integration tests.** Not needed for EAS cloud builds |
| Xcode / Android SDK | Xcode 27.1 (no iOS 27.1 simulator runtime); Android SDK present, `ANDROID_HOME` unset | Only for **local** native builds (`npx expo run:ios|android`) | Optional. EAS Build replaces them for the dev client |
| gcloud / gh | present | | OK (gcloud only with `~/.fyt-cloud/env.sh`) |
| OS | macOS 27.0.1, arm64 | | |

**Nothing was installed system-wide for Milestone 1.** All packages are npm installs inside the repo. Java (P1) needs the owner's go-ahead.

### 1.1 The repo is on a slow external SSD (USB, APFS)

- **npm workspaces hoist to one root `node_modules`**, so there is one copy of React, zod and the toolchain on the SSD instead of four.
- **Keep heavy caches on the internal disk, where they already are:** `~/.npm`, Metro's cache (`$TMPDIR/metro-*`), `~/.gradle`, Xcode DerivedData and the Firebase emulator JARs (`~/.cache/firebase/emulators`).
- **Prefer EAS cloud builds** for the dev client. Local `npx expo run:*` writes `apps/mobile/{ios,android}` (gitignored, generated by prebuild) to the SSD and is slow there.
- **Don't run `expo start --clear` by reflex.** Clear Metro's cache only after changing `babel`/`metro` config or env variables.
- **Editor watchers:** exclude `**/node_modules/**`, `**/.expo/**`, `**/ios/**`, `**/android/**` and `**/.next/**`.
- **Emulator export data** (`.emulator-data/`) is small. Keep it in the repo directory, gitignored.

---

## 2. App shape

### 2.1 One app or two: one app, one learner role, two segments

| Signal | Source | Implication |
|---|---|---|
| "Flutter-based Mobile App (Android + iOS) with dual onboarding flows" | contract §1 | A single app whose two flows are **segments** (student, corporate), not two apps |
| "Mobile number + OTP login", student and corporate onboarding | §2.1 | Learners are the only app sign-ins |
| "All platform content (institutes, trainers, consultants) is pre-defined by admin — no user-generated listings" | §2.7 | Trainers never create or edit anything, so they need no app |
| "Google Meet link generation and delivery to both trainer and trainee… link is generated and shared within the app" | §2.5 | The trainer gets the link by **calendar invite email**. The learner gets it in the app |
| "There are no user-generated listings and no provider logins in Phase 1" | DESIGN-v2 §1 | Confirms it |
| One Play listing and one App Store listing in the cost table | §8.1, §10.1 | Two apps would double store review, signing, CI and support |

Conclusion:
- Build **one app** for learners (React Native with Expo; see the decision note at the top).
- Use the segment to vary onboarding and home-feed emphasis.
- Operators (owner, superadmin, admin) use only the web console.
- The trainer role is reserved, not built. If the client later asks for trainer access (a Change Request, §7.5), it slots into the same app:
  - a `fytRole: "provider"` claim plus `providerId`;
  - a `/t/*` route subtree with its own shell;
  - rules that read `bookings where targetId == providerId`.

  The schema is already keyed for that (`users.role`, `bookings.targetId`), so nothing needs restructuring.

The app's "role-based home shells" are therefore session-state shells:
- **Gate:** update, maintenance, blocked.
- **Signed-out:** welcome and OTP.
- **Onboarding.**
- **Learner shell**, with a **Student home** or a **Corporate home**.

### 2.2 Screens: Phase 1, mapped to the contract

| # | Screen (route) | Contract | Notes |
|---|---|---|---|
| 1 | Splash / boot (`/splash`) | infra | Waits for Firebase, `config/public` and auth state. Never more than 2 s of visible spinner; renders from cache |
| 2 | Update required (`/gate/update`) | infra (admin `minAppVersion`) | Store link |
| 3 | Maintenance (`/gate/maintenance`) | admin maintenance mode | Shows the message and expected end from config |
| 4 | Account blocked (`/gate/blocked`) | admin learner block | Support contact |
| 5 | Welcome (`/welcome`) | §2.1 | Brand and a single "Continue with mobile number". No fake social proof (PRODUCT.md) |
| 6 | Phone number (`/auth/phone`) | §2.1 OTP login | Fixed +91 prefix. 10 digits starting 6–9 (the same rule as the admin's `identifiers.ts`) |
| 7 | OTP verify (`/auth/otp`) | §2.1 | 6 digits, SMS autofill, 30 s resend cooldown, Android auto-retrieval |
| 8 | Choose segment (`/onboarding/segment`) | §2.1 dual flows | "Student" / "Working professional" (corporate employee) |
| 9 | Student details (`/onboarding/student`) | §2.1 | Name, contact (phone, prefilled and read-only), educational institution, course interests (categories), desired tech skills (tech stacks), area, optional email |
| 10 | Corporate details (`/onboarding/corporate`) | §2.1 | Name, contact, current role, years of experience, tech stack to learn, optional company, area, optional email |
| 11 | Profile setup (`/onboarding/profile`) | §2.1 "educational background and work experience" | Education and experience lists. Skippable; completed later from Profile |
| 12 | Home (`/home`) | §2.1 "Home screen with featured courses, institutes, trainers, and mentors" | Student order: courses, institutes, trainers, mentors. Corporate order: mentors, courses matching `skillsToLearn`, trainers, consultants. Featured comes from `config/public.featured` |
| 13 | Explore (`/explore`) | §2.2–2.6 browse | Search field plus tabs: Courses, Institutes, Trainers, Mentors, Consultants |
| 14 | Course and project list + filters (`/explore/courses`) | §2.2 | Filters: category, tech stack, duration, mode. Kind toggle: course / project |
| 15 | Course detail (`/courses/:id`) | §2.2 | Full details, institute link, "Book a demo" (online/offline) |
| 16 | Institute directory + filters (`/explore/institutes`) | §2.3 | Search, category, location (area), specialization. Organisation-type trainers appear here (§2.3) |
| 17 | Institute detail (`/institutes/:id`) | §2.3 | Location (Open in Maps), courses offered, contact (call/email), gallery |
| 18 | Trainer list and profile (`/explore/trainers`, `/providers/:id`) | §2.5 | Expertise, admin-entered rating, training details, "Book 1-on-1 demo" |
| 19 | Mentor list by domain and profile | §2.6 | Background, admin-entered review quotes, session info, "Book a mentorship slot" |
| 20 | Consultant list by specialization and profile | §2.4 | Specializations, availability, "Book a consultation" |
| 21 | Slot picker (`/book/:targetType/:targetId`) | §2.2, §2.4–2.6 | 14-day date strip, slots grouped Morning / Afternoon / Evening, mode chips, times in Geist Mono with "IST" |
| 22 | Confirm sheet | same | Summary, optional note, email prompt for online bookings (Q4), "Confirm booking" |
| 23 | Booking confirmed (`/bookings/:id?new=1`) | §2.2 "confirmation with session details and Google Meet link" | Ref, details, live status: "Creating your Meet link…" becomes the link |
| 24 | My bookings (`/bookings`) | §2.5 link "shared within the app" | Upcoming and past. Cached for offline use |
| 25 | Booking detail (`/bookings/:id`) | §2.5 | Status pill, Join Meet (opens the Meet app or browser; never embedded, per §2.5), copy link, offline address with Maps, cancel (within policy), reschedule (only if Q6 allows) |
| 26 | Notifications inbox (`/notifications`) | §2.8 | Booking events, reminders and announcements. Small, but it is the fallback when push is off |
| 27 | Profile (`/profile`) and edit (`/profile/edit`) | §2.1 | Segment fields, education, experience |
| 28 | Settings and about (`/profile/settings`) | store requirement | Notification permission shortcut, privacy and terms links, support, app version, environment badge (non-prod) |
| 29 | Delete account (`/profile/delete`) | **store requirement** (Apple 5.1.1(v), Google Play) | Not in the contract list but required for M7 store submission |
| 30 | Design gallery (`/dev/gallery`) | internal | Tokens and components. Compiled out of prod (`FYT_ENV != prod`) |

**Out of scope (Phase 2 or a Change Request). Do not build these:**
- payments or checkout, and any price field;
- user-submitted ratings and reviews (Phase 1 shows admin-entered values only);
- chat;
- video course hosting;
- certificates;
- referrals;
- advanced analytics, including in-app analytics SDK funnels;
- multi-language (the app is *ready* for it, but ships English only);
- trainer, institute or consultant logins and self-service listings;
- Algolia or full-text search (client-side search over `catalogIndex` instead);
- SMS or WhatsApp copies of links;
- an embedded Meet (§2.5 says the link is shared, not embedded).

---

## 3. Expo (React Native) stack

### 3.1 Packages (checked against npm on 2026-10-29)

- Expo-managed native packages are installed with `npx expo install` so their versions match the SDK; `npx expo install --check` and `npx expo-doctor` run in CI.
- The root `package-lock.json` is committed; CI runs `npm ci`.
- **Expo Go is not supported for the real backend.** React Native Firebase ships native code, so the app runs in a development build (`expo-dev-client`) made by EAS Build (or locally with `npx expo run:*`).

| Package | Version | Why |
|---|---|---|
| expo | ~58.0.21 (SDK 58; `npm view expo version` = 58.0.21) | Runtime, config plugins, CLI |
| react / react-native | 19.3.0 / 0.88.1 | The SDK 58 pair. The admin is aligned to React 19.3.0 so the workspace has one React |
| expo-router | ~58.0.28 | File-based routing in `src/app`, typed `Stack`/`Tabs` |
| expo-dev-client | ~58.0.17 | The development build that hosts the native Firebase modules |
| expo-build-properties | ~58.0.11 | `ios.useFrameworks: "dynamic"` (Firebase Apple SDK 13+ is SPM-only and needs dynamic frameworks) |
| @react-native-firebase/app, auth, firestore, functions | 27.1.0 | Phone OTP, Firestore listeners with offline cache, callables. Modular API (`getAuth()`, `onSnapshot(doc(...))`, `httpsCallable(getFunctions(app, "asia-south1"), …)`) |
| @tanstack/react-query | ^5.105 | Server state: callable mutations now; catalog and availability queries later |
| zustand | ^5.0.16 | The session store (auth user, config, user doc). Nothing else unless a feature needs it |
| zod | ^4.6.5 | Through `@fyt/domain`; the same schemas validate in the app, the admin and Functions |
| @fyt/domain | workspace (`file:../../packages/domain`) | Types, zod schemas, slots, status machine, error codes, phone and semver helpers |
| expo-font + @expo-google-fonts/inter, playfair-display, geist-mono | ~58.0.11 / ^0.4 | Bundled fonts (§3.5) |
| @expo/vector-icons | ^15.0.2 | Feather icons, the outline family lucide (the admin's icons) grew from |
| expo-application, expo-constants | SDK 58 | App version for the `minAppVersion` gate and `client.appVersion` |
| expo-splash-screen, expo-status-bar, expo-system-ui, expo-linking | SDK 58 | Boot, theming, deep links |
| react-native-safe-area-context, react-native-screens, react-native-gesture-handler, react-native-reanimated, react-native-worklets | SDK 58 pins | Navigation runtime |
| **later milestones:** expo-notifications (or @react-native-firebase/messaging) | | FCM push (Milestone 6) |
| @react-native-firebase/crashlytics, @react-native-firebase/app-check | 27.x | Crash metric (contract §10) and App Check (Milestone 8) |
| expo-image | SDK 58 | Catalog images with disk cache (Milestone 4) |
| **dev:** jest 30 + jest-expo ~58.0.13, @types/jest, eslint 9 + eslint-config-expo ~58.0.4, typescript ~6.0.3 | | Tests, lint, typecheck |

Deliberately excluded:
- **Expo Go as a runtime for the real backend** (no native Firebase modules there).
- **The Firebase JS SDK in the app**: phone auth needs reCAPTCHA in a web view and has no Android auto-retrieval; React Native Firebase uses the native SDKs, offline persistence and silent APNs.
- `@react-native-firebase/analytics`: Phase 2 "advanced analytics", and it widens the privacy labels. Funnel numbers come from the server (`statsDaily`).
- A date library: IST is a fixed offset (§5.6).

Back-end npm pins:
- runtime: `firebase-functions 7.4.0`, `firebase-admin 14.5.0`, `zod ^4.6.5` (shared with the admin), later `@googleapis/calendar` and `google-auth-library`;
- dev: `typescript ~6.0.3`, `esbuild 0.28.2`, `vitest ^5.0.5`, `tsx`, `@firebase/rules-unit-testing 6.0.0`, `firebase 13.1.0`, `firebase-tools 15.34.2`, `@types/node ^24`.

### 3.2 State: TanStack Query for server state, a small Zustand session store

- `src/backend/` is the only code that touches Firebase. `Backend` is an interface (realtime listeners for auth, `config/public` and `users/{uid}`; `sendCode`, `confirmCode`; one method per callable). `firebase.ts` implements it with React Native Firebase; `mock.ts` is the dev-only bypass (§3.11).
- `src/session/store.ts` (Zustand) holds the raw inputs: auth user, `config/public`, the user doc, `authDisabled` and the pending phone number. `SessionProvider` wires the listeners in once at the root.
- `src/session/state.ts` derives the `SessionState` from those inputs with a pure function (§4.2). Screens read the derived state with `useSession()`.
- **Callables** are TanStack Query mutations (`useMutation`) with `retry: 0`; the screens show inline errors keyed by `reason`. **Reads** that aren't realtime (catalog, availability) become TanStack queries in Milestones 4–5, with cache keys per document.
- Listeners on `users/{uid}`, `config/public` and an open booking stay realtime (`onSnapshot`); Firestore's own offline cache serves them when offline.
- There is no global mutable singleton outside the backend instance and the session store. Tests use the mock backend or pure functions.

### 3.3 Routing: Expo Router

- Routes are files in `apps/mobile/src/app`: `index.tsx` (splash), `gate/{update,maintenance,blocked}.tsx`, `auth/{phone,otp}.tsx`, `onboarding/{segment,details}.tsx`, and the learner tab group `(tabs)/{home,explore,bookings,profile}.tsx` with `(tabs)/_layout.tsx` (Expo Router `Tabs`).
- `src/session/state.ts` exports `redirectFor(state, pathname)`, the pure redirect table below. The root layout's `SessionRouter` calls it whenever the session or the path changes and does `router.replace(target)`.
- Detail routes (`/courses/[id]`, `/bookings/[id]` and so on) arrive as stack screens outside the tab group, so a deep link from a push opens them full-screen.
- Paths are lowercase. Typed routes are off until CI generates `.expo/types` (keeps `tsc` independent of `expo start`).

Redirect table (evaluated top-down; the first match wins):

| Session state | Allowed paths | Otherwise go to |
|---|---|---|
| `booting` | `/` (splash) | `/` |
| `updateRequired` | `/gate/update` | `/gate/update` |
| `maintenance` | `/gate/maintenance` | `/gate/maintenance` |
| `blocked` | `/gate/blocked` | `/gate/blocked` |
| `signedOut` | `/auth/phone`, `/auth/otp` | `/auth/phone` |
| `needsOnboarding(segment)` | `/onboarding/segment` | `/onboarding/segment` |
| `needsOnboarding(details)` | `/onboarding/details`, `/onboarding/segment` (to change the segment) | `/onboarding/details` |
| `ready(segment)` | the four tabs and `/dev/*`; later the detail routes | `/home`, or the pending deep link (Milestone 6) |

Deep links:
- A push's `data.route` is validated against an allowlist (`/bookings/[id]`, `/notifications`, `/courses/[id]`, `/providers/[id]`, `/institutes/[id]`).
- It is stored as a pending link while the session isn't `ready`, then replayed.
- Custom scheme `fyt://` now. Verified App Links / Universal Links later, on the client's domain via Firebase Hosting (contract §5 lists Vercel + Firebase Hosting).

### 3.4 Theme and tokens (same brand as the console)

React Native has no OKLCH, so the tokens below are the admin's live `globals.css` values converted to sRGB. They live in `apps/mobile/src/theme/tokens.ts` as `light` and `dark`; `usePalette()` follows the system setting. Regenerate them if `globals.css` changes.

| Token | Light | Dark | Use in the app |
|---|---|---|---|
| paper | `#FCFAF6` | `#15120F` | Scaffold background |
| surface | `#FFFDFA` | `#1C1915` | Cards, sheets |
| sunken | `#F5F2EC` | `#0F0D0A` | Inputs, navigation bar, segmented controls |
| raised | `#FFFFFD` | `#25211D` | Menus, the bottom sheet top layer |
| line | `#E3DFD8` | `#312D28` | Hairlines, dividers |
| lineStrong | `#CECAC2` | `#47413C` | Input borders, focused outline base |
| ink | `#1F1913` | `#EEEBE4` | Text, **primary buttons** |
| ink2 | `#5B544C` | `#AEAAA2` | Secondary text (≥ 4.5:1) |
| ink3 | `#857F79` | `#7E7A72` | Tertiary text, placeholders, disabled |
| accent (marigold) | `#F5A32F` | `#F8AC3D` | Selection, focus ring, active tab indicator, the one thing needing attention |
| accentSoft | `#FFECCD` | `#462D0B` | Selected chip fill, nav indicator |
| accentInk | `#4C2905` | `#281606` | Text on marigold |
| onAccentSoft | `#4C2905` | `#FED081` | Text on accentSoft |
| ok / okSoft / onOkSoft | `#298954` / `#DDF6E4` / `#167645` | `#5EC386` / `#173523` / `#5EC386` | Confirmed, attended |
| warn / warnSoft / onWarnSoft | `#CB5A1A` / `#FFE8D6` / `#A34000` | `#F7945A` / `#4B2915` / `#F7945A` | Link delayed, needs attention |
| bad / badSoft / onBadSoft | `#C92F33` / `#FFE6E3` / `#BC272C` | `#F2716A` / `#4E201E` / `#F2716A` | Errors, destructive actions, missed |
| info / infoSoft / onInfoSoft | `#27709C` / `#E5F2FD` / `#1F6A96` | `#74B3DE` / `#1A3040` / `#74B3DE` | Requested / pending, neutral info |

Rules carried over from DESIGN.md and PRODUCT.md:
- Marigold covers 10% of a screen or less. Primary buttons are ink, never marigold.
- No purple anywhere. No emoji in copy or UI. No fake social proof.
- A status is never shown by colour alone. Pills and chips pair colour with an icon and a label. Booking pills (labels in `@fyt/domain` `STATUS_LABEL`):
  - requested: info, clock, "Requested";
  - confirmed: ok, check, "Confirmed";
  - meet_failed: warn, alert, "Link delayed";
  - cancelled: ink3, x, "Cancelled";
  - completed: ok, check-check, "Attended";
  - no_show: bad, user-x, "Missed";
  - unknown: ink3, help, "Contact support".
- Radii: 6 for controls, 10 for cards, 14 for sheets and dialogs. No pill-shaped panels.
- Depth comes from tone plus a 1 px line. The only shadow is on overlays (sheets, menus), tinted ink.
- Motion: 150–220 ms, transform and opacity only, only for state changes; respect "Reduce motion" (`AccessibilityInfo.isReduceMotionEnabled`, Reanimated's `useReducedMotion`).
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40. Screen gutter 16. Minimum touch target 48 × 48.
- Components in `src/components`: `Txt` (variants + `mono`), `Button` (primary ink, secondary outline, ghost), `TextField` (label above, sunken fill, marigold focus ring, error below), `Chip` (check icon + colour), `Card`, `SectionHeader`, `EmptyState`, `GateScreen`, `Screen` (safe areas, gutter, keyboard-aware footer), `Wordmark`.

### 3.5 Typography

| Variant (`src/theme/typography.ts`) | Font | Size / line height | Weight | Use |
|---|---|---|---|---|
| display | Playfair Display | 34 / 40 | 500 | Wordmark, welcome headline |
| headline | Playfair Display | 28 / 34, −0.01em | 500 | Screen titles |
| title | Playfair Display | 22 / 28 | 500 | Section titles, sheet titles |
| cardTitle | Inter | 17 / 24 | 500 | Card titles, list primary |
| body | Inter | 16 / 24 | 400 | Default body |
| bodyDense | Inter | 15 / 22 | 400 | Dense body |
| meta | Inter | 14 / 20 | 400 | Meta, descriptions |
| label | Inter | 15 / 20 | 500 | Buttons |
| caption | Inter | **13 / 18** | 500 | **The floor**: pills, chips, tab labels, helper text |
| eyebrow | Inter | 12 / 16, +0.06em, UPPERCASE | 500 | Eyebrow labels only |
| `mono` prop | Geist Mono | inherits | 400 / 500, `fontVariant: ["tabular-nums"]` | Booking refs, times, dates, OTP digits, phone numbers |

- Never 600 or bold anywhere. Hierarchy comes from size, ink / ink2 / ink3 and spacing.
- Playfair Display only at 18 px and above. **Minimum text is 13 px**; the only exception is the uppercase 12 px eyebrow.
- Respect the system font scale (no `allowFontScaling={false}`). Layouts wrap instead of shrinking.

**Fonts are bundled, not fetched.** `@expo-google-fonts/{inter,playfair-display,geist-mono}` ship the TTFs inside the JS bundle's assets; `useFytFonts()` registers `Inter_400Regular`, `Inter_500Medium`, `PlayfairDisplay_500Medium`, `GeistMono_400Regular` and `GeistMono_500Medium` before the splash screen hides. The `expo-font` config plugin can embed them natively later to skip even that step. All three families are SIL OFL 1.1; list them on the About screen (Milestone 8).

### 3.6 Localisation readiness

- Every user-facing string lives in the screen or in `src/lib/messages.ts` today; Milestone 3 moves them to an `en` catalogue (`i18next` or `expo-localization` + a typed dictionary). Only `en` ships; multi-language is Phase 2.
- Dates and numbers use `Intl` with the `en-IN` locale (lakh grouping). All times go through IST helpers (§5.6).
- Copy rules: sentence case, plain and exact (PRODUCT.md tone); errors say what happened and what to do next; empty states teach the next action and never invent numbers.

### 3.7 Error handling

- `ErrorReason` lives in `@fyt/domain` (`src/errors.ts`), shared by Functions and the app:
  - `VALIDATION_FAILED`, `USER_BLOCKED`, `APP_UPDATE_REQUIRED`, `MAINTENANCE`, `PROFILE_INCOMPLETE`, `LISTING_NOT_FOUND`;
  - `SLOT_FULL`, `SLOT_NOT_OFFERED`, `LEAD_TIME`, `USER_OVERLAP`, `BOOKING_LIMIT`, `IDEMPOTENCY_MISMATCH`, `CONTENTION`;
  - `BOOKING_NOT_FOUND`, `INVALID_STATE`, `CANCEL_WINDOW_CLOSED`, `RESCHEDULE_DISABLED`;
  - `REAUTH_REQUIRED`, `RATE_LIMITED`, `UNAUTHENTICATED`, `INTERNAL`.
  It also exports the `HttpsError` code per reason, the retryable set, the `ErrorDetails` zod schema, `DomainError` and `reasonOf(details)` (unknown reasons decode to `INTERNAL`).
- The Firebase backend wraps every callable: it adds `client: {appVersion, platform}`, parses the response with zod, and turns failures into `BackendError(code, message, fieldErrors)`, where `code` is the `reason` (or a Firebase Auth code such as `auth/invalid-verification-code`, `auth/too-many-requests`, `auth/user-disabled`).
- `src/lib/messages.ts` maps codes to copy. **The UI switches on codes, never on message text.**
- **Where errors show:** inline under the field or button for validation and booking errors; a toast for transient errors; a full-screen error with Retry when a screen's primary load fails.
- **Crashlytics** (Milestone 8): a global JS error handler plus native crashes; unexpected `INTERNAL` callable failures recorded as non-fatal with `requestId`; off in `emulator` and `dev`; never receives phone numbers, names or OTP values.

### 3.8 Offline behaviour

- React Native Firebase keeps Firestore's offline persistence on by default (cache size set to 100 MB in Milestone 4).
- **Available offline (reads):** `config/public`; the three `catalogIndex` docs (browse, filter and search work fully offline); detail docs already opened; `users/{uid}`; my bookings, including the **Meet link**; notifications. Images come from the `expo-image` disk cache.
- **Online only (writes):** OTP sign-in, onboarding and profile saves, slot availability, booking, cancel and reschedule, device registration, account deletion. Their buttons are disabled offline with the reason inline. **Bookings are never queued offline.**
- An offline banner appears when `@react-native-community/netinfo` reports no network **or** the last snapshot came from cache after a failed server fetch (Milestone 4).

### 3.9 Folder structure

```
apps/mobile/
  app.config.ts        Expo config; resolves the native Firebase files (§10.2); app id per env
  eas.json             build profiles: development, development-simulator, dev, staging, production
  .env.example         EXPO_PUBLIC_FYT_ENV, EXPO_PUBLIC_FYT_EMULATOR_HOST, EXPO_PUBLIC_FYT_AUTH_BYPASS (.env is gitignored)
  firebase/            google-services.example.json, GoogleService-Info.example.plist (FAKE demo-fyt values); real files gitignored
  eslint.config.js  tsconfig.json  package.json  README.md
  assets/images/       icon, adaptive icon, splash (brand assets in Milestone 8)
  src/
    app/               Expo Router routes (§3.3): _layout.tsx, index.tsx, gate/, auth/, onboarding/, (tabs)/
    backend/           types.ts (Backend interface), firebase.ts (React Native Firebase), mock.ts (dev bypass), index.ts (lazy choice)
    session/           state.ts (deriveSession, redirectFor), store.ts (Zustand), SessionProvider.tsx, gates.ts (gate copy)
    config/            env.ts (EXPO_PUBLIC_* parsing), app-info.ts (app version, client meta)
    theme/             tokens.ts, typography.ts, fonts.ts, index.ts (usePalette)
    components/        Txt, Button, TextField, Chip, Card, SectionHeader, EmptyState, GateScreen, Screen, Wordmark
    features/home/     HomeShell, StudentHome, CorporateHome, sections.ts (per-segment order)
    lib/               messages.ts (error code -> copy)
  (*.test.ts next to the code they test)
```

There is no `ios/` or `android/` folder in git: `npx expo prebuild` (run by EAS Build or `expo run:*`) generates them from `app.config.ts` and the config plugins.

### 3.10 Testing

| Layer | Tooling | What |
|---|---|---|
| Domain unit | vitest (`packages/domain`) | slots (the admin's tests, moved), status machine, `applyProfile` onboarding rule, semver gate, phone normalisation, error codes, config schema |
| App unit | Jest + jest-expo (`apps/mobile`) | `deriveSession` precedence, the redirect table (every state, no loops), gate copy and IST formatting, env parsing (bypass never in prod), the dev bypass driving the session machine end to end |
| App components (Milestone 3+) | `@testing-library/react-native` | phone and OTP validation, resend timer, home per segment, slot picker states, font scale 2.0 |
| App end to end (Milestone 5+) | Maestro flows on a dev build against the emulator | OTP sign-in (code from the Auth emulator REST API), onboarding, a booking |
| Functions | vitest unit (`test/unit`) + emulator integration (`test/integration`, `firebase emulators:exec`) | gates, callable cores, error envelope, seed guard; callables over HTTP with an emulator ID token; later transactions (the 50-parallel `createBookingV1` test) |
| Rules | vitest + `@firebase/rules-unit-testing` 6 (`tests/rules`) | the full matrix (§8) |

### 3.11 Dev-only auth bypass

`EXPO_PUBLIC_FYT_AUTH_BYPASS=1` swaps the Firebase backend for `src/backend/mock.ts`, an in-memory backend, so the whole flow can be clicked through without native Firebase (it works in Expo Go and in a dev build without emulators).
- It is honoured only when `__DEV__` is true **and** `EXPO_PUBLIC_FYT_ENV` is not `prod` (`parseEnv`, unit-tested). Release builds ignore it.
- React Native Firebase is `require`d lazily, so the bypass never loads the native modules.
- The OTP is always `123456`. Numbers mirror the emulator seed: `90000 00001` student, `00002` corporate, `00004` blocked, anything else is a new learner.
- `saveProfile` runs the real `@fyt/domain` `applyProfile`, so validation matches the server.
- The Profile tab shows a "Dev gate preview" card in bypass mode, to see the Maintenance and Update-required gates for 10 seconds.

---

## 4. Auth

### 4.1 Learner sign-in: phone OTP, Firebase Auth

1. **Phone screen.** Normalise to E.164 `+91XXXXXXXXXX`: 10 digits starting 6–9, using `@fyt/domain` `normalizeIndianPhone` (the same rule as the admin's `lib/auth/identifiers.ts`). Then call React Native Firebase `signInWithPhoneNumber(getAuth(), phone)`, which returns a confirmation. (`verifyPhoneNumber` is the alternative when native force-resend and auto-verification callbacks are needed.)
   - On Android, auto-retrieval can sign the user in without typing; the auth listener moves the session on, so the OTP screen must not assume the code is still needed.
   - On iOS, Firebase uses silent APNs, with a reCAPTCHA fallback. Both need setup in real projects: the APNs auth key uploaded to Firebase, and the reversed client-ID URL scheme, which the `@react-native-firebase/auth` config plugin adds from `GoogleService-Info.plist` (it also patches the SDK 58 `SceneDelegate` for the reCAPTCHA redirect). **Neither is needed on the emulator:** with `connectAuthEmulator`, no SMS is sent and the code appears in the Emulator UI and REST endpoint.
2. **OTP screen.**
   - `confirmation.confirm(code)`. A disabled account fails with `auth/user-disabled`, which the app turns into the Blocked gate.
   - Resend re-sends after a 30 s countdown, at most 3 times per screen visit. Firebase applies its own rate limits, surfaced as `auth/too-many-requests`.
   - Autofill: `textContentType="oneTimeCode"` on iOS and `autoComplete="sms-otp"` on Android, plus Firebase auto-retrieval.
3. **After sign-in.** Call `ensureUserV1`. It creates `users/{uid}` on the first call: `segment: null`, `onboarded: false`, the phone from the token, `createdAt`. That is the "Registered" funnel stage. On later calls it bumps `lastActiveAt` (throttled) and returns the doc.
   - It runs non-blocking after the cached user doc renders, so a cold start isn't gated on a function round-trip.
4. **Session.** The root layout's `SessionRouter` reacts to `useSession()` (§4.2).
5. **Sign out.** Call `unregisterDeviceV1` first, while the user is still authenticated, then `signOut(getAuth())`. App queries are always scoped by `userId`, so a later learner never sees another learner's cached data. Even so, a shared phone shouldn't keep the previous learner's bookings in the cache:
   - Store the last signed-in uid in local storage (`expo-secure-store` or MMKV).
   - At the next cold start, if the uid differs, call `clearPersistence(getFirestore())` before any other Firestore use.

**Dev and staging projects (real SMS cost):**
- Use Firebase console **test phone numbers** (fictional numbers with fixed codes, no SMS) for daily work.
- Set `getAuth().settings.appVerificationDisabledForTesting = true` only when `EXPO_PUBLIC_FYT_ENV != prod` and the number is in the test set.
- **Apple and Google review** need a working demo login. Configure one fictional test number in prod and give it to the reviewers.
- **SMS-pumping guard:**
  - restrict SMS regions to India (verify availability on the project's Auth tier; it may need Identity Platform);
  - App Check;
  - budget alerts (contract §11 "Firebase cost spike").

### 4.2 Session state machine

```ts
// apps/mobile/src/session/state.ts
type SessionState =
  | { kind: "booting" }                                   // auth, config/public or the user doc not resolved yet
  | { kind: "updateRequired" }                            // appVersion < config.minAppVersion[platform]
  | { kind: "maintenance"; message?: string; until?: number }
  | { kind: "signedOut" }
  | { kind: "blocked"; reason?: string }                  // users.blocked, or sign-in refused with auth/user-disabled
  | { kind: "needsOnboarding"; step: "segment" | "details" }
  | { kind: "ready"; segment: "student" | "corporate" };
```

`deriveSession(inputs)` is pure and unit-tested (Jest), with the precedence: `booting > updateRequired > maintenance > blocked (Auth disabled) > signedOut > blocked (user doc) > needsOnboarding > ready`. A missing `config/public` falls back to the defaults in `@fyt/domain` so the app never hangs on boot.
- `NeedsOnboarding` applies while `!user.onboarded`. Its `step` comes from `onboardingStep` (`segment` → `details` → `profile`).
- `onboarded` becomes true when the segment details are saved.
- The `profile` step (education and experience) is optional and skippable. It sets `onboardingStep: done` and never blocks `Ready`.

### 4.3 Roles: user document vs custom claims

| Who | Identity | Role source | Claims | Why |
|---|---|---|---|---|
| Learner | Firebase Auth **phone** account | `users/{uid}` (segment, onboarded, blocked) | **none** | Rules need only uid ownership (`bookings.userId`, `users/{uid}`). Segment changes must apply instantly, and claims go stale until a token refresh. Callables read the doc anyway |
| Operator | Firebase Auth **email** account (console) | `admins/{uid}` (role, permissions, status, tokenVersion) | `fytRole: owner \| superadmin \| admin`, mirrored on every role change | Defense in depth and fast checks in Functions. Permissions stay in the doc (1000-byte claim cap, staleness). Matches INTEGRATION-PLAN §5 |
| Trainer / mentor / consultant | **no account in Phase 1** | `providers/{id}` + `private/contact` (email) | n/a | Receives sessions by calendar invite email |

- **Trainer onboarding and approval:** an operator with the `providers` permission creates the profile, sets availability, and publishes it. **`published: true` is the approval.** There is no self-signup, verification queue or pending state in Phase 1.
- **Blocking a learner:** an admin server action, through `packages/domain`, does the following:
  1. sets `users.blocked = true` and `blockedReason`;
  2. `auth.updateUser(uid, {disabled: true})`;
  3. `revokeRefreshTokens(uid)`;
  4. cancels the learner's future bookings (rec, Q7);
  5. writes `audit`.

  The app's next token refresh fails with `user-disabled`, which leads to the `Blocked` gate. Callables reject earlier with `USER_BLOCKED`.

### 4.4 How operators relate to app users

- **One Firebase project and one Auth user pool, with two disjoint kinds of account.** A learner is a phone-provider account. An operator is an email/password account (the console's `login` action verifies the ID token and requires `admins/{uid}`, per INTEGRATION-PLAN §5).
- **Never link the phone provider to an operator account.** A phone number can belong to only one Firebase account, so linking it would stop that operator from also using the app as a learner. The console's own second-factor code step (`lib/auth/otp.ts`, `ticket.ts`) keeps `admins.phone` as a delivery address, not a credential.
- **The app offers only phone sign-in**, so an operator credential can never reach the app. The console rejects phone-only accounts because they have no `admins/{uid}`.
- **Rules use `sign_in_provider == 'phone'`** for learner reads, so even a leaked operator ID token gets no client-SDK access to catalog or booking data. The console reads through the Admin SDK.
- **Owner bootstrap** is a one-off script in Milestone 8, `scripts/owner-bootstrap.ts`. It creates the client's email account, `admins/{uid}` with role owner, and the claim. The demo `*@demo.local` accounts never exist in dev, staging or prod (INTEGRATION-PLAN D6).

### 4.5 Account deletion (store requirement)

`deleteAccountV1({confirm: true})` needs a recent sign-in: `auth_time` within 5 minutes, otherwise `REAUTH_REQUIRED`, and the app re-runs OTP. It:
1. cancels future bookings, which releases seats and deletes calendar events through the normal trigger path;
2. deletes the `devices` and `notifications` subcollections;
3. anonymises `users/{uid}`: name becomes "Deleted user", phone and email are cleared, `deletedAt` is set;
4. deletes the Auth user.

Past bookings keep their snapshot for the operators' records. The retention period is a privacy-policy item, Q3. Google Play also needs a **web** deletion URL (`config/public.legal.deleteAccountUrl`), which can be a simple page on Firebase Hosting.

---

## 5. Booking integrity

### 5.1 Model

- **Availability:** `availability/{targetId}` = `{rules[], exceptions[]}`, edited only by the admin.
- **Slots:** never stored. They are generated by `planDays()` / `generateSlots()` in `packages/domain/src/slots.ts`. This is the admin's tested `slots.ts`, moved unchanged; the admin re-exports it and its tests move with it. The generator is pure (the clock is passed in), so the same code runs in the console preview, in `getAvailabilityV1` and inside the booking transaction.
- **Seats:** `slotLedgers/{targetId}_{yyyymmdd}.entries[bookingId] = {start, end, mode, uid}`. Remaining seats = capacity − overlapping entries. These are `slots.ts` rules 6–8, with the ledger entries standing in for "bookings".
- Why a per-day ledger rather than querying bookings:
  - A transaction can't lock a query range against phantom inserts, but it does lock a document it read. Every booking for that listing and day must write the same ledger doc, so concurrent bookings serialise.
  - At this scale, write contention on one doc per listing per day is far below Firestore's per-doc limit.

### 5.2 Double-booking prevention: one transaction in a callable

`createBookingV1({clientRequestId, slotId, mode, note?, email?})` runs one `runTransaction` (Admin SDK, server-side locks):

```mermaid
sequenceDiagram
  participant A as App
  participant F as createBookingV1
  participant DB as Firestore (transaction)
  participant T as onBookingWritten
  participant Q as Cloud Tasks meetWorker
  participant G as Google Calendar
  A->>F: {clientRequestId, slotId, mode}
  F->>DB: read booking(id=hash(uid,crid)), config/public, users/uid, target, availability, ledger(day), user live bookings, 3 bookingRefs
  alt booking exists
    F-->>A: {booking, replayed:true}
  else
    F->>F: planDays(day) - slot open? seats? lead time? user overlap/limit?
    F->>DB: create booking (online: requested + holdExpiresAt; offline: confirmed), create bookingRefs/ref, set ledger entry
    F-->>A: {booking, replayed:false}
    DB-->>T: onDocumentWritten
    T->>Q: enqueue {bookingId, op:create} (task id = bookingId:create:n)
    Q->>G: events.insert(id=eventIdFor(bookingId), conferenceData.createRequest{requestId=bookingId})
    G-->>Q: hangoutLink
    Q->>DB: status=confirmed, meet.link (transaction, only if still requested)
    DB-->>T: confirmed -> FCM push + inbox + stats
  end
  A->>A: booking detail listens to bookings/{id}: link appears live
```

- **Contention.** The Admin SDK retries the transaction (up to 5 attempts). After that the function throws `CONTENTION` (`retryable: true`) and the app retries once automatically with the **same** `clientRequestId`.
- **Idempotency:**
  - The booking ID is `bkg_ + base32(sha256(uid:clientRequestId))`, so network retries can never double-book.
  - The app generates the `clientRequestId` when the confirm sheet opens and reuses it until it gets a definitive answer.
- **Required test** (INTEGRATION-PLAN S2): 50 parallel `createBookingV1` calls on one capacity-1 slot give exactly 1 success and 49 `SLOT_FULL`. Plus a reschedule racing a create, and a cancel racing a create on the same seat.

### 5.3 Holds and TTL

- **No pre-checkout hold in Phase 1.** There's no payment step, so "pick slot → confirm" is a single call; a separate hold would add a round trip and an abuse surface (one user parking seats). The `requested` booking **is** the hold: it occupies a ledger seat from creation.
- **`holdExpiresAt`** is a Timestamp set to `createdAt + 30 min` on `requested` bookings. `bookingsSweep` runs every 5 minutes:
  - re-enqueues `meetWorker` for `requested` bookings older than 2 minutes whose task may have been lost;
  - moves a booking to `meet_failed` when `holdExpiresAt` has passed;
  - auto-cancels `meet_failed` bookings at **T−2h**, with a push and an inbox notice (rec; client decision Q8).

  The sweeper queries by `status == requested` and `status == meet_failed` only. These sets are small, so the time conditions are filtered in memory and no extra index is needed.
- Firestore **TTL deletion is never used for capacity.** TTL deletes lazily, up to roughly 24 h late. Expiry is always evaluated inside the transaction from the stored time. TTL is used only to garbage-collect notifications and dead letters.
- **If Phase 2 adds payments,** add `slotLedgers.entries[holdId] = {…, expiresAt}`, counted only while `expiresAt > now` inside the transaction, through a `holdSlotV1` call with a 10-minute expiry. No schema break.

### 5.4 Cancellation and reschedule rules

`[CLIENT]` means the default needs client confirmation (§13).

| Rule | Default | Enforced in |
|---|---|---|
| Lead time: earliest bookable start | `config.booking.leadHours = 4` `[CLIENT]` | generator (`too_soon`), `createBookingV1` (`LEAD_TIME`) |
| Booking horizon | 14 days | `getAvailabilityV1` |
| Max live bookings per learner | 5 `[CLIENT]` | `createBookingV1` (`BOOKING_LIMIT`) |
| One upcoming booking per listing per learner | on (rec) `[CLIENT]` | `createBookingV1` (`BOOKING_LIMIT`) |
| No overlapping bookings for a learner | always | `createBookingV1` / reschedule (`USER_OVERLAP`) |
| Learner cancel | allowed until `start − cancellationWindowHours` (2 h) `[CLIENT]`. After that the button is replaced by "Contact support" with the support phone and email | `cancelBookingV1` (`CANCEL_WINDOW_CLOSED`) |
| Learner reschedule | **off** (`booking.userReschedule = false`): cancel and rebook `[CLIENT]`. If turned on: the same window as cancel, at most 2 reschedules per booking | `rescheduleBookingV1` (`RESCHEDULE_DISABLED`) |
| Operator cancel or reschedule | any time before `end`, with a reason; reschedule goes through the same slot checks (fixes the admin's current unchecked `datetime-local`) | admin → `packages/domain` |
| Provider unavailable | the operator cancels or reschedules for the provider and adds an availability exception; the learner gets a push | admin |
| Offline bookings | confirmed instantly, address attached `[CLIENT]` (DESIGN-v2 risk 5) | `createBookingV1` |
| Meet link failure | hold, alert the operators, auto-cancel at T−2h `[CLIENT]` | `meetWorker`, `bookingsSweep` |
| Outcome | the operator marks completed or no_show after `end` | admin `markOutcome` |
| Blocked or deleted learner | future bookings cancelled `[CLIENT]` | admin block action, `deleteAccountV1` |
| Listing unpublished or deleted with upcoming bookings | delete is blocked (the admin already does this); unpublishing keeps existing bookings | admin |

### 5.5 Other integrity points

- **Status transitions** go only through `packages/domain` `assertTransition()` (schema §3.6). Callables, admin actions and workers all use it.
- **Side effects are keyed off committed state transitions** (an outbox via `onBookingWritten`), never done inline. This means a cancel from the app and a cancel from the admin behave identically.
- **Triggers are at-least-once.** Workers re-read the booking and act only if the state still calls for it. Task IDs are deterministic (`{bookingId}:{op}:{rescheduleCount}`), so duplicate enqueues collapse.
- **The nightly `statsReconcile`** also checks that every ledger matches its live bookings, and alerts on any drift.

### 5.6 Timezone handling

- **Storage** is epoch ms (UTC instants). **Business time** is Asia/Kolkata: a fixed +05:30, no DST.
- Availability is expressed as IST weekday and minutes-from-midnight. Date keys are IST `YYYY-MM-DD`. The conversion functions are `istEpoch`, `istDateKey` and `weekdayOf` from `slots.ts`, used by both the server and the admin.
- **The app always displays IST, labelled** ("Thu 12 Nov, 10:30 am IST"), whatever the device timezone. The sessions are Hyderabad sessions and the offline ones are physical. If the device offset isn't +05:30, a secondary line shows the local time ("4:00 pm your time").
- **App (TypeScript):** never format business times with the device timezone (`toLocaleString()` without `timeZone`). Use the IST helpers: `istDateKey`, `istEpoch` and `weekdayOf` from `@fyt/domain`, and `Intl.DateTimeFormat("en-IN", {timeZone: "Asia/Kolkata"})` (or the fixed-offset formatter in `session/gates.ts`) for display. Because the app, the admin and Functions run the same `slots.ts`, the day-boundary cases (23:59 and 00:00 IST, UTC 18:30 rollover) are tested once, in `packages/domain`.
- **Server "now"** comes only from the function clock. `getAvailabilityV1` returns `serverNow`, so the app can show lead-time messages correctly even with a skewed device clock.
- **Calendar events** use `timeZone: "Asia/Kolkata"`.
- **Reminders** compare epoch ms.

---

## 6. Google Meet link generation

### 6.1 Identity: the decision that blocks Milestone 6

A plain service account **cannot** create a Meet conference or invite attendees on its own calendar. Attendee invitations need domain-wide delegation, and `hangoutsMeet` conference creation fails for non-delegated service accounts. **Spike this on day 1 of the decision.**

| Option | How | Pros | Cons |
|---|---|---|---|
| **A. Google Workspace + domain-wide delegation (rec)** | The client's Workspace on the brand domain. A dedicated user `sessions@<domain>` owns the events. A service account `meet-organizer@<project>` gets DWD for the scope `https://www.googleapis.com/auth/calendar.events`, granted by the Workspace super-admin. **Keyless** where possible: the function's runtime SA calls IAM Credentials `signJwt` for the DWD SA with `sub = sessions@<domain>`, then exchanges it at the OAuth token endpoint. Fallback: an SA key JSON in Secret Manager, if the org policy allows key creation | Durable. No refresh-token expiry. Workspace admin controls. With the Meet REST API the meeting can be opened (`spaces.patch` `accessType: OPEN`), so learners don't wait in a lobby with no host | Workspace licence about ₹150–200/user/month, the domain must exist, setup by the client's admin |
| **B. One dedicated Google account + OAuth refresh token** | A consumer Google account `fyt.sessions@gmail.com`. An OAuth client (External, **published to "In production"**; refresh tokens of apps in "Testing" expire after 7 days) authorised once for `calendar.events`. The refresh token lives in Secret Manager | No Workspace cost; fast to set up | Unverified-app warning at the one-time consent. The token is revoked if the password changes or after long inactivity. **Lobby risk:** guests not on the invite may land in "Ask to join" with no host present. No Meet API access controls |

Contract §11 asks for "fallback link generation". Fallback = the admin pastes a manual link on a `meet_failed` booking, which sets `meet.status = ok`. Pre-generated link pools are not recommended.

### 6.2 The worker

`meetWorker` (`onTaskDispatched`):
- `retryConfig: {maxAttempts: 5, minBackoffSeconds: 10, maxBackoffSeconds: 300}`;
- `rateLimits: {maxConcurrentDispatches: 5}`;
- secrets from §10.3.

It handles three ops:
- **`create`:** `calendar.events.insert({calendarId, conferenceDataVersion: 1, sendUpdates: "all", requestBody})`.
  - `requestBody` has:
    - `id: eventIdFor(bookingId)`, deterministic base32hex `[a-v0-9]`;
    - `summary: "FYT demo: <targetName>"`;
    - start and end in `Asia/Kolkata`;
    - `attendees: [hostEmail, userEmail?]`;
    - `description` with the booking ref and the learner's name, with no phone number;
    - `conferenceData.createRequest: {requestId: bookingId, conferenceSolutionKey: {type: "hangoutsMeet"}}`;
    - `guestsCanSeeOtherGuests: false`.
  - A `409` means the event already exists: call `events.get` and continue.
  - If `conferenceData.createRequest.status.statusCode == "pending"`, poll `events.get` for up to 10 s, then throw retryable.
  - On success, set `confirmed`, `meet = {status: ok, link: hangoutLink, eventId}` in a transaction, but only if the booking is still `requested` or `meet_failed`.
- **`patch`** (reschedule): `events.patch` with the new start and end, `sendUpdates: "all"`. The Meet link is unchanged.
- **`delete`** (cancel): `events.delete`, `sendUpdates: "all"`, which notifies the trainer. A `404` or `410` counts as success.
- **Retry policy:** retry only on 429, 5xx and network errors. A 4xx (except 409) is final.
- **Final attempt** (`req.retryCount + 1 == maxAttempts`): set `meet_failed` and `meet.lastError`, write `deadLetters`, emit the `meet_failed` log metric (which alerts), add it to the admin attention queue, and send the learner "Your Meet link is delayed, we're on it".
- **Admin "Retry link":** sets `meet.status = pending`, `attempts = 0`, `op = create`. The trigger re-enqueues.

Delivery:
- **Trainer:** a Google Calendar invite email with the Meet link (contract §2.5).
- **Learner:** in the app (booking detail, live), by push, and by calendar invite if an email is on file.

### 6.3 Client inputs needed (Q1, Q4, Q9)

- The organiser identity (option A or B) and the mailbox that owns the events.
- If option A: a Workspace super-admin grants DWD to the service account's client ID for the `calendar.events` scope (and `meetings.space.settings` if the lobby is to be opened through the Meet API).
- The Google Cloud project (the client's) with the Calendar API (and Meet API) enabled.
- Every provider's email (and the course host emails) for invites, in the §8.3 data sheet.
- The learner email policy: optional or required for online bookings.
- Join-path spike results to share with the client: (a) the invited email signed in; (b) a different Google account; (c) no Google account. This decides whether email becomes required.

---

## 7. Cloud Functions (the stable API contract)

Settings for every function:
- 2nd gen, `region: "asia-south1"`, Node 24, `setGlobalOptions({region, maxInstances: 20})`.
- Callables use `enforceAppCheck: env !== "emulator"`. Start in monitor mode (log only) for 2 weeks in staging, then enforce.
- `minInstances: 1` **in prod only** for `createBookingV1` and `getAvailabilityV1`, to avoid cold starts on the booking path. The cost is small; confirm in the budget.

**Envelope (INTEGRATION-PLAN §3):**
- Request: `{...payload, client: {appVersion, platform}}`. Zod strips unknown keys.
- Success: `{...payload, requestId}`.
- Failure: `HttpsError(code, userSafeMessage, {reason, retryable, requestId, fieldErrors?})`.

**Every app callable first:**
1. checks auth;
2. parses with zod;
3. checks `config/public.maintenance` (`MAINTENANCE`);
4. checks `minAppVersion` against `client.appVersion` (`APP_UPDATE_REQUIRED`);
5. checks `users.blocked` (`USER_BLOCKED`), except `ensureUserV1` and `deleteAccountV1`;
6. logs structured JSON `{fn, version, requestId, uid}`.

### 7.1 Callables used by the app

| Name | Request → response | Auth | Notes / error reasons |
|---|---|---|---|
| `ensureUserV1` | `{}` → `{user}` | phone user | Creates the skeleton doc (registration). Bumps `lastActiveAt` (6 h throttle). Returns `blocked` honestly |
| `saveProfileV1` | `{step, segment?, name?, email?, area?, institution?, company?, currentRole?, yearsExperience?, interests?[], skillsToLearn?[], education?[], experience?[]}` → `{user}` | phone user | Upserts only the fields allowed for `step`:<br>• `"segment"` needs only `segment`.<br>• `"details"` needs the segment's required fields. Student: name, institution, ≥1 interest, ≥1 skill. Corporate: name, currentRole, yearsExperience, ≥1 skill.<br>• `"profile"` takes education and experience and sets `onboardingStep: done`.<br>• `"edit"`, from the Profile screen, takes any field but must keep the segment's required fields valid.<br>Sets `onboarded = true` when the details are valid. Re-subscribes topics when the segment changes. `VALIDATION_FAILED` |
| `getAvailabilityV1` | `{targetType, targetId, fromDate, days≤14}` → `{timezone, serverNow, days:[{date, blocked, slots:[{slotId, start, end, mode, remaining}]}]}` | phone user | Runs the same generator as the admin preview. `LISTING_NOT_FOUND`, `VALIDATION_FAILED` |
| `createBookingV1` | `{clientRequestId, slotId, mode, note?, email?}` → `{booking, replayed}` | phone user, onboarded | §5.2. Also: `PROFILE_INCOMPLETE`, `SLOT_FULL`, `SLOT_NOT_OFFERED`, `LEAD_TIME`, `USER_OVERLAP`, `BOOKING_LIMIT`, `IDEMPOTENCY_MISMATCH`, `CONTENTION`. Increments `statsDaily.bookingAttempts` on every call |
| `cancelBookingV1` | `{bookingId, reason?, opId}` → `{booking}` | owner of the booking | Cancelling an already-cancelled booking returns it unchanged. `BOOKING_NOT_FOUND`, `INVALID_STATE`, `CANCEL_WINDOW_CLOSED` |
| `rescheduleBookingV1` | `{bookingId, newSlotId, opId}` → `{booking}` | owner of the booking | Only when `config.booking.userReschedule`, else `RESCHEDULE_DISABLED`. The same checks as create, plus the cancel window |
| `registerDeviceV1` | `{token, platform, appVersion, locale?}` → `{ok}` | phone user | Upserts `devices/{sha256(token)}`, subscribes the token to `all` + `seg_<segment>` |
| `unregisterDeviceV1` | `{token}` → `{ok}` | phone user | Deletes the device doc, unsubscribes from topics |
| `deleteAccountV1` | `{confirm: true}` → `{ok}` | phone user, recent login | §4.5. `REAUTH_REQUIRED`. Safe to repeat |

The app marks notifications read with a direct, rules-guarded update of `readAt` (no callable).

### 7.2 Admin side: no callables, shared domain code

The console's server actions import `@fyt/domain` and use the Admin SDK:
- catalog CRUD (with atomic `audit`);
- availability rules and exceptions;
- `cancelBooking`, `rescheduleBooking`, `markOutcome`;
- `requestMeetRetry` (sets state, the trigger does the work);
- `setManualMeetLink`;
- learner block and unblock;
- broadcasts (create, schedule, withdraw);
- settings (`config/public`, `config/private`);
- team and ownership (claims mirrored).

Because every side effect is triggered by state, the admin needs no Function-held secrets.

### 7.3 Triggers, task workers and schedules

| Name | Type | Fires on / schedule | Does |
|---|---|---|---|
| `onBookingWritten` | Firestore `onDocumentWritten("bookings/{id}")` | every booking write | Diffs `before`/`after` status, `start` and `meet.status`, then: enqueues `meetWorker` (create, patch or delete); sends FCM and writes the inbox for confirmed, cancelled (when not by the user), rescheduled and meet_failed; increments stats |
| `onCourseWritten` / `onInstituteWritten` / `onProviderWritten` | Firestore | catalog writes | Incremental `catalogIndex/{kind}` update. An institute rename updates `courses.instituteName` |
| `onUserWritten` | Firestore | `users/{uid}` | Stats: registrations by segment, onboarded |
| `onBroadcastWritten` | Firestore | `broadcasts/{id}` → `queued` / `scheduled` | Enqueues `broadcastWorker` (with `scheduleTime` for scheduled ones). Task ID `bc:{id}:{updatedAt}` |
| `meetWorker` | Task queue | from `onBookingWritten`, admin retry, sweeper | §6.2 |
| `broadcastWorker` | Task queue | from `onBroadcastWritten` | Re-checks status (a withdrawn broadcast never sends). Sends to topic `all` or `seg_*`. Writes `audienceSize` (via `count()`), `sentAt` and `announcements/{id}`. Failure goes to `failed` + `deadLetters` |
| `remindersTick` | `onSchedule("every 5 minutes")`, Asia/Kolkata | | For each offset in `reminderMinutes` ([60, 15]): confirmed bookings with `start ∈ [now+offset−5min, now+offset)`. Claims `reminders.<offset>` in a transaction, then pushes and writes the inbox |
| `bookingsSweep` | `onSchedule("every 5 minutes")` | | §5.3 |
| `statsReconcile` | `onSchedule("30 2 * * *")` IST | | Recomputes `statsDaily` for the last 3 days, checks ledger and booking consistency |
| `maintenanceJobs` | `onSchedule("0 3 * * 1")` IST | | Full `catalogIndex` rebuild; prunes availability exceptions older than 90 days; prunes devices older than 60 days |
| `onCatalogImageFinalized` (optional, Milestone 4) | Storage `onObjectFinalized` | `catalog/**` | Writes a 480 px webp `thumbUrl` (sharp). Skip if images are already small |

Emulator notes:
- Scheduled functions don't fire on their own in the emulator. Each schedule's body is an exported pure function (`runRemindersTick(now)` and so on) that tests call directly.
- Task queues run on the Cloud Tasks emulator (port 9499).

---

## 8. Security rules

The rules text, the per-collection, per-role design and the full test matrix are in `docs/firestore-schema.md` §7. In summary:

- **Deny by default.** Clients write only `users/{uid}/notifications/{id}.readAt`, which must equal `request.time`.
- **Learner reads:**
  - their own `users/{uid}`, notifications and bookings (`userId == uid`; queries must filter on it);
  - published catalog docs (queries must filter `published == true`);
  - `catalogIndex` and `announcements`.
- **`config/public` is readable signed-out**, for the update and maintenance gates. Everything else is invisible to clients.
- `isLearner()` requires `sign_in_provider == 'phone'`.
- **Provider and course contact emails** live in `private/contact` subdocs, which are never readable by clients. The admin type currently keeps `Provider.email` on the public doc; the adapter must move it.
- **Storage:** `catalog/**` is read-only for signed-in users and written by nobody through the client. The admin uploads through the server.
- **Testing:**
  - `tests/rules` (vitest + `@firebase/rules-unit-testing` 6) runs under `firebase emulators:exec --only firestore,storage`;
  - identities: anon, learnerA, learnerB, emailUser, operator;
  - every collection × {get, list, create, update, delete} cell is asserted, plus the negative query cases;
  - the suite is a required CI check on any change to the rules, schema or tests;
  - a `/cso` rules review comes before launch (Milestone 8).

---

## 9. Notifications (FCM)

- **Tokens:**
  - Get the token after permission is granted. `registerDeviceV1` runs on first grant, on every `onTokenRefresh`, and on app start if `sha256(token)` differs from the last registered hash in local storage.
  - On sign-out, call `unregisterDeviceV1` before `signOut`.
  - Stored at `users/{uid}/devices/{sha256(token)}`. On send, the server prunes tokens that return `messaging/registration-token-not-registered`.
- **Topics:**
  - `all`, `seg_student` and `seg_corporate`, subscribed **server-side** (Admin SDK `subscribeToTopic`) in `registerDeviceV1`, and re-subscribed when `saveProfileV1` changes the segment.
  - Broadcasts go to topics. Booking messages go to the user's tokens (multicast).
- **Android channels** (created at startup by `expo-notifications` or Notifee; chosen in Milestone 6):

  | Channel | Name | Importance |
  |---|---|---|
  | `bookings` | Booking updates | high |
  | `reminders` | Session reminders | high |
  | `updates` | Platform updates | default |
- **iOS:** the APNs auth key (`.p8`) from the client's Apple account is uploaded to each Firebase project. Foreground presentation is alert + sound.
- **Payload** (server, `packages/domain/src/push.ts`):

```json
{ "notification": { "title": "Booking confirmed", "body": "Thu 12 Nov, 10:30 am IST with <name>. Your Meet link is ready." },
  "data": { "type": "booking", "bookingId": "bkg_…", "route": "/bookings/bkg_…" },
  "android": { "priority": "high", "notification": { "channelId": "bookings", "tag": "bkg_…" } },
  "apns": { "payload": { "aps": { "sound": "default", "thread-id": "bkg_…" } } } }
```

  Reminders use the tag `reminder-<bookingId>` with the TTL set to the session start.
- **Taps:** `getInitialMessage` (cold start) and `onMessageOpenedApp` (background) both go through the router's pending deep link (§3.3). In the foreground on Android, the notification library shows the message. On iOS, the presentation options do.
- **Permission timing:** don't ask at launch.
  - Ask on the booking-confirmed screen: "Get a reminder before your session?" leads to the OS prompt. This gives a better opt-in rate.
  - On Android 13+, that is the `POST_NOTIFICATIONS` runtime permission.
  - If permission is denied, Settings explains how to turn it on, and the inbox still holds everything.
- **Inbox:**
  - `users/{uid}/notifications` gets booking events and reminders, with a 90-day TTL.
  - Broadcasts are **not** fanned out per user. The inbox merges `announcements where audience in ["all", segment] orderBy sentAt desc`.
  - The unread badge counts notifications where `readAt` is null, limited to 99.
- **Contract §10 metric** (push delivery > 95%): log the result of every send (success, failure, pruned) in `statsDaily`. The Firebase console's FCM delivery reports cover Android. State the iOS measurement limits honestly in the UAT report.

---

## 10. Environments, config and CI

### 10.1 Projects and app variants

| Env | Firebase project | Owner | Used for | App ID (placeholder until Q3) |
|---|---|---|---|---|
| `emulator` | `demo-fyt` (the `demo-` prefix means no real resources and no billing) | none | Local development, CI integration tests | `in.findyourtrainer.fyt.dev` with `EXPO_PUBLIC_FYT_ENV=emulator` |
| `dev` | ours, created now (for example `fyt-dev-<suffix>`), Blaze, `asia-south1`; later replaced by the client's `fyt-dev` | us, then the client | Device testing with test phone numbers, the Meet spike, internal builds | `in.findyourtrainer.fyt.dev` |
| `staging` | `fyt-staging` (client, Blaze, `asia-south1`) | client | UAT (contract M6), TestFlight and Play internal testing, store review | `in.findyourtrainer.fyt.stg` |
| `prod` | `fyt-prod` (client, Blaze, `asia-south1`) | client | Live | `in.findyourtrainer.fyt` |

- If the client wants only two projects (INTEGRATION-PLAN S13), staging folds into dev. Nothing else changes.
- **The Firestore location (`asia-south1`) can't be changed once chosen** (INTEGRATION-PLAN D3).
- **App variants instead of native flavors.** `app.config.ts` reads `EXPO_PUBLIC_FYT_ENV` and sets the app name ("FYT Dev", "FYT Staging", "FYT"), the bundle ID / package suffix and the Firebase files. `eas.json` profiles set the env per build: `development` (dev client, emulator), `development-simulator`, `dev`, `staging`, `production`. Each variant installs side by side on one phone.
- **EAS Update channels** match the profiles (`dev`, `staging`, `production`); `runtimeVersion: {policy: "appVersion"}` keeps an update from reaching a binary with different native code.

### 10.2 Keeping config out of git ("switch projects with config only")

The repo is **public**, so nothing that names or unlocks a real project is committed:

| Item | Where | Committed? |
|---|---|---|
| Firebase project aliases | `.firebaserc` (`default: demo-fyt`; `dev`, `staging` and `prod` added locally with `firebase use --add`, after `source ~/.fyt-cloud/env.sh`) | Yes, `demo-fyt` only |
| App JS config | `apps/mobile/.env` (`EXPO_PUBLIC_FYT_ENV`, `EXPO_PUBLIC_FYT_EMULATOR_HOST`, `EXPO_PUBLIC_FYT_AUTH_BYPASS`) or the `env` block of an `eas.json` profile | Only `.env.example` |
| Native Firebase config | `apps/mobile/firebase/google-services.json` and `GoogleService-Info.plist` locally, or the EAS **file** environment variables `GOOGLE_SERVICES_JSON` / `GOOGLE_SERVICE_INFO_PLIST` for cloud builds. `app.config.ts` resolves env var → local file → (emulator env only) the committed fake `*.example.*` files, and fails loudly for dev/staging/prod if none exists | **No**, gitignored. Only the fake `demo-fyt` examples |
| EAS project link | `EAS_PROJECT_ID` env var read by `app.config.ts` (adds `extra.eas.projectId` and the update URL) | No (not secret, but tied to the owner's Expo account) |
| Functions non-secret params | `functions/.env.<projectId>` (`ORGANIZER_EMAIL`, `CALENDAR_ID`, `ALERT_EMAILS`, `MEET_MODE`) | No. `functions/.gitignore` and the root `.gitignore` ignore `.env.*` and allow `.env.example` |
| Functions secrets | Secret Manager through `defineSecret` (§6.1 options A/B). Set with `firebase functions:secrets:set` | Never |
| Admin (Vercel) | Vercel env vars: `FYT_DATA_SOURCE`, `FIREBASE_PROJECT_ID`, the WIF/OIDC config | Never |
| Signing | EAS-managed Android keystore and iOS certificates/profiles; App Store Connect API key for EAS Submit | Never in git; held by EAS (client's Expo account at handover) |

Firebase client API keys aren't secrets in the cryptographic sense: security comes from the rules, App Check and API-key restrictions. They're kept out anyway because the repo is public. In each real project, restrict the API keys to the app IDs.

### 10.3 Secrets and identities

- Functions run as a dedicated runtime service account per project with least privilege: Firestore, FCM, Cloud Tasks enqueue, IAM `signJwt` on `meet-organizer` (option A).
- CI deploys through **Workload Identity Federation** (`google-github-actions/auth`), so no JSON keys live in GitHub.
- The admin on Vercel gets GCP access through Vercel OIDC and WIF (INTEGRATION-PLAN D4).

### 10.4 CI (GitHub Actions; the client-owned org in the end)

| Workflow | Trigger | Steps |
|---|---|---|
| `ci.yml` | every PR / push | `actions/setup-node` 24 (npm cache) → `npm ci` → `npm run typecheck` → `npm run lint` → `npm test` (domain vitest, admin `node --test`, functions unit, mobile Jest) → `npm run build -w apps/admin` → `npx expo-doctor` and `npx expo export --platform ios --platform android` in `apps/mobile` (proves the JS bundle builds) |
| `backend.yml` | PR / push touching `functions/**`, `packages/**`, `tests/rules/**`, `firestore.*`, `storage.rules`, `firebase.json` | the above + `actions/setup-java` 21 (temurin) + cache `~/.cache/firebase/emulators` → `npm run test:rules` → `npm run test:integration` |
| `eas-build.yml` (Milestone 2) | manual, or tag `mobile-v*` | `expo/expo-github-action` with `EXPO_TOKEN` → `eas build --profile <dev|staging|production> --platform all --non-interactive`. Native Firebase files come from EAS file env vars, not from GitHub |
| `eas-update.yml` (Milestone 2) | push to `main` touching `apps/mobile/**` or `packages/domain/**` | `eas update --channel dev --non-interactive` (JS-only changes reach dev builds in minutes) |
| `deploy-dev.yml` (Milestone 2) | push to `main` | WIF auth → `npx firebase deploy --only firestore,storage,functions --project dev` |
| `deploy-prod.yml` / `release-mobile.yml` (Milestone 8) | `workflow_dispatch` + the protected `production` environment | Firebase deploy order: rules and indexes → functions → admin; then `eas build --profile production` + `eas submit` (Play internal track, TestFlight) |

There is no Flutter CI. EAS Build replaces the macOS runner for iOS builds.

---

## 11. Repo layout and how the admin plugs in

```
/                               npm workspaces: packages/*, apps/admin, apps/mobile, functions, tests/rules
├─ package.json  package-lock.json  .nvmrc (24)
├─ firebase.json  .firebaserc (demo-fyt)  firestore.rules  firestore.indexes.json  storage.rules
├─ apps/
│  ├─ admin/           Next.js 16 console (Vercel Root Directory). Imports @fyt/domain
│  └─ mobile/          Expo app (§3.9)
├─ packages/
│  └─ domain/          @fyt/domain: common.ts (enums), user.ts (UserDoc, SaveProfileRequest, applyProfile), config.ts (ConfigPublic),
│                      booking.ts (status machine), errors.ts (ErrorReason, DomainError), envelope.ts (callable schemas),
│                      slots.ts (moved from the admin), semver.ts, phone.ts; test/ (vitest)
├─ functions/          TypeScript, 2nd gen. src/{index.ts, callables/, lib/}, test/{unit,integration}, scripts/seed-emulator.ts
│  ├─ build.mjs        esbuild bundle -> functions/dist/index.js (inlines @fyt/domain) + dist/package.json (exact runtime deps)
│  └─ dist/            deploy and emulator source (gitignored)
├─ tests/rules/        rules matrix (vitest + @firebase/rules-unit-testing)
├─ docs/
└─ .github/workflows/  (added with CI, §10.4)
```

**How `packages/domain` is shared (npm workspaces):**
- `@fyt/domain` is a source-only TypeScript package (`exports` point at `src/*.ts`, no build step). Each consumer depends on it as `"@fyt/domain": "file:../../packages/domain"` (functions: `file:../packages/domain`). `npm install` at the root links it into the root `node_modules`; a `file:` spec, unlike a bare `*`, can never fall back to a same-named package on the public registry.
- **Admin (Next.js 16):** `transpilePackages: ["@fyt/domain"]`, and `turbopack.root` / `outputFileTracingRoot` set to the repo root because Turbopack only resolves files under its root. Client components import `@fyt/domain/slots` (pure, no zod) to keep bundles lean.
- **Mobile (Metro):** Expo SDK 58 configures Metro for workspaces automatically (watch folders and the hoisted `node_modules`); Metro compiles the TypeScript source like app code. Jest resolves the symlink to `packages/domain/src` (outside `node_modules`), so it is transformed without extra config.
- **Functions:** esbuild inlines `@fyt/domain` into `dist/index.js`; only real npm dependencies stay external and are pinned in `dist/package.json`, because Firebase deploys a single directory. `firebase.json` uses `"functions": [{"source": "functions/dist", "runtime": "nodejs24", "predeploy": ["npm run build -w functions"]}]`.
- **One React.** The admin is aligned to React 19.3.0, the version Expo SDK 58 pins, so the hoisted tree has a single React and `react-dom`.
- **Vercel** builds `apps/admin` as its Root Directory with "Include files outside the Root Directory" enabled (verified on the project), so `packages/domain` is in the build. `npm install` run inside `apps/admin` resolves to the workspace root and its lockfile. The old `apps/admin/package-lock.json` is removed; the root lockfile is the only one.

**The admin's Firestore adapter** (INTEGRATION-PLAN §5; build Milestone 7):

1. **Async repo.** Add `apps/admin/src/lib/data/repo.ts`, the `Repo` interface: `institutes|courses|providers.{list,get,save,delete}`, `availability.{get,save}`, `bookings.{query,get}`, `learners.{query,get,block}`, `broadcasts.*`, `settings.{get,save}`, `audit.query` and `mutate(actor, fn)`. Then:
   - `MemoryRepo` wraps today's `Dataset`;
   - every `db()` call in the 14 pages and the action files becomes `await repo()…`;
   - `queries.ts` becomes async.

   No Firebase is needed for this step.
2. **Join the workspace.** Done in Milestone 1 (2026-10-29): `apps/admin` is a workspace, imports `@fyt/domain` (slots today), and has `transpilePackages` plus the Turbopack root (§11). Vercel's "include files outside the root directory" is on.
3. **FirestoreRepo.** `src/lib/firebase/admin.ts` (`server-only`) initialises the Admin SDK and uses the emulator when `FIRESTORE_EMULATOR_HOST` is set. Then:
   - `src/lib/data/firestore-repo.ts` implements `Repo` with zod-based converters, following the mapping table in `firestore-schema.md` §8;
   - `mutate()` writes the change and `audit/{id}` in one transaction;
   - `DATA_SOURCE` becomes `process.env.FYT_DATA_SOURCE` (`demo` | `firestore`), and the header badge stays.
4. **Booking actions.** `bookings/actions.ts` drops `meetCode()` and the local clash check, and calls `@fyt/domain` `cancel`, `reschedule`, `markOutcome` and `requestMeetRetry`.
5. **Availability.** Availability actions and the preview already use `@fyt/domain/slots` (since Milestone 1).
6. **Images.** `storage/index.ts` returns `firebaseStorage` when the source is `firestore`, implementing the TODOs already written in `firebase-storage.ts`.
7. **Auth.** Admin auth moves to Firebase Auth email accounts plus `admins/{uid}` and the `fytRole` claim. The HMAC session cookie is kept (INTEGRATION-PLAN §5).

Result: locally, the console and the app both point at `demo-fyt` on the emulator. An operator edits a course in the console, the trigger updates `catalogIndex`, and the app shows it. A learner books in the app, and it appears in the console's calendar and attention queue.

---

## 12. Build order (13-week Phase 1)

These are *build* milestones, numbered 1–8. The contract's milestones are written C-M1…C-M7.

Today is week 5 of the contract term that started 2026-09-28. DESIGN-v2 §7 placed C-M3 (app core) at Oct 19 – Nov 8, and the app hasn't been scaffolded yet. The plan below compresses the remaining work into Dec 27 and **moves C-M3 to about Nov 22 and C-M4 to about Nov 29**. Confirm the revised dates with the client in writing (Q12).

| # | Milestone | Dates (2026) | Contract | Exit criteria |
|---|---|---|---|---|
| 1 | **Foundation**: scaffold, theme, routing, phone OTP on the emulator, gate/onboarding/learner shells, rules, emulator, CI | Oct 29 – Nov 4 | C-M2 | Checklist below is green |
| 2 | **Schema, data and real dev project**: `packages/domain` schemas for every collection, catalog triggers + `catalogIndex`, seed for every collection, EAS project + dev build with the dev project's Firebase files, CI + deploy-dev pipeline, test phone numbers | Nov 2 – Nov 8 | C-M2 | App signs in on a real phone against dev. Rules matrix 100% |
| 3 | **Onboarding and profile**: segment, student and corporate forms with taxonomy chips, profile setup, profile edit, settings | Nov 5 – Nov 13 | C-M3 | Both segments onboard on dev. Funnel stats increment |
| 4 | **Catalog and discovery**: home per segment, explore, lists, filters, search over `catalogIndex`, course/institute/provider details, gallery, offline cache, optional thumbnails | Nov 9 – Nov 22 | C-M3 | Contract §2.2–2.6 browse items demoable; offline browse works |
| 5 | **Booking engine and booking UI**: `packages/domain` (slots move + booking.ts), `getAvailabilityV1`, `createBookingV1`, `cancelBookingV1`, ledger, concurrency suite; slot picker, confirm, my bookings, detail | Nov 16 – Nov 29 | C-M4 | 50-parallel test passes; book and cancel end to end on the emulator and dev |
| 6 | **Meet, push, reminders**: Meet identity spike (needs Q1 by **Nov 13**), `meetWorker` + DLQ + admin retry, `registerDeviceV1`, booking pushes, `remindersTick`, broadcasts → announcements, inbox, `deleteAccountV1` | Nov 23 – Dec 4 | C-M4 | 100% link generation on the test suite (S8); push received on both OSes |
| 7 | **Admin on Firestore** (parallel track; INTEGRATION-PLAN §5): async repo, FirestoreRepo, domain booking actions, Firebase Auth for operators, signed image uploads, `statsDaily` analytics | Nov 16 – Dec 6 | C-M5 | Console works on dev with real data and atomic audit |
| 8 | **Hardening, QA/UAT and release**: App Check enforce, alerts and budgets, backups + restore drill, `/cso` review, staging and prod projects, store assets (icons, splash, screenshots), privacy policy, data-safety and privacy labels, review test number, TestFlight + Play internal track, UAT, store submission by **Dec 18**, docs + KT | Dec 5 – Dec 27 | C-M6, C-M7 | UAT sign-off; both stores submitted; handover |

**Critical path:**
- Q1 (Meet identity) → Milestone 6.
- Q2 (client Firebase projects) and the Apple and Play accounts → Milestone 8.
- JDK 21 (emulators) and the owner's Expo account (first dev build) → Milestone 1 sign-off.

### 12.1 Milestone 1 checklist

Status as of 2026-10-29. `[x]` = done and verified locally; `[~]` = written, but needs Java or the owner's Expo login to run.

**Pre-flight (owner)**
- [ ] P1. JDK 21 for the emulators: `brew install --cask temurin@21`, then `export JAVA_HOME=$(/usr/libexec/java_home -v 21)` in `~/.zshrc`; check `java -version`. Needs the owner's OK (system software).
- [ ] P2. Expo account: `npx eas-cli@latest login`, then `npx eas-cli init` in `apps/mobile` (creates the Expo project; put its id in `EAS_PROJECT_ID`).
- [ ] P3. (Optional) local native builds only: iOS simulator runtime (`xcodebuild -downloadPlatform iOS`), `ANDROID_HOME`. Not needed with EAS Build.

**Repo and shared code**
- [x] 1. Root `package.json`: `private`, workspaces `packages/*`, `apps/admin`, `apps/mobile`, `functions`, `tests/rules`; devDependency `firebase-tools` 15.34.2; scripts `emulators`, `emulators:fresh`, `seed`, `build:functions`, `test`, `test:rules`, `test:integration`, `typecheck`, `lint`. `.nvmrc` = 24.
- [x] 2. `packages/domain` (`@fyt/domain`): common enums, `UserDoc`/`SaveProfileRequest`/`applyProfile`, `ConfigPublic` + defaults, the booking status machine (`TRANSITIONS`, `assertTransition`, `userCanCancel`), `ErrorReason`/`DomainError`/`HTTPS_CODE`, callable envelope schemas, semver and phone helpers, and `slots.ts` moved from the admin with its tests. vitest suite.
- [x] 3. Admin rewired: availability pages import `@fyt/domain/slots`; `transpilePackages`, Turbopack root; React aligned to 19.3.0; its own lockfile removed. `next build`, `node --test` and lint still pass.

**Back end and emulator**
- [x] 4. `firebase.json` (firestore, storage, functions from `functions/dist` on `nodejs24`; emulators auth 9099, firestore 8080, functions 5001, storage 9199, tasks 9499, UI 4000, hub 4400, logging 4500; `singleProjectMode`), `.firebaserc` = `demo-fyt`.
- [x] 5. `firestore.rules`, `storage.rules` and `firestore.indexes.json` copied verbatim from `docs/firestore-schema.md` §6–§7.
- [x] 6. `functions/`: `build.mjs` (esbuild, `--watch`), `lib/admin.ts` (region `asia-south1`, `maxInstances 20`), `lib/errors.ts` (`fail`, `toHttpsError`), `lib/gates.ts` (maintenance, `minAppVersion`, blocked), `lib/callable.ts` (`appCallable`: phone-provider auth, zod parse, gates, `requestId`, structured log), `ensureUserV1`, `saveProfileV1` (rules from `@fyt/domain`). Unit tests pass; `tsc` clean; bundle builds.
- [~] 7. Functions integration tests over HTTP with an Auth-emulator ID token (`test/integration`). Needs Java.
- [~] 8. `tests/rules`: the §7.3 matrix (every row × identity × get/list/create/update/delete), the negative query and field cases, and storage read/write cases. `tsc` clean; running it needs Java.
- [x] 9. `functions/scripts/seed-emulator.ts` (`npm run seed`): refuses unless the project id starts with `demo-` and both emulator hosts are set (unit-tested); writes `config/public` and four Auth phone users: `+919000000001` student onboarded, `…002` corporate onboarded, `…003` new (no doc), `…004` blocked and Auth-disabled. Running it needs the emulators (Java).
- [x] 10. Ignore rules: `apps/mobile/.gitignore` (native folders, real Firebase files, `.env`, keystores), `functions/.gitignore` (`dist/`, `.env.*`), root `.gitignore` gains `.emulator-data/` and `.firebase/`.

**Mobile app**
- [x] 11. `npx create-expo-app@latest` (SDK 58 default template, TypeScript, Expo Router), trimmed to FYT: `app.config.ts`, `eas.json`, `.env.example`, fake `demo-fyt` Firebase example files.
- [x] 12. Theme tokens (light and dark), type scale with a 13 px floor, bundled fonts, components (§3.4).
- [x] 13. Env layer (`src/config/env.ts`) and native config resolution (`app.config.ts`, §10.2).
- [x] 14. Session machine and redirect table (`src/session/state.ts`), Zustand store, `SessionProvider`, root `SessionRouter`.
- [x] 15. Screens: splash; gates (update, maintenance, blocked) with copy from `config/public`; phone entry (+91, shared phone rule) and OTP (6 Geist Mono cells, `oneTimeCode` autofill, 30 s resend cooldown, at most 3 resends, change number); segment picker; details step (the segment's required fields, validated by the shared rule); learner tabs with Student and Corporate homes in each segment's section order, honest empty states, Explore and Bookings empty states, Profile with sign-out and env badge.
- [x] 16. React Native Firebase backend: phone OTP, `config/public` and `users/{uid}` listeners, `ensureUserV1` after sign-in (non-blocking), `saveProfileV1`; Auth, Firestore and Functions emulators in the `emulator` env.
- [x] 17. Dev-only auth bypass (§3.11).
- [x] 18. Jest: session precedence, redirect table and loop check, gate copy, env parsing, the bypass flow. `npx expo lint` and `tsc` clean. `npx expo export` for iOS and Android succeeds; `npx expo-doctor` reviewed.
- [~] 19. First dev build on a phone (`eas build --profile development`). Needs the owner's Expo login (P2).
- [ ] 20. CI workflows (§10.4). Milestone 2, together with the EAS project.

**Milestone 1 acceptance**
- `npm run emulators` starts auth, firestore, functions, storage and tasks with the UI on :4000 (needs Java).
- `npm run seed` succeeds, and refuses a non-`demo-` project.
- On a dev build against the emulator: phone → OTP (code from the Emulator UI) → `…001` lands on the **Student** home and `…002` on the **Corporate** home; `…003` lands on the segment picker; `…004` gets the **Blocked** gate; `config/public.maintenance.on = true` shows **Maintenance** live; `minAppVersion` above the app version shows **Update required**.
- With `EXPO_PUBLIC_FYT_AUTH_BYPASS=1`, the same flow works without Firebase.
- `npm test`, `npm run typecheck` and `npm run lint` pass; the rules matrix and functions integration tests pass on a machine with Java.
- Light and dark themes render brand tokens. No text below 13 px except the uppercase 12 px eyebrow. No emoji. No purple. Every status has an icon and a label.

---

## 13. Open questions for the client (deduplicated)

1. **Meet organiser:** Google Workspace on your domain (recommended), or one dedicated Google account? Which mailbox owns the sessions? Needed by **Nov 13**.
2. **Firebase projects:** when can you create `fyt-staging` and `fyt-prod` (Blaze, Mumbai region) in your account and give us Owner access? We build on our own dev project until then.
3. **App identity:**
   - the store name;
   - the application/bundle ID (it depends on the domain);
   - the support email and phone;
   - privacy-policy, terms and account-deletion URLs.

   Also: are your Apple Developer and Play Console accounts approved?
4. **Learner email:** optional, or required for online bookings? It enables calendar invites and smoother Meet entry.
5. **Offline demos:** confirm them instantly, or does the institute confirm first?
6. **Policies:** lead time (4 h?), cancellation cut-off (2 h?). Can learners reschedule in the app, or only cancel and rebook?
7. **Limits:** max 5 active bookings per learner, and one upcoming booking per listing? On a block or account deletion, cancel future bookings?
8. **If a Meet link can't be created:** hold the booking for your team and auto-cancel 2 h before the start, with a message?
9. **Course demos:** one-to-one or group (seats)? Who gets the calendar invite: the institute email or a per-course contact?
10. **Profile content for the §8.3 data sheet:** trainer and mentor bio, mentor domain, consultant specialisations, session length, and the admin-entered ratings and review quotes. These are shown as provided by FYT, not as user reviews.
11. **Trainers:** confirm they receive sessions by calendar email only, with no trainer login in Phase 1.
12. **Revised dates in writing:** development started Sep 28. The proposal is store submission by Dec 18 and handover by Dec 27.
13. **OTP SMS:** restrict sign-in to +91 numbers, and approve the SMS cost, which isn't in the §10.1 estimate.

## 14. Risks (short)

- **Schedule.** The app starts in week 5. C-M3 slips to about Nov 22 and C-M4 to about Nov 29. Milestone 5 overlaps Milestones 4 and 6, and QA has one week. Mitigations: run the concurrency and Meet suites continuously from Milestone 5, and use Milestone 7 (admin) as the only buffer.
- **Meet identity and lobby (Q1, Q4).** If this isn't decided by Nov 13, Milestone 6 and C-M4 slip.
- **Toolchain.** No JDK means no emulators, so the rules matrix and the functions integration tests can't run on this Mac yet (P1). EAS cloud builds need the owner's Expo login (P2).
- **Contract wording.** The contract says "Flutter-based". The owner chose Expo on 2026-10-29; confirm with the client in writing so acceptance isn't disputed on the stack.
- **React Native Firebase on new SDKs.** RNFB 27 with Expo SDK 58 needs dynamic frameworks on iOS (`expo-build-properties`) and a dev build. Mitigation: build the dev client early (Milestone 1–2) and keep `expo-doctor` in CI.
- **OTA discipline.** EAS Update can only ship JS. Native changes (new native modules, config plugin changes) need a new binary; `runtimeVersion: appVersion` prevents a mismatched update from loading.
- **One React across the workspace.** The admin follows Expo's React pin (19.3.0 now). An Expo SDK upgrade can force a React bump on the admin; upgrade both together.
- **Public repo.** Real config, client data or secrets committed by mistake. Mitigations: the gitignore rules above, synthetic seed data, and GitHub secret scanning turned on.
- **Store review.** OTP-only login needs a review test number. The account-deletion web URL and the privacy policy are required before submission.
- **The external SSD.** Installs and Metro may be slow. Mitigations in §1.1; native builds run on EAS.
