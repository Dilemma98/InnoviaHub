import { useEffect, useRef } from "react";
import connection from "../services/signalRConnection";
import { HubConnectionState } from "@microsoft/signalr";

export interface BookingUpdate {
  resourceId: number;
  start: string; // ISO string
  end: string;   // ISO string
  date: string;
}

// Global subscribers
const subscribers: ((update: BookingUpdate) => void)[] = [];

// Broadcast to all subscribers
const broadcast = (update: BookingUpdate) => {
  console.log(`🔔 Broadcasting to ${subscribers.length} subscribers`, update);
  subscribers.forEach(cb => cb(update));
};

// Ref to track connection
const isConnectedRef = { current: false };

const useSignalr = (callback: (update: BookingUpdate) => void, source = "unknown") => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    console.log(`🔌 useSignalr mount, adding subscriber from ${source}`);
    subscribers.push(callbackRef.current);

    const startConnection = async () => {
      // Register event once
      if (!(connection as any)._hasHandler) {
        connection.on("ReceiveBookingUpdate", (update: BookingUpdate) => {
          console.log("📡 Hub message received:", update); // <- logga alltid här
          broadcast(update);
        });
        (connection as any)._hasHandler = true;
      } else {
        console.log("⚠️ Already has handler, skipping");
      }

      // Start connection if disconnected
      if (connection.state === "Disconnected") {
        await connection.start();
        console.log("✅ SignalR connected");
      } else {
        console.log("⚠️ Connection already started, skipping start()");
      }

    };

    startConnection();

    return () => {
      const index = subscribers.indexOf(callbackRef.current);
      if (index !== -1) subscribers.splice(index, 1);
    };
  }, [source]);
};

export default useSignalr;
