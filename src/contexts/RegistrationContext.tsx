import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { fetchList, RegistrationData as QueueData } from "@/lib/listFirestore";
import {
  getQueueCount,
  CounterDataType,
  DateSlotData,
  getTimeslotCount,
} from "@/lib/counterFirestore";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { fetchRegisterData, RegisterData } from "@/lib/registerFirestore";
import {
  CollectionDate,
  QUEUE_COLLECTION,
  WAITLIST_COLLECTION,
  MAX_QUEUE,
  MAX_WAIT,
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
  /** Start the live counter onSnapshot — call when the registration modal opens */
  subscribeCounters: () => void;
  /** Stop the live counter onSnapshot — call when the registration modal closes */
  unsubscribeCounters: () => void;
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
  // Ref to the counter unsubscribe fn — stored outside state to avoid re-renders
  const counterUnsubRef = React.useRef<(() => void) | null>(null);

  const subscribeCounters = useCallback(() => {
    if (counterUnsubRef.current) return; // already subscribed
    const counterRef = doc(db, "counter", "count");
    counterUnsubRef.current = onSnapshot(
      counterRef,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data() as CounterDataType;
          setCounterData(d);
          setQueueLimit(d.queueCount >= MAX_QUEUE);
          setWaitLimit(d.waitingCount >= MAX_WAIT);
        }
      },
    );
  }, []);

  const unsubscribeCounters = useCallback(() => {
    counterUnsubRef.current?.();
    counterUnsubRef.current = null;
  }, []);

  const [queueLimit, setQueueLimit] = useState<boolean>(false);
  const [waitLimit,  setWaitLimit]  = useState<boolean>(false);

  const [registrationData, setRegistrationData] = useState<
    RegisterData[] | null
  >(null);

  const refreshQueueData = useCallback(async () => {
    try {
      setQueueData(await fetchList("queue"));
    } catch (error) {
      console.error("Error fetching queue data:", error);
    }
  }, []);

  const refreshWaitData = useCallback(async () => {
    try {
      setWaitingData(await fetchList("wait"));
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
    // Initial counter fetch (no persistent socket open on page load)
    refreshCounterData();

    // Poll timeslot counts once on mount — updated again when modal opens
    refreshTimeslotData();

    // Subscribe to counter updates by default so queueLimit/waitLimit are live
    subscribeCounters();

    return () => {
      unsubscribeCounters();
    };
  }, [refreshCounterData, refreshTimeslotData, subscribeCounters, unsubscribeCounters]);

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
        subscribeCounters,
        unsubscribeCounters,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
};
