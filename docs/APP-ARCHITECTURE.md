# FYT mobile app and Firebase back end: architecture plan

Date: 2026-10-28 · Status: DRAFT for build · Session TRN-20260928-c20456ad
Companion: `docs/firestore-schema.md`, which holds the collections, fields, indexes, security rules and the rules test matrix.

**Inputs:**
- the signed agreement (`~/Downloads/signed agreement of training project.pdf`, read in full: §1–§11);
- `PRODUCT.md`, `DESIGN.md`, `docs/DESIGN-v2.md`, `docs/INTEGRATION-PLAN.md` and `brand/`;
- the admin's de facto spec: `apps/admin/src/lib/{data/*, slots.ts, rbac.ts, storage/*}`.

**Precedence:** contract > INTEGRATION-PLAN > this doc > DESIGN-v2.

**Audience:** the agent or developer who will scaffold and build `apps/mobile`, `functions/` and the Firebase config. Section 12 has the Milestone 1 checklist, which can be executed now.

---

## 0. Key decisions

1. **One app with one signed-in role (learner) and two segments (student, corporate).** There is no trainer login in Phase 1: the contract has every listing created by the admin, and trainers receive the Meet link by calendar email.
2. **Phone OTP is the only sign-in** (contract §2.1). There is no email or Google sign-in, which also keeps Sign in with Apple off the iOS checklist.
3. **Stack:** Flutter 3.47.8 / Dart 3.13 with Riverpod 3 (hand-written providers), go_router 18 (`StatefulShellRoute`), and freezed + json_serializable models held to shared JSON fixtures.
4. **The local Flutter (3.41.5) must be upgraded first**, because the current go_router, Riverpod and freezed need Dart ≥ 3.12. Fallback pins are listed if the upgrade is refused.
5. **Fonts are bundled:** Inter 400/500, Playfair Display 500, Geist Mono 400/500. Nothing is fetched at runtime.
6. **The app reads Firestore directly and writes only through versioned callables (`…V1`).** The admin runs the same `packages/domain` code through the Admin SDK.
7. **Learner authorization** comes from uid ownership plus the `users/{uid}` document. Custom claims are used only for operators (`fytRole`).
8. **Browse and search read one `catalogIndex` document per kind** and filter on the client. No composite catalog indexes are needed.
9. **Slots are generated on read** by `slots.ts`, moved to `packages/domain`. Seats are tracked in per-day `slotLedgers`. Each booking is one Firestore transaction with a deterministic ID and a reserved human ref (`BK-XXXXXX`).
10. **There is no pre-booking hold in Phase 1**, because there is no payment step. The `requested` state is the hold, with `holdExpiresAt` and a sweeper.
11. **Time:** stored as epoch ms. Every rule, slot and displayed time is Asia/Kolkata (fixed +05:30).
12. **Meet links** come from Calendar API `events.insert` with `conferenceData`, run by a Cloud Tasks worker with retries and a dead-letter path. Recommended identity: Google Workspace with domain-wide delegation.
13. **Firebase:** region `asia-south1`, Node 24 functions, projects `demo-fyt` (emulator), dev, staging and prod.
14. **The repo is public**, so no real-project Firebase config, secrets or client data are committed. Config is injected through `--dart-define-from-file`, gitignored native files and CI secrets.
15. **Repo layout:** `firebase.json`, rules and indexes at the root, plus `functions/`, `packages/{schema,domain}`, `tests/rules` and `apps/mobile`.

---

## 1. Local toolchain (checked 2026-10-28 on this Mac) and the slow-disk plan

| Tool | Found | Needed | Status |
|---|---|---|---|
| Flutter | 3.41.5 stable (2026-03-17), Homebrew at `/opt/homebrew/share/flutter` | **3.47.8** (current stable, 2026-10-23) | **Upgrade**: `brew upgrade --cask flutter` |
| Dart | 3.11.3 | 3.13.x (comes with Flutter 3.47.8) | Upgrade together with Flutter |
| Firebase CLI | 15.11.0 (global, nvm) | 15.34.1 (latest) | OK. The repo pins `firebase-tools` as a devDependency, so use `npx firebase` |
| Node / npm | v24.13.1 / 11.8.0 (nvm) | Node 24 (functions runtime `nodejs24` is GA; `@firebase/rules-unit-testing` 6 needs ≥ 24.12) | OK |
| Java | **none.** `/usr/bin/java` is the macOS stub ("Unable to locate a Java Runtime") | **JDK 21+**. firebase-tools 15 refuses to start emulators below Java 21 (`MIN_SUPPORTED_JAVA_MAJOR_VERSION = 21`), and Android Gradle also needs a JDK | **Missing. Blocks the emulators and Android builds** |
| Xcode | 27.1 (27A9275), CocoaPods 1.16.2 | | OK, but **the iOS 27.1 Simulator runtime is not installed** (`flutter doctor`) |
| Android SDK | `~/Library/Android/sdk`: platforms 31–36.1, build-tools 35/36, cmdline-tools, emulator 37.1, NDK | | Present, but `ANDROID_HOME` is unset, `adb` and `sdkmanager` aren't on PATH, there's no Android Studio, licences are unverified, and doctor reports "Could not determine java version" |
| gcloud / gh | 562.0.0 / present | | OK |
| FlutterFire CLI | not installed | needed in Milestone 2, for real projects only | `dart pub global activate flutterfire_cli` later |
| OS | macOS 27.0.1, arm64 | | |

`flutter doctor -v` summary:
- Flutter: OK.
- Android toolchain: Java missing.
- Xcode: simulator runtime missing.
- Chrome: OK.
- Network: OK.

**Nothing was installed for this report.** The installs are listed as Milestone 1 pre-flight items P1–P6, and they need the owner's go-ahead.

### 1.1 The repo is on a slow external SSD (USB, APFS)

- **Keep the heavy caches on the internal disk, where they already are.** Don't relocate them:
  - `~/.pub-cache` (1.5 GB) and `~/.gradle` (9.1 GB);
  - Xcode DerivedData and the CocoaPods cache;
  - the AVDs (`~/.android/avd`);
  - the Firebase emulator JARs (`~/.cache/firebase/emulators`).
- **Per-project build output (`apps/mobile/build`, `.dart_tool`, `ios/Pods`) lives on the SSD.** Measure first with `time flutter build apk --debug --flavor dev`. If an incremental build takes over 60 s, symlink `apps/mobile/build` to `~/Library/Caches/fyt/mobile-build`. The `build/` directory is gitignored and disposable.
- **Keep code generation narrow.** `build.yaml` limits freezed/json_serializable to `lib/shared/models/**`. There's no `riverpod_generator` and no `go_router_builder`. Run `build_runner build` on demand rather than `watch`. Generated `*.freezed.dart` and `*.g.dart` files are committed, so a checkout compiles without running codegen, and CI checks for drift.
- **Gradle:** in `android/gradle.properties` set `org.gradle.caching=true`, `org.gradle.configuration-cache=true` and `org.gradle.jvmargs=-Xmx4g`. Keep the daemon warm.
- **npm workspaces** hoist to one root `node_modules`, so there is one copy on the SSD instead of three.
- **Don't run `flutter clean` or `pod deintegrate` by reflex.** Run `pod install` only when the `Podfile` changes.
- **Editor watchers:** exclude `**/build/**`, `**/.dart_tool/**`, `**/node_modules/**` and `**/Pods/**`.
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
- Build **one Flutter app** for learners.
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

## 3. Flutter stack

### 3.1 Packages (pinned; checked against pub.dev on 2026-10-28)

- `pubspec.yaml` uses `^x.y.z` with these lower bounds, and `pubspec.lock` is committed.
- CI runs `flutter pub get --enforce-lockfile`.
- Environment: `sdk: ^3.13.0`, `flutter: ">=3.47.0"`.
- The **fallback** column is the newest version that still resolves on the local Flutter 3.41.5 / Dart 3.11.3. Use it only if the upgrade is refused.

| Package | Pin | Fallback (3.41.5) | Why |
|---|---|---|---|
| flutter_riverpod | 3.4.3 | 3.3.2 | State and DI. Hand-written providers, no generator |
| go_router | 18.1.1 | 17.5.0 | Routing, redirects, `StatefulShellRoute` |
| firebase_core | 5.1.0 | 5.1.0 | |
| firebase_auth | 7.0.1 | 7.0.1 | Phone OTP |
| cloud_firestore | 7.1.0 | 7.1.0 | Reads, offline cache |
| cloud_functions | 7.0.1 | 7.0.1 | Callables |
| firebase_messaging | 17.0.1 | 17.0.1 | FCM |
| firebase_crashlytics | 6.0.1 | 6.0.1 | Contract §10 crash-rate metric |
| firebase_app_check | 0.5.1 | 0.5.1 | Play Integrity / App Attest |
| flutter_local_notifications | 22.3.3 | 22.3.3 | Android channels, foreground display |
| freezed_annotation / json_annotation | 3.1.0 / 4.12.0 | same | Models |
| flutter_localizations (sdk) + intl | `intl: any` (resolved by flutter_localizations) | same | l10n, en_IN formatting |
| cached_network_image | 4.0.5 | 3.4.1 | Catalog images with disk cache |
| url_launcher | 6.3.3 | 6.3.3 | Meet link, tel:, mailto:, Maps |
| connectivity_plus | 7.3.2 | 7.3.2 | Offline banner hint |
| shared_preferences | 2.5.6 | 2.5.6 | Small local flags (last registered token hash, theme) |
| package_info_plus | 10.2.2 | 10.2.2 | `minAppVersion` gate, `client.appVersion` |
| uuid | 4.6.0 | 4.6.0 | `clientRequestId` |
| flutter_svg | 2.3.0 | 2.3.0 | Brand SVGs from `brand/logo` |
| lucide_icons_flutter | 4.0.1 | 4.0.1 | Same icon family as the admin (lucide) |
| pinput | 7.0.0 | 6.0.2 | OTP input with autofill and paste |
| **dev:** build_runner | 2.17.1 | 2.17.1 | |
| freezed | 4.0.3 | 3.2.5 | |
| json_serializable | 6.15.2 | 6.14.1 | |
| flutter_lints | 6.0.0 | 6.0.0 | Plus the strict analyzer modes below |
| mocktail | 1.0.5 | 1.0.5 | |
| fake_cloud_firestore / firebase_auth_mocks | 4.5.0 / 0.16.0 | same | Widget tests without emulators |
| http | 1.6.0 | 1.6.0 | integration_test fetches OTP codes from the Auth emulator REST API |
| integration_test, flutter_test (sdk) | | | |
| flutter_launcher_icons / flutter_native_splash | 0.14.4 / 2.4.8 | same | Milestone 8 store assets |

Deliberately excluded:
- `google_fonts`: fonts are bundled, and 9.0.0 needs Flutter 3.47.
- `riverpod_generator` / `go_router_builder`: extra codegen on a slow disk for little gain.
- `firebase_analytics`: Phase 2 "advanced analytics", and it would add privacy-label scope. Booking funnel numbers come from the server (`statsDaily.bookingAttempts`).
- `timezone`: IST is a fixed offset.

Back-end npm pins:
- runtime: `firebase-functions 7.4.0`, `firebase-admin 14.5.0`, `zod 4.6.7` (the admin is on ^4.6.5), `@googleapis/calendar 20.1.0`, `google-auth-library 11.3.1`;
- dev: `typescript 5.9.3` (the same major as the admin; TS 7 is out but tooling compatibility isn't proven), `esbuild 0.28.2`, `vitest 5.0.5`, `@firebase/rules-unit-testing 6.0.0`, `firebase 13.1.0`, `firebase-tools 15.34.1`, `@types/node ^24`.

### 3.2 State management: Riverpod 3, hand-written providers

**Layers per feature:**
- `data/` holds repositories: Firestore reads, callable calls and model mapping. These are the only classes that touch Firebase.
- `application/` holds `Notifier` / `AsyncNotifier` controllers and derived providers.
- `presentation/` holds widgets that `ref.watch` providers.

Core providers (`lib/core/firebase/providers.dart`, `lib/features/session/`):

```dart
final envProvider = Provider<Env>((_) => throw UnimplementedError());           // overridden in bootstrap
final authProvider = Provider((ref) => FirebaseAuth.instance);
final firestoreProvider = Provider((ref) => FirebaseFirestore.instance);
final functionsProvider = Provider((ref) => FirebaseFunctions.instanceFor(region: 'asia-south1'));

final authUserProvider = StreamProvider<User?>((ref) => ref.watch(authProvider).idTokenChanges());
final configPublicProvider = StreamProvider<ConfigPublic>(...);                   // config/public snapshots
final userDocProvider = StreamProvider<UserDoc?>(...);                            // users/{uid}; null when signed out or missing
final sessionProvider = Provider<SessionState>(...);                             // pure derivation, see §4.2
```

- `ProviderScope(retry: …)`: Riverpod 3 retries failing providers by default. The retry callback returns `null` (no retry) for `AppFailure`s with `retryable == false`, such as permission or validation errors. Otherwise it backs off 200 ms × 2ⁿ, up to 3 tries.
- Listeners on `users/{uid}`, `config/public` and an open booking are realtime `StreamProvider`s. Lists use the cached `catalogIndex` doc.
- There is no global mutable singleton outside providers. Tests override providers with fakes.

### 3.3 Routing: go_router 18

- `lib/core/router/routes.dart` holds the route names and paths, `redirect.dart` holds the pure `String? redirectFor(SessionState s, Uri location)`, and `router.dart` builds the `GoRouter`.
- `refreshListenable` is a `ValueNotifier<SessionState>` kept in sync with `ref.listen(sessionProvider, …)`.
- Tabs use `StatefulShellRoute.indexedStack` with four branches: Home, Explore, Bookings, Profile. Each branch keeps its own navigation stack.
- Detail routes (`/courses/:id`, `/bookings/:id` and so on) sit outside the shell (full-screen, using `parentNavigatorKey: rootKey`), so a deep link from a push opens them directly.
- **Read the go_router 17 and 18 changelog entries before scaffolding.** 17.0 made shell navigation notify root observers by default. 15.0 made URLs case-sensitive: keep all paths lowercase.

Redirect table (evaluated top-down; the first match wins):

| Session state | Allowed locations | Otherwise go to |
|---|---|---|
| `Booting` | `/splash` | `/splash` |
| `UpdateRequired` | `/gate/update` | `/gate/update` |
| `Maintenance` | `/gate/maintenance` | `/gate/maintenance` |
| `SignedOut` | `/welcome`, `/auth/*` | `/welcome` |
| `Blocked` | `/gate/blocked` | `/gate/blocked` |
| `NeedsOnboarding(step)` | `/onboarding/*` | `/onboarding/{segment\|student\|corporate\|profile}` for that step |
| `Ready(segment)` | everything except `/splash`, `/welcome`, `/auth/*`, `/onboarding/{segment,student,corporate}`, `/gate/*`. `/onboarding/profile` stays allowed: it is the optional step pushed right after the details are saved | `/home`, or the pending deep link |

Deep links:
- A push's `data.route` is validated against an allowlist (`/bookings/:id`, `/notifications`, `/courses/:id`, `/providers/:id`, `/institutes/:id`).
- It is stored as a pending link while the session isn't `Ready`, then replayed.
- Custom scheme `fyt://` now. Verified App Links / Universal Links later, on the client's domain via Firebase Hosting (contract §5 lists Vercel + Firebase Hosting).

### 3.4 Theme and tokens (same brand as the console)

Flutter has no OKLCH, so the tokens below are the admin's live `globals.css` values converted to sRGB. They live in `lib/core/theme/tokens.dart` as `FytPalette.light` and `FytPalette.dark`. Regenerate them if `globals.css` changes.

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
- A status is never shown by colour alone. `StatusPill` always pairs a colour with an icon and a label. Booking pills:
  - requested: info, clock, "Requested";
  - confirmed: ok, check, "Confirmed";
  - meet_failed: warn, alert, "Link delayed";
  - cancelled: ink3, x, "Cancelled";
  - completed: ok, check-check, "Attended";
  - no_show: bad, user-x, "Missed";
  - unknown: ink3, help, "Contact support".
- Radii: 6 for controls, 10 for cards, 14 for sheets and dialogs. No pill-shaped panels.
- Depth comes from tone plus a 1 px line. The only shadow is on overlays (sheets, menus), tinted ink.
- Motion: 150–220 ms with `Curves.easeOutQuart`, animating transform and opacity only, and only for state changes. `MediaQuery.disableAnimationsOf(context)` turns it off.
- `ThemeData` mapping:
  - `colorScheme`:
    - `primary` is ink and `onPrimary` is paper;
    - `secondary` is accent and `onSecondary` is accentInk;
    - `surface` is surface and `surfaceContainer` is sunken;
    - `outline` is lineStrong and `outlineVariant` is line;
    - `error` is bad.
  - All tokens are also exposed as a `ThemeExtension<FytColors>` (`context.fyt.ink2`).
  - `ThemeMode.system`, plus a manual override in Settings.
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40. Screen gutter 16. Minimum touch target 48 × 48.

### 3.5 Typography

| Style (`TextTheme`) | Font | Size / line height | Weight | Use |
|---|---|---|---|---|
| displayLarge | Playfair Display | 34 / 40 | 500 | Welcome headline |
| headlineMedium | Playfair Display | 28 / 34, −0.01em | 500 | Screen titles |
| titleLarge | Playfair Display | 22 / 28 | 500 | Detail names, sheet titles, section titles |
| titleMedium | Inter | 17 / 24 | 500 | Card titles, list primary |
| bodyLarge | Inter | 16 / 24 | 400 | Default body |
| bodyMedium | Inter | 15 / 22 | 400 | Dense body, list secondary |
| bodySmall (meta) | Inter | 14 / 20 | 400 | Meta, descriptions |
| labelLarge | Inter | 15 / 20 | 500 | Buttons |
| labelMedium (caption) | Inter | **13 / 18** | 500 | **The floor**: pills, chips, tab labels, helper text, timestamps |
| labelSmall (micro) | Inter | 12 / 16, +0.06em, UPPERCASE | 500 | Eyebrow labels only |
| `FytText.mono(base)` | Geist Mono | inherits | 400 / 500, `FontFeature.tabularFigures()` | Booking refs, times, dates, counts, OTP digits |

- Never 600 or bold anywhere. Hierarchy comes from size, ink / ink2 / ink3 and spacing.
- Playfair Display only at 18 px and above. Nothing below 13 px except the uppercase 12 px micro label.
- Respect the system text scale with no clamp. Layouts wrap and truncate (with full text in `Semantics`/`Tooltip`) instead of shrinking. Widget tests run key screens at 1.0, 1.3 and 2.0.

**Fonts are bundled, not fetched.**
- Files in `assets/fonts/`:
  - `Inter-Regular.ttf` and `Inter-Medium.ttf` (rsms/inter release, static TTFs);
  - `PlayfairDisplay-Medium.ttf` (google/fonts `ofl/playfairdisplay`; take the static instance from the family download);
  - `GeistMono-Regular.ttf` and `GeistMono-Medium.ttf` (vercel/geist-font release);
  - one `OFL-<family>.txt` per family.
- Declare them under `flutter: fonts:` with explicit weights.
- Register the licences with `LicenseRegistry.addLicense` so they appear on the Flutter licence page.
- Why bundle: first paint works offline, there's no runtime network fetch, and the files are deterministic. That is about 1 MB.

### 3.6 Localisation readiness

- `l10n.yaml`: `arb-dir: lib/l10n`, `template-arb-file: app_en.arb`, `output-dir: lib/l10n/gen`, `nullable-getter: false`. Generated files are committed.
- Every user-facing string goes through `AppLocalizations` from day one. Only `en` ships; multi-language is Phase 2.
- Dates and numbers use `intl` with the `en_IN` locale, so lakh grouping is right. All times are formatted through `core/time/ist.dart` (§5.6).
- Copy rules:
  - sentence case, plain and exact (PRODUCT.md tone);
  - errors say what happened and what to do next;
  - empty states teach the next action and never invent numbers.

### 3.7 Error handling

- `ErrorReason` is a Dart enum that mirrors `packages/schema` `ErrorReason`, plus an `unknown` fallback:
  - `VALIDATION_FAILED`, `USER_BLOCKED`, `APP_UPDATE_REQUIRED`, `MAINTENANCE`, `PROFILE_INCOMPLETE`, `LISTING_NOT_FOUND`;
  - `SLOT_FULL`, `SLOT_NOT_OFFERED`, `LEAD_TIME`, `USER_OVERLAP`, `BOOKING_LIMIT`, `IDEMPOTENCY_MISMATCH`, `CONTENTION`;
  - `BOOKING_NOT_FOUND`, `INVALID_STATE`, `CANCEL_WINDOW_CLOSED`, `RESCHEDULE_DISABLED`;
  - `REAUTH_REQUIRED`, `RATE_LIMITED`, `INTERNAL`.
- `sealed class AppFailure`:
  - `NetworkFailure` (unavailable, deadline exceeded, offline);
  - `AuthFailure(code)`, mapped from `FirebaseAuthException` codes such as `invalid-verification-code`, `too-many-requests`, `session-expired`, `quota-exceeded`, `user-disabled`, `network-request-failed`;
  - `ServerFailure(reason, retryable, fieldErrors, requestId)`, from `FirebaseFunctionsException.details`;
  - `PermissionFailure`;
  - `UnknownFailure`.
- `core/firebase/callable.dart` provides `Future<T> call<T>(String name, Map req, T Function(Map) parse)`. It:
  - adds `client: {appVersion, platform}`;
  - maps exceptions to `AppFailure`;
  - **switches on `reason`, never on the message text.**
- **Where errors show:**
  - inline under the field or button for validation and booking errors (for example: "That slot was just taken. Pick another time.", then refresh the slots);
  - a SnackBar for transient errors;
  - a full-screen `ErrorView` with Retry when a screen's primary load fails.
- **Crashlytics:**
  - `FlutterError.onError` and `PlatformDispatcher.instance.onError` record fatals;
  - unexpected `ServerFailure(INTERNAL|unknown)` is recorded as non-fatal with its `requestId`;
  - collection is off in the `emulator` and `dev` environments;
  - Crashlytics never receives phone numbers, names or OTP values.

### 3.8 Offline behaviour

- Firestore persistence is on: `Settings(persistenceEnabled: true, cacheSizeBytes: 100 MB)`.
- **Available offline (reads):**
  - `config/public`;
  - the three `catalogIndex` docs (browse, filter and search work fully offline);
  - detail docs already opened;
  - `users/{uid}`;
  - my bookings, including the **Meet link**, which matters because joining needs only the URL;
  - notifications.

  Images come from the `cached_network_image` disk cache.
- **Online only (writes):**
  - OTP sign-in;
  - onboarding and profile saves;
  - slot availability;
  - booking, cancel and reschedule;
  - device registration;
  - account deletion.

  Their buttons are disabled offline, with the reason given inline ("You're offline. Booking needs a connection."). **Bookings are never queued offline:** a queued booking that fails later is worse than an honest disabled button.
- An offline banner appears when `connectivity_plus` reports no network **or** the last Firestore snapshot came `fromCache` after a failed server fetch. `connectivity_plus` alone can't detect captive portals.

### 3.9 Folder structure

```
apps/mobile/
  pubspec.yaml  pubspec.lock  analysis_options.yaml  l10n.yaml  build.yaml  README.md
  env/            emulator.json (committed, fake values)  dev|staging|prod.example.json (committed)  dev|staging|prod.json (gitignored)
  assets/fonts/   Inter-*.ttf  PlayfairDisplay-Medium.ttf  GeistMono-*.ttf  OFL-*.txt
  assets/brand/   fyt-mark.svg  fyt-wordmark.svg  fyt-wordmark-light.svg   (copied from /brand/logo)
  lib/
    main.dart                    reads Env.fromEnvironment(), calls bootstrap()
    app/       bootstrap.dart  app.dart  env.dart  firebase_options.dart (builds FirebaseOptions from Env)
    core/
      theme/        tokens.dart  colors.dart (ThemeExtension)  typography.dart  spacing.dart  theme.dart
      router/       routes.dart  redirect.dart  router.dart
      firebase/     providers.dart  callable.dart  emulators.dart
      errors/       error_reason.dart  app_failure.dart  error_mapper.dart
      time/         ist.dart  formatters.dart
      connectivity/ connectivity_provider.dart  offline_banner.dart
      widgets/      fyt_button.dart  fyt_text_field.dart  status_pill.dart  empty_state.dart  error_view.dart  skeleton.dart  section_header.dart
    l10n/          app_en.arb  gen/ (generated, committed)
    shared/models/ user_doc.dart  config_public.dart  catalog_index.dart  course.dart  institute.dart  provider_profile.dart  booking.dart  slot.dart  app_notification.dart  (+ .freezed.dart/.g.dart, committed)
    features/
      session/       session_state.dart  session_provider.dart
      gates/         splash_screen.dart  update_required_screen.dart  maintenance_screen.dart  blocked_screen.dart
      auth/          data/auth_repository.dart  application/phone_auth_controller.dart  presentation/{welcome,phone,otp}_screen.dart
      onboarding/    data/profile_repository.dart  application/onboarding_controller.dart  presentation/{segment,student_form,corporate_form,profile_setup}_screen.dart
      shell/         learner_shell.dart
      home/          home_screen.dart  student_home.dart  corporate_home.dart
      explore/       explore_screen.dart  filters/
      catalog/       data/catalog_repository.dart  courses/  institutes/  providers/
      booking/       data/booking_repository.dart  application/  presentation/{slot_picker,confirm_sheet,booking_detail,my_bookings}.dart
      notifications/ data/  push/push_service.dart  presentation/inbox_screen.dart
      profile/       presentation/{profile,edit_profile,settings,delete_account}_screen.dart
      dev/           gallery_screen.dart (non-prod only)
  test/            mirrors lib/; reads ../../packages/schema/fixtures/*.json for model contract tests
  integration_test/ auth_flow_test.dart  booking_flow_test.dart (emulator)
  android/  ios/
```

`analysis_options.yaml`:
- `include: package:flutter_lints/flutter.yaml`;
- `analyzer.language: {strict-casts: true, strict-inference: true, strict-raw-types: true}`;
- exclude `**/*.g.dart` and `**/*.freezed.dart`;
- extra lints: `always_use_package_imports`, `avoid_print`, `unawaited_futures`, `prefer_final_locals`, `require_trailing_commas`, `use_build_context_synchronously`.

Models:
- freezed classes with `@JsonKey(unknownEnumValue: …unknown)` on every enum.
- Times are `int` epoch ms, with `DateTime` getters through `ist.dart`.
- Each model has a fixture test: decode → encode → compare with the shared fixture.

### 3.10 Testing

| Layer | Tooling | What |
|---|---|---|
| Unit | `flutter test` | redirect table, IST helpers (the same day-boundary cases as the admin's `slots.test.ts`), phone normalisation, semver gate, error mapping, model fixtures |
| Widget | `flutter test` with provider overrides, `fake_cloud_firestore`, `firebase_auth_mocks` | phone and OTP validation, resend timer (fake_async), gates, home per segment, slot picker states, booking detail per status, text scale 2.0 |
| Integration | `integration_test` on a simulator or emulator against the Firebase Emulator Suite | OTP sign-in (code read from `GET http://HOST:9099/emulator/v1/projects/demo-fyt/verificationCodes`), onboarding, a booking end to end (Milestone 5+) |
| Back end | vitest + emulators (`firebase emulators:exec`) | rules matrix, callables, transactions (the 50-parallel `createBooking` test), triggers fired twice give one side effect |

---

## 4. Auth

### 4.1 Learner sign-in: phone OTP, Firebase Auth

1. **Phone screen.** Normalise to E.164 `+91XXXXXXXXXX`: 10 digits starting 6–9, mirroring `apps/admin/src/lib/auth/identifiers.ts`. Then call `verifyPhoneNumber(phoneNumber, timeout: 60s, verificationCompleted, verificationFailed, codeSent, codeAutoRetrievalTimeout)`.
   - On Android, `verificationCompleted` (auto-retrieval) signs in without typing.
   - On iOS, Firebase uses silent APNs, with a reCAPTCHA fallback. Both need setup in real projects: the APNs auth key uploaded to Firebase, and the reversed app-ID URL scheme in `Info.plist` per flavor. **Neither is needed on the emulator:** with `useAuthEmulator`, the SDKs disable app verification, no SMS is sent, and the code appears in the Emulator UI and REST endpoint.
2. **OTP screen.**
   - `PhoneAuthProvider.credential(verificationId, smsCode)` → `signInWithCredential`.
   - Resend uses `forceResendingToken` after a 30 s countdown, at most 3 times per screen visit. Firebase applies its own rate limits, surfaced as `too-many-requests`.
   - Autofill: `AutofillHints.oneTimeCode` on iOS; on Android, Firebase auto-retrieval.
3. **After sign-in.** Call `ensureUserV1`. It creates `users/{uid}` on the first call: `segment: null`, `onboarded: false`, the phone from the token, `createdAt`. That is the "Registered" funnel stage. On later calls it bumps `lastActiveAt` (throttled) and returns the doc.
   - It runs non-blocking after the cached user doc renders, so a cold start isn't gated on a function round-trip.
4. **Session.** The router reacts to `sessionProvider` (§4.2).
5. **Sign out.** Call `unregisterDeviceV1` first, while the user is still authenticated, then `FirebaseAuth.signOut()`. App queries are always scoped by `userId`, so a later learner never sees another learner's cached data. Even so, a shared phone shouldn't keep the previous learner's bookings in the cache:
   - Store the last signed-in uid in `shared_preferences`.
   - At the next cold start, if the uid differs, `bootstrap()` calls `FirebaseFirestore.instance.clearPersistence()` before any other Firestore use.

**Dev and staging projects (real SMS cost):**
- Use Firebase console **test phone numbers** (fictional numbers with fixed codes, no SMS) for daily work.
- On Android, set `FirebaseAuth.instance.setSettings(appVerificationDisabledForTesting: true)` only when `FYT_ENV != prod` and the number is in the test set.
- **Apple and Google review** need a working demo login. Configure one fictional test number in prod and give it to the reviewers.
- **SMS-pumping guard:**
  - restrict SMS regions to India (verify availability on the project's Auth tier; it may need Identity Platform);
  - App Check;
  - budget alerts (contract §11 "Firebase cost spike").

### 4.2 Session state machine

```dart
sealed class SessionState {}
class Booting extends SessionState {}                       // Firebase/config/auth not resolved yet
class UpdateRequired extends SessionState {}                // appVersion < config.minAppVersion[platform]
class Maintenance extends SessionState { final String? message; }
class SignedOut extends SessionState {}
class Blocked extends SessionState {}                       // users.blocked, or Auth user-disabled / user-token-expired
class NeedsOnboarding extends SessionState { final OnboardingStep step; }
class Ready extends SessionState { final Segment segment; }
```

The derivation is pure and unit-tested, with the precedence shown: `Booting > UpdateRequired > Maintenance > SignedOut > Blocked > NeedsOnboarding > Ready`.
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
- **Dart:** never call `DateTime.toLocal()` for business display. Use `core/time/ist.dart`:
  - `istFromEpoch(ms)` = `DateTime.fromMillisecondsSinceEpoch(ms, isUtc: true).add(const Duration(minutes: 330))`, formatted with `DateFormat` as a UTC value;
  - `istDateKey(ms)`;
  - `istMinute(ms)`.

  Unit tests share the day-boundary fixtures with `slots.test.ts`: 23:59 and 00:00 IST, and UTC 18:30 rollover.
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
  - Get the token after permission is granted. `registerDeviceV1` runs on first grant, on every `onTokenRefresh`, and on app start if `sha256(token)` differs from the last registered hash in `shared_preferences`.
  - On sign-out, call `unregisterDeviceV1` before `signOut`.
  - Stored at `users/{uid}/devices/{sha256(token)}`. On send, the server prunes tokens that return `messaging/registration-token-not-registered`.
- **Topics:**
  - `all`, `seg_student` and `seg_corporate`, subscribed **server-side** (Admin SDK `subscribeToTopic`) in `registerDeviceV1`, and re-subscribed when `saveProfileV1` changes the segment.
  - Broadcasts go to topics. Booking messages go to the user's tokens (multicast).
- **Android channels** (created at startup by `flutter_local_notifications`):

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
- **Taps:** `getInitialMessage` (cold start) and `onMessageOpenedApp` (background) both go through the router's pending deep link (§3.3). In the foreground on Android, `flutter_local_notifications` shows the message. On iOS, the presentation options do.
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

### 10.1 Projects and flavors

| Env | Firebase project | Owner | Used for | App ID (placeholder until Q3) |
|---|---|---|---|---|
| `emulator` | `demo-fyt` (the `demo-` prefix means no real resources and no billing) | none | Local development, CI integration tests | any dev build with `FYT_ENV=emulator` |
| `dev` | ours, created now (for example `fyt-dev-<suffix>`), Blaze, `asia-south1`; later replaced by the client's `fyt-dev` | us, then the client | Device testing with test phone numbers, the Meet spike, internal builds | `in.findyourtrainer.fyt.dev` |
| `staging` | `fyt-staging` (client, Blaze, `asia-south1`) | client | UAT (contract M6), TestFlight and Play internal testing, store review | `in.findyourtrainer.fyt.stg` |
| `prod` | `fyt-prod` (client, Blaze, `asia-south1`) | client | Live | `in.findyourtrainer.fyt` |

- If the client wants only two projects (INTEGRATION-PLAN S13), staging folds into dev and the `staging` flavor points at it. Nothing else changes.
- **The Firestore location (`asia-south1`) can't be changed once chosen** (INTEGRATION-PLAN D3).
- **Flutter flavors:**
  - Android `productFlavors`: `dev`, `staging` and `prod`, with `applicationIdSuffix` and a `resValue` app name ("FYT Dev", "FYT Staging", "FYT").
  - iOS: schemes `dev`, `staging` and `prod`, with `Debug-/Release-<flavor>` configurations and xcconfig bundle IDs.
  - Run commands:
    - `flutter run --flavor dev --dart-define-from-file=env/emulator.json` for the emulator;
    - `flutter run --flavor dev --dart-define-from-file=env/dev.json` for the dev project.
  - Milestone 1 ships without native flavors (emulator only). They arrive in Milestone 2.

### 10.2 Keeping config out of git ("switch projects with config only")

The repo is **public**, so nothing that names or unlocks a real project is committed. The project lives entirely in these places:

| Item | Where | Committed? |
|---|---|---|
| Firebase project aliases | `.firebaserc` (`default: demo-fyt`; `dev`, `staging` and `prod` added with `firebase use --add`) | Yes, `demo-fyt` only. The real IDs are added locally, or by CI with `--project` |
| Dart-side `FirebaseOptions` | `apps/mobile/env/<env>.json`: `FYT_ENV`, `FYT_FB_PROJECT_ID`, `FYT_FB_API_KEY`, `FYT_FB_SENDER_ID`, `FYT_FB_ANDROID_APP_ID`, `FYT_FB_IOS_APP_ID`, `FYT_FB_IOS_BUNDLE_ID`, `FYT_FB_STORAGE_BUCKET`, `FYT_EMULATOR_HOST` | Only `emulator.json` (fake `demo-fyt` values) and `*.example.json` |
| Native config | `android/app/src/<flavor>/google-services.json`, `ios/config/<flavor>/GoogleService-Info.plist` (a build phase copies the flavor's plist) | **No**, gitignored. `flutterfire configure --project=<id> --platforms=android,ios` writes them locally. CI decodes them from base64 secrets. Set `googleServices { missingGoogleServicesStrategy = WARN }` so emulator builds work without them |
| Functions non-secret params | `functions/.env.<projectId>` (`ORGANIZER_EMAIL`, `CALENDAR_ID`, `ALERT_EMAILS`, `MEET_MODE`) | No. The root `.gitignore` already ignores `.env.*` and allows `.env.example` |
| Functions secrets | Secret Manager through `defineSecret`: option A uses keyless DWD (no secret) or `CAL_SA_KEY_JSON` as a fallback; option B uses `CAL_OAUTH_CLIENT_ID`, `CAL_OAUTH_CLIENT_SECRET` and `CAL_OAUTH_REFRESH_TOKEN`. Set with `firebase functions:secrets:set` | Never |
| Admin (Vercel) | Vercel env vars: `FYT_DATA_SOURCE`, `FIREBASE_PROJECT_ID`, the WIF/OIDC config | Never |
| Signing | Android keystore plus `key.properties`; App Store Connect API key | Never. GitHub environment secrets (Milestone 8) |

Firebase client API keys aren't secrets in the cryptographic sense: security comes from the rules, App Check and API-key restrictions. They're kept out anyway because the repo is public and the brief asks for it. In each real project, restrict the API keys to the app IDs.

### 10.3 Secrets and identities

- Functions run as a dedicated runtime service account per project with least privilege: Firestore, FCM, Cloud Tasks enqueue, IAM `signJwt` on `meet-organizer` (option A).
- CI deploys through **Workload Identity Federation** (`google-github-actions/auth`), so no JSON keys live in GitHub.
- The admin on Vercel gets GCP access through Vercel OIDC and WIF (INTEGRATION-PLAN D4).

### 10.4 CI (GitHub Actions; the client-owned org in the end)

| Workflow | Trigger | Steps |
|---|---|---|
| `mobile.yml` | PR / push touching `apps/mobile/**`, `packages/schema/fixtures/**` | `subosito/flutter-action@v2` (flutter-version 3.47.8, cache on) → `flutter pub get --enforce-lockfile` → `dart run build_runner build --delete-conflicting-outputs` + `git diff --exit-code` (codegen drift) → `dart format --output=none --set-exit-if-changed lib test integration_test` → `flutter analyze` → `flutter test --coverage`. Nightly on `main`: `flutter build ios --no-codesign --flavor dev` (macOS runner) and `flutter build apk --flavor dev` |
| `backend.yml` | PR / push touching `functions/**`, `packages/**`, `tests/rules/**`, `firestore.*`, `storage.rules`, `firebase.json` | `actions/setup-node` 24 (npm cache) + `actions/setup-java` 21 (temurin) + cache `~/.cache/firebase/emulators` → `npm ci` → `npm run typecheck` → `npm run lint` → `npm test -w packages/schema -w packages/domain` → `npx firebase emulators:exec --project demo-fyt --only auth,firestore,functions,storage,tasks "npm run test:integration"` (rules matrix + functions) |
| `deploy-dev.yml` (Milestone 2) | push to `main` | WIF auth → `npx firebase deploy --only firestore,storage,functions --project dev` |
| `deploy-prod.yml` (Milestone 8) | `workflow_dispatch` + the protected `production` environment (manual approval) | the same, for prod. Deploy order: rules and indexes → functions → admin → app release |
| `release-mobile.yml` (Milestone 8) | tag `mobile-v*` | Signed AAB to Play internal testing; IPA to TestFlight through an App Store Connect API key |

---

## 11. Repo layout and how the admin plugs in

```
/                               npm workspaces: functions, packages/*, tests/rules (apps/admin joins in Milestone 7)
├─ firebase.json  .firebaserc  firestore.rules  firestore.indexes.json  storage.rules
├─ package.json  package-lock.json  .nvmrc (24)
├─ apps/
│  ├─ admin/           Next.js 16 console (exists; DATA_SOURCE "demo" today)
│  └─ mobile/          Flutter app (§3.9)
├─ functions/          TypeScript, 2nd gen. src/{index.ts, callables/, triggers/, tasks/, scheduled/, lib/}, test/
│  ├─ build.mjs        esbuild bundle -> functions/dist/index.js (inlines @fyt/schema and @fyt/domain) + dist/package.json (runtime deps, exact versions)
│  └─ dist/            deploy and emulator source (gitignored)
├─ packages/
│  ├─ schema/          @fyt/schema: zod v4 document and callable schemas, ErrorReason, fixtures/*.json (the contract)
│  └─ domain/          @fyt/domain: slots.ts (moved from the admin), booking.ts (transactions, transitions), ids.ts, ist.ts, push.ts
├─ tests/rules/        rules matrix
├─ scripts/            seed-emulator.ts (refuses non-"demo-" projects), owner-bootstrap.ts, import-catalog.ts (Milestone 8)
├─ docs/
└─ .github/workflows/
```

- This places Firebase config at the root as briefed. DESIGN-v2 §3 shows `firebase/functions`; update DESIGN-v2 when Milestone 1 lands.
- `firebase.json` uses `"functions": [{"source": "functions/dist", "runtime": "nodejs24", "predeploy": ["npm run build -w functions"]}]`. Firebase deploys a single directory, so workspace packages are bundled in and only real npm dependencies stay external.
- If the functions emulator can't resolve modules from `dist/` through the hoisted root `node_modules`, the build script runs `npm install --omit=dev --prefix functions/dist` after generating `dist/package.json`.

**The admin's Firestore adapter** (INTEGRATION-PLAN §5; build Milestone 7):

1. **Async repo.** Add `apps/admin/src/lib/data/repo.ts`, the `Repo` interface: `institutes|courses|providers.{list,get,save,delete}`, `availability.{get,save}`, `bookings.{query,get}`, `learners.{query,get,block}`, `broadcasts.*`, `settings.{get,save}`, `audit.query` and `mutate(actor, fn)`. Then:
   - `MemoryRepo` wraps today's `Dataset`;
   - every `db()` call in the 14 pages and the action files becomes `await repo()…`;
   - `queries.ts` becomes async.

   No Firebase is needed for this step.
2. **Join the workspace.** `apps/admin` joins the root workspaces and imports `@fyt/schema` and `@fyt/domain`. Check the Next 16 docs in `apps/admin/node_modules/next/dist/docs/` for `transpilePackages` and the Turbopack root before wiring it. On Vercel, enable "include files outside the root directory".
3. **FirestoreRepo.** `src/lib/firebase/admin.ts` (`server-only`) initialises the Admin SDK and uses the emulator when `FIRESTORE_EMULATOR_HOST` is set. Then:
   - `src/lib/data/firestore-repo.ts` implements `Repo` with zod-based converters, following the mapping table in `firestore-schema.md` §8;
   - `mutate()` writes the change and `audit/{id}` in one transaction;
   - `DATA_SOURCE` becomes `process.env.FYT_DATA_SOURCE` (`demo` | `firestore`), and the header badge stays.
4. **Booking actions.** `bookings/actions.ts` drops `meetCode()` and the local clash check, and calls `@fyt/domain` `cancel`, `reschedule`, `markOutcome` and `requestMeetRetry`.
5. **Availability.** Availability actions and the preview use `@fyt/domain` `slots.ts`, which is the same file.
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
| 2 | **Schema, data and real dev project**: `packages/schema` complete with fixtures, Dart models, catalog triggers + `catalogIndex`, seed for every collection, native flavors + `flutterfire` for dev, deploy-dev pipeline, test phone numbers | Nov 2 – Nov 8 | C-M2 | App signs in on a real phone against dev. Rules matrix 100% |
| 3 | **Onboarding and profile**: segment, student and corporate forms with taxonomy chips, profile setup, profile edit, settings | Nov 5 – Nov 13 | C-M3 | Both segments onboard on dev. Funnel stats increment |
| 4 | **Catalog and discovery**: home per segment, explore, lists, filters, search over `catalogIndex`, course/institute/provider details, gallery, offline cache, optional thumbnails | Nov 9 – Nov 22 | C-M3 | Contract §2.2–2.6 browse items demoable; offline browse works |
| 5 | **Booking engine and booking UI**: `packages/domain` (slots move + booking.ts), `getAvailabilityV1`, `createBookingV1`, `cancelBookingV1`, ledger, concurrency suite; slot picker, confirm, my bookings, detail | Nov 16 – Nov 29 | C-M4 | 50-parallel test passes; book and cancel end to end on the emulator and dev |
| 6 | **Meet, push, reminders**: Meet identity spike (needs Q1 by **Nov 13**), `meetWorker` + DLQ + admin retry, `registerDeviceV1`, booking pushes, `remindersTick`, broadcasts → announcements, inbox, `deleteAccountV1` | Nov 23 – Dec 4 | C-M4 | 100% link generation on the test suite (S8); push received on both OSes |
| 7 | **Admin on Firestore** (parallel track; INTEGRATION-PLAN §5): async repo, FirestoreRepo, domain booking actions, Firebase Auth for operators, signed image uploads, `statsDaily` analytics | Nov 16 – Dec 6 | C-M5 | Console works on dev with real data and atomic audit |
| 8 | **Hardening, QA/UAT and release**: App Check enforce, alerts and budgets, backups + restore drill, `/cso` review, staging and prod projects, store assets (icons, splash, screenshots), privacy policy, data-safety and privacy labels, review test number, TestFlight + Play internal track, UAT, store submission by **Dec 18**, docs + KT | Dec 5 – Dec 27 | C-M6, C-M7 | UAT sign-off; both stores submitted; handover |

**Critical path:**
- Q1 (Meet identity) → Milestone 6.
- Q2 (client Firebase projects) and the Apple and Play accounts → Milestone 8.
- JDK and the Flutter upgrade → Milestone 1.

### 12.1 Milestone 1 checklist (executable now)

**Pre-flight. These need the owner's OK because they install software. They were not run for this report.**
- [ ] P1. JDK 21:
  - `brew install --cask temurin@21`;
  - add `export JAVA_HOME=$(/usr/libexec/java_home -v 21)` to `~/.zshrc`;
  - check that `java -version` reports 21.
- [ ] P2. Flutter:
  - `brew upgrade --cask flutter`;
  - check that `flutter --version` reports 3.47.x / Dart 3.13.x.
  - If the upgrade is refused, use the fallback column in §3.1, set `sdk: ^3.11.0`, and note it in `apps/mobile/README.md`.
- [ ] P3. Android:
  - add `export ANDROID_HOME=$HOME/Library/Android/sdk` and `export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin` to `~/.zshrc`;
  - `flutter config --android-sdk $ANDROID_HOME`;
  - `flutter config --jdk-dir $(/usr/libexec/java_home -v 21)`;
  - `flutter doctor --android-licenses`;
  - create an AVD: `sdkmanager "system-images;android-36;google_apis;arm64-v8a"` + `avdmanager create avd -n fyt_api36 -k "system-images;android-36;google_apis;arm64-v8a" -d pixel_8`.
- [ ] P4. iOS:
  - `xcodebuild -downloadPlatform iOS` to get the iOS 27.1 simulator runtime;
  - `sudo xcodebuild -license accept` if prompted.
- [ ] P5. `flutter doctor -v` reports no errors for the Android toolchain or Xcode.

**Back end and emulator (repo root)**
- [ ] 1. **Root `package.json`.**
  - Fields: `"private": true`, `"workspaces": ["functions", "packages/*", "tests/rules"]`, `"engines": {"node": ">=24.12"}`.
  - devDependency: `firebase-tools@15.34.1`.
  - Scripts:
    - `emulators`: `firebase emulators:start --project demo-fyt --import .emulator-data --export-on-exit`;
    - `emulators:fresh`: `firebase emulators:start --project demo-fyt`;
    - `seed`: `node scripts/seed-emulator.ts`;
    - `build:functions`;
    - `test:rules`: `firebase emulators:exec --project demo-fyt --only firestore,storage "npm test -w tests/rules"`;
    - `test:integration`;
    - `typecheck`;
    - `lint`.
  - Also add `.nvmrc` with `24`.
- [ ] 2. **`firebase.json`** with:
  - `firestore` (rules and indexes), `storage` (rules), and `functions` as in §11;
  - `emulators`: `singleProjectMode: true`, auth 9099, firestore 8080, functions 5001, storage 9199, tasks 9499, ui 4000 (enabled), hub 4400, logging 4500.
- [ ] 3. **`.firebaserc`:** `{"projects": {"default": "demo-fyt"}}`.
- [ ] 4. **Rules and indexes.** Copy `firestore.rules`, `storage.rules` and `firestore.indexes.json` **verbatim** from `docs/firestore-schema.md` §6–§7.
- [ ] 5. **`packages/schema`** (`@fyt/schema`, ESM, zod 4.6.7).
  - Sources:
    - `src/common.ts`: `Segment`, `Mode`, `BookingTarget`, and the `epochMs` and `istDate` refinements;
    - `src/user.ts`: `UserDoc`, `SaveProfileRequest`;
    - `src/config.ts`: `ConfigPublic`;
    - `src/errors.ts`: the `ErrorReason` enum, exactly the list in §3.7;
    - `src/envelope.ts`: `ClientMeta`, `ErrorDetails`;
    - `src/index.ts`.
  - Fixtures: `fixtures/user.new.json`, `user.student.json`, `user.corporate.json`, `user.blocked.json`, `config.public.json`.
  - `test/fixtures.test.ts`: every fixture parses.
- [ ] 6. **`functions/`.**
  - Dependencies: `firebase-functions 7.4.0`, `firebase-admin 14.5.0`, `zod 4.6.7`; dev: `typescript 5.9.3`, `esbuild 0.28.2`, `vitest 5.0.5`.
  - `tsconfig.json`: strict, `moduleResolution: bundler`, `target es2023`.
  - `build.mjs`: esbuild bundles `src/index.ts` into `dist/index.js` (cjs, `platform node`, `target node24`, externals = runtime deps) and writes `dist/package.json` (`main`, `engines.node: 24`, exact deps). It accepts a `--watch` flag.
  - `src/lib/admin.ts`: `initializeApp()`, `getFirestore()`, `setGlobalOptions({region: "asia-south1", maxInstances: 20})`.
  - `src/lib/errors.ts`: `fail(reason, message, {retryable, fieldErrors})` builds an `HttpsError` with `details`.
  - `src/lib/callable.ts`: the `appCallable(schema, handler, {skipBlockedCheck})` wrapper. It does auth, zod parse, maintenance, `minAppVersion`, blocked check, `requestId` and the structured log.
  - `src/callables/ensureUser.ts`: `ensureUserV1`, as in §7.1.
  - `src/callables/saveProfile.ts`: `saveProfileV1`, the full request schema and `onboarded` rule from §7.1. The UI for the full forms comes in Milestone 3.
  - `src/index.ts`: exports both.
  - `test/`: unit tests for the `onboarded` rule and semver gate, and emulator integration tests that call both callables over HTTP with an emulator ID token.
- [ ] 7. **`tests/rules`.**
  - vitest 5 + `@firebase/rules-unit-testing` 6.0.0 + `firebase` 13.1.0.
  - Implement the matrix in `firestore-schema.md` §7.3 as a table-driven test (every cell), plus the negative query cases and the storage cases.
- [ ] 8. **`scripts/seed-emulator.ts`** (Node 24 runs `.ts` with type stripping; use no enums or namespaces).
  - It exits unless `FIRESTORE_EMULATOR_HOST` is set and the project ID starts with `demo-`.
  - It writes:
    - `config/public` (defaults from schema §3.7, `minAppVersion` `1.0.0`);
    - 3 institutes, 4 courses and 4 providers (one of them unpublished), with synthetic data only (the repo is public);
    - `catalogIndex/{courses,institutes,providers}` built directly (the trigger arrives in Milestone 2).
  - It creates Auth emulator users with the Admin SDK `auth().createUser({uid, phoneNumber})`, each with a matching `users/{uid}`:

    | Phone | User |
    |---|---|
    | `+919000000001` | student, onboarded |
    | `+919000000002` | corporate, onboarded |
    | `+919000000003` | no doc (new user) |
    | `+919000000004` | blocked, Auth `disabled: true` |
- [ ] 9. **Ignore rules.**
  - Root `.gitignore`: add `.emulator-data/`, `functions/dist/` and `.firebase/`. That file currently has an uncommitted change by its owner: append, don't rewrite.
  - New `apps/mobile/.gitignore`: the `flutter create` defaults plus `env/*.json`, `!env/emulator.json`, `!env/*.example.json`, `android/app/src/*/google-services.json`, `ios/config/`, `android/key.properties`, `*.jks`, `*.keystore`.

**Mobile app**
- [ ] 10. **Create the project.**
  - `flutter create --org in.findyourtrainer --project-name fyt --platforms android,ios --empty apps/mobile`. The bundle ID is a placeholder until Q3; renaming is a find-and-replace before any store registration.
  - Android: set `minSdk = 24`.
  - iOS: deployment target 15.0 in the Podfile and the Xcode project. Verify against the Firebase Apple SDK minimum that the pinned plugins pull in.
- [ ] 11. **Dependencies.** `pubspec.yaml` with the §3.1 pins and `environment: sdk ^3.13.0, flutter >=3.47.0`. Then `flutter pub get` and commit `pubspec.lock`.
  - Add `build.yaml`, restricting `freezed` and `json_serializable` to `lib/shared/models/**`.
  - Add `analysis_options.yaml` as in §3.9.
- [ ] 12. **Assets.**
  - Fonts in `assets/fonts/` from §3.5, plus the OFL texts, and a `flutter: fonts:` block: Inter 400/500, PlayfairDisplay 500, GeistMono 400/500.
  - `LicenseRegistry.addLicense` for each family.
  - Brand SVGs copied from `brand/logo/` into `assets/brand/`.
- [ ] 13. **Env and bootstrap.**
  - `lib/app/env.dart`: `Env.fromEnvironment()` reads the `--dart-define`s from §10.2. `FYT_EMULATOR_HOST` empty means `10.0.2.2` on Android and `127.0.0.1` on iOS; set the Mac's LAN IP for a physical device, and start the emulators with `--host 0.0.0.0`, or set `host` per emulator in a local-only config.
  - `env/emulator.json`, committed:

    ```json
    {"FYT_ENV":"emulator","FYT_EMULATOR_HOST":"","FYT_FB_PROJECT_ID":"demo-fyt","FYT_FB_API_KEY":"demo-api-key","FYT_FB_SENDER_ID":"000000000000","FYT_FB_ANDROID_APP_ID":"1:000000000000:android:0000000000000000","FYT_FB_IOS_APP_ID":"1:000000000000:ios:0000000000000000","FYT_FB_IOS_BUNDLE_ID":"in.findyourtrainer.fyt","FYT_FB_STORAGE_BUCKET":"demo-fyt.appspot.com"}
    ```

    Also commit `env/dev.example.json` with the same keys and empty values.
  - `lib/app/bootstrap.dart`:
    1. `WidgetsFlutterBinding.ensureInitialized()`;
    2. `Firebase.initializeApp(options: firebaseOptionsFor(env))`;
    3. if the env is emulator: `useAuthEmulator(host, 9099)`, `FirebaseFirestore.instance.useFirestoreEmulator(host, 8080)` and `FirebaseFunctions.instanceFor(region: 'asia-south1').useFunctionsEmulator(host, 5001)`. The app never uses the Storage SDK, because images load from URLs;
    4. Firestore `Settings(persistenceEnabled: true, cacheSizeBytes: 100 * 1024 * 1024)`;
    5. error hooks (§3.7), with Crashlytics off for emulator and dev;
    6. `runApp(ProviderScope(overrides: [envProvider.overrideWithValue(env)], retry: …, child: const FytApp()))`.
  - Android debug-only `android/app/src/debug/res/xml/network_security_config.xml`, allowing cleartext to `10.0.2.2`, `localhost` and `127.0.0.1`, referenced from `src/debug/AndroidManifest.xml`.
- [ ] 14. **Theme.**
  - `core/theme/tokens.dart` (the §3.4 table, both palettes), `colors.dart` (`ThemeExtension<FytColors>`), `typography.dart` (§3.5), `spacing.dart`, and `theme.dart` (`buildTheme(Brightness)`).
  - Component themes: Filled (ink), Outlined (surface + line), Text, InputDecoration (sunken fill, label above, error below), NavigationBar (sunken, accentSoft indicator, 13/500 labels), Chip, BottomSheet (radius 14, ink-tinted shadow), SnackBar, Card (radius 10, 1 px line, no elevation).
  - `ThemeMode.system`.
  - `features/dev/gallery_screen.dart` shows every token, text style, button state and `StatusPill`. Its route is registered only when `FYT_ENV != prod`.
- [ ] 15. **l10n.** `l10n.yaml` (§3.6) and `lib/l10n/app_en.arb` with every Milestone 1 string. `MaterialApp.router(localizationsDelegates: AppLocalizations.localizationsDelegates, supportedLocales: [Locale('en', 'IN')])`.
- [ ] 16. **Error layer.** `core/errors/*` (§3.7) and `core/firebase/callable.dart`. Unit tests: every `ErrorReason` maps, an unknown reason maps to `unknown`, and `unavailable` maps to `NetworkFailure`.
- [ ] 17. **Models.**
  - `shared/models/user_doc.dart` and `config_public.dart` (freezed + json; unknown-enum fallback).
  - `dart run build_runner build --delete-conflicting-outputs`, and commit the generated files.
  - Fixture tests decode `packages/schema/fixtures/user.*.json` and `config.public.json`.
- [ ] 18. **Session.**
  - `features/session/session_state.dart` and `session_provider.dart` (§4.2), deriving from `authUserProvider`, `userDocProvider`, `configPublicProvider` and `package_info_plus`.
  - `core/router/redirect.dart` holds `redirectFor()`.
  - A unit-test table covers every state × a representative location (at least 30 cases), including deep-link replay.
- [ ] 19. **Router.**
  - Routes: `/splash`, `/gate/update`, `/gate/maintenance`, `/gate/blocked`, `/welcome`, `/auth/phone`, `/auth/otp`, `/onboarding/segment`, `/onboarding/student`, `/onboarding/corporate`, `/onboarding/profile`.
  - A `StatefulShellRoute.indexedStack` with branches `/home`, `/explore`, `/bookings` and `/profile`.
  - `/dev/gallery` (non-prod only).
  - `refreshListenable` as in §3.3.
- [ ] 20. **Auth.**
  - `features/auth/data/auth_repository.dart` wraps `verifyPhoneNumber` (all four callbacks, `forceResendingToken`) and `signInWithCredential`.
  - `application/phone_auth_controller.dart` is a `Notifier` with the states `idle → sending → codeSent(verificationId, resendToken, cooldownEndsAt) → verifying → error(AppFailure)`.
  - Screens:
    - Welcome;
    - Phone: +91 prefix, 10-digit validation from the admin `identifiers.ts` rule, inline errors;
    - OTP: pinput with 6 Geist Mono cells, `AutofillHints.oneTimeCode`, a 30 s resend countdown, at most 3 resends, "Change number".
  - After sign-in, call `ensureUserV1` (non-blocking).
  - Sign out in the Profile tab (the `unregisterDeviceV1` step lands in Milestone 6).
- [ ] 21. **Onboarding slice.**
  - `/onboarding/segment`: "Student" / "Working professional" cards. Choosing one calls `saveProfileV1({step: "segment", segment})`, and the router moves to that segment's details route.
  - `/onboarding/student` and `/onboarding/corporate` are placeholder screens: a heading and "The details form is built in Milestone 3". No fake form.
- [ ] 22. **Shells and gates.**
  - `features/shell/learner_shell.dart`: a `NavigationBar` with Home, Explore, Bookings and Profile, using lucide icons and 13 px labels.
  - `HomeScreen` dispatches to `StudentHome` or `CorporateHome`. Each renders its segment's section order (§2.2 #12) as `SectionHeader`s with honest `EmptyState`s ("Featured courses appear here once the catalog is connected"), no placeholder data. A small segment eyebrow shows which shell is active.
  - Explore and Bookings are `EmptyState`s. Profile shows the name, the phone (mono), the segment, the app version, an env badge (non-prod) and Sign out.
  - Gate screens read their copy and support contact from `config/public`.
- [ ] 23. **Tests.**
  - Unit: redirect table, phone normalisation, semver compare, IST helpers, error mapping, fixtures.
  - Widget: phone validation, OTP cooldown (fake_async), each gate, Student vs Corporate home order, text scale 2.0 on Welcome and Phone with no overflow.
  - `integration_test/auth_flow_test.dart`, run against the emulator:
    1. enter `+919000000001`;
    2. fetch the code from `http://$host:9099/emulator/v1/projects/demo-fyt/verificationCodes`;
    3. expect the Student home;
    4. sign out;
    5. run the same flow with `…003`, expecting `/onboarding/segment`;
    6. run it with `…004`, expecting the Blocked gate.
- [ ] 24. **CI.** `.github/workflows/mobile.yml` and `backend.yml` as in §10.4. The deploy workflows are not part of Milestone 1.
- [ ] 25. **`apps/mobile/README.md`:**
  - prerequisites (P1–P5);
  - `npm ci && npm run emulators` (terminal 1);
  - `npm run seed` (terminal 2);
  - `cd apps/mobile && flutter run --dart-define-from-file=env/emulator.json`;
  - test numbers and where the OTP shows (Emulator UI → Authentication, or the REST endpoint);
  - the slow-SSD notes (§1.1).

**Milestone 1 acceptance**
- `npm run emulators` starts auth, firestore, functions, storage and tasks with the UI on :4000.
- `npm run seed` succeeds, and refuses when pointed at a non-`demo-` project.
- The app runs on both the iOS simulator and the Android emulator:
  - welcome → phone → OTP (code from the Emulator UI);
  - `…001` lands on the **Student** shell and `…002` on the **Corporate** shell;
  - `…003` lands on the segment picker;
  - `…004` gets the **Blocked** gate;
  - setting `config/public.maintenance.on = true` in the Emulator UI shows **Maintenance** live;
  - setting `minAppVersion.android` / `minAppVersion.ios` to `9.0.0` shows **Update required**.
- `flutter analyze` reports no issues. `flutter test` and the integration test pass. `npm run test:rules` (the full matrix) and the functions tests pass. Both CI workflows are green.
- Light and dark themes render brand tokens. No text is below 13 px except the uppercase 12 px micro labels. No emoji. No purple. Every status has an icon and a label.

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
- **Toolchain.** No JDK means no emulators and no Android build. Flutter 3.41.5 can't resolve the current packages. Both are fixed by P1–P2.
- **Public repo.** Real config, client data or secrets committed by mistake. Mitigations: the gitignore rules above, synthetic seed data, and GitHub secret scanning turned on.
- **Store review.** OTP-only login needs a review test number. The account-deletion web URL and the privacy policy are required before submission.
- **The external SSD.** Builds may be slow. Mitigations in §1.1. Measure before adding symlinks.
