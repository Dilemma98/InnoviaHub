import "./bookingFlow.css";
import "./calendar.css";
import StepBar from "./stepBar";
import ShowAvailableTimeslots from "./showTimeslots";
import Calendar from "react-calendar";
import { useEffect, useState } from "react";
import { BASE_URL } from "../../../src/config";
import VirtualAssistant from "../virtualAssistant/virtualAssistant";

// Props interface for ChoseDateTime
interface ChooseDateTimeProps {
  selectedResourceName: string;
  selectedResourceId: number | null;
  selectedTimeslot: Timeslot | null;
  setSelectedTimeslot: (slot: Timeslot) => void;
  setSelectedDate: (date: Date | null) => void;
  onContinue: () => void;
  onReturn: () => void;
  timeslots: Timeslot[];
  fetchTimeslots: () => void;
}

// Timeslot type definition
type Timeslot = {
  timeslotId: number;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  resourceId: number;
};

const ChooseDateTime = ({
  selectedResourceName,
  selectedResourceId,
  selectedTimeslot,
  setSelectedTimeslot,
  setSelectedDate,
  onContinue,
  onReturn,
}: ChooseDateTimeProps) => {

  // State for currently selected date
  const [selectedLocalDate, setSelectedLocalDate] = useState<Date | null>(null);
  // State for virtualAssistant message
  const [assistantMessage, setAssistantMessage] = useState<string | null>(null);
  // State to show assistant is thinking
  const [assistantLoading, setAssistantLoading] = useState(false);

  // Fetch timeslots whenever selected date or resource changes
  useEffect(() => {
    if (selectedLocalDate) {
      fetchTimeslots();
    }
  }, [selectedLocalDate, selectedResourceId]);

  // Fetch userdata from localstorage
  // localStorage.getItem("") ?? "{}"
  // If no data saved, use empty array to avoid error
  // ?.userId
  // If object exists, get userId
  // ?? null
  // If userId doesn´t exists, set userId to null
  const currentUserId = JSON.parse(localStorage.getItem("user") ?? "{}")?.id ?? null;

  // Handler for when a user selects a timeslot
  // sends request to backend to check for double bookings
  const handleTimeslotSelect = async (slot: Timeslot) => {
    
    // Update parent state with selected timeslot
    setSelectedTimeslot(slot);

    if(!currentUserId) return;

    setAssistantLoading(true);
    console.log(assistantLoading);
    setAssistantMessage("Vänta! Ska bara dubbelkolla dina bokningar... 🤔")

    // Convert backend timezone
    const startUTC = new Date(slot.startTime).toISOString();
    const endUTC = new Date(slot.endTime).toISOString();

    try{
      // Post request to backend
      const res = await fetch (`${BASE_URL}VirtualAssistant`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          userId: currentUserId,
          startTime: startUTC,
          endTime: endUTC
        })
      });

      const data = await res.json();
      setAssistantMessage(data.message);
    } catch (err) {
      console.error(err);
      setAssistantMessage("Ojdå! Just nu är inte assistenten hemma tyvärr..");
    }
  };

  // Continue button handler
  const continueBookingBtn = () => {
    if (!selectedResourceId || !selectedLocalDate || !selectedTimeslot) {
      return;
    }
    setSelectedDate(selectedLocalDate);
    onContinue();
  };

  // Local state for timeslots fetched from backend
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  console.log(timeslots);

  const fetchTimeslots = () => {
    if (!selectedResourceId || !selectedLocalDate) return;

    const formattedDate = `${selectedLocalDate.getFullYear()}-${(selectedLocalDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${selectedLocalDate.getDate().toString().padStart(2, "0")}`;

    fetch(`${BASE_URL}Timeslot/resources/${selectedResourceId}/timeslots?date=${formattedDate}`)
      .then((res) => {
        if (!res.ok) throw new Error("Kunde inte hämta lediga tider");
        return res.json();
      })
      .then((data) => setTimeslots(data))
      .catch((err) => console.error(err))
  };

  return (
    <div className="mainContentChooseDateTime">
      <StepBar currentStep={2} />
      <div className="chooseDateTime">
        <h1 className="componentHeader">Välj dag för bokning:</h1>
        <Calendar
          className="calendar"
          onChange={(date) => setSelectedLocalDate(date as Date)}
          value={selectedLocalDate}
        />
        {selectedLocalDate && (
          <div className="infoText">
            <p>
              <b>{selectedResourceName}</b>
              <br />
              <b>{selectedLocalDate.toLocaleDateString()} </b>
            </p>
            <hr />

            <ShowAvailableTimeslots
              resourceId={selectedResourceId ?? undefined}
              date={selectedLocalDate}
              selectedTimeslot={selectedTimeslot}
              setSelectedTimeslot={setSelectedTimeslot}
              handleTimeslotSelect={handleTimeslotSelect}
            />
          </div>
        )}

        <button className="continueBtn" onClick={continueBookingBtn}>
          Fortsätt
        </button>
        <button className="goBackBtn" onClick={onReturn}>
          Tillbaka
        </button>
      </div>
      {/* Send assistantMessage as prop down to VirtualAssistant */}
      <VirtualAssistant message={assistantMessage}/>
    </div>
  );
};

export default ChooseDateTime;
