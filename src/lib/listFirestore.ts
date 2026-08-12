/**
 * listFirestore.ts
 *
 * Unified data module for both queue and wait collections.
 * Replaces queueFirestore.ts and waitFirestore.ts.
 *
 * Key design decisions:
 * - `joinList` is an atomic Firestore transaction: capacity check + write happen
 *   together. The old check-then-write race condition is eliminated.
 * - `rank` is removed; ordering is by `registeredAt` server timestamp.
 * - Cancellation releases the slot via decrementSlot.
 * - Global counters (counter/count) are updated outside the transaction as
 *   display-only — a counter being 1 off is fine; a slot being over-sold is not.
 */

import { db } from "./firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  arrayUnion,
  serverTimestamp,
  runTransaction,
  increment,
} from "firebase/firestore";
import {
  CollectionDate,
  TimeslotKey,
  slotDocId,
  CAP_BY_DATE,
} from "./eventConfig";
import {
  updateQueueCounter,
  updateWaitingCounter,
  updateWaitingToQueueCounter,
  SlotData,
} from "./counterFirestore";

// ---------------------------------------------------------------------------
// Shared data shape (queue and wait use the same structure)
// ---------------------------------------------------------------------------
export type ListType = "queue" | "wait";

export interface RegistrationData {
  fullName: string;
  studentId: string;
  studentEmail: string;
  personalEmail: string;
  phoneNumber: string;
  registeredAt: ReturnType<typeof serverTimestamp> | null; // server timestamp
  collectDetails: {
    timeslot: TimeslotKey;
    date: CollectionDate;
  };
  queuingStatus: "queuing" | "waiting" | "cancelled" | "collected";
  ticketNumber: string | null;
}

// ---------------------------------------------------------------------------
// joinList — atomic: capacity check + write in one transaction
// ---------------------------------------------------------------------------
export const joinList = async (
  type: ListType,
  data: Omit<RegistrationData, "registeredAt" | "queuingStatus" | "ticketNumber">,
): Promise<void> => {
  const { studentId, collectDetails } = data;
  const { date, timeslot } = collectDetails;

  const queueRef    = doc(db, "queue", studentId);
  const waitRef     = doc(db, "wait",  studentId);
  const targetRef   = type === "queue" ? queueRef : waitRef;
  const slotRef     = doc(db, "counter", slotDocId(date, timeslot));
  const cap         = CAP_BY_DATE[date];

  await runTransaction(db, async (tx) => {
    // 1. Check both collections — no double registration
    const [queueSnap, waitSnap, slotSnap] = await Promise.all([
      tx.get(queueRef),
      tx.get(waitRef),
      tx.get(slotRef),
    ]);

    if (queueSnap.exists() || waitSnap.exists()) {
      throw new Error("Student ID already exist");
    }

    // 2. Capacity check — use cap from eventConfig if slot doc missing
    const slotCount = slotSnap.exists()
      ? (slotSnap.data() as SlotData).count
      : 0;
    const slotCap = slotSnap.exists()
      ? (slotSnap.data() as SlotData).cap
      : cap;

    if (slotCount >= slotCap) {
      throw new Error("Slot full");
    }

    // 3. Atomic write: student doc + slot increment
    tx.set(targetRef, {
      ...data,
      registeredAt: serverTimestamp(),
      queuingStatus: type === "queue" ? "queuing" : "waiting",
      ticketNumber: null,
    });

    if (slotSnap.exists()) {
      tx.update(slotRef, { count: increment(1) });
    }
  });

  // 4. Bump display counter outside the transaction (best-effort, non-critical)
  if (type === "queue") {
    updateQueueCounter(1).catch(() => {});
  } else {
    updateWaitingCounter(1).catch(() => {});
  }
};

// ---------------------------------------------------------------------------
// fetchList — returns all documents from a collection
// ---------------------------------------------------------------------------
export const fetchList = async (type: ListType): Promise<RegistrationData[]> => {
  const ref = collection(db, type === "queue" ? "queue" : "wait");
  try {
    const snap = await getDocs(ref);
    return snap.docs.map((d) => d.data() as RegistrationData);
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// getStudent — searches queue then wait
// ---------------------------------------------------------------------------
export const getStudent = async (
  studentId: string,
): Promise<RegistrationData | null> => {
  const queueRef = doc(db, "queue", studentId);
  const waitRef  = doc(db, "wait",  studentId);
  try {
    const queueSnap = await getDoc(queueRef);
    if (queueSnap.exists()) return queueSnap.data() as RegistrationData;
    const waitSnap = await getDoc(waitRef);
    if (waitSnap.exists()) return waitSnap.data() as RegistrationData;
    return null;
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// cancelTicket — marks cancelled and releases the slot
// ---------------------------------------------------------------------------
export const cancelTicket = async (
  type: ListType,
  studentId: string,
): Promise<void> => {
  const docRef    = doc(db, type === "queue" ? "queue" : "wait", studentId);
  const cancelRef = doc(db, "cancel", type);

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const { collectDetails, personalEmail } = snap.data() as RegistrationData;

    await updateDoc(docRef, { queuingStatus: "cancelled" });

    // Release the timeslot
    const slotRef = doc(db, "counter", slotDocId(collectDetails.date, collectDetails.timeslot));
    try {
      await updateDoc(slotRef, { count: increment(-1) });
    } catch { /* slot doc may not exist in legacy data — non-fatal */ }

    // Log in cancel collection
    try {
      await updateDoc(cancelRef, {
        studentEmail: arrayUnion(personalEmail),
        studentId:    arrayUnion(studentId),
      });
    } catch { /* non-fatal */ }
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// promoteToQueue — moves a waiting student into the queue pool
// ---------------------------------------------------------------------------
export const promoteToQueue = async (studentId: string): Promise<void> => {
  const waitRef = doc(db, "wait", studentId);
  try {
    const snap = await getDoc(waitRef);
    if (!snap.exists()) return;
    await updateDoc(waitRef, { queuingStatus: "queuing" });
    await updateWaitingToQueueCounter(1).catch(() => {});
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Backward-compat re-exports so any remaining references compile
// ---------------------------------------------------------------------------
/** @deprecated Use joinList("queue", ...) instead */
export const storeQueueData = (data: RegistrationData) =>
  joinList("queue", data);

/** @deprecated Use joinList("wait", ...) instead */
export const storeWaitData = (data: RegistrationData) =>
  joinList("wait", data);

/** @deprecated Use fetchList("queue") instead */
export const fetchQueueData = () => fetchList("queue");

/** @deprecated Use fetchList("wait") instead */
export const fetchWaitData = () => fetchList("wait");

/** @deprecated Use getStudent instead */
export const getStudentId = getStudent;

/** @deprecated Use cancelTicket("queue", ...) instead */
export const cancelQueueTicket = (studentId: string) =>
  cancelTicket("queue", studentId);

/** @deprecated Use cancelTicket("wait", ...) instead */
export const cancelWaitTicket = (studentId: string) =>
  cancelTicket("wait", studentId);

/** @deprecated Use promoteToQueue instead */
export const updateWaitingToQueuing = promoteToQueue;

// QueueData kept as alias for build compatibility
export type QueueData = RegistrationData;
