/**
 * Security rules matrix (docs/firestore-schema.md §7.3). Every row is asserted
 * for every identity and every op (get, list, create, update, delete).
 *
 * Needs the Firestore and Storage emulators, which need Java 21:
 *   npm run test:rules        (repo root)
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestContext, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Firestore,
  type Query,
} from "firebase/firestore";
import { getBytes, ref, uploadString } from "firebase/storage";

const PROJECT = "demo-fyt";
const root = new URL("../../", import.meta.url);

type Who = "anon" | "learnerA" | "learnerB" | "emailUser" | "operator";
type Op = "get" | "list" | "create" | "update" | "delete";
const WHO: Who[] = ["anon", "learnerA", "learnerB", "emailUser", "operator"];
const OPS: Op[] = ["get", "list", "create", "update", "delete"];

let env: RulesTestEnvironment;

function ctx(who: Who): RulesTestContext {
  switch (who) {
    case "anon":
      return env.unauthenticatedContext();
    case "learnerA":
      return env.authenticatedContext("uA", { firebase: { sign_in_provider: "phone" }, phone_number: "+919000000001" } as never);
    case "learnerB":
      return env.authenticatedContext("uB", { firebase: { sign_in_provider: "phone" }, phone_number: "+919000000002" } as never);
    case "emailUser":
      return env.authenticatedContext("uE", { firebase: { sign_in_provider: "password" }, email: "e@example.com" } as never);
    case "operator":
      return env.authenticatedContext("uO", { firebase: { sign_in_provider: "password" }, fytRole: "owner" } as never);
  }
}

interface Row {
  name: string;
  /** Seeded document path. */
  path: string;
  data: Record<string, unknown>;
  /** The query a client would run for "list". */
  list: (db: Firestore) => Query;
  /** Allowed ops per identity; anything absent must be denied. */
  allow: Partial<Record<Who, Op[]>>;
  /** Update payload (defaults to a harmless field change). */
  update?: () => Record<string, unknown>;
}

const R: Op[] = ["get", "list"];
const pub = { published: true, name: "x" };
const unpub = { published: false, name: "x" };
const coll = (p: string) => p.split("/").slice(0, -1).join("/");

const MATRIX: Row[] = [
  { name: "config/public", path: "config/public", data: { platformName: "FYT" }, list: (db) => collection(db, "config"), allow: { anon: ["get"], learnerA: ["get"], learnerB: ["get"], emailUser: ["get"], operator: ["get"] } },
  { name: "config/private", path: "config/private", data: { organizerEmail: "x" }, list: (db) => collection(db, "config"), allow: {} },
  ...(["institutes", "courses", "providers"] as const).flatMap((c): Row[] => [
    { name: `${c} (published)`, path: `${c}/p1`, data: pub, list: (db) => query(collection(db, c), where("published", "==", true)), allow: { learnerA: R, learnerB: R } },
    { name: `${c} (unpublished)`, path: `${c}/u1`, data: unpub, list: (db) => query(collection(db, c), where("published", "==", false)), allow: {} },
  ]),
  { name: "courses/x/private/contact", path: "courses/p1/private/contact", data: { email: "h@example.com" }, list: (db) => collection(db, "courses/p1/private"), allow: {} },
  { name: "providers/x/private/contact", path: "providers/p1/private/contact", data: { email: "h@example.com" }, list: (db) => collection(db, "providers/p1/private"), allow: {} },
  { name: "catalogIndex", path: "catalogIndex/courses", data: { items: [] }, list: (db) => collection(db, "catalogIndex"), allow: { learnerA: ["get"], learnerB: ["get"] } },
  { name: "announcements", path: "announcements/bc_1", data: { title: "t", audience: "all", sentAt: 1 }, list: (db) => collection(db, "announcements"), allow: { learnerA: R, learnerB: R } },
  { name: "users/uA", path: "users/uA", data: { phone: "+919000000001", blocked: false }, list: (db) => collection(db, "users"), allow: { learnerA: ["get"] } },
  { name: "users/uA/devices", path: "users/uA/devices/d1", data: { token: "t" }, list: (db) => collection(db, "users/uA/devices"), allow: {} },
  {
    name: "users/uA/notifications",
    path: "users/uA/notifications/n1",
    data: { title: "t", body: "b", createdAt: 1 },
    list: (db) => collection(db, "users/uA/notifications"),
    allow: { learnerA: ["get", "list", "update"] },
    update: () => ({ readAt: serverTimestamp() }),
  },
  { name: "bookings (owned by uA)", path: "bookings/bkg_a", data: { userId: "uA", start: 1 }, list: (db) => query(collection(db, "bookings"), where("userId", "==", "uA")), allow: { learnerA: R } },
  ...(["availability", "slotLedgers", "bookingRefs", "broadcasts", "admins", "audit", "statsDaily", "deadLetters"] as const).map(
    (c): Row => ({ name: c, path: `${c}/x1`, data: { v: 1 }, list: (db) => collection(db, c), allow: {} }),
  ),
];

async function run(row: Row, who: Who, op: Op): Promise<unknown> {
  const db = ctx(who).firestore() as unknown as Firestore;
  switch (op) {
    case "get":
      return getDoc(doc(db, row.path));
    case "list":
      return getDocs(row.list(db));
    case "create":
      return setDoc(doc(db, `${coll(row.path)}/new_${who}`), { ...row.data });
    case "update":
      return updateDoc(doc(db, row.path), row.update ? row.update() : { touched: true });
    case "delete":
      return deleteDoc(doc(db, row.path));
  }
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: readFileSync(new URL("firestore.rules", root), "utf8") },
    storage: { rules: readFileSync(new URL("storage.rules", root), "utf8") },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore() as unknown as Firestore;
    for (const row of MATRIX) await setDoc(doc(db, row.path), row.data);
  });
});

describe("firestore rules matrix", () => {
  for (const row of MATRIX) {
    describe(row.name, () => {
      for (const who of WHO) {
        for (const op of OPS) {
          const allowed = row.allow[who]?.includes(op) ?? false;
          it(`${who} ${op} -> ${allowed ? "allow" : "deny"}`, async () => {
            if (allowed) await assertSucceeds(run(row, who, op));
            else await assertFails(run(row, who, op));
          });
        }
      }
    });
  }
});

describe("negative query and field cases", () => {
  const learnerA = () => ctx("learnerA").firestore() as unknown as Firestore;

  it("a courses list without the published filter is denied", async () => {
    await assertFails(getDocs(collection(learnerA(), "courses")));
  });

  it("a bookings query without userId == uid is denied", async () => {
    await assertFails(getDocs(collection(learnerA(), "bookings")));
    await assertFails(getDocs(query(collection(learnerA(), "bookings"), where("userId", "==", "uB"))));
  });

  it("learnerB cannot read learnerA's booking or notifications", async () => {
    const dbB = ctx("learnerB").firestore() as unknown as Firestore;
    await assertFails(getDoc(doc(dbB, "bookings/bkg_a")));
    await assertFails(getDocs(collection(dbB, "users/uA/notifications")));
  });

  it("a notification update that also changes title is denied", async () => {
    await assertFails(updateDoc(doc(learnerA(), "users/uA/notifications/n1"), { readAt: serverTimestamp(), title: "x" }));
  });

  it("readAt set to a client timestamp is denied", async () => {
    await assertFails(updateDoc(doc(learnerA(), "users/uA/notifications/n1"), { readAt: Timestamp.fromMillis(Date.now()) }));
  });
});

describe("storage rules", () => {
  const path = "catalog/courses/crs_x/cover.png";

  beforeAll(async () => {
    await env.withSecurityRulesDisabled(async (c) => {
      await uploadString(ref(c.storage(), path), "png-bytes");
    });
  });

  for (const who of WHO) {
    const canRead = who !== "anon";
    it(`${who} read -> ${canRead ? "allow" : "deny"}`, async () => {
      const p = getBytes(ref(ctx(who).storage(), path));
      if (canRead) await assertSucceeds(p);
      else await assertFails(p);
    });
    it(`${who} write -> deny`, async () => {
      await assertFails(uploadString(ref(ctx(who).storage(), `catalog/courses/crs_x/${who}.png`), "x"));
    });
  }
});
