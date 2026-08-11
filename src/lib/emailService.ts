import emailjs from "@emailjs/browser";
import { QueueData } from "./queueFirestore";
import { DATE_LABELS, TIME_LABELS, VENUE_BY_DATE, EVENT } from "./eventConfig";

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string;

/**
 * Send a confirmation email to the student after successful queue/waitlist
 * registration.
 *
 * Template parameters sent to EmailJS:
 *   - to_email        : student's personal email
 *   - to_name         : student's full name
 *   - student_id      : student ID
 *   - status          : "Queue" or "Waiting List"
 *   - collection_date : human-readable date string (from eventConfig)
 *   - collection_time : human-readable timeslot string (from eventConfig)
 *   - venue           : venue for that specific collection day (TGH or LT1)
 *   - event_date      : event date label from eventConfig
 *   - contact_email   : committee contact email from eventConfig
 */
export const sendConfirmationEmail = async (data: QueueData): Promise<void> => {
  const isWaiting = data.queuingStatus === "waiting";

  const collectionDate = DATE_LABELS[data.collectDetails.date]     ?? data.collectDetails.date;
  const collectionTime = TIME_LABELS[data.collectDetails.timeslot] ?? data.collectDetails.timeslot;
  const venue          = VENUE_BY_DATE[data.collectDetails.date]   ?? EVENT.venue;

  const templateParams = {
    to_email:        data.personalEmail,
    to_name:         data.fullName,
    student_id:      data.studentId,
    status:          isWaiting ? "Waiting List" : "Queue",
    collection_date: collectionDate,
    collection_time: collectionTime,
    venue,
    event_date:      EVENT.dateLabel,
    contact_email:   EVENT.contactEmail,
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
    // Non-fatal: log but don't block the student flow
    console.error("Failed to send confirmation email:", error);
  }
};
