import emailjs from "@emailjs/browser";
import { QueueData } from "./queueFirestore";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;

/**
 * Human-readable labels for collection dates and timeslots.
 */
const DATE_LABELS: Record<string, string> = {
  sept14: "14th September 2026 (Sunday)",
  sept15: "15th September 2026 (Monday)",
  sept17: "17th September 2026 (Wednesday)",
};

const TIME_LABELS: Record<string, string> = {
  "530": "5:30 PM",
  "630": "6:30 PM",
  "730": "7:30 PM",
};

/**
 * Send a confirmation email to the student after successful queue/waitlist registration.
 *
 * Template parameters sent to EmailJS:
 *   - to_email       : student's personal email
 *   - to_name        : student's full name
 *   - student_id     : student ID
 *   - status         : "Queue" or "Waiting List"
 *   - collection_date: human-readable date string
 *   - collection_time: human-readable timeslot string
 *   - venue          : venue name (Taylor's Grand Hall)
 *   - event_date     : "18th September 2026"
 *   - contact_email  : committee contact email
 */
export const sendConfirmationEmail = async (
  data: QueueData,
): Promise<void> => {
  const isWaiting = data.queuingStatus === "waiting";
  const collectionDate = DATE_LABELS[data.collectDetails.date] ?? data.collectDetails.date;
  const collectionTime = TIME_LABELS[data.collectDetails.timeslot] ?? data.collectDetails.timeslot;

  const templateParams = {
    to_email: data.personalEmail,
    to_name: data.fullName,
    student_id: data.studentId,
    status: isWaiting ? "Waiting List" : "Queue",
    collection_date: collectionDate,
    collection_time: collectionTime,
    venue: "Taylor's Grand Hall (TGH), Taylor's University",
    event_date: "18th September 2026",
    contact_email: import.meta.env.VITE_CONTACT_EMAIL || "op2026@gmail.com",
  };

  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY,
    );
    console.log("Confirmation email sent:", response.status, response.text);
  } catch (error) {
    // Non-fatal: log the error but don't block the user flow
    console.error("Failed to send confirmation email:", error);
  }
};
