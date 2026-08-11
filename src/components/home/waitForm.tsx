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
import { getCurrentDateTime } from "@/lib/utils";
import { useRegistration } from "@/contexts/RegistrationContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { timeslotLimit } from "@/lib/counterFirestore";
import { storeWaitData } from "@/lib/waitFirestore";
import { sendConfirmationEmail } from "@/lib/emailService";
import { WAITLIST_COLLECTION, CollectionDate } from "@/lib/eventConfig";

const englishNameRegex = /^[A-Za-z\s,\\/]+$/;
const studentIdRegex = /^\d{7}$/;
const studentEmailRegex = /^[A-Za-z0-9._%+-]+@sd\.taylors\.edu\.my$/;
const phoneNumberRegex =
  /^\+?(\d{1,3})?[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;

// All date/venue/cap/timeslot values derived from eventConfig — edit there only.
const SLOT_KEYS = WAITLIST_COLLECTION.timeslots.map((t) => t.key) as
  [typeof WAITLIST_COLLECTION.timeslots[0]["key"], ...typeof WAITLIST_COLLECTION.timeslots[number]["key"][]];

const formSchema = z.object({
  fullName: z.string().min(3).max(50).regex(englishNameRegex, {
    message: "Full name must contain English letters only",
  }),
  studentId: z.string().regex(studentIdRegex, {
    message: "Student ID must be 7 characters",
  }),
  studentEmail: z.string().regex(studentEmailRegex, {
    message: "Please enter a valid student email",
  }),
  personalEmail: z.string().email({
    message: "Please enter a valid email",
  }),
  phoneNumber: z.string().regex(phoneNumberRegex, {
    message: "Please enter a valid phone number",
  }),
  dateTime: z.string(),
  rank: z.number(),
  collectDetails: z.object({
    date: z.enum([WAITLIST_COLLECTION.dateKey], {
      message: "Collection date is required",
    }),
    timeslot: z.enum(SLOT_KEYS, { message: "Timeslot is required" }),
  }),
  queuingStatus: z.enum(["queuing", "waiting", "cancelled", "collected"]),
  ticketNumber: z.string().nullable(),
});

export const WaitForm = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const { counterData, refreshCounterData, timeslotData } = useRegistration();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      studentId: "",
      studentEmail: "",
      personalEmail: "",
      phoneNumber: "",
      dateTime: getCurrentDateTime(),
      rank: counterData?.waitingCount || 0,
      collectDetails: {
        date: WAITLIST_COLLECTION.dateKey,
        timeslot: WAITLIST_COLLECTION.timeslots[0].key,
      },
      queuingStatus: "waiting",
      ticketNumber: null,
    },
  });

  const selectedDate = form.watch("collectDetails.date") as CollectionDate | undefined;

  const getSlotsLeft = (date: CollectionDate | undefined, timeslot: string): number => {
    if (!date || !timeslotData) return WAITLIST_COLLECTION.slotCap;
    const slotCount = (timeslotData[date]?.[timeslot] as { count?: number } | undefined)?.count || 0;
    return Math.max(0, WAITLIST_COLLECTION.slotCap - slotCount);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const hasCapacity = await timeslotLimit(
        values.collectDetails.date as CollectionDate,
        values.collectDetails.timeslot,
      );
      if (!hasCapacity) {
        throw new Error("Reached limit");
      }

      values.rank += 1;

      await storeWaitData(values);
      toast.success("Joined waiting list successfully");

      // Send confirmation email (non-blocking)
      sendConfirmationEmail({ ...values, queuingStatus: "waiting" });

      await refreshCounterData();
      form.reset();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Student ID already exist") {
          toast.error("Student ID already exists. Please use a different ID.");
        } else if (error.message === "Reached limit") {
          toast.error("Timeslot limit has been reached, try another timeslot or date");
        } else {
          toast.error("An error occurred. Please try again.");
        }
      }
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormDescription>English only</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
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
          <FormField
            control={form.control}
            name="studentEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student Email</FormLabel>
                <FormControl>
                  <Input placeholder="john@sd.taylors.edu.my" {...field} />
                </FormControl>
                <FormDescription>
                  Please do not use personal email
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
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
                  Use your personal email — confirmation will be sent here
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
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
                  For contact purpose if email is unreachable
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Collection Date — derived from WAITLIST_COLLECTION in eventConfig */}
          <FormItem className="space-y-1">
            <FormLabel>Collection Date</FormLabel>
            <div className="rounded-md border px-3 py-2 text-sm bg-muted text-muted-foreground">
              {WAITLIST_COLLECTION.dateLabel} — {WAITLIST_COLLECTION.venue}
            </div>
            <p className="text-xs text-muted-foreground">
              You will be notified via email if a spot becomes available.
            </p>
          </FormItem>

          {/* Step 2: Timeslot */}
          <FormField
            control={form.control}
            name="collectDetails.timeslot"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Preferred Timeslot</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a timeslot" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {WAITLIST_COLLECTION.timeslots.map((opt) => (
                      <SelectItem key={opt.key} value={opt.key}>
                        {opt.label} ({getSlotsLeft(selectedDate, opt.key)} slots left)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Preferred timeslot — first come first serve basis
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Vegetarian option removed — no food provided */}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Ticket className="h-4 w-4 mr-2" />
                Join Waiting List
              </>
            )}
          </Button>
        </form>
      </Form>
      <Toaster />
    </>
  );
};

export default WaitForm;
