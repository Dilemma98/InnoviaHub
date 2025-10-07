import { useEffect, useState, useCallback, useRef } from "react";
import "./timeslots.css";
import useSignalr from "../../hooks/useSignalR";
import { BASE_URL } from "../../config";
import VirtualAssistant from "../virtualAssistant/virtualAssistant";

// Define the shape of a Timeslot-object returned from backend
export type Timeslot = {
  timeslotId: number;
  startTime: string; // UTC
  endTime: string;   // UTC
  isBooked: boolean;
  resourceId: number;
};

// Define the interface props that this component expects
interface ShowAvailableTimeslotsProps {
  resourceId: number | undefined;
  date: Date;
  selectedTimeslot: Timeslot | null;
  setSelectedTimeslot: (slot: Timeslot) => void;
  handleTimeslotSelect: (slot: Timeslot) => void;
}

// Main component function
const ShowAvailableTimeslots = ({
  resourceId,
  date,
  selectedTimeslot,
  handleTimeslotSelect
  // setSelectedTimeslot,
}: ShowAvailableTimeslotsProps) => {

  //Local state for storing fetched timeslots
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  // Local state for error handling
  const [error, setError] = useState<string | null>(null);
  // State for assistantMessage to send as prop to VirtualAssistant-component
  const [assistantMessage] = useState<string | null>(null);
  

  // Fetch timeslots from API for a given resource and date
  const fetchTimeslots = useCallback(() => {
    // If no resourceId or date is provided, exit early
    if (!resourceId || !date) return;

    // Format date as YYYY-MM-DD string
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

    // Fetch timeslots from backend depending on resourceId and chosen date
    fetch(`${BASE_URL}Timeslot/resources/${resourceId}/timeslots?date=${formattedDate}`)
      .then(res => {
        if (!res.ok) throw new Error("Kunde inte hämta lediga tider");
        return res.json();
      })
      // Save data to state 
      .then(data => setTimeslots([...data]))
      // Handle errors
      .catch(err => setError(err.message));
  }, [resourceId, date]);

  // Use ref to always keep the latest version of fetched Timeslots
  const fetchTimeslotsRef = useRef(fetchTimeslots);
  useEffect(() => {
    fetchTimeslotsRef.current = fetchTimeslots;
  }, [fetchTimeslots]);

  // Subscripe to SignalR updates for real-time updates
  useSignalr((update: any) => {
    if (!resourceId || !date) return;

    // Create a date object for the update (UTC midnight of that date)
    const updateDate = new Date(update.date + "T00:00:00Z");

    // Only fetch new timeslots if the update is for the same resource & date
    if (update.resourceId === resourceId &&
      updateDate.getUTCFullYear() === date.getFullYear() &&
      updateDate.getUTCMonth() === date.getMonth() &&
      updateDate.getUTCDate() === date.getDate()) {
      // Refresh timeslots
      fetchTimeslotsRef.current();
    }
    // Unique sibscription key to avoid multiple subscriptions
  }, `${resourceId}-${date.toDateString()}`);

  // Fetch timeslots when component mounts or dependencies change
  useEffect(() => {
    // Clear previous timeslots
    setTimeslots([]); 
    fetchTimeslots();
  }, [fetchTimeslots]);

  // Convert UTC time to local time (Stockholm) and format as HH:mm
  const formatTime = (utcTime: string) => {
    const date = new Date(utcTime);
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
          // Check if this slot is the one currently selected
          const isSelected = selectedTimeslot?.timeslotId === slot.timeslotId;
          // Check if the slot is already booked, set to false if backend doesnt say otherwise
          const isBooked = slot.isBooked ?? false;
          // Current time so we have something to compare with
          const now = new Date();
          // ------------Only for development------------
          // Faking the time is 13
          now.setHours(11, 0, 0, 0)
          //---------------------------------------------
          const slotStart = new Date(slot.startTime);
          // Check if slotStart is in the past, by comparing with now
          const isPast = slotStart < now;

          let itemClass = "timeslotItem";
          // Highlight the selected slot
          if (isSelected) itemClass += " selected";
          // Mark booked
          if (isBooked) itemClass += " booked";
          // Mark if in the past
          else if (isPast) itemClass += " past";

          return (
            <li
              key={slot.timeslotId}
              className={itemClass}
              // Only allow click if slot is not booked or not in the past
              onClick={() => { if (!isBooked && !isPast) handleTimeslotSelect(slot);
              }}
              style={(isBooked || isPast) ? { pointerEvents: "none" } : {}}
            >
              {formatTime(slot.startTime)} - {formatTime(slot.endTime)} {isBooked && "(Bokad)"} {isPast && ""}
            </li>
          );
        })}
      </ul>
      <VirtualAssistant message={assistantMessage} />
    </div>
  );
};

export default ShowAvailableTimeslots;
