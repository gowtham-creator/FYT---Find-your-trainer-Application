import { describe, expect, it } from "vitest";
import { applyProfile, DomainError, newUserDoc, SaveProfileRequest, UserDoc } from "../src";

const NOW = 1_790_000_000_000;
const fresh = () => newUserDoc("+919000000003", NOW);

function reasonOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (e) {
    return (e as DomainError).reason;
  }
  return undefined;
}

describe("user document", () => {
  it("creates a valid skeleton on first sign-in", () => {
    const u = fresh();
    expect(UserDoc.parse(u)).toEqual(u);
    expect(u.onboarded).toBe(false);
    expect(u.onboardingStep).toBe("segment");
    expect(u.segment).toBeNull();
  });

  it("rejects a non-Indian or malformed phone", () => {
    expect(UserDoc.safeParse({ ...fresh(), phone: "+14155550100" }).success).toBe(false);
  });
});

describe("applyProfile (saveProfileV1 rule)", () => {
  it("segment step sets the segment and moves to details", () => {
    const u = applyProfile(fresh(), { step: "segment", segment: "student" }, NOW + 1);
    expect(u.segment).toBe("student");
    expect(u.onboardingStep).toBe("details");
    expect(u.onboarded).toBe(false);
    expect(u.updatedAt).toBe(NOW + 1);
  });

  it("segment step ignores fields that belong to other steps", () => {
    const u = applyProfile(fresh(), { step: "segment", segment: "corporate", name: "Asha" }, NOW);
    expect(u.name).toBe("");
  });

  it("segment step without a segment is a validation failure", () => {
    expect(reasonOf(() => applyProfile(fresh(), { step: "segment" }, NOW))).toBe("VALIDATION_FAILED");
  });

  it("student details need name, institution, an interest and a skill", () => {
    const seg = applyProfile(fresh(), { step: "segment", segment: "student" }, NOW);
    let err: DomainError | undefined;
    try {
      applyProfile(seg, { step: "details", name: "Asha" }, NOW);
    } catch (e) {
      err = e as DomainError;
    }
    expect(err?.reason).toBe("VALIDATION_FAILED");
    expect(Object.keys(err?.fieldErrors ?? {}).sort()).toEqual(["institution", "interests", "skillsToLearn"]);

    const done = applyProfile(seg, { step: "details", name: "Asha", institution: "JNTU", interests: ["Design"], skillsToLearn: ["React"] }, NOW);
    expect(done.onboarded).toBe(true);
    expect(done.onboardingStep).toBe("profile");
  });

  it("corporate details need role and years, not institution", () => {
    const seg = applyProfile(fresh(), { step: "segment", segment: "corporate" }, NOW);
    const done = applyProfile(seg, { step: "details", name: "Ravi", currentRole: "QA engineer", yearsExperience: 0, skillsToLearn: ["Python"] }, NOW);
    expect(done.onboarded).toBe(true);
  });

  it("profile step needs onboarding first, then finishes it", () => {
    expect(reasonOf(() => applyProfile(fresh(), { step: "profile", education: [] }, NOW))).toBe("PROFILE_INCOMPLETE");
    const seg = applyProfile(fresh(), { step: "segment", segment: "corporate" }, NOW);
    const det = applyProfile(seg, { step: "details", name: "Ravi", currentRole: "Dev", yearsExperience: 3, skillsToLearn: ["AWS"] }, NOW);
    const prof = applyProfile(det, { step: "profile", experience: [{ company: "Acme", title: "Dev", current: true }] }, NOW);
    expect(prof.onboardingStep).toBe("done");
    expect(prof.experience).toHaveLength(1);
  });

  it("edit cannot break a completed profile", () => {
    const seg = applyProfile(fresh(), { step: "segment", segment: "corporate" }, NOW);
    const det = applyProfile(seg, { step: "details", name: "Ravi", currentRole: "Dev", yearsExperience: 3, skillsToLearn: ["AWS"] }, NOW);
    expect(reasonOf(() => applyProfile(det, { step: "edit", skillsToLearn: [] }, NOW))).toBe("VALIDATION_FAILED");
    expect(applyProfile(det, { step: "edit", area: "Madhapur" }, NOW).area).toBe("Madhapur");
  });

  it("the request schema trims and lowercases, and rejects unknown steps", () => {
    const r = SaveProfileRequest.parse({ step: "details", name: "  Asha  ", email: " A@B.COM " });
    expect(r.name).toBe("Asha");
    expect(r.email).toBe("a@b.com");
    expect(SaveProfileRequest.safeParse({ step: "nope" }).success).toBe(false);
  });
});
