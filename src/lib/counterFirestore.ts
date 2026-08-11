import { db } from "./firebaseConfig";
import {
  doc,
  setDoc,
  getDoc,
  increment,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import {
  CollectionDate,
  CAP_BY_DATE,
  QUEUE_COLLECTION,
  WAITLIST_COLLECTION,
} from "./eventConfig";

// ---------------------------------------------------------------------------
// Counter document shape
// ---------------------------------------------------------------------------
export interface CounterDataType {
  queueCount: number;
  registerCount: number;
  registeredCount: number;
  waitingCount: number;
  waitingToQueueCount: number;
}

// ---------------------------------------------------------------------------
// Timeslot document shape — flexible Record so both
// "530"/"630"/"730" (queue) and "500"/"600" (waitlist) are valid at runtime.
// ---------------------------------------------------------------------------
export interface TimeSlotData {
  count: number;
  studentId: string[];
}

export type DateSlotData = Record<string, TimeSlotData>;

// Re-export CollectionDate from eventConfig so existing imports still work
export type { CollectionDate };

// ---------------------------------------------------------------------------
// Counter reads
// ---------------------------------------------------------------------------
export const getQueueCount = async (): Promise<CounterDataType | null> => {
  const counterRef = doc(db, "counter", "count");
  try {
    const docSnap = await getDoc(counterRef);
    if (docSnap.exists()) return docSnap.data() as CounterDataType;
    console.log("no queueCounter document found");
    return null;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Counter writes
// ---------------------------------------------------------------------------
export const updateQueueCounter = async (incrementValue: number): Promise<void> => {
  const counterRef = doc(db, "counter", "count");
  try {
    await updateDoc(counterRef, { queueCount: increment(incrementValue) });
  } catch (error) {
    console.error("Error updating queueCounter:", error);
  }
};

export const updateRegisterCounter = async (incrementValue: number): Promise<void> => {
  const counterRef = doc(db, "counter", "count");
  try {
    await updateDoc(counterRef, { registerCount: increment(incrementValue) });
  } catch (error) {
    console.error("Error updating registerCounter:", error);
  }
};

export const updateWaitingCounter = async (incrementValue: number): Promise<void> => {
  const counterRef = doc(db, "counter", "count");
  try {
    await updateDoc(counterRef, { waitingCount: increment(incrementValue) });
  } catch (error) {
    console.error("Error updating waitingCounter:", error);
  }
};

export const updateWaitingToQueueCounter = async (incrementValue: number): Promise<void> => {
  const counterRef = doc(db, "counter", "count");
  try {
    await updateDoc(counterRef, { waitingToQueueCount: increment(incrementValue) });
  } catch (error) {
    console.error("Error updating waitingToQueueCounter:", error);
  }
};

export const updateRegisteredCounter = async (incrementValue: number): Promise<void> => {
  const counterRef = doc(db, "counter", "count");
  try {
    await updateDoc(counterRef, { registeredCount: increment(incrementValue) });
  } catch (error) {
    console.error("Error updating registeredCounter:", error);
  }
};

// ---------------------------------------------------------------------------
// Timeslot init — derived from eventConfig, no magic strings here
// ---------------------------------------------------------------------------
const emptySlot = (): TimeSlotData => ({ count: 0, studentId: [] });

export const initTimeSlotCount = async (): Promise<void> => {
  const collections = [
    {
      dateKey: QUEUE_COLLECTION.dateKey,
      slots: QUEUE_COLLECTION.timeslots.map(({ key }) => key),
    },
    {
      dateKey: WAITLIST_COLLECTION.dateKey,
      slots: WAITLIST_COLLECTION.timeslots.map(({ key }) => key),
    },
  ];

  try {
    for (const { dateKey, slots } of collections) {
      const slotData: DateSlotData = Object.fromEntries(
        slots.map((key) => [key, emptySlot()]),
      );
      await setDoc(doc(db, "counter", dateKey), slotData);
    }
    console.log("Firestore timeslots initialised from eventConfig");
  } catch (error) {
    console.error("Error initialising timeslots:", error);
  }
};

// ---------------------------------------------------------------------------
// Timeslot reads
// ---------------------------------------------------------------------------
export const getTimeslotCount = async (
  date: CollectionDate,
): Promise<DateSlotData | null> => {
  const dateRef = doc(db, "counter", date);
  try {
    const dateSnap = await getDoc(dateRef);
    if (dateSnap.exists()) return dateSnap.data() as DateSlotData;
    console.log(`No counter document found for ${date}`);
    return null;
  } catch (error) {
    console.error("Error getting timeslot data", error);
    return null;
  }
};

// ---------------------------------------------------------------------------
// Timeslot increment — records studentId in the slot array
// ---------------------------------------------------------------------------
export const updateTimeslot = async (
  date: CollectionDate,
  incrementValue: number,
  studentId: string,
  time: string,
): Promise<void> => {
  const dateRef = doc(db, "counter", date);
  try {
    await updateDoc(dateRef, {
      [`${time}.count`]:     increment(incrementValue),
      [`${time}.studentId`]: arrayUnion(studentId),
    });
  } catch (error) {
    console.error("Error updating timeslot:", error);
  }
};

// ---------------------------------------------------------------------------
// Timeslot cap check — cap comes from eventConfig, not hardcoded
// ---------------------------------------------------------------------------
export const timeslotLimit = async (
  date: CollectionDate,
  time: string,
): Promise<boolean> => {
  const dateRef = doc(db, "counter", date);
  const cap = CAP_BY_DATE[date];          // 450 for TGH, 250 for LT1

  try {
    const dateSnap = await getDoc(dateRef);
    if (dateSnap.exists()) {
      const slotData = dateSnap.data()[time] as TimeSlotData | undefined;
      if (slotData?.count !== undefined) return slotData.count < cap;
      console.log("No data for given timeslot");
      return false;
    }
    console.log(`No counter document found for ${date}`);
    return false;
  } catch (error) {
    console.error("Error checking timeslot limit:", error);
    return false;
  }
};
