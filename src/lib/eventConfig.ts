/**
 * eventConfig.ts — Single source of truth for all event dates, venues, caps,
 * and timeslots. Import from here; never hard-code these values in components.
 *
 * To change anything about the event schedule:
 *   1. Edit this file only.
 *   2. Run `npm run build` to confirm nothing broke.
 */

// ---------------------------------------------------------------------------
// Event metadata
// ---------------------------------------------------------------------------
export const EVENT = {
  name: "Orientation Party 2026",
  /** ISO date of the event — used for countdowns */
  dateISO: "2026-09-18",
  dateLabel: "Friday, 18th September 2026",
  venue: "Taylor's Grand Hall, Taylor's University",
  startTime: "6:00 PM",
  contactEmail: (import.meta.env.VITE_CONTACT_EMAIL as string) || "op2026@gmail.com",
} as const;

// ---------------------------------------------------------------------------
// Capacity caps
// ---------------------------------------------------------------------------
export const MAX_QUEUE = 1350;
export const MAX_WAIT  = 500;

// ---------------------------------------------------------------------------
// Queue collection — 15 Sept 2026, TGH
// ---------------------------------------------------------------------------
export const QUEUE_COLLECTION = {
  dateKey:   "sept15" as const,
  dateLabel: "Tuesday, 15th September 2026",
  venue:     "Taylor's Grand Hall (TGH)",
  timeslots: [
    { key: "530" as const, label: "5:30 PM" },
    { key: "630" as const, label: "6:30 PM" },
    { key: "730" as const, label: "7:30 PM" },
  ],
  slotCap: 450,
} as const;

// ---------------------------------------------------------------------------
// Waitlist collection — 17 Sept 2026, LT1
// ---------------------------------------------------------------------------
export const WAITLIST_COLLECTION = {
  dateKey:   "sept17" as const,
  dateLabel: "Thursday, 17th September 2026",
  venue:     "Lecture Theatre 1 (LT1)",
  timeslots: [
    { key: "500" as const, label: "5:00 PM" },
    { key: "600" as const, label: "6:00 PM" },
  ],
  slotCap: 250,
} as const;

// ---------------------------------------------------------------------------
// Derived lookup maps (used by email, search, FAQ)
// ---------------------------------------------------------------------------

/** Human-readable date labels keyed by Firestore doc key */
export const DATE_LABELS: Record<string, string> = {
  [QUEUE_COLLECTION.dateKey]:    QUEUE_COLLECTION.dateLabel,
  [WAITLIST_COLLECTION.dateKey]: WAITLIST_COLLECTION.dateLabel,
};

/** Human-readable timeslot labels keyed by slot key */
export const TIME_LABELS: Record<string, string> = {
  ...Object.fromEntries(QUEUE_COLLECTION.timeslots.map(({ key, label }) => [key, label])),
  ...Object.fromEntries(WAITLIST_COLLECTION.timeslots.map(({ key, label }) => [key, label])),
};

/** Venue string keyed by collection date key */
export const VENUE_BY_DATE: Record<string, string> = {
  [QUEUE_COLLECTION.dateKey]:    QUEUE_COLLECTION.venue,
  [WAITLIST_COLLECTION.dateKey]: WAITLIST_COLLECTION.venue,
};

/** Slot cap keyed by collection date key */
export const CAP_BY_DATE: Record<string, number> = {
  [QUEUE_COLLECTION.dateKey]:    QUEUE_COLLECTION.slotCap,
  [WAITLIST_COLLECTION.dateKey]: WAITLIST_COLLECTION.slotCap,
};

// ---------------------------------------------------------------------------
// CollectionDate type — kept in sync with config keys
// ---------------------------------------------------------------------------
export type CollectionDate =
  | typeof QUEUE_COLLECTION.dateKey
  | typeof WAITLIST_COLLECTION.dateKey;

// ---------------------------------------------------------------------------
// Timeslot type — union of all valid slot keys across both collection days
// ---------------------------------------------------------------------------
export type TimeslotKey =
  | typeof QUEUE_COLLECTION.timeslots[number]["key"]
  | typeof WAITLIST_COLLECTION.timeslots[number]["key"];
