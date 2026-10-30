# Security rules tests

The Firestore and Storage rules matrix from `docs/firestore-schema.md` §7.3: every collection × identity (anon, learnerA, learnerB, emailUser, operator) × op (get, list, create, update, delete), plus the negative query and field cases and the storage cases.

**Needs Java 21.** The Firestore and Storage emulators won't start without it (firebase-tools 15 requires Java 21+). This Mac has no JDK yet, so the suite is written and type-checked but has not run here.

```sh
brew install --cask temurin@21          # owner's call: system software
npm run test:rules                      # repo root: starts the emulators, runs vitest, stops them
npm run typecheck -w tests/rules        # works without Java
```

The emulators use the `demo-fyt` project and need no Firebase login. For any other `firebase` command, `source ~/.fyt-cloud/env.sh` first (see `functions/README.md`).
