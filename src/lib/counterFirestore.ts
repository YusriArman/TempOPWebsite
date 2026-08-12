import { db } from "./firebaseConfig";
import {
  doc,
  setDoc,
  getDoc,
  increment,
  updateDoc,
  runTransaction,
} from "firebase/firestore";
import {
  CollectionDate,
  TimeslotKey,
  QUEUE_COLLECTION,
  WAITLIST_COLLECTION,
  slotDocId,
} from "./eventConfig";

// ---------------------------------------------------------------------------
// Counter document shape  (counter/count — display-only aggregate)
// ---------------------------------------------------------------------------
export interface CounterDataType {
  queueCount: number;
  registerCount: number;
  registeredCount: number;
  waitingCount: number;
  waitingToQueueCount: number;
}

// ---------------------------------------------------------------------------
// Per-slot document shape  (counter/sept15_530, counter/sept17_500, …)
// ---------------------------------------------------------------------------
export interface SlotData {
  count: number;
  cap: number;
}

// Legacy aggregate shape kept for RegistrationContext snapshot listener
export interface TimeSlotData {
  count: number;
  studentId: string[];
}
export type DateSlotData = Record<string, TimeSlotData>;

// Re-export types so existing imports still compile
export type { CollectionDate };

// ---------------------------------------------------------------------------
// Counter reads
// ---------------------------------------------------------------------------
export const getQueueCount = async (): Promise<CounterDataType | null> => {
  const counterRef = doc(db, "counter", "count");
  try {
    const snap = await getDoc(counterRef);
    if (snap.exists()) return snap.data() as CounterDataType;
    return null;
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Aggregate counter writes (display-only — correctness lives in the transaction)
// ---------------------------------------------------------------------------
export const updateQueueCounter = async (delta: number): Promise<void> => {
  try {
    await updateDoc(doc(db, "counter", "count"), { queueCount: increment(delta) });
  } catch { /* non-fatal */ }
};

export const updateWaitingCounter = async (delta: number): Promise<void> => {
  try {
    await updateDoc(doc(db, "counter", "count"), { waitingCount: increment(delta) });
  } catch { /* non-fatal */ }
};

export const updateWaitingToQueueCounter = async (delta: number): Promise<void> => {
  try {
    await updateDoc(doc(db, "counter", "count"), { waitingToQueueCount: increment(delta) });
  } catch { /* non-fatal */ }
};

export const updateRegisterCounter = async (delta: number): Promise<void> => {
  try {
    await updateDoc(doc(db, "counter", "count"), { registerCount: increment(delta) });
  } catch { /* non-fatal */ }
};

/**
 * Fixed: accepts an explicit delta (+1 or -1) so un-registering decrements
 * instead of always incrementing.
 */
export const updateRegisteredCounter = async (delta: 1 | -1): Promise<void> => {
  try {
    await updateDoc(doc(db, "counter", "count"), { registeredCount: increment(delta) });
  } catch { /* non-fatal */ }
};

// ---------------------------------------------------------------------------
// Per-slot document init — one doc per slot, e.g. counter/sept15_530
// ---------------------------------------------------------------------------
export const initSlotDocs = async (): Promise<void> => {
  const allSlots = [
    ...QUEUE_COLLECTION.timeslots.map((t) => ({
      id: slotDocId(QUEUE_COLLECTION.dateKey, t.key),
      cap: QUEUE_COLLECTION.slotCap,
    })),
    ...WAITLIST_COLLECTION.timeslots.map((t) => ({
      id: slotDocId(WAITLIST_COLLECTION.dateKey, t.key),
      cap: WAITLIST_COLLECTION.slotCap,
    })),
  ];
  for (const { id, cap } of allSlots) {
    await setDoc(doc(db, "counter", id), { count: 0, cap } satisfies SlotData);
  }
};

// ---------------------------------------------------------------------------
// Per-slot read
// ---------------------------------------------------------------------------
export const getSlotData = async (
  date: CollectionDate,
  timeslot: TimeslotKey,
): Promise<SlotData | null> => {
  try {
    const snap = await getDoc(doc(db, "counter", slotDocId(date, timeslot)));
    return snap.exists() ? (snap.data() as SlotData) : null;
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Atomic slot increment (used inside joinList transaction)
// Returns false if cap is already reached, true on success.
// ---------------------------------------------------------------------------
export const incrementSlotAtomic = async (
  date: CollectionDate,
  timeslot: TimeslotKey,
): Promise<boolean> => {
  const slotRef = doc(db, "counter", slotDocId(date, timeslot));
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(slotRef);
      if (!snap.exists()) throw new Error("slot-not-found");
      const { count, cap } = snap.data() as SlotData;
      if (count >= cap) throw new Error("slot-full");
      tx.update(slotRef, { count: increment(1) });
    });
    return true;
  } catch (e) {
    if (e instanceof Error && (e.message === "slot-full" || e.message === "slot-not-found")) {
      return false;
    }
    throw e;
  }
};

// ---------------------------------------------------------------------------
// Atomic slot decrement (used by cancelTicket to release the slot)
// ---------------------------------------------------------------------------
export const decrementSlot = async (
  date: CollectionDate,
  timeslot: TimeslotKey,
): Promise<void> => {
  try {
    const slotRef = doc(db, "counter", slotDocId(date, timeslot));
    await updateDoc(slotRef, { count: increment(-1) });
  } catch { /* non-fatal */ }
};

// ---------------------------------------------------------------------------
// Legacy aggregate-date slot read — kept for RegistrationContext
// ---------------------------------------------------------------------------
export const getTimeslotCount = async (
  date: CollectionDate,
): Promise<DateSlotData | null> => {
  // Build from individual slot docs
  const collection = date === QUEUE_COLLECTION.dateKey ? QUEUE_COLLECTION : WAITLIST_COLLECTION;
  const result: DateSlotData = {};
  for (const { key } of collection.timeslots) {
    const slot = await getSlotData(date, key);
    result[key] = { count: slot?.count ?? 0, studentId: [] };
  }
  return result;
};
