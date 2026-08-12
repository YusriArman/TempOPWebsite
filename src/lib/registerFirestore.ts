import {
  updateRegisterCounter,
  updateRegisteredCounter,
} from "./counterFirestore";
import { db } from "./firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";

export interface RegisterData {
  ticketNumber: string;
  studentId: string;
  createdAt: string;
  registered: boolean;
}

export const registerTicket = async (
  ticketData: RegisterData,
): Promise<void> => {
  const { ticketNumber, studentId, createdAt, registered } = ticketData;
  const docRef = doc(db, "registration", ticketNumber);

  try {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      throw new Error("Ticket number already exist");
    }

    await setDoc(docRef, { ticketNumber, studentId, createdAt, registered });
    await updateRegisterCounter(1);
  } catch (error) {
    console.log("Error registering ticket:", error);
    throw error;
  }
};

// update queuing status
export const updateStatus = async (
  studentId: string,
  ticketNumber: string,
  type: "queue" | "wait",
): Promise<void> => {
  const docRef = doc(db, type, studentId);

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, {
        queuingStatus: "collected",
        ticketNumber: ticketNumber,
      });
      console.log(`Collected status for ${studentId} updated`);
    } else {
      console.log("no doc found");
    }
  } catch (error) {
    console.error("Error updating status:", error);
  }
};

export const fetchRegisterData = async (): Promise<RegisterData[]> => {
  const registrationCollectionRef = collection(db, "registration");

  try {
    const querySnapshot = await getDocs(registrationCollectionRef);
    const registerDataList: RegisterData[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as RegisterData;
      registerDataList.push({
        ticketNumber: data.ticketNumber,
        studentId: data.studentId,
        createdAt: data.createdAt,
        registered: data.registered,
      });
    });
    return registerDataList;
  } catch (error) {
    console.error("Error fetching registration data:", error);
    throw error;
  }
};

export const updateRegistered = async (ticketNumber: string): Promise<void> => {
  const docRef = doc(db, "registration", ticketNumber);

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const newValue = !docSnap.data().registered;
      await updateDoc(docRef, { registered: newValue });
      // +1 when marking registered, -1 when un-registering
      await updateRegisteredCounter(newValue ? 1 : -1);
    }
  } catch (error) {
    console.error("Error updating registration status:", error);
  }
};
