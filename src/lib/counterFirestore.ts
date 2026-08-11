import { db } from "./firebaseConfig";
import {
  doc,
  setDoc,
  getDoc,
  increment,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

export interface CounterDataType {
  queueCount: number;
  registerCount: number;
  registeredCount: number;
  vegetarianCount: number;
  waitingCount: number;
  waitingToQueueCount: number;
}

export interface TimeSlotData {
  count: number;
  studentId: string[];
}

// Each date document holds the 3 timeslots
export interface DateSlotData {
  "530": TimeSlotData;
  "630": TimeSlotData;
  "730": TimeSlotData;
}

// All 3 collection dates for OP 2026
export type CollectionDate = "sept14" | "sept15" | "sept17";

export const getQueueCount = async (): Promise<CounterDataType | null> => {
  const counterRef = doc(db, "counter", "count");

  try {
    const docSnap = await getDoc(counterRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as CounterDataType;
      return data;
    } else {
      console.log("no queueCounter document found");
      return null;
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// not needed anymore
export const initQueueCounter = async (): Promise<void> => {
  const counterRef = doc(db, "counter", "count");

  try {
    const docSnap = await getDoc(counterRef);
    if (!docSnap.exists()) {
      await setDoc(
        counterRef,
        {
          queueCount: 0,
          registerCount: 0,
          vegetarianCount: 0,
          waitingCount: 0,
          waitingToQueueCount: 0,
          registeredCount: 0,
        },
        { merge: true },
      );
      console.log("queue counter initialized with count: 0");
    } else {
      console.log("queueCounter already exist");
    }
  } catch (error) {
    console.error("Error initializing queue counter");
  }
};

export const updateQueueCounter = async (
  incrementValue: number,
): Promise<void> => {
  const counterRef = doc(db, "counter", "count");

  try {
    await updateDoc(counterRef, {
      queueCount: increment(incrementValue),
    });
    console.log(`queueCounter updated by ${incrementValue}`);
  } catch (error) {
    console.error("Error updating queueCounter:", error);
  }
};

export const updateRegisterCounter = async (
  incrementValue: number,
): Promise<void> => {
  const counterRef = doc(db, "counter", "count");

  try {
    await updateDoc(counterRef, {
      registerCount: increment(incrementValue),
    });
    console.log(`registerCounter updated by ${incrementValue}`);
  } catch (error) {
    console.error("Error updating registerCounter:", error);
  }
};

export const updateVegetarianCounter = async (
  incrementValue: number,
): Promise<void> => {
  const counterRef = doc(db, "counter", "count");

  try {
    await updateDoc(counterRef, {
      vegetarianCount: increment(incrementValue),
    });
    console.log(`vegetarianCounter updated by ${incrementValue}`);
  } catch (error) {
    console.error("Error updating vegetarianCounter:", error);
  }
};

export const updateWaitingCounter = async (
  incrementValue: number,
): Promise<void> => {
  const counterRef = doc(db, "counter", "count");

  try {
    await updateDoc(counterRef, {
      waitingCount: increment(incrementValue),
    });
    console.log(`waitingCounter updated by ${incrementValue}`);
  } catch (error) {
    console.error("Error updating waitingCounter:", error);
  }
};

export const updateWaitingToQueueCounter = async (
  incrementValue: number,
): Promise<void> => {
  const counterRef = doc(db, "counter", "count");

  try {
    await updateDoc(counterRef, {
      waitingToQueueCount: increment(incrementValue),
    });
    console.log(`waitingToQueueCounter updated by ${incrementValue}`);
  } catch (error) {
    console.error("Error updating waitingToQueueCounter:", error);
  }
};

export const updateRegisteredCounter = async (
  incrementValue: number,
): Promise<void> => {
  const counterRef = doc(db, "counter", "count");

  try {
    await updateDoc(counterRef, {
      registeredCount: increment(incrementValue),
    });
    console.log(`registeredCounter updated by ${incrementValue}`);
  } catch (error) {
    console.error("Error updating registeredCounter:", error);
  }
};

/**
 * Initialize Firestore timeslot counter documents for OP 2026.
 * Creates 3 date documents: sept14, sept15, sept17.
 * Each holds the 3 standard timeslots: 5:30PM, 6:30PM, 7:30PM.
 */
export const initTimeSlotCount = async (): Promise<void> => {
  const emptySlots: DateSlotData = {
    "530": { count: 0, studentId: [] },
    "630": { count: 0, studentId: [] },
    "730": { count: 0, studentId: [] },
  };

  const dates: CollectionDate[] = ["sept14", "sept15", "sept17"];

  try {
    for (const date of dates) {
      const dateRef = doc(db, "counter", date);
      await setDoc(dateRef, emptySlots);
    }
    console.log("Firestore timeslot initialized for OP 2026 (sept14, sept15, sept17)");
  } catch (error) {
    console.error("Error initialising timeslot", error);
  }
};

/**
 * Fetch timeslot counts for a given collection date.
 */
export const getTimeslotCount = async (
  date: CollectionDate,
): Promise<DateSlotData | null> => {
  const dateRef = doc(db, "counter", date);
  try {
    const dateSnap = await getDoc(dateRef);

    if (dateSnap.exists()) {
      const data = dateSnap.data();
      return {
        "530": data["530"] || { count: 0, studentId: [] },
        "630": data["630"] || { count: 0, studentId: [] },
        "730": data["730"] || { count: 0, studentId: [] },
      } as DateSlotData;
    } else {
      console.log(`No counter document found for ${date}`);
      return null;
    }
  } catch (error) {
    console.error("Error getting timeslot data", error);
    return null;
  }
};

/**
 * Increment timeslot count for a given date and time, and record the studentId.
 */
export const updateTimeslot = async (
  date: CollectionDate,
  incrementValue: number,
  studentId: string,
  time: string,
): Promise<void> => {
  const dateRef = doc(db, "counter", date);

  try {
    await updateDoc(dateRef, {
      [`${time}.count`]: increment(incrementValue),
      [`${time}.studentId`]: arrayUnion(studentId),
    });
    console.log(
      `Timeslot ${time} on ${date} updated by ${incrementValue}, studentId: ${studentId}`,
    );
  } catch (error) {
    console.error("Error updating timeslot:", error);
  }
};

/**
 * Check whether a given timeslot on a given date still has capacity.
 * Returns true if capacity is available, false if the slot is full.
 * Cap is 450 per timeslot per date.
 */
export const timeslotLimit = async (
  date: CollectionDate,
  time: string,
): Promise<boolean> => {
  const dateRef = doc(db, "counter", date);
  const SLOT_LIMIT = 450;

  try {
    const dateSnap = await getDoc(dateRef);

    if (dateSnap.exists()) {
      const data = dateSnap.data();
      const slotData = data[time];

      if (slotData && slotData.count !== undefined) {
        return slotData.count < SLOT_LIMIT;
      } else {
        console.log("No data for given timeslot");
        return false;
      }
    } else {
      console.log(`No counter document found for ${date}`);
      return false;
    }
  } catch (error) {
    console.error("Error checking timeslot limit:", error);
    return false;
  }
};
