import {
  updateQueueCounter,
  updateTimeslot,
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
import { CollectionDate, TimeslotKey } from "./eventConfig";

export interface QueueData {
  fullName: string;
  studentId: string;
  studentEmail: string;
  personalEmail: string;
  phoneNumber: string;
  dateTime: string;
  rank: number;
  collectDetails: {
    timeslot: TimeslotKey;
    date: CollectionDate;
  };
  queuingStatus: "queuing" | "waiting" | "cancelled" | "collected";
  ticketNumber: string | null;
}

export const storeQueueData = async (queueData: QueueData): Promise<void> => {
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

  const docRef = doc(db, "queue", studentId);

  try {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      throw new Error("Student ID already exist");
    }

    await setDoc(docRef, {
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
    await updateQueueCounter(1);
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

export const fetchQueueData = async (): Promise<QueueData[]> => {
  const queueCollectionRef = collection(db, "queue");

  try {
    const querySnapshot = await getDocs(queueCollectionRef);
    const queueDataList: QueueData[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as QueueData;
      queueDataList.push({
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
    return queueDataList;
  } catch (error) {
    console.error("Error fetching queue data:", error);
    throw error;
  }
};

export const getStudentId = async (
  studentId: string,
): Promise<QueueData | null> => {
  const queueRef = doc(db, "queue", studentId);
  const waitRef = doc(db, "wait", studentId);

  try {
    const queueSnap = await getDoc(queueRef);
    if (queueSnap.exists()) {
      return queueSnap.data() as QueueData;
    }

    const waitSnap = await getDoc(waitRef);
    if (waitSnap.exists()) {
      return waitSnap.data() as QueueData;
    }

    console.log("No document found with the student ID");
    return null;
  } catch (error) {
    console.error("Error retrieving document:", error);
    throw error;
  }
};

export const cancelQueueTicket = async (
  studentId: string,
  email: string,
): Promise<void> => {
  const queueRef = doc(db, "queue", studentId);
  const cancelRef = doc(db, "cancel", "queuing");

  try {
    const queueSnap = await getDoc(queueRef);
    if (queueSnap.exists()) {
      await updateDoc(queueRef, {
        queuingStatus: "cancelled",
      });
      console.log(`Cancelled status for ${studentId} updated`);

      await updateDoc(cancelRef, {
        studentEmail: arrayUnion(email),
        studentId: arrayUnion(studentId),
      });
      console.log(`${email} & ${studentId} added to cancel collection`);
    } else {
      console.log("no doc found");
    }
  } catch (error) {
    console.error("Error cancelling ticket", error);
  }
};
