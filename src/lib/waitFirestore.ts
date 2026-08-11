import {
  updateTimeslot,
  updateWaitingCounter,
  updateWaitingToQueueCounter,
} from "./counterFirestore";
import { db } from "./firebaseConfig";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  arrayUnion,
} from "firebase/firestore";
import { QueueData } from "./queueFirestore";

export const storeWaitData = async (queueData: QueueData): Promise<void> => {
  const {
    fullName,
    studentId,
    studentEmail,
    personalEmail,
    phoneNumber,
    dateTime,
    rank,
    collectDetails,
    queuingStatus,
    ticketNumber,
  } = queueData;

  const queueRef = doc(db, "queue", studentId);
  const waitRef  = doc(db, "wait",  studentId);

  try {
    const queueSnap = await getDoc(queueRef);
    if (queueSnap.exists()) {
      throw new Error("Student ID already exist");
    }

    const waitSnap = await getDoc(waitRef);
    if (waitSnap.exists()) {
      throw new Error("Student ID already exist");
    }

    await setDoc(waitRef, {
      fullName,
      studentId,
      studentEmail,
      personalEmail,
      phoneNumber,
      dateTime,
      rank,
      collectDetails,
      queuingStatus,
      ticketNumber,
    });

    console.log("document updated successfully");
    await updateWaitingCounter(1);
    await updateTimeslot(
      queueData.collectDetails.date,
      1,
      queueData.studentId,
      collectDetails.timeslot,
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const fetchWaitData = async (): Promise<QueueData[]> => {
  const waitCollectionRef = collection(db, "wait");

  try {
    const querySnapshot = await getDocs(waitCollectionRef);
    const waitDataList: QueueData[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as QueueData;
      waitDataList.push({
        fullName: data.fullName,
        studentId: data.studentId,
        studentEmail: data.studentEmail,
        personalEmail: data.personalEmail,
        phoneNumber: data.phoneNumber,
        dateTime: data.dateTime,
        rank: data.rank,
        collectDetails: data.collectDetails,
        queuingStatus: data.queuingStatus,
        ticketNumber: data.ticketNumber,
      });
    });
    return waitDataList;
  } catch (error) {
    console.error("Error fetching wait data:", error);
    throw error;
  }
};

export const cancelWaitTicket = async (
  studentId: string,
  email: string,
): Promise<void> => {
  const waitRef   = doc(db, "wait",   studentId);
  const cancelRef = doc(db, "cancel", "waiting");

  try {
    const waitSnap = await getDoc(waitRef);
    if (waitSnap.exists()) {
      await updateDoc(waitRef, {
        queuingStatus: "cancelled",
      });
      console.log(`Cancelled status for ${studentId} updated`);

      await updateDoc(cancelRef, {
        studentEmail: arrayUnion(email),
        studentId:    arrayUnion(studentId),
      });
      console.log(`${email} & ${studentId} added to cancel collection`);
    } else {
      console.log("no doc found");
    }
  } catch (error) {
    console.error("Error cancelling ticket", error);
  }
};

export const updateWaitingToQueuing = async (
  studentId: string,
): Promise<void> => {
  const waitRef = doc(db, "wait", studentId);

  try {
    const waitSnap = await getDoc(waitRef);
    if (waitSnap.exists()) {
      await updateDoc(waitRef, {
        queuingStatus: "queuing",
      });
      await updateWaitingToQueueCounter(1);
      console.log(`${studentId} updated from waiting to queuing`);
    } else {
      console.log("No doc found");
    }
  } catch (error) {
    console.error("Error updating status", error);
  }
};
