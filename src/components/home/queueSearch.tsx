import React, { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { getStudentId, QueueData } from "@/lib/queueFirestore";
import toast, { Toaster } from "react-hot-toast";
import { Check, Search, X } from "lucide-react";

const studentIdRegex = /^\d{7}$/;

import { DATE_LABELS, TIME_LABELS, VENUE_BY_DATE } from "@/lib/eventConfig";

const QueueSearch = () => {
  const [studentId, setStudentId] = useState<string>("");
  const [result, setResult] = useState<QueueData | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    setResult(null);
    e.preventDefault();

    if (!studentIdRegex.test(studentId)) {
      toast.error("Invalid student ID");
      return;
    }

    try {
      const data = await getStudentId(studentId);
      setResult(data);
      if (!data) toast.error("No student ID found");
    } catch (error) {
      console.error(error);
      toast.error("Please try again");
    } finally {
      setStudentId("");
    }
  };

  const statusCheck = (status: string): React.ReactNode => {
    if (status === "queuing" || status === "waiting") {
      return (
        <div className="flex items-center">
          <Check className="bg-yellow-500 w-4 h-4 mr-1" />
          {status === "waiting" ? "Waiting List" : "Queuing"}
        </div>
      );
    } else if (status === "collected") {
      return (
        <div className="flex items-center">
          <Check className="bg-green-500 h-4 w-4 mr-1" />
          Collected
        </div>
      );
    } else {
      return (
        <div className="flex items-center">
          <X className="bg-red-500 h-4 w-4 mr-1" />
          Cancelled
        </div>
      );
    }
  };

  const collectionDetails = (data: QueueData) => {
    const dateLabel  = DATE_LABELS[data.collectDetails.date]     ?? data.collectDetails.date;
    const timeLabel  = TIME_LABELS[data.collectDetails.timeslot] ?? data.collectDetails.timeslot;
    const venueLabel = VENUE_BY_DATE[data.collectDetails.date]   ?? "Taylor's Grand Hall (TGH)";
    return (
      <>
        <p>Collection date: {dateLabel}</p>
        <p>Collection time: {timeLabel}</p>
        <p>Collection venue: {venueLabel}</p>
      </>
    );
  };

  return (
    <>
      <div className="text-black flex flex-col gap-4 justify-center font-alata">
        <form
          onSubmit={onSubmit}
          className="flex flex-col items-center justify-center border rounded sm:mx-auto p-6 bg-celestialLightGray space-y-6"
        >
          <div className="flex space-x-4 font-alata">
            <Input
              type="text"
              placeholder="Type your student ID here..."
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-52 bg-celestialDarkGray !placeholder-celestialLightGray text-white"
            />
            <Button
              type="submit"
              variant="default"
              className="flex items-center gap-2 bg-celestialDarkGray text-white"
            >
              Search
              <Search className="w-4" />
            </Button>
          </div>
          <div className="border p-4 rounded-lg text-white w-full h-full bg-celestialDarkGray">
            {result ? (
              <div className="space-y-2">
                <h3 className="font-semibold underline underline-offset-2 text-center">
                  Queue Search Result
                </h3>
                <div className="text-left text-white">
                  <div>ID: {result.studentId}</div>
                  <div>Name: {result.fullName}</div>
                  <div>Email: {result.studentEmail}</div>
                  <div className="flex items-center gap-2">
                    Status: {statusCheck(result.queuingStatus)}
                  </div>
                  {result.queuingStatus !== "cancelled"
                    ? collectionDetails(result)
                    : null}
                </div>
              </div>
            ) : (
              <span className="text-sm font-light">Search with Student ID</span>
            )}
          </div>
        </form>
      </div>
      <Toaster />
    </>
  );
};

export default QueueSearch;
