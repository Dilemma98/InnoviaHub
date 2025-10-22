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
          "http://localhost:5101/api/tenants/by-slug/innovia"
        );
        if (!responseTenant.ok) {
          const text = await responseTenant.text();
          console.error("Backend Error (tenant):", text);
          return;
        }
        const tenant = await responseTenant.json();

        // Fetch devices for tennant
        const responseDevices = await fetch(
          `http://localhost:5101/api/tenants/${tenant.id}/devices`
        );
        if (!responseDevices.ok) {
          const text = await responseDevices.text();
          console.error("Backend Error (devices):", text);
          return;
        }
        const devices = await responseDevices.json();
        // Save to state
        setDevices(devices);

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
      .withUrl("http://localhost:5103/hub/telemetry")
      // If disconnected, reconnect
      .withAutomaticReconnect()
      .build();

    // Listen to incoming measurements
    hub.on("measurementReceived", (m: Measurement) => {
      console.log("Mätning mottagen:", m);
      setNewestMeasurement((prev) => ({ ...prev, [m.deviceId]: m }));
    });

    // Start hub and join tenant-group
    hub
      .start()
      .then(() => {
        hub.invoke("JoinTenant", "innovia");
      })
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
            {/* If no measurements, show loadingSpinner */}
          {Object.keys(newestMeasurement).length === 0 ? (
            <div className="loadingMeasurements">
              <LoadingSpinner />
            </div>
          ) : (
            devices.map((d) => {
              // Latest measurement for sepcific device
              const m = newestMeasurement[d.id];
              let displayValue = "-";

              // If m contains deviceId
              if (m) {
                // If measurement unit contains 'bool'
                if (m.unit === "bool") {
                  // Display 1 as 'Yes' and 0 as 'No'
                  displayValue = m.value ? "Yes" : "No";

                  // If measurement type contains 'motion'
                  if (m.type === "motion") {
                    // Display 1 as 'Detected' and 0 as 'Undetected'
                    displayValue = m.value ? "Detected" : "Undetected";
                  }

                  // Else if value is number
                } else if (typeof m.value === "number") {
                  // Display with only one decimal
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
    </div>
  );
};

export default Sensors;
