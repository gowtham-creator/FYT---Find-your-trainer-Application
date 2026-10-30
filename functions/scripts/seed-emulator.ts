/**
 * Seeds the Firebase Emulator Suite with synthetic data (the repo is public:
 * no real people, numbers or client data).
 *
 *   npm run seed            (repo root, with `npm run emulators` running)
 *
 * Refuses to run unless the project id starts with "demo-" AND the Firestore
 * and Auth emulator hosts are set, so it can never write to a real project.
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { DEFAULT_CONFIG_PUBLIC, newUserDoc, type UserDoc } from "@fyt/domain";

const projectId = process.env.FYT_SEED_PROJECT ?? process.env.GCLOUD_PROJECT ?? "demo-fyt";
process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";

export function assertSafeTarget(id: string, env: NodeJS.ProcessEnv): void {
  if (!id.startsWith("demo-")) throw new Error(`Refusing to seed "${id}": only demo-* projects (the emulator) can be seeded.`);
  if (!env.FIRESTORE_EMULATOR_HOST || !env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error("Refusing to seed: emulator hosts are not set.");
}

async function main() {
  assertSafeTarget(projectId, process.env);
  initializeApp({ projectId });
  const db = getFirestore();
  const auth = getAuth();
  const now = Date.now();

  await db.doc("config/public").set({ ...DEFAULT_CONFIG_PUBLIC, updatedAt: now });

  const people: Array<{ uid: string; phone: string; doc: ((base: UserDoc) => UserDoc) | null; disabled?: boolean }> = [
    {
      uid: "seed-student",
      phone: "+919000000001",
      doc: (b) => ({ ...b, name: "Asha Rao", segment: "student", institution: "Demo Engineering College", interests: ["Software development"], skillsToLearn: ["React"], onboarded: true, onboardingStep: "done" }),
    },
    {
      uid: "seed-corporate",
      phone: "+919000000002",
      doc: (b) => ({ ...b, name: "Ravi Kumar", segment: "corporate", currentRole: "QA engineer", yearsExperience: 3, skillsToLearn: ["Python", "AWS"], onboarded: true, onboardingStep: "done" }),
    },
    { uid: "seed-new", phone: "+919000000003", doc: null },
    {
      uid: "seed-blocked",
      phone: "+919000000004",
      disabled: true,
      doc: (b) => ({ ...b, name: "Blocked Learner", segment: "student", blocked: true, blockedReason: "Seed data", onboarded: true, onboardingStep: "done", institution: "Demo", interests: ["Design"], skillsToLearn: ["SQL"] }),
    },
  ];

  for (const p of people) {
    await auth.deleteUser(p.uid).catch(() => undefined);
    await auth.createUser({ uid: p.uid, phoneNumber: p.phone, disabled: p.disabled ?? false });
    const ref = db.doc(`users/${p.uid}`);
    if (p.doc) await ref.set(p.doc(newUserDoc(p.phone, now)));
    else await ref.delete();
  }

  console.log(`Seeded ${projectId}: config/public and ${people.length} phone users (+91 90000 0000 1-4).`);
}

// Run only when executed directly (tests import assertSafeTarget).
if (process.argv[1] && /seed-emulator\.ts$/.test(process.argv[1])) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
