import { useEffect, useState, useCallback, useRef } from "react";
import "./timeslots.css";
import useSignalr from "../../hooks/useSignalR";
import { BASE_URL } from "../../config";

export type Timeslot = {
  timeslotId: number;
  startTime: string; // UTC
  endTime: string;   // UTC
  isBooked: boolean;
  resourceId: number;
};

interface ShowAvailableTimeslotsProps {
  resourceId: number | undefined;
  date: Date;
  selectedTimeslot: Timeslot | null;
  setSelectedTimeslot: (slot: Timeslot) => void;
}

const ShowAvailableTimeslots = ({
  resourceId,
  date,
  selectedTimeslot,
  setSelectedTimeslot,
}: ShowAvailableTimeslotsProps) => {
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch timeslots
  const fetchTimeslots = useCallback(() => {
    if (!resourceId || !date) return;

    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

    fetch(`${BASE_URL}Timeslot/resources/${resourceId}/timeslots?date=${formattedDate}`)
      .then(res => {
        if (!res.ok) throw new Error("Kunde inte hämta lediga tider");
        return res.json();
      })
      .then(data => setTimeslots([...data]))
      .catch(err => setError(err.message));
  }, [resourceId, date]);

  const fetchTimeslotsRef = useRef(fetchTimeslots);
  useEffect(() => {
    fetchTimeslotsRef.current = fetchTimeslots;
  }, [fetchTimeslots]);

  // SignalR – endast fetch om update gäller denna resurs & dag
  useSignalr((update: any) => {
    if (!resourceId || !date) return;
    const updateDate = new Date(update.date + "T00:00:00Z");
    if (update.resourceId === resourceId &&
        updateDate.getUTCFullYear() === date.getFullYear() &&
        updateDate.getUTCMonth() === date.getMonth() &&
        updateDate.getUTCDate() === date.getDate()) {
      fetchTimeslotsRef.current();
    }
  }, `${resourceId}-${date.toDateString()}`);

  useEffect(() => {
    fetchTimeslots();
  }, [fetchTimeslots]);

  // Konvertera UTC → svensk tid
  const formatTime = (utcTime: string) => {
    const date = new Date(utcTime + "Z");
    return date.toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Stockholm",
    });
  };

  return (
    <div>
      <h2>Tillgängliga tider</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul className="timeslotHolder">
        {timeslots.map(slot => {
          const isSelected = selectedTimeslot?.timeslotId === slot.timeslotId;
          const isDisabled = slot.isBooked;

          return (
            <li
              key={slot.timeslotId}
              className={`timeslotItem ${isSelected ? "selected" : ""} ${isDisabled ? "booked" : ""}`}
              onClick={() => { if (!isDisabled) setSelectedTimeslot(slot); }}
            >
              {formatTime(slot.startTime)} - {formatTime(slot.endTime)} {isDisabled && "(Bokad)"}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ShowAvailableTimeslots;
