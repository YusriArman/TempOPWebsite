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
  getTimeslotCount,
} from "@/lib/counterFirestore";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { fetchWaitData } from "@/lib/waitFirestore";
import { fetchRegisterData, RegisterData } from "@/lib/registerFirestore";
import {
  CollectionDate,
  QUEUE_COLLECTION,
  WAITLIST_COLLECTION,
} from "@/lib/eventConfig";

// Derived from eventConfig — add/remove dates there, not here
const COLLECTION_DATES: CollectionDate[] = [
  QUEUE_COLLECTION.dateKey,
  WAITLIST_COLLECTION.dateKey,
];

// Timeslot data keyed by collection date — only the two active dates
export type AllTimeslotData = Record<CollectionDate, DateSlotData>;

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
      setQueueLimit(queuing >= 1350);
      setWaitLimit(waiting >= 500);
    } catch (error) {
      console.error("Error fetching counter data:", error);
    }
  }, []);

  const refreshTimeslotData = useCallback(async () => {
    try {
      const results = await Promise.all(
        COLLECTION_DATES.map((date) => getTimeslotCount(date)),
      );
      const entries = COLLECTION_DATES.map((date, i) => [
        date,
        results[i] ?? {},
      ]);
      setTimeslotData(Object.fromEntries(entries) as AllTimeslotData);
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
          setQueueLimit(queuing >= 1350);
          setWaitLimit(waiting >= 500);
        } else {
          console.log("counter update doc not found");
        }
      },
      (error) => {
        console.error("Error getting counter refresh snapshot:", error);
      },
    );

    // Per-date timeslot snapshot listeners — only for active collection dates
    const unsubDateListeners = COLLECTION_DATES.map((date) => {
      const dateRef = doc(db, "counter", date);
      return onSnapshot(
        dateRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data() as DateSlotData;
            setTimeslotData((prev) => ({
              ...Object.fromEntries(
                COLLECTION_DATES.map((d) => [d, prev?.[d] ?? {}]),
              ),
              [date]: data,
            } as AllTimeslotData));
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
