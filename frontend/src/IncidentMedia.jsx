
import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function IncidentMedia() {
  const [incidents, setIncidents] = useState([]);
  const [media, setMedia] = useState([]);
  const [incidentId, setIncidentId] = useState("");
  const [mediaId, setMediaId] = useState("");
  const [linked, setLinked] = useState([]);
  const [message, setMessage] = useState("");

  async function loadOptions() {
    try {
      const [incidentResponse, mediaResponse] = await Promise.all([
        fetch(`${API}/incidents`),
        fetch(`${API}/media-evidence`)
      ]);

      if (!incidentResponse.ok || !mediaResponse.ok) {
        throw new Error("Unable to load incidents or media.");
      }

      const incidentData = await incidentResponse.json();
      const mediaData = await mediaResponse.json();

      setIncidents(
        Array.isArray(incidentData)
          ? incidentData
          : incidentData.incidents || []
      );

      setMedia(Array.isArray(mediaData) ? mediaData : []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadOptions();
  }, []);

  async function loadLinked(id) {
    if (!id) {
      setLinked([]);
      return;
    }

    try {
      const response = await fetch(`${API}/incident-media/${id}`);
      if (!response.ok) throw new Error("Unable to load linked media.");
      setLinked(await response.json());
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function attach() {
    if (!incidentId || !mediaId) return;

    setMessage("");

    try {
      const response = await fetch(`${API}/incident-media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            incident_id: incidentId,
            media_id: mediaId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to link media.");
      }

      setMessage("Media evidence linked to incident successfully.");
      await loadLinked(incidentId);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="panel">
      <span className="section-eyebrow">EVIDENCE ASSOCIATION</span>
      <h2>Attach Audio / Video to Incident</h2>

      <p className="muted">
        Select an existing incident and a previously uploaded media file.
      </p>

      <div className="incident-form">
        <label>
          Choose Incident
          <select
            value={incidentId}
            onChange={(event) => {
              const id = event.target.value;
              setIncidentId(id);
              loadLinked(id);
            }}
          >
            <option value="">Select incident</option>
            {incidents.map((incident) => (
              <option key={incident.id} value={incident.id}>
                {incident.title || `Incident #${incident.id}`}
              </option>
            ))}
          </select>
        </label>

        <label>
          Choose Audio / Video Evidence
          <select
            value={mediaId}
            onChange={(event) => setMediaId(event.target.value)}
          >
            <option value="">Select media evidence</option>
            {media.map((item) => (
              <option key={item.id} value={item.id}>
                {item.original_name} ({item.media_type})
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          disabled={!incidentId || !mediaId}
          onClick={attach}
        >
          Link Media to Incident
        </button>

        <button type="button" onClick={loadOptions}>
          ↻ Refresh Incident & Media Lists
        </button>
      </div>

      {message && <p role="status">{message}</p>}

      {incidentId && (
        <>
          <h3>Linked Media Evidence</h3>

          {linked.length === 0 ? (
            <p className="muted">
              No audio or video evidence linked yet.
            </p>
          ) : (
            linked.map((item) => (
              <div className="evidence-card" key={item.id}>
                <strong>
                  {item.media_type === "audio" ? "🎵" : "🎬"}{" "}
                  {item.original_name}
                </strong>

                <p className="muted">
                  SHA-256: {item.sha256}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      `${API}/media-evidence/${item.id}/verify`,
                      "_blank"
                    )
                  }
                >
                  Verify Fingerprint
                </button>
              </div>
            ))
          )}
        </>
      )}
    </section>
  );
}
