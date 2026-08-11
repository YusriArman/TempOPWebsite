import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { fetchQueueData, QueueData } from "@/lib/queueFirestore";
import {
  getQueueCount,
  CounterDataType,
  DateSlotData,
  CollectionDate,
  getTimeslotCount,
} from "@/lib/counterFirestore";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { fetchWaitData } from "@/lib/waitFirestore";
import { fetchRegisterData, RegisterData } from "@/lib/registerFirestore";

// All 3 collection dates
const COLLECTION_DATES: CollectionDate[] = ["sept14", "sept15", "sept17"];

// Timeslot data keyed by collection date
export type AllTimeslotData = {
  [K in CollectionDate]: DateSlotData;
};

interface RegistrationContextType {
  queueData: QueueData[] | null;
  refreshQueueData: () => Promise<void>;
  waitingData: QueueData[] | null;
  refreshWaitData: () => Promise<void>;
  counterData: CounterDataType | null;
  refreshCounterData: () => Promise<void>;
  timeslotData: AllTimeslotData | null;
  refreshTimeslotData: () => Promise<void>;
  queueLimit: boolean;
  waitLimit: boolean;
  registrationData: RegisterData[] | null;
  refreshRegistrationData: () => Promise<void>;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(
  undefined,
);

export const useRegistration = (): RegistrationContextType => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error(
      "useRegistration must be used within a RegistrationProvider",
    );
  }
  return context;
};

const emptyDateSlot = (): DateSlotData => ({
  "530": { count: 0, studentId: [] },
  "630": { count: 0, studentId: [] },
  "730": { count: 0, studentId: [] },
});

export const RegistrationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [queueData, setQueueData] = useState<QueueData[] | null>(null);
  const [waitingData, setWaitingData] = useState<QueueData[] | null>(null);
  const [counterData, setCounterData] = useState<CounterDataType | null>(null);
  const [timeslotData, setTimeslotData] = useState<AllTimeslotData | null>(null);
  // Default false = queue is open. Firebase will update if connected.
  const [queueLimit, setQueueLimit] = useState<boolean>(false);
  const [waitLimit, setWaitLimit] = useState<boolean>(false);
  const [registrationData, setRegistrationData] = useState<
    RegisterData[] | null
  >(null);

  const refreshQueueData = useCallback(async () => {
    try {
      const allQueueData = await fetchQueueData();
      setQueueData(allQueueData);
    } catch (error) {
      console.error("Error fetching queue data:", error);
    }
  }, []);

  const refreshWaitData = useCallback(async () => {
    try {
      const allWaitingData = await fetchWaitData();
      setWaitingData(allWaitingData);
    } catch (error) {
      console.error("Error fetching wait data:", error);
    }
  }, []);

  const refreshCounterData = useCallback(async () => {
    try {
      const queueCount = await getQueueCount();
      setCounterData(queueCount);
      const queuing = queueCount?.queueCount || 0;
      const waiting = queueCount?.waitingCount || 0;
      setQueueLimit(queuing > 1350); // true if full
      setWaitLimit(waiting > 500);   // true if full
    } catch (error) {
      console.error("Error fetching counter data:", error);
    }
  }, []);

  const refreshTimeslotData = useCallback(async () => {
    try {
      const results = await Promise.all(
        COLLECTION_DATES.map((date) => getTimeslotCount(date)),
      );
      setTimeslotData({
        sept14: results[0] || emptyDateSlot(),
        sept15: results[1] || emptyDateSlot(),
        sept17: results[2] || emptyDateSlot(),
      });
    } catch (error) {
      console.error("Error fetching timeslot data:", error);
    }
  }, []);

  const refreshRegistrationData = useCallback(async () => {
    try {
      const allRegisterData = await fetchRegisterData();
      setRegistrationData(allRegisterData);
    } catch (error) {
      console.error("Error fetching register data:", error);
    }
  }, []);

  useEffect(() => {
    // Counter snapshot listener
    const counterRef = doc(db, "counter", "count");
    const unsubCounter = onSnapshot(
      counterRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setCounterData(docSnapshot.data() as CounterDataType);
          const queuing = docSnapshot.data().queueCount;
          const waiting = docSnapshot.data().waitingCount;
          setQueueLimit(queuing > 1350);
          setWaitLimit(waiting > 500);
        } else {
          console.log("counter update doc not found");
        }
      },
      (error) => {
        console.error("Error getting counter refresh snapshot:", error);
      },
    );

    // Per-date timeslot snapshot listeners
    const unsubDateListeners = COLLECTION_DATES.map((date) => {
      const dateRef = doc(db, "counter", date);
      return onSnapshot(
        dateRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data() as DateSlotData;
            setTimeslotData((prev) => ({
              sept14: prev?.sept14 || emptyDateSlot(),
              sept15: prev?.sept15 || emptyDateSlot(),
              sept17: prev?.sept17 || emptyDateSlot(),
              [date]: data,
            }));
          } else {
            console.log(`${date} timeslot document not found.`);
          }
        },
        (error) => {
          console.error(`Error listening to ${date} timeslot updates:`, error);
        },
      );
    });

    return () => {
      unsubCounter();
      unsubDateListeners.forEach((unsub) => unsub());
    };
  }, []);

  return (
    <RegistrationContext.Provider
      value={{
        queueData,
        refreshQueueData,
        waitingData,
        refreshWaitData,
        counterData,
        refreshCounterData,
        timeslotData,
        refreshTimeslotData,
        queueLimit,
        waitLimit,
        registrationData,
        refreshRegistrationData,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
};
