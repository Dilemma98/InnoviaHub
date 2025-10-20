import "./sensors.css";
import LoadingSpinner from "../loading/loadingComponent";
import { useEffect, useState } from "react";
import * as SignalR from "@microsoft/signalr";

interface Device {
  id: string;
  tenantId: string;
  model: string;
  serial: string;
  status: string;
}

interface Measurement {
  deviceId: string;
  type: string;
  value: number;
  unit: string;
  timestamp: string;
}

const Sensors = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [newestMeasurement, setNewestMeasurement] = useState<
    Record<string, Measurement>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // --- Fetch tenant and devices ---
    const fetchMeasurements = async () => {
      try {
        const responseTenant = await fetch(
          "http://localhost:5101/api/tenants/by-slug/innovia"
        );
        if (!responseTenant.ok) {
          const text = await responseTenant.text();
          console.error("Backend Error (tenant):", text);
          return;
        }
        const tenant = await responseTenant.json();

        const responseDevices = await fetch(
          `http://localhost:5101/api/tenants/${tenant.id}/devices`
        );
        if (!responseDevices.ok) {
          const text = await responseDevices.text();
          console.error("Backend Error (devices):", text);
          return;
        }
        const devices = await responseDevices.json();
        setDevices(devices);

        console.log("Tenant:", tenant);
        console.log("Devices:", devices);
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        console.log(loading);
        setLoading(false);
      }
    };

    fetchMeasurements();

    // --- SignalR hub ---
    const hub = new SignalR.HubConnectionBuilder()
      .withUrl("http://localhost:5103/hub/telemetry")
      .withAutomaticReconnect()
      .build();

    hub.on("measurementReceived", (m: Measurement) => {
      console.log("Mätning mottagen:", m);
      setNewestMeasurement((prev) => ({ ...prev, [m.deviceId]: m }));
    });

    hub
      .start()
      .then(() => {
        console.log("Ansluten til sensorhubben");
        hub.invoke("JoinTenant", "innovia");
      })
      .catch((err) => console.error("SignalR-error: ", err));

    return () => {
      hub.stop();
    };
  }, []);

  return (
    <div className="sensors">
      <h2>Sensorer</h2>
      <hr />
      <table>
        <thead>
          <tr>
            <th>Sensortyp</th>
            <th>Värde</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(newestMeasurement).length === 0 ? (
           
              <div className="loadingMeasurements"  >
                <LoadingSpinner />
              </div>
          ) : (
            devices.map((d) => {
              const m = newestMeasurement[d.id];
              return (
                <tr key={d.id}>
                  <td><b>{d.model}</b></td>
                  <td>{m ? m.value.toFixed(1) : "-"} <i>{m?.unit ?? ""}</i></td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Sensors;
