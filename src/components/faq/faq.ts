import {
  EVENT,
  QUEUE_COLLECTION,
  WAITLIST_COLLECTION,
  MAX_QUEUE,
  MAX_WAIT,
} from "@/lib/eventConfig";

export interface FaqProp {
  title: string;
  desc: Array<string>;
}

// Derived shorthand strings — change eventConfig, FAQ updates automatically
const Q_DATE  = QUEUE_COLLECTION.dateLabel;     // "Tuesday, 15th September 2026"
const W_DATE  = WAITLIST_COLLECTION.dateLabel;  // "Thursday, 17th September 2026"
const Q_VENUE = QUEUE_COLLECTION.venue;         // "Taylor's Grand Hall (TGH)"
const W_VENUE = WAITLIST_COLLECTION.venue;      // "Lecture Theatre 1 (LT1)"
const EV_DATE = EVENT.dateLabel;                // "Friday, 18th September 2026"

export const faqList: FaqProp[] = [
  {
    title: "What is Orientation Party (OP)?",
    desc: [
      "The Orientation Party is a once-in-a-year event filled with exciting games, performances, music, and food for freshmen before they begin their university life.",
    ],
  },
  {
    title: "What is the date, time, and venue of Orientation Party?",
    desc: [
      `Date: ${EV_DATE}`,
      `Time: ${EVENT.startTime} onwards`,
      `Venue: ${EVENT.venue}`,
    ],
  },
  {
    title: "What is the eligibility to join Orientation Party?",
    desc: [
      "You must be a freshman starting your course in September 2026 to be eligible to join OP.",
    ],
  },
  {
    title: "How do I register for OP?",
    desc: [
      "You would need to follow two simple steps.",
      "Firstly, you would have to register through the queuing system shared via email.",
      `Then, you would need to physically collect your ticket on your chosen collection date at the venue shown in your confirmation email.`,
    ],
  },
  {
    title: "What document or proof do I need to join OP?",
    desc: [
      "All you need to do is sign up through the queuing system and we will cross-check your freshmen status.",
    ],
  },
  {
    title: "Can I bring a guest/friend with me?",
    desc: [
      "You are strictly not allowed to bring anyone else to the event other than yourself due to venue limitations as we cannot accommodate too many attendees.",
    ],
  },
  {
    title: "Is there any entrance fee to pay?",
    desc: [
      "This event is completely free, just bring yourself and a fun attitude!",
    ],
  },
  {
    title: "What is the dress code for this event?",
    desc: [
      "You are encouraged to wear clothing that fits the 2026 OP theme but remember to dress appropriately for a university programme.",
    ],
  },
  {
    title: "What is the process of registering for a ticket?",
    desc: [
      "Stage 1: Join the queuing system and register online.",
      `Stage 2: Ticket Collection — collect your physical ticket at your designated venue on your chosen date.`,
      `Queue: ${Q_DATE} at ${Q_VENUE}.`,
      `Waitlist (if promoted): ${W_DATE} at ${W_VENUE}.`,
    ],
  },
  {
    title: "What is the queue for?",
    desc: [
      "The queue is to ensure every freshman has an equal chance of getting a ticket to the Orientation Party.",
    ],
  },
  {
    title: "What happens if the queue is full?",
    desc: [
      `When the queue is full (${MAX_QUEUE.toLocaleString()} spots), all freshmen who sign up after will be put on a waiting list (up to ${MAX_WAIT} spots). If a queued student does not collect their ticket on their collection day, the slot will open up for waitlisted students. This will be communicated via email.`,
    ],
  },
  {
    title: "What if I queue but never show up on Ticket Collection Day?",
    desc: [
      "Unfortunately, if you do not show up on your Ticket Collection Day, your name will be removed from the system and your ticket will be passed to freshmen on the waiting list.",
    ],
  },
  {
    title: "What if I can't make it on my chosen Ticket Collection Day?",
    desc: [
      `You will need to send an email to ${EVENT.contactEmail} at least 24 hours before your scheduled Ticket Collection Day.`,
    ],
  },
  {
    title: "When and where is Ticket Collection?",
    desc: [
      `Queue collection: ${Q_DATE} at ${Q_VENUE}, Taylor's University.`,
      `Waitlist collection (if promoted): ${W_DATE} at ${W_VENUE}, Taylor's University.`,
      "You will collect your ticket at the timeslot you selected when registering.",
    ],
  },
  {
    title: "What is the waiting list?",
    desc: [
      `The waiting list is for freshmen who missed the first ${MAX_QUEUE.toLocaleString()} spots in the queue. You will be contacted via email if a spot opens up for you.`,
    ],
  },
  {
    title: "Can I collect my ticket earlier than the time I chose?",
    desc: [
      "You are strongly advised to queue according to the timeslot you have chosen in the queuing system.",
    ],
  },
  {
    title: "Am I allowed to bring food and beverages to the event?",
    desc: [
      "You are strictly not allowed to bring any outside food & beverage to avoid spillages and missing items throughout the event.",
    ],
  },
  {
    title: "Can we join the event if we are late?",
    desc: [
      "Once we close the doors — signifying that registration has closed — you will not be allowed to enter the Grand Hall.",
    ],
  },
  {
    title: "Can I leave the event earlier?",
    desc: [
      "You are strongly encouraged to stay throughout the event as there are exciting programmes planned for you!",
    ],
  },
  {
    title: "What should I bring to the event?",
    desc: ["Yourself, your own ticket, and a fun attitude!"],
  },
  {
    title: "What does it mean if my queuing status is cancelled?",
    desc: [
      "Ticket queuing will be cancelled if the following happens:",
      "- You are not a freshman according to our database.",
      "- Absent during ticket collection.",
      `Please send us an email at ${EVENT.contactEmail} if there is any discrepancy.`,
    ],
  },
  {
    title: "Can I come if I am on the waiting list?",
    desc: [
      "If there are any remaining tickets due to absences or cancellations among registered students, those on the waiting list will be contacted via email to collect their ticket.",
    ],
  },
  {
    title: "Will I receive a confirmation after registering?",
    desc: [
      "Yes! A confirmation email will be sent to your personal email address after you successfully register in the queuing system. Please check your inbox (and spam folder) after submitting.",
    ],
  },
];
