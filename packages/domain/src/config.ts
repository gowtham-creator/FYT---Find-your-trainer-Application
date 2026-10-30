/**
 * `config/public` (docs/firestore-schema.md §3.7). Readable signed-out so the
 * app's update and maintenance gates work before sign-in.
 */
import { z } from "zod";
import { epochMs, SCHEMA_VERSION } from "./common";

export const SemverString = z.string().regex(/^\d+\.\d+\.\d+$/, "Expected x.y.z");

export const ConfigPublic = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  platformName: z.string(),
  supportEmail: z.string(),
  supportPhone: z.string().optional(),
  maintenance: z.object({ on: z.boolean(), message: z.string().optional(), until: epochMs.optional() }),
  minAppVersion: z.object({ android: SemverString, ios: SemverString }),
  booking: z.object({
    leadHours: z.number().nonnegative(),
    cancellationWindowHours: z.number().nonnegative(),
    horizonDays: z.number().int().positive(),
    maxActiveBookings: z.number().int().positive(),
    userReschedule: z.boolean(),
    requireEmailForOnline: z.boolean(),
  }),
  reminderMinutes: z.array(z.number().int().positive()),
  taxonomy: z.object({
    categories: z.array(z.string()),
    techStacks: z.array(z.string()),
    areas: z.array(z.string()),
    mentorDomains: z.array(z.string()),
    consultantSpecializations: z.array(z.string()),
  }),
  featured: z.object({ institutes: z.array(z.string()), courses: z.array(z.string()), providers: z.array(z.string()) }),
  legal: z.object({ privacyUrl: z.string(), termsUrl: z.string(), deleteAccountUrl: z.string() }),
  updatedAt: epochMs,
  updatedBy: z.string(),
});
export type ConfigPublic = z.infer<typeof ConfigPublic>;

/** Defaults used by the seed script and as the app's offline fallback. Synthetic values only. */
export const DEFAULT_CONFIG_PUBLIC: ConfigPublic = {
  schemaVersion: SCHEMA_VERSION,
  platformName: "FYT",
  supportEmail: "support@example.com",
  maintenance: { on: false },
  minAppVersion: { android: "1.0.0", ios: "1.0.0" },
  booking: {
    leadHours: 4,
    cancellationWindowHours: 2,
    horizonDays: 14,
    maxActiveBookings: 5,
    userReschedule: false,
    requireEmailForOnline: false,
  },
  reminderMinutes: [60, 15],
  taxonomy: {
    categories: ["Software development", "Data and AI", "Cloud and DevOps", "Design", "Testing"],
    techStacks: ["Java", "Python", "React", "Node.js", "AWS", "SQL", "Flutter", "DevOps"],
    areas: ["Ameerpet", "Madhapur", "Kukatpally", "Gachibowli", "Dilsukhnagar"],
    mentorDomains: ["Career", "Interviews", "System design"],
    consultantSpecializations: ["Career change", "Upskilling plans"],
  },
  featured: { institutes: [], courses: [], providers: [] },
  legal: { privacyUrl: "", termsUrl: "", deleteAccountUrl: "" },
  updatedAt: 0,
  updatedBy: "system",
};
