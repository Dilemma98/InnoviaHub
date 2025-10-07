import { useEffect, useState, useCallback } from "react";
import "./resourceAdmin.css";
import useSignalr from "../../../hooks/useSignalR";
import { BASE_URL } from "../../../config";
import LoadingSpinner from "../../loading/loadingComponent";
import VirtualAssistant from "../../virtualAssistant/virtualAssistant";

type BookingType = "Desk" | "VRHeadset" | "MeetingRoom" | "AIServer";

interface Resource {
  resourceId: number;
  resourceName: string;
  resourceType: number;
  capacity: number;
  timeslots: Timeslot[];
}

interface Timeslot {
  timeslotId: number;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

const resourceTypes: { key: BookingType; label: string }[] = [
  { key: "Desk", label: "Skrivbord" },
  { key: "VRHeadset", label: "VR-Headset" },
  { key: "MeetingRoom", label: "Mötesrum" },
  { key: "AIServer", label: "AI-Server" },
];

const enumNumberToKey: Record<number, BookingType> = {
  0: "MeetingRoom",
  1: "Desk",
  2: "VRHeadset",
  3: "AIServer",
};


const enumMap: Record<BookingType, number> = {
  Desk: 1,
  VRHeadset: 2,
  MeetingRoom: 0,
  AIServer: 3,
};

export default function ResourceAdmin() {
  // Current time for checking if a resource is currently booked
  const now = new Date();

  const [selectedType, setSelectedType] = useState<BookingType>("Desk");
  const [selectedTypeForAdd, setSelectedTypeForAdd] = useState<BookingType>("Desk");
  const [resources, setResources] = useState<Resource[]>([]);
  const [newResource, setNewResource] = useState("");
  const [loading, setLoading] = useState<boolean>(true);

  // Function to load resources from backend
  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}AdminResource`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data: Resource[] = await res.json();
      setResources(data.map(r => ({ ...r, timeslots: r.timeslots || [] })));
    } catch (error) {
      console.error("Kunde inte ladda resurser:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial loading of resources
  useEffect(() => {
    loadResources();
  }, [loadResources]);

  // SignalR realtime updates
  useSignalr(() => {
    loadResources();
  }, "all-resources");

  const handleAdd = async () => {
    if (!newResource.trim()) return;
    const body = {
      resourceId: 0,
      resourceName: newResource,
      resourceType: enumMap[selectedTypeForAdd],
      capacity: 1,
    };
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}AdminResource`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorText = await response.text();
        alert("Kunde inte lägga till resurs: " + errorText);
        return;
      }
      setNewResource("");
      loadResources();
    } catch (error) {
      console.error("Fetch failed:", error);
      alert("Kunde inte lägga till resurs, nätverksfel?");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Är du säker på att du vill ta bort resursen?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}AdminResource/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error("Kunde inte ta bort resurs: " + errorText);
      }
      loadResources();
    } catch (error) {
      console.error("Kunde inte ta bort resurs:", error);
      alert("Kunde inte ta bort resurs, nätverksfel?");
    } finally {
      setLoading(false);
    }
  };

  const extractNumber = (name: string) => {
    const match = name.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const filteredResources = resources
    .filter((res) => enumNumberToKey[res.resourceType] === selectedType)
    .sort((a, b) => {
      const nameA = a.resourceName.toLowerCase();
      const nameB = b.resourceName.toLowerCase();
      const numA = extractNumber(nameA);
      const numB = extractNumber(nameB);
      if (numA && numB) return numA - numB;
      return nameA.localeCompare(nameB);
    });

  return (
    <div className="resource-admin">
      <h2>Resurshantering</h2>

      <div className="type-buttons">
        {resourceTypes.map((type) => (
          <button
            key={type.key}
            className={`type-button ${selectedType === type.key ? "active" : ""}`}
            onClick={() => setSelectedType(type.key)}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="add-resource">
        <input
          type="text"
          placeholder="Namn på resurs"
          value={newResource}
          onChange={(e) => setNewResource(e.target.value)}
        />
        <select
          value={selectedTypeForAdd}
          onChange={(e) => setSelectedTypeForAdd(e.target.value as BookingType)}
        >
          {resourceTypes.map((type) => (
            <option key={type.key} value={type.key}>{type.label}</option>
          ))}
        </select>
        <button onClick={handleAdd}>➕ Lägg till</button>
      </div>

      {loading && (
        <div className="loadingContainerResources">
          <LoadingSpinner />
        </div>
      )}

      <div className="resource-grid">
        {filteredResources.map((res) => (
          <div key={res.resourceId} className="resource-card">
            <h3>{res.resourceName}</h3>
            <div style={{ marginTop: "6px" }}>

              Status:{" "}
              {res.timeslots && res.timeslots.some(slot => {
                // Compare current time with timeslot start and end
                // to show if currently booked
                const start = new Date(slot.startTime);
                const end = new Date(slot.endTime);
                return slot.isBooked && now >= start && now <= end; 
              }) ? (

                // If booked, show red dot
                <span
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "red",
                  }}
                />
              ) : (
                // If not booked, show green dot
               <span
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "green",
                  }}
                />
              )}
            </div>

            <div className="actions">
              <button className="delete" onClick={() => handleDelete(res.resourceId)}>🗑️ Ta bort</button>
            </div>
          </div>
        ))}
      </div>
      <VirtualAssistant />
    </div>
  );
}
