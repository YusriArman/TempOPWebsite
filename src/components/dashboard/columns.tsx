import { ColumnDef } from "@tanstack/react-table";
import { RegistrationData } from "@/lib/listFirestore";
import { Check, X, ArrowUpDown, Users, Loader } from "lucide-react";
import { Button } from "../ui/button";

export const columns: ColumnDef<RegistrationData>[] = [
  {
    accessorKey: "registeredAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Registered
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const ts = row.original.registeredAt as { seconds?: number } | null;
      if (!ts?.seconds) return <span className="text-muted-foreground">—</span>;
      return (
        <span>
          {new Date(ts.seconds * 1000).toLocaleString("en-MY", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </span>
      );
    },
  },
  {
    accessorKey: "studentId",
    header: "ID",
  },
  {
    accessorKey: "fullName",
    header: "Name",
  },
  {
    accessorKey: "queuingStatus",
    header: "Status",
    cell: ({ row }) =>
      row.original.queuingStatus === "collected" ? (
        <Check className="text-green-500" />
      ) : row.original.queuingStatus === "cancelled" ? (
        <X className="text-red-500" />
      ) : row.original.queuingStatus === "queuing" ? (
        <Users className="text-yellow-500" />
      ) : (
        <Loader className="text-yellow-500" />
      ),
  },
  {
    accessorKey: "ticketNumber",
    header: "Ticket",
    cell: ({ row }) =>
      row.original.ticketNumber ? (
        <span>{row.original.ticketNumber}</span>
      ) : (
        <X className="text-red-500" />
      ),
  },
];
