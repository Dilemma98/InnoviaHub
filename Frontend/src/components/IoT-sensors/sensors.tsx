import "./sensors.css";
import LoadingSpinner from "../loading/loadingComponent";
import { useEffect, useState } from "react";
import * as SignalR from "@microsoft/signalr";
import { BASE_URL } from "../../config";
import VirtualAssistant from "../virtualAssistant/virtualAssistant";

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
  // State for list of devices
  const [devices, setDevices] = useState<Device[]>([]);
  // State for latest measurements per deviceId
  const [newestMeasurement, setNewestMeasurement] = useState<Record<string, Measurement>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // --- Fetch tenant and devices ---
    const fetchMeasurements = async () => {
      try {
        // Fetch tennant by slug 'innovia'
        const responseTenant = await fetch(
          `${BASE_URL}tenants/by-slug/innovia`
        );
        if (!responseTenant.ok) {
          const text = await responseTenant.text();
          console.error("Backend Error (tenant):", text);
          return;
        }
        const tenant = await responseTenant.json();
        console.log("Tenant", tenant);

        // Fetch devices for tennant
        const responseDevices = await fetch(
          `${BASE_URL}tenants/${tenant.id}/devices`
        );
        if (!responseDevices.ok) {
          const text = await responseDevices.text();
          console.error("Backend Error (devices):", text);
          return;
        }
        const devices = await responseDevices.json();
        // Save to state
        setDevices(devices);
        console.log("Devices", devices);

      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        console.log(loading);
        setLoading(false);
      }
    };

    fetchMeasurements();

    // --- SignalR hub for realtime-updates ---
    const hub = new SignalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL.replace(/\/api\/?$/, "")}/hub/telemetry`)
      // If disconnected, reconnect
      .withAutomaticReconnect()
      .build();

    // Listen to incoming measurements
    hub.on("measurementReceived", (m: Measurement) => {
       console.log("DEBUG measurement:", m);
      setNewestMeasurement((prev) => ({ ...prev, [m.deviceId]: m }));
    });

    // Start hub and join tenant-group
    hub
      .start()
      .then(() => {
        console.log("SignalR connected, joining tenant...");
        return hub.invoke("JoinTenant", "innovia");
      })
       .then(() => console.log("Joined tenant group"))
      .catch((err) => console.error("SignalR-error: ", err));

    // Cleanup: stop hub when component unmounts
    return () => {
      hub.stop();
    };
  }, []);

  return (
    <div className="sensors">
      <h2>Kontorets sensorer</h2>
      <table>
        <thead>
          <tr>
            <th>Sensortyp</th>
            <th>Värde</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={2}>
                <div className="loadingMeasurements">
                  <LoadingSpinner />
                </div>
              </td>
            </tr>
          ) : devices.length === 0 ? (
            <tr>
              <td colSpan={2}>
                <div className="noSensorsFound"> 
                  <p>Tyvärr är våra sensorer offline för stunden</p>
                </div>
              </td>
            </tr>
          ) : (
            devices.map(d => {
              const m = newestMeasurement[d.id];
              let displayValue = "-";

              if (m) {
                if (m.unit === "bool") {
                  displayValue = m.type === "motion" 
                    ? (m.value ? "Detected" : "Undetected")
                    : (m.value ? "Yes" : "No");
                } else if (typeof m.value === "number") {
                  displayValue = m.value.toFixed(1);
                } else {
                  displayValue = String(m.value);
                }
              }
              return (
                <tr key={d.id}>
                  <td>
                    <b>{d.model}</b>
                  </td>
                  <td>
                    <span
                      className={
                        displayValue === "Yes"
                          ? // Add className 'value-yes' to the value 'Yes'
                            "value-yes"
                          : displayValue === "No"
                          ? // Add className 'value-no' to the value 'No'
                            "value-no"
                          : displayValue === "Detected"
                          ? // Add className 'value-yes' to the value 'Detected'
                            "value-yes"
                          : displayValue === "Undetected"
                          ? // Add className 'value-no' to the value 'Undetected'
                            "value-no"
                          : // Otherwise className will be 'value-default'
                            "value-default"
                      }
                    >
                      {displayValue}
                    </span>{" "}
                    {""}
                    <i>{m?.unit === "bool" ? "" : m?.unit}</i>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <VirtualAssistant message={""} />
    </div>
  );
};

export default Sensors;
