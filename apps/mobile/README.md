# FYT mobile app (Expo)

The learner app for FYT (Find Your Trainer): one app, two segments (Student and Corporate), phone OTP sign-in. React Native with Expo SDK 58, Expo Router, TypeScript strict, React Native Firebase. Architecture: `docs/APP-ARCHITECTURE.md`.

**It runs in a development build, not Expo Go.** Phone auth uses React Native Firebase's native modules, which Expo Go doesn't have. The one exception is the dev auth bypass below, which runs anywhere.

All commands run from the repo root unless noted. Dependencies are installed once for the whole workspace with `npm install` at the root.

## 1. Click through the UI right now (no Firebase, no build)

```sh
npm install                                  # repo root, once
cd apps/mobile
cp .env.example .env
# edit .env: EXPO_PUBLIC_FYT_AUTH_BYPASS=1
npx expo start --go                          # scan the QR code with Expo Go
```

### Dev-only auth bypass

`EXPO_PUBLIC_FYT_AUTH_BYPASS=1` replaces Firebase with an in-memory backend (`src/backend/mock.ts`):

- No SMS is sent. The OTP is always **123456**.
- `90000 00001` is an onboarded student, `90000 00002` an onboarded working professional, `90000 00004` is blocked, and any other valid number is a new learner (segment picker, then details).
- Onboarding uses the real `@fyt/domain` validation, so the errors match the server.
- The Profile tab shows a "Dev gate preview" card that shows the Maintenance and Update-required gates for 10 seconds.
- It only works in development (`__DEV__`) and never when `EXPO_PUBLIC_FYT_ENV=prod`. Release builds ignore it.
- Restart Metro with `npx expo start --clear` after changing `.env`.

## 2. First development build (one-time, needs your Expo account)

EAS Build compiles the native app in the cloud, so you don't need Xcode or Android Studio.

```sh
cd apps/mobile
npx eas-cli@latest login                     # your Expo account
npx eas-cli@latest init                      # creates the Expo project, prints its id
export EAS_PROJECT_ID=<the id it printed>    # or put it in your shell profile; app.config.ts reads it
npx eas-cli@latest build --profile development --platform android   # APK you can install directly
npx eas-cli@latest build --profile development --platform ios       # needs an Apple Developer account; registers your iPhone (eas device:create)
```

When the build finishes, open the link on your phone and install it. For the iOS Simulator use `--profile development-simulator`.

The `development` profile sets `EXPO_PUBLIC_FYT_ENV=emulator` and uses the committed **fake** `demo-fyt` Firebase files in `firebase/*.example.*`, which only work against the local emulator.

## 3. Run against the Firebase emulator

Needs Java 21 for the emulators (`brew install --cask temurin@21`).

```sh
# terminal 1 (repo root)
npm run emulators                            # Auth 9099, Firestore 8080, Functions 5001, UI http://localhost:4000
# terminal 2 (repo root)
npm run build:functions && npm run seed      # config/public + test phone users
# terminal 3
cd apps/mobile && npx expo start             # opens in the dev client (--dev-client is the default script)
```

Sign in with `+91 90000 00001` (student), `…002` (corporate), `…003` (new learner) or `…004` (blocked). No SMS is sent: the code shows in the Emulator UI (Authentication tab) and at `http://localhost:9099/emulator/v1/projects/demo-fyt/verificationCodes`.

Live gates: in the Emulator UI, edit `config/public` and set `maintenance.on = true` (Maintenance) or `minAppVersion.android/ios = "9.0.0"` (Update required).

### Physical phone

The phone must reach the emulators on your Mac:

- **Android over USB:** `adb reverse tcp:9099 tcp:9099 && adb reverse tcp:8080 tcp:8080 && adb reverse tcp:5001 tcp:5001`, then set `EXPO_PUBLIC_FYT_EMULATOR_HOST=127.0.0.1` in `.env`.
- **iPhone or Android over Wi-Fi:** set `EXPO_PUBLIC_FYT_EMULATOR_HOST=<your Mac's LAN IP>` and make the auth, firestore and functions emulators listen on the LAN by adding `"host": "0.0.0.0"` to each of them in `firebase.json` (local change, your call; the emulators hold only `demo-fyt` data).

## 4. Switch to a real Firebase project (dev, staging, prod)

Nothing real is committed (the repo is public).

1. In the Firebase console of the project, add an Android app (`in.findyourtrainer.fyt.dev` for dev, `.stg` for staging, no suffix for prod) and an iOS app with the same bundle ID. Enable **Phone** sign-in and add test phone numbers.
2. Download `google-services.json` and `GoogleService-Info.plist`.
3. Local builds: put them in `apps/mobile/firebase/` (gitignored). EAS builds: upload them as **file** environment variables named `GOOGLE_SERVICES_JSON` and `GOOGLE_SERVICE_INFO_PLIST` in the EAS project (`npx eas-cli env:create --type file …` or the expo.dev dashboard).
4. Build with the matching profile: `npx eas-cli build --profile dev` (or `staging`, `production`). The profile sets `EXPO_PUBLIC_FYT_ENV`, which picks the app ID and turns the emulator off.
5. Deploy rules, indexes and functions to that project (see `functions/README.md`; always `source ~/.fyt-cloud/env.sh` first).

`app.config.ts` refuses to build a dev/staging/prod variant without its real Firebase files.

## Checks

```sh
npm run lint -w apps/mobile          # expo lint
npm run typecheck -w apps/mobile     # tsc --noEmit
npm test -w apps/mobile              # Jest: session machine, redirect table, gates, env, bypass flow
cd apps/mobile && npx expo export --platform ios --platform android --output-dir .expo-export-check   # JS bundle builds
cd apps/mobile && npx expo-doctor
```

## Over-the-air updates

After `eas init`, `npx eas-cli update --channel dev --message "…"` ships JS-only changes to installed dev builds. Native changes (new native modules or config plugins) need a new build.

## Slow external SSD

Dependencies are hoisted to the root `node_modules`. Metro's cache lives in the system temp folder. Prefer EAS cloud builds over `npx expo run:*`, which writes `ios/` and `android/` (gitignored) to the SSD.
