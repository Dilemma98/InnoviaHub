import { useEffect, useState } from "react";
import connection from "../../services/signalRConnection";
import "./myBookings.css";
import UnBookBtn from "./unBookBtn";
import { BASE_URL } from "../../config";
import LoadingSpinner from "../loading/loadingComponent";
import "../../components/loading/loadingStyle.css";

interface Booking {
  bookingId: number;
  userId: string;
  resourceId: number;
  resourceName: string;
  bookingType: number;
  startTime: string;
  endTime: string;
  dateOfBooking: string;
}

interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  firstName: string;
  lastName: string;
}

interface MyBookingsProps {
  className?: string;
}

const MyBookingsComponent = ({ className }: MyBookingsProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resourceTypeColors: { [key: string]: string } = {
    "Mötesrum": "#ffd3a0de",
    "Skrivbord": "#8ec4cdde",
    "VR-Headset": "#a48fb5de",
    "AI-Server": "#6BCB77de",
  };

  const getResourceColor = (name: string) => {
    if (name.includes("Mötesrum")) return resourceTypeColors["Mötesrum"];
    if (name.includes("Skrivbord")) return resourceTypeColors["Skrivbord"];
    if (name.includes("VR")) return resourceTypeColors["VR-Headset"];
    if (name.includes("AI")) return resourceTypeColors["AI-Server"];
    return "#6a3333ff";
  };

  const formatTime = (utcTime: string) => {
    const date = new Date(utcTime);
    return date.toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Stockholm",
    });
  };

  const formatDateToSwedish = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric" };
    const parts = new Intl.DateTimeFormat("sv-SE", options).formatToParts(date);
    const weekday = parts.find((p) => p.type === "weekday")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
    return `${capitalizeFirstLetter(weekday || "")} den ${day}`;
  };

  const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setLoading(false);
      setError("Ingen användare hittades. Är du inloggad?");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    const fetchBookings = async () => {
      try {
        const res = await fetch(`${BASE_URL}Booking/user/${parsedUser.id}`);
        if (!res.ok) throw new Error("Kunde inte hämta bokningar");
        const data: Booking[] = await res.json();
        setBookings(data.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Något gick fel");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();

    // Starta SignalR-anslutning om den inte är igång
    if (connection.state === "Disconnected") {
      connection.start()
        .then(() => {
          console.log("✅ SignalR connected");
        })
        .catch((err) => console.error("SignalR error:", err));
    }

    // Lyssna på event
    const handler = (update: { bookingId: number }) => {
      setBookings((prev) => prev.filter((b) => b.bookingId !== update.bookingId));
    };
    connection.on("BookingChanged", handler);

    // Cleanup
    return () => {
      connection.off("BookingChanged", handler);
    };
  }, []);

  return (
    <div className={`mainContentMyBookings ${className || ""}`}>
      <h1 className="myBookingsHeader">Hej {user?.firstName}!</h1>
      <h2 className="h2">Här hittar du dina bokningar</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <div className="loadingContainerMyBookings"><LoadingSpinner /></div>}
      {!loading && !error && bookings.length === 0 && <p>Du har inga bokningar för tillfället</p>}

      {!loading && !error && bookings.length > 0 && (
        <ul className="myBookedResources">
          {bookings.map((booking) => {
            const color = getResourceColor(booking.resourceName);
            return (
              <li key={booking.bookingId} className="bookedResourceItem">
                <div style={{ display: "flex", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{
                    backgroundColor: color,
                    color: "black",
                    padding: "0.3em 0.8em",
                    borderRadius: "1em",
                    fontSize: "1em",
                    fontWeight: 500,
                    marginLeft: "-1.5em",
                    marginBottom: "1em",
                    whiteSpace: "nowrap",
                    border: "1px solid black",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.47)"
                  }}>
                    {booking.resourceName.includes("Skrivbord") ? "Skrivbord" :
                      booking.resourceName.includes("Mötesrum") ? "Mötesrum" :
                        booking.resourceName.includes("VR") ? "VR-Headset" :
                          booking.resourceName.includes("AI") ? "AI-Server" : "Okänd"}
                  </span>
                </div>

                <div className="dateTimeInfo">
                  <div className="bookingDateTimeInfo"><b>{formatDateToSwedish(booking.startTime)}</b></div>
                  <div className="bookingDateTimeInfo">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</div>
                </div>

                <UnBookBtn 
                  booking={booking} 
                  onDeleted={(id) => setBookings(prev => prev.filter(b => b.bookingId !== id))} 
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default MyBookingsComponent;