import { useRegistration } from "@/contexts/RegistrationContext";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { MoreHorizontal, Ticket } from "lucide-react";
import { QueueTable } from "../dashboard/queueTable";
import { registerColumns } from "../dashboard/registerColumns";
import { Skeleton } from "../ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import toast from "react-hot-toast";
import { updateRegistered } from "@/lib/registerFirestore";

const RegisterDataTable = () => {
  const { registrationData, refreshRegistrationData } = useRegistration();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!registrationData) {
      refreshRegistrationData().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [registrationData, refreshRegistrationData]);

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
        {registrationData && registrationData.length > 0 ? (
          <QueueTable
            columns={[
              ...registerColumns,

              {
                id: "actions",
                cell: ({ row }) => {
                  const registration = row.original;
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
                        <DropdownMenuItem
                          disabled={registration.registered}
                          className="text-green-500 font-semibold"
                          onClick={() => {
                            updateRegistered(registration.ticketNumber);
                            toast.success(
                              `Registered ${registration.ticketNumber}`,
                            );
                            refreshRegistrationData();
                          }}
                        >
                          <Ticket className="h-4 w-4 mr-2" />
                          Register
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                },
              },
            ]}
            data={registrationData}
          />
        ) : (
          <p>No data available</p>
        )}
      </div>
    </>
  );
};

export default RegisterDataTable;
