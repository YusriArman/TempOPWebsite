import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { UsersRound } from "lucide-react";
import RegistrationForm from "./RegistrationForm";
import { useRegistration } from "@/contexts/RegistrationContext";

const QueueModal = () => {
  const { queueLimit, waitLimit } = useRegistration();

  const buttonText = waitLimit
    ? "Event limit has been reached"
    : queueLimit
      ? "Click here to join Waiting List"
      : "Click here to Queue";

  return (
    <Dialog>
      <DialogTrigger
        className={`bg-slate-100 text-slate-700 rounded px-3 py-2 font-zendots text-lg font-medium
        ${waitLimit ? "cursor-not-allowed opacity-50" : "hover:bg-slate-300"}`}
        disabled={waitLimit}
      >
        <div className="flex items-center gap-2 font-zendots text-lg font-medium">
          {buttonText} <UsersRound fill="" />
        </div>
      </DialogTrigger>

      {!waitLimit && (
        <DialogContent className="max-h-[90vh] overflow-y-auto p-6 sm:w-full">
          <DialogHeader>
            <DialogTitle>
              Ticket {queueLimit ? "Waiting List" : "Queue"}
            </DialogTitle>
            <DialogDescription>
              Please use your full name (English), student ID, and student email
            </DialogDescription>
          </DialogHeader>
          {/* Single form component — type prop switches queue ↔ wait */}
          <RegistrationForm type={queueLimit ? "wait" : "queue"} />
        </DialogContent>
      )}
    </Dialog>
  );
};

export default QueueModal;
