import "./myBookings.css";
import { BASE_URL } from "../../config";

interface UnBookBtnProps {
  booking: { bookingId: number; resourceId: number };
  onDeleted: (id: number) => void; // skickar tillbaka till parent
}

const UnBookBtn = ({ booking, onDeleted }: UnBookBtnProps) => {
  const unBook = async () => {
    try {
      const res = await fetch(`${BASE_URL}Booking/${booking.bookingId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Kunde inte ta bort bokning");
      
      // ✅ Ta bort direkt i UI
      onDeleted(booking.bookingId);
    } catch (err) {
      console.error(err);
      alert("Något gick fel vid avbokning");
    }
  };

  return <button className="unBookBtn" onClick={unBook}>Avboka</button>;
};

export default UnBookBtn;
