/**
 * RegistrationForm.tsx
 *
 * Single parameterised form used for both queue and waitlist registration.
 * Replaces queueForm.tsx and waitForm.tsx.
 *
 * Usage:
 *   <RegistrationForm type="queue" />   — shown when queue is open
 *   <RegistrationForm type="wait"  />   — shown when queue is full
 */

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useState } from "react";
import { Loader2, Ticket } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useRegistration } from "@/contexts/RegistrationContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { sendConfirmationEmail } from "@/lib/emailService";
import {
  QUEUE_COLLECTION,
  WAITLIST_COLLECTION,
  CollectionDate,
  TimeslotKey,
  EVENT,
} from "@/lib/eventConfig";
import { joinList, ListType } from "@/lib/listFirestore";

// ---------------------------------------------------------------------------
// Validation regexes
// ---------------------------------------------------------------------------
const englishNameRegex  = /^[A-Za-z\s,\\/]+$/;
const studentIdRegex    = /^\d{7}$/;
const studentEmailRegex = /^[A-Za-z0-9._%+-]+@sd\.taylors\.edu\.my$/;
const phoneNumberRegex  =
  /^\+?(\d{1,3})?[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface Props {
  type: ListType;
}

// ---------------------------------------------------------------------------
// Build Zod schema from the correct collection config
// ---------------------------------------------------------------------------
function buildSchema(cfg: typeof QUEUE_COLLECTION | typeof WAITLIST_COLLECTION) {
  const slotKeys = cfg.timeslots.map((t) => t.key) as
    [TimeslotKey, ...TimeslotKey[]];
  return z.object({
    fullName: z.string().min(3).max(50).regex(englishNameRegex, {
      message: "Full name must contain English letters only",
    }),
    studentId: z.string().regex(studentIdRegex, {
      message: "Student ID must be 7 digits",
    }),
    studentEmail: z.string().regex(studentEmailRegex, {
      message: "Please enter a valid student email (@sd.taylors.edu.my)",
    }),
    personalEmail: z.string().email({ message: "Please enter a valid email" }),
    phoneNumber: z.string().regex(phoneNumberRegex, {
      message: "Please enter a valid phone number",
    }),
    collectDetails: z.object({
      date:     z.enum([cfg.dateKey] as [CollectionDate]),
      timeslot: z.enum(slotKeys),
    }),
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const RegistrationForm = ({ type }: Props) => {
  const cfg = type === "queue" ? QUEUE_COLLECTION : WAITLIST_COLLECTION;
  const schema = buildSchema(cfg);
  type FormValues = z.infer<typeof schema>;

  const [loading, setLoading] = useState(false);
  const { timeslotData, refreshCounterData } = useRegistration();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName:      "",
      studentId:     "",
      studentEmail:  "",
      personalEmail: "",
      phoneNumber:   "",
      collectDetails: {
        date:     cfg.dateKey,
        timeslot: cfg.timeslots[0].key,
      },
    },
  });

  const getSlotsLeft = (timeslot: string): number => {
    const slotData = timeslotData?.[cfg.dateKey]?.[timeslot] as
      | { count?: number }
      | undefined;
    return Math.max(0, cfg.slotCap - (slotData?.count ?? 0));
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await joinList(type, {
        fullName:      values.fullName,
        studentId:     values.studentId,
        studentEmail:  values.studentEmail,
        personalEmail: values.personalEmail,
        phoneNumber:   values.phoneNumber,
        collectDetails: {
          date:     values.collectDetails.date as CollectionDate,
          timeslot: values.collectDetails.timeslot as TimeslotKey,
        },
      });

      const successMsg =
        type === "queue"
          ? "Queued for ticket successfully"
          : "Added to waiting list successfully";
      toast.success(successMsg);

      // Non-blocking confirmation email
      sendConfirmationEmail({
        fullName:      values.fullName,
        studentId:     values.studentId,
        studentEmail:  values.studentEmail,
        personalEmail: values.personalEmail,
        phoneNumber:   values.phoneNumber,
        collectDetails: {
          date:     values.collectDetails.date as CollectionDate,
          timeslot: values.collectDetails.timeslot as TimeslotKey,
        },
        queuingStatus:  type === "queue" ? "queuing" : "waiting",
        registeredAt:   null,
        ticketNumber:   null,
      });

      await refreshCounterData();
      form.reset();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Student ID already exist") {
          toast.error("You are already registered.");
        } else if (error.message === "Slot full") {
          toast.error("This timeslot is full — please choose another.");
        } else if (error.message.includes("Missing or insufficient permissions") || error.message.includes("permission-denied")) {
          toast.error(`Not eligible or already registered. Contact ${EVENT.contactEmail} if this is a mistake.`, { duration: 5000 });
        } else {
          toast.error("An error occurred. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const isWait = type === "wait";

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

          {/* Full Name */}
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Smith" {...field} />
                </FormControl>
                <FormDescription>English letters only</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Student ID */}
          <FormField
            control={form.control}
            name="studentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student ID</FormLabel>
                <FormControl>
                  <Input placeholder="0362041" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Student Email */}
          <FormField
            control={form.control}
            name="studentEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student Email</FormLabel>
                <FormControl>
                  <Input placeholder="john@sd.taylors.edu.my" {...field} />
                </FormControl>
                <FormDescription>Taylor's student email only</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Personal Email */}
          <FormField
            control={form.control}
            name="personalEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Personal Email</FormLabel>
                <FormControl>
                  <Input placeholder="john@gmail.com" {...field} />
                </FormControl>
                <FormDescription>
                  Confirmation will be sent here
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone Number */}
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="0123456789" {...field} />
                </FormControl>
                <FormDescription>
                  For contact if email is unreachable
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Collection Date — fixed, displayed as read-only */}
          <FormItem className="space-y-1">
            <FormLabel>Collection Date</FormLabel>
            <div className="rounded-md border px-3 py-2 text-sm bg-muted text-muted-foreground">
              {cfg.dateLabel} — {cfg.venue}
            </div>
            {isWait && (
              <p className="text-xs text-muted-foreground">
                You will be notified by email if a spot becomes available.
              </p>
            )}
          </FormItem>

          {/* Timeslot */}
          <FormField
            control={form.control}
            name="collectDetails.timeslot"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>
                  {isWait ? "Preferred Timeslot" : "Collection Timeslot"}
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a timeslot" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cfg.timeslots.map((opt) => (
                      <SelectItem key={opt.key} value={opt.key}>
                        {opt.label} ({getSlotsLeft(opt.key)} slots left)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {isWait
                    ? "Preferred timeslot — subject to availability"
                    : "Timeslot to collect your physical ticket"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering…
              </>
            ) : (
              <>
                <Ticket className="h-4 w-4 mr-2" />
                {isWait ? "Join Waiting List" : "Register"}
              </>
            )}
          </Button>
        </form>
      </Form>
      <Toaster />
    </>
  );
};

export default RegistrationForm;
