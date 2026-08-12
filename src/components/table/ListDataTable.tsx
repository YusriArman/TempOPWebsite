/**
 * ListDataTable.tsx
 *
 * Single parameterised admin table component for queue and waitlist.
 * Replaces queueDataTable.tsx and waitDataTable.tsx.
 *
 * Usage:
 *   <ListDataTable type="queue" />
 *   <ListDataTable type="wait"  />
 */

import { useRegistration } from "@/contexts/RegistrationContext";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Ban, CircleArrowUp, Copy, MoreHorizontal, Ticket } from "lucide-react";
import { QueueTable } from "../dashboard/queueTable";
import { columns } from "../dashboard/columns";
import { Skeleton } from "../ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import RegisterModal from "../dashboard/registerModal";
import toast from "react-hot-toast";
import { cancelTicket, promoteToQueue, ListType } from "@/lib/listFirestore";

interface Props {
  type: ListType;
}

const ListDataTable = ({ type }: Props) => {
  const {
    queueData,
    waitingData,
    refreshQueueData,
    refreshWaitData,
  } = useRegistration();

  const isWait  = type === "wait";
  const data    = isWait ? waitingData : queueData;
  const refresh = isWait ? refreshWaitData : refreshQueueData;

  const [loading, setLoading]                     = useState(true);
  const [studentId, setStudentId]                 = useState("");
  const [isRegisterModalOpen, setRegisterModal]   = useState(false);

  useEffect(() => {
    if (!data) {
      refresh().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [data, refresh]);

  if (loading) {
    return (
      <div className="flex flex-col items-center space-y-3 p-32">
        <Skeleton className="h-96 w-96 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        {data && data.length > 0 ? (
          <QueueTable
            columns={[
              ...columns,
              {
                id: "actions",
                cell: ({ row }) => {
                  const entry = row.original;
                  const isActive =
                    entry.queuingStatus !== "collected" &&
                    entry.queuingStatus !== "cancelled";

                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>

                        {/* Promote to Queue — waitlist only, when still waiting */}
                        {isWait && entry.queuingStatus === "waiting" && (
                          <DropdownMenuItem
                            className="text-orange-500 font-semibold"
                            onClick={async () => {
                              await promoteToQueue(entry.studentId);
                              toast.success("Promoted to queue");
                              refresh();
                            }}
                          >
                            <CircleArrowUp className="w-4 h-4 mr-2" />
                            Promote to Queue
                          </DropdownMenuItem>
                        )}

                        {/* Register ticket — when already queuing (promoted or queue) */}
                        {isActive && entry.queuingStatus !== "waiting" && (
                          <DropdownMenuItem
                            className="text-green-500 font-semibold"
                            onClick={() => {
                              setStudentId(entry.studentId);
                              setRegisterModal(true);
                            }}
                          >
                            <Ticket className="w-4 h-4 mr-2" />
                            Register Ticket
                          </DropdownMenuItem>
                        )}

                        {/* Copy contact info */}
                        <DropdownMenuItem
                          onClick={() => {
                            navigator.clipboard.writeText(entry.studentEmail);
                            toast.success("Copied student email");
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" /> Student Email
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            navigator.clipboard.writeText(entry.personalEmail);
                            toast.success("Copied personal email");
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" /> Personal Email
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            navigator.clipboard.writeText(entry.phoneNumber);
                            toast.success("Copied phone number");
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" /> Phone Number
                        </DropdownMenuItem>

                        {/* Cancel — only when not already cancelled/collected */}
                        {isActive && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="font-semibold text-red-500"
                              onClick={async () => {
                                await cancelTicket(type, entry.studentId);
                                toast.success("Ticket cancelled — slot released");
                                refresh();
                              }}
                            >
                              <Ban className="h-4 w-4 mr-2" /> Cancel Ticket
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                },
              },
            ]}
            data={data}
          />
        ) : (
          <p className="text-center text-muted-foreground py-8">No data available</p>
        )}

        <RegisterModal
          isOpen={isRegisterModalOpen}
          onClose={() => setRegisterModal(false)}
          studentId={studentId}
          source={isWait ? "wait" : "queue"}
        />
      </div>
    </>
  );
};

export default ListDataTable;
