import "./bookingFlow.css";
import StepBar from "./stepBar";
import { useState } from "react";
import { BASE_URL } from "../../config";
import LoadingSpinner from "../loading/loadingComponent";
import useSignalr from "../../hooks/useSignalR";

// Interface för user
interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  firstName: string;
  lastName: string;
}

export type Timeslot = {
  timeslotId: number;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  resourceId: number;
};

interface ConfirmBookingProps {
  selectedResourceName: string;
  selectedResourceId: number;
  selectedDate: Date;
  selectedTimeslot: Timeslot;
  onReturn: () => void;
  user: User;
  refreshTimeslots: () => void;
}

const ConfirmBooking = ({
  onReturn,
  selectedResourceName,
  selectedResourceId,
  selectedDate,
  selectedTimeslot,
  user,
  refreshTimeslots
}: ConfirmBookingProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  const channelKey = `${selectedResourceId}-${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;

  useSignalr((update: any) => {
    const updateDate = new Date(update.date + "T00:00:00Z");
    const selectedDay = new Date(selectedDate);

    if (
      update.resourceId === selectedResourceId &&
      updateDate.getUTCFullYear() === selectedDay.getUTCFullYear() &&
      updateDate.getUTCMonth() === selectedDay.getUTCMonth() &&
      updateDate.getUTCDate() === selectedDay.getUTCDate()
    ) {
      refreshTimeslots();
    }
  }, channelKey);

  // gets correct bookingTypeNumber for resource
  const getBookingTypeForResource = (resourceId: number) => {
    switch (resourceId) {
      case 1: return 0; // MeetingRoom
      case 2: return 1; // Desk
      case 3: return 2; // VRHeadset
      case 4: return 3; // AIServer
      default: return 0;
    }
  };
    // Fixad svensk tidskonvertering
  const formatTime = (utcTime: string) => {
  const date = new Date(utcTime + 'Z');
  return date.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Stockholm"
  });
};

  const CompleteBooking = () => {
    
    setLoading(true);
    // const start = new Date(selectedTimeslot.startTime);
    // const end = new Date(selectedTimeslot.endTime);

    const bookingData = {
      resourceId: selectedResourceId,
      bookingType: getBookingTypeForResource(selectedResourceId),
      startTime: selectedTimeslot.startTime,
      endTime: selectedTimeslot.endTime, 
      userId: user.id,
    };

    fetch(`${BASE_URL}Booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 409) throw new Error("Denna tid är redan bokad");
          throw new Error("Något gick fel vid bokning");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Tid för bokning: ", data.startTime, " till ", data.endTime);
        console.log("Status: ", bookingData);
        refreshTimeslots();
        setShowConfirmation(true);
      })
      .catch((err) => alert(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="mainContentConfirmBooking">
      <StepBar currentStep={3} />
      <div className="confirmBooking">
        <h1 className="componentHeader">Bekräfta bokning</h1>

        <div className="bookingInfo">
          <p>Bokningen avser: <b>{selectedResourceName}</b></p>
          <p>Datum för bokning: <b>{selectedDate.toLocaleDateString()}</b></p>
          <p>
            Tid för bokning:{" "}
            <b>
              {formatTime(selectedTimeslot.startTime)} - {formatTime(selectedTimeslot.endTime)}
            </b>
          </p>
          <p>
            Bokat på: <b>{user ? `${user.firstName} ${user.lastName}` : "Okänd användare"}</b>
          </p>
        </div>

        {loading ? (
          <div className="loadingContainerConfirmBooking">
            <LoadingSpinner />
          </div>
        ) : showConfirmation ? (
          <div className="confirmation-popup">
            <p>Bokningen är skapad!</p>
            <button
              onClick={() => {
                setShowConfirmation(false);
                onReturn();
              }}
            >
              Stäng
            </button>
          </div>
        ) : (
          <button className="continueBtn" onClick={CompleteBooking}>
            Bekräfta
          </button>
        )}

        <button className="goBackBtn" onClick={onReturn}>
          Tillbaka
        </button>
      </div>
    </div>
  );
};

export default ConfirmBooking;
