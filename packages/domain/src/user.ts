/**
 * `users/{uid}` (docs/firestore-schema.md §3.1) and the `saveProfileV1`
 * request (APP-ARCHITECTURE §7.1), plus the pure onboarding rule both the
 * function and the app use.
 */
import { z } from "zod";
import { epochMs, Segment, SCHEMA_VERSION, text } from "./common";
import { DomainError } from "./errors";

export const OnboardingStep = z.enum(["segment", "details", "profile", "done"]);
export type OnboardingStep = z.infer<typeof OnboardingStep>;

const year = z.number().int().min(1950).max(2100);

export const Education = z.object({
  institution: text(1, 120),
  degree: text(1, 80),
  field: text(1, 80).optional(),
  startYear: year.optional(),
  endYear: year.optional(),
});
export type Education = z.infer<typeof Education>;

export const Experience = z.object({
  company: text(1, 120),
  title: text(1, 80),
  startYear: year.optional(),
  endYear: year.optional(),
  current: z.boolean().optional(),
});
export type Experience = z.infer<typeof Experience>;

const tagList = (max: number) => z.array(text(1, 60)).max(max);

export const UserDoc = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  role: z.literal("learner"),
  phone: z.string().regex(/^\+91[6-9]\d{9}$/),
  name: z.string().max(80),
  email: z.string().email().max(120).optional(),
  segment: Segment.nullable(),
  area: text(1, 60).optional(),
  institution: text(1, 120).optional(),
  company: text(1, 120).optional(),
  currentRole: text(1, 80).optional(),
  yearsExperience: z.number().int().min(0).max(50).optional(),
  interests: tagList(10),
  skillsToLearn: tagList(15),
  education: z.array(Education).max(10),
  experience: z.array(Experience).max(10),
  onboarded: z.boolean(),
  onboardingStep: OnboardingStep,
  blocked: z.boolean(),
  blockedReason: z.string().max(200).optional(),
  createdAt: epochMs,
  updatedAt: epochMs,
  lastActiveAt: epochMs,
  deletedAt: epochMs.optional(),
});
export type UserDoc = z.infer<typeof UserDoc>;

/** The skeleton `ensureUserV1` writes on first sign-in (the "Registered" funnel stage). */
export function newUserDoc(phone: string, now: number): UserDoc {
  return {
    schemaVersion: SCHEMA_VERSION,
    role: "learner",
    phone,
    name: "",
    segment: null,
    interests: [],
    skillsToLearn: [],
    education: [],
    experience: [],
    onboarded: false,
    onboardingStep: "segment",
    blocked: false,
    createdAt: now,
    updatedAt: now,
    lastActiveAt: now,
  };
}

/** `ensureUserV1` bumps `lastActiveAt` at most once per 6 hours. */
export const LAST_ACTIVE_THROTTLE_MS = 6 * 3_600_000;

export const ProfileFields = z.object({
  segment: Segment.optional(),
  name: text(2, 80).optional(),
  email: z.string().trim().toLowerCase().email().max(120).optional(),
  area: text(1, 60).optional(),
  institution: text(1, 120).optional(),
  company: text(1, 120).optional(),
  currentRole: text(1, 80).optional(),
  yearsExperience: z.number().int().min(0).max(50).optional(),
  interests: tagList(10).optional(),
  skillsToLearn: tagList(15).optional(),
  education: z.array(Education).max(10).optional(),
  experience: z.array(Experience).max(10).optional(),
});
export type ProfileFields = z.infer<typeof ProfileFields>;

export const SaveProfileStep = z.enum(["segment", "details", "profile", "edit"]);
export type SaveProfileStep = z.infer<typeof SaveProfileStep>;

export const SaveProfileRequest = ProfileFields.extend({ step: SaveProfileStep });
export type SaveProfileRequest = z.infer<typeof SaveProfileRequest>;

/** Fields each step may write. Anything else in the request is ignored. */
const STEP_FIELDS: Record<SaveProfileStep, readonly (keyof ProfileFields)[]> = {
  segment: ["segment"],
  details: ["name", "email", "area", "institution", "company", "currentRole", "yearsExperience", "interests", "skillsToLearn"],
  profile: ["education", "experience"],
  edit: [
    "segment",
    "name",
    "email",
    "area",
    "institution",
    "company",
    "currentRole",
    "yearsExperience",
    "interests",
    "skillsToLearn",
    "education",
    "experience",
  ],
};

/** Field errors for the segment's required details, or null when complete. */
export function missingDetails(u: Pick<UserDoc, "segment" | "name" | "institution" | "currentRole" | "yearsExperience" | "interests" | "skillsToLearn">): Record<string, string[]> | null {
  const e: Record<string, string[]> = {};
  if (!u.segment) e.segment = ["Choose student or working professional."];
  if (!u.name || u.name.trim().length < 2) e.name = ["Enter your name."];
  if (u.segment === "student") {
    if (!u.institution) e.institution = ["Enter your college or school."];
    if (u.interests.length === 0) e.interests = ["Pick at least one course interest."];
  }
  if (u.segment === "corporate") {
    if (!u.currentRole) e.currentRole = ["Enter your current role."];
    if (u.yearsExperience === undefined) e.yearsExperience = ["Enter your years of experience."];
  }
  if (u.skillsToLearn.length === 0) e.skillsToLearn = ["Pick at least one skill to learn."];
  return Object.keys(e).length ? e : null;
}

/**
 * Applies a `saveProfileV1` request to a user document. Pure: the function
 * reads the doc, calls this, and writes the result.
 * Throws `VALIDATION_FAILED` with field errors when the step can't be saved.
 */
export function applyProfile(user: UserDoc, req: SaveProfileRequest, now: number): UserDoc {
  const next: UserDoc = { ...user, updatedAt: now };
  for (const key of STEP_FIELDS[req.step]) {
    const value = req[key];
    if (value !== undefined) (next as Record<string, unknown>)[key] = value;
  }

  switch (req.step) {
    case "segment": {
      if (!req.segment) throw new DomainError("VALIDATION_FAILED", "Choose a segment.", { fieldErrors: { segment: ["Choose student or working professional."] } });
      if (!user.onboarded) next.onboardingStep = "details";
      break;
    }
    case "details": {
      const missing = missingDetails(next);
      if (missing) throw new DomainError("VALIDATION_FAILED", "Some details are missing.", { fieldErrors: missing });
      next.onboarded = true;
      if (user.onboardingStep === "segment" || user.onboardingStep === "details") next.onboardingStep = "profile";
      break;
    }
    case "profile": {
      if (!user.onboarded) throw new DomainError("PROFILE_INCOMPLETE", "Finish your details first.");
      next.onboardingStep = "done";
      break;
    }
    case "edit": {
      if (user.onboarded) {
        const missing = missingDetails(next);
        if (missing) throw new DomainError("VALIDATION_FAILED", "Some details are missing.", { fieldErrors: missing });
      }
      break;
    }
  }
  return next;
}
