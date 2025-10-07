import { useEffect, useState } from "react";
import connection from "../../services/signalRConnection";
import "./overviewcard.css";
import { BASE_URL } from "../../config";
import LoadingSpinner from "../loading/loadingComponent";
import VirtualAssistant from "../virtualAssistant/virtualAssistant";

interface ResourceStatus {
  MeetingRoom: number;
  Desk: number;
  VRHeadset: number;
  AIServer: number;
}

const OverviewCard = () => {
  const [status, setStatus] = useState<ResourceStatus>({
    MeetingRoom: 0,
    Desk: 0,
    VRHeadset: 0,
    AIServer: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE_URL}Booking/ResourceAvailability`)
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    // Starta SignalR-anslutning om den inte är igång
    if (connection.state === "Disconnected") {
      connection.start()
        .then(() => {
          console.log("Connected to SignalR hub");
        })
        .catch((err) => console.error("SignalR connection error:", err));
    }

    // Lyssna på event
    const handler = () => {
      fetch(`${BASE_URL}Booking/ResourceAvailability`)
        .then((res) => res.json())
        .then((data) => setStatus(data))
        .catch((err) => console.error(err));
    };
    connection.on("ReceiveBookingUpdate", handler);

    // Cleanup
    return () => {
      connection.off("ReceiveBookingUpdate", handler);
    };
  }, []);

  return (
    <div className="overviewCard">
      <h2>Snabb översikt</h2>
      <p>Här får du en snabb översikt över alla lediga skrivbord, mötesrum, VR-headset och AI-servrar.</p>
      <div className="overview-grid">
        <div className="overview-item">
          <h3>Lediga skrivbord</h3>
          {loading ? (
            <div className="loadingAvailableResources">
              <LoadingSpinner />
            </div>
          ) : (
            <span className="count">{status.Desk}</span>
          )}
        </div>
        <div className="overview-item">
          <h3>Lediga AI-servrar</h3>
          {loading ? (
            <div className="loadingAvailableResources">
              <LoadingSpinner />
            </div>
          ) : (
            <span className="count">{status.AIServer}</span>
          )}
        </div>
        <div className="overview-item">
          <h3>Lediga mötesrum</h3>
          {loading ? (
            <div className="loadingAvailableResources">
              <LoadingSpinner />
            </div>
          ) : (
            <span className="count">{status.MeetingRoom}</span>
          )}
        </div>
        <div className="overview-item">
          <h3>Lediga VR-headset</h3>
          {loading ? (
            <div className="loadingAvailableResources">
              <LoadingSpinner />
            </div>
          ) : (
            <span className="count">{status.VRHeadset}</span>
          )}
        </div>
      </div>
      <VirtualAssistant />
    </div>
  );
};

export default OverviewCard;