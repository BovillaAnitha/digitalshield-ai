
import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

const emptyForm = {
  title: "",
  description: "",
  category: "Harassment",
  occurred_at: "",
  evidence_id: "",
};

export default function IncidentTimeline({ incidentDraft }) {
  const [incidents, setIncidents] = useState([]);
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // Load previously recorded incidents
  async function loadIncidents() {
    try {
      const response = await fetch(`${API}/incidents`);

      if (!response.ok) {
        throw new Error("Could not load incidents.");
      }

      const data = await response.json();
      setIncidents(data);
    } catch (err) {
      setError(err.message);
    }
  }

  // Load available evidence files
  async function loadEvidence() {
    try {
      const response = await fetch(`${API}/evidence`);

      if (!response.ok) {
        throw new Error("Could not load evidence.");
      }

      const data = await response.json();
      setEvidenceFiles(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadIncidents();
    loadEvidence();
  }, []);

  // Populate form when creating incident from analysis
  useEffect(() => {
    if (incidentDraft) {
      setForm(incidentDraft);
      loadEvidence();
    }
  }, [incidentDraft]);

  function update(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  // Create a new incident
  async function addIncident(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/incidents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          occurred_at: new Date(
            form.occurred_at
          ).toISOString(),
          evidence_id: form.evidence_id || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not save incident.");
      }

      setForm({ ...emptyForm });
      await loadIncidents();

      setMessage("Incident recorded successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Delete an existing incident
  async function deleteIncident(id) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this incident? The incident will be removed from the timeline and future reports. Linked evidence files will not be deleted."
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/incidents/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          typeof errorData.detail === "string"
            ? errorData.detail
            : "Could not delete incident."
        );
      }

      // Remove the deleted incident from the timeline
      setIncidents((previous) =>
        previous.filter(
          (incident) => incident.id !== id
        )
      );

      setMessage("Incident deleted successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  // Download incident PDF report
  async function downloadReport() {
    setError("");

    try {
      const response = await fetch(
        `${API}/incidents/report`
      );

      if (!response.ok) {
        throw new Error(
          "Add an incident before exporting."
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "digitalshield-report.pdf";
      link.click();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="panel">
      <h2>📅 Incident Timeline</h2>

      <p className="muted">
        Record incidents, attach evidence, and generate
        a structured PDF report.
      </p>

      {/* Incident Form */}
      <form
        onSubmit={addIncident}
        className="incident-form"
      >
        <label>
          Incident title
          <input
            name="title"
            value={form.title}
            onChange={update}
            placeholder="e.g. Repeated unwanted messages"
            maxLength={150}
            required
          />
        </label>

        <label>
          Date and time of incident
          <input
            type="datetime-local"
            name="occurred_at"
            value={form.occurred_at}
            onChange={update}
            required
          />
        </label>

        <label>
          Category
          <select
            name="category"
            value={form.category}
            onChange={update}
          >
            <option>Harassment</option>
            <option>Threat</option>
            <option>Impersonation</option>
            <option>Privacy violation</option>
            <option>Other</option>
          </select>
        </label>

        <label>
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={update}
            placeholder="Describe what happened..."
            rows={5}
            maxLength={3000}
            required
          />
        </label>

        <label>
          Attach Evidence (optional)
          <select
            name="evidence_id"
            value={form.evidence_id}
            onChange={update}
          >
            <option value="">
              No evidence selected
            </option>

            {evidenceFiles.map((file) => (
              <option
                key={file.id}
                value={file.id}
              >
                {file.filename} —{" "}
                {file.sha256.slice(0, 12)}...
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={saving}
        >
          {saving ? "Saving..." : "Add Incident"}
        </button>
      </form>

      {/* Status Messages */}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p role="status">
          {message}
        </p>
      )}

      {/* Timeline Header */}
      <div className="timeline-header">
        <h3>
          Recorded Incidents ({incidents.length})
        </h3>

        <button
          type="button"
          onClick={downloadReport}
          disabled={incidents.length === 0}
        >
          Download PDF Report
        </button>
      </div>

      {/* Incident Timeline */}
      {incidents.length === 0 ? (
        <p className="muted">
          No incidents recorded yet.
        </p>
      ) : (
        <div className="timeline">
          {incidents.map((incident) => (
            <article
              className="timeline-item"
              key={incident.id}
            >
              <small>
                {new Date(
                  incident.occurred_at
                ).toLocaleString()}
              </small>

              <h4>{incident.title}</h4>

              <strong>
                {incident.category}
              </strong>

              <p>
                {incident.description}
              </p>

              {incident.evidence_id && (
                <small>
                  Evidence reference:{" "}
                  {incident.evidence_id}
                </small>
              )}

              {/* Delete Incident Button */}
              <div
                style={{
                  marginTop: "14px",
                }}
              >
                <button
                  type="button"
                  className="delete-evidence-btn"
                  onClick={() =>
                    deleteIncident(incident.id)
                  }
                  disabled={
                    deletingId === incident.id
                  }
                >
                  {deletingId === incident.id
                    ? "Deleting..."
                    : "🗑 Delete Incident"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
