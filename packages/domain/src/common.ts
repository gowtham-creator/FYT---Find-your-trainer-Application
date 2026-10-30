/**
 * Shared primitives for the FYT schema v1 (docs/firestore-schema.md §1, §3).
 * Every enum here is the single source for the admin, the app and Functions.
 */
import { z } from "zod";

export const SCHEMA_VERSION = 1 as const;

/** IST is a fixed UTC+05:30 with no DST. */
export const TIMEZONE = "Asia/Kolkata" as const;

/** Cloud Functions region (Mumbai). */
export const FUNCTIONS_REGION = "asia-south1" as const;

export const Segment = z.enum(["student", "corporate"]);
export type Segment = z.infer<typeof Segment>;

export const Mode = z.enum(["online", "offline"]);
export type Mode = z.infer<typeof Mode>;

export const BookingTargetType = z.enum(["course", "trainer", "mentor", "consultant"]);
export type BookingTargetType = z.infer<typeof BookingTargetType>;

export const BookingStatus = z.enum(["requested", "confirmed", "completed", "cancelled", "no_show", "meet_failed"]);
export type BookingStatus = z.infer<typeof BookingStatus>;

export const Platform = z.enum(["android", "ios"]);
export type Platform = z.infer<typeof Platform>;

/** Epoch milliseconds, the storage format for every domain time. */
export const epochMs = z.number().int().nonnegative();

/** An IST calendar day, "YYYY-MM-DD". */
export const istDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

/** Trimmed, length-bounded text. */
export const text = (min: number, max: number) => z.string().trim().min(min).max(max);
