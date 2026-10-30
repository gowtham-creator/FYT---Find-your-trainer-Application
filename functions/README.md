# FYT Cloud Functions

2nd gen, region `asia-south1`, Node 24. Callables are versioned (`…V1`) and validated with the zod schemas in `@fyt/domain` (`packages/domain`), shared with the app and the admin. API contract: `docs/APP-ARCHITECTURE.md` §7.

| Callable | Does |
|---|---|
| `ensureUserV1` | Creates `users/{uid}` on first sign-in (registration); bumps `lastActiveAt` at most every 6 h. Works for blocked users |
| `saveProfileV1` | Onboarding steps (`segment`, `details`, `profile`) and profile edits; rules in `@fyt/domain` `applyProfile` |

Every app callable: phone-provider auth → zod parse → maintenance → `minAppVersion` → blocked check → handler. Failures are `HttpsError` with `details = {reason, retryable, requestId, fieldErrors?}`.

## Firebase and gcloud CLI: use the FYT-only config

This Mac has global Firebase and gcloud logins that belong to other clients' projects. **Before any `firebase` or `gcloud` command, run:**

```sh
source ~/.fyt-cloud/env.sh
```

It sets `XDG_CONFIG_HOME`, `CLOUDSDK_CONFIG` and `GOOGLE_APPLICATION_CREDENTIALS` to FYT-only config under `~/.fyt-cloud/`. Never run `firebase login`, `firebase login:use`, `gcloud auth` or `gcloud config set` against the global config. The emulators with `demo-fyt` need no login at all.

## Commands (repo root)

```sh
npm run build:functions            # esbuild -> functions/dist (inlines @fyt/domain, pins runtime deps)
npm test -w functions              # unit tests (no emulator)
npm run typecheck -w functions

# need Java 21 (firebase-tools 15 refuses older Java):
npm run emulators                  # auth, firestore, functions, storage, tasks; UI on :4000
npm run seed                       # demo data; refuses any project id not starting with "demo-"
npm run test:integration           # callables over HTTP against the emulators
npm run test:rules                 # tests/rules security matrix
```

`npm run build -w functions -- --watch` rebuilds `dist/` on change while the emulator runs.

## Seed data (synthetic only; the repo is public)

| Phone | User |
|---|---|
| `+919000000001` | student, onboarded |
| `+919000000002` | corporate, onboarded |
| `+919000000003` | no doc (new learner) |
| `+919000000004` | blocked, Auth disabled |

## Deploying (later milestones, not done in Milestone 1)

Deploys go to our dev project first, then the client's projects, through CI with Workload Identity Federation. A manual deploy, if ever needed: `source ~/.fyt-cloud/env.sh && npx firebase deploy --only firestore,storage,functions --project <alias>`. Project aliases other than `demo-fyt` are added locally with `firebase use --add` and never committed.
