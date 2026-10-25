
import { confirmEvidenceUpload } from "./privacyConfirm";
import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

export default function MediaEvidence() {
  const [file, setFile] = useState(null);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");
  const [checks, setChecks] = useState({});

  // Load existing audio/video evidence
  async function refresh() {
    try {
      const response = await fetch(`${API}/media-evidence`);

      if (!response.ok) {
        throw new Error("Unable to load media.");
      }

      const data = await response.json();
      setItems(data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  // Upload audio/video evidence
  async function upload(event) {
    event.preventDefault();

    const formElement = event.currentTarget;

    if (!file) {
      setMessage("Please select an audio or video file.");
      return;
    }

    // Ask for privacy confirmation before uploading
    if (!confirmEvidenceUpload()) {
      return;
    }

    const extension = file.name
      .split(".")
      .pop()
      .toLowerCase();

    const audioTypes = ["mp3", "wav", "m4a"];
    const videoTypes = ["mp4", "webm", "mov"];

    if (
      !audioTypes.includes(extension) &&
      !videoTypes.includes(extension)
    ) {
      setMessage("Unsupported audio or video format.");
      return;
    }

    const maxSize = audioTypes.includes(extension)
      ? 25 * 1024 * 1024
      : 100 * 1024 * 1024;

    if (file.size > maxSize) {
      setMessage(
        `File exceeds the ${audioTypes.includes(extension) ? 25 : 100} MB limit.`
      );
      return;
    }

    const form = new FormData();
    form.append("file", file);

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/media-evidence/upload`,
        {
          method: "POST",
          body: form,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Upload failed."
        );
      }

      setMessage("Media evidence uploaded successfully.");
      setFile(null);
      formElement.reset();

      await refresh();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  // Verify file integrity
  async function verify(id) {
    try {
      const response = await fetch(
        `${API}/media-evidence/${encodeURIComponent(id)}/verify`
      );

      if (!response.ok) {
        throw new Error("Verification failed.");
      }

      const data = await response.json();

      setChecks((previous) => ({
        ...previous,
        [id]: data.verified
          ? "✓ Fingerprint matches"
          : "⚠ File missing or modified",
      }));
    } catch (error) {
      setChecks((previous) => ({
        ...previous,
        [id]: error.message,
      }));
    }
  }

  // Delete previously uploaded or new media evidence
  async function deleteMedia(id) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this audio/video evidence? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeletingId(id);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/media-evidence/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(
          typeof errorData.detail === "string"
            ? errorData.detail
            : "Failed to delete media evidence."
        );
      }

      // Remove deleted item from the displayed list
      setItems((previous) =>
        previous.filter((item) => item.id !== id)
      );

      // Clear its verification result
      setChecks((previous) => {
        const updated = { ...previous };
        delete updated[id];
        return updated;
      });

      setMessage("Media evidence deleted successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="panel">
      <span className="section-eyebrow">
        MEDIA EVIDENCE
      </span>

      <h2>Audio & Video Evidence</h2>

      <p className="muted">
        Upload existing audio or video files and preserve
        their SHA-256 fingerprints.
      </p>

      {/* Upload Form */}
      <form onSubmit={upload} className="incident-form">
        <label>
          Select audio or video
          <input
            type="file"
            accept=".mp3,.wav,.m4a,.mp4,.webm,.mov"
            onChange={(event) =>
              setFile(event.target.files?.[0] || null)
            }
          />
        </label>

        <p className="muted">
          Audio: maximum 25 MB. Video: maximum 100 MB.
        </p>

        <button disabled={!file || busy} type="submit">
          {busy ? "Uploading..." : "Upload Media Evidence"}
        </button>
      </form>

      {/* Status Message */}
      {message && (
        <p role="status">{message}</p>
      )}

      {/* Saved Media Evidence */}
      <h3>Saved Media Evidence ({items.length})</h3>

      {items.length === 0 && (
        <p className="muted">
          No media evidence uploaded yet.
        </p>
      )}

      {items.map((item) => (
        <article className="evidence-card" key={item.id}>
          <strong>
            {item.media_type === "audio" ? "🎵" : "🎬"}{" "}
            {item.original_name}
          </strong>

          <p className="muted">
            Type: {item.media_type} · Size:{" "}
            {(item.file_size / (1024 * 1024)).toFixed(2)} MB
          </p>

          <p className="muted">
            Uploaded:{" "}
            {new Date(item.uploaded_at).toLocaleString()}
          </p>

          <p
            style={{
              overflowWrap: "anywhere",
              fontSize: 12,
            }}
          >
            SHA-256: {item.sha256}
          </p>

          {/* Verify and Delete Buttons */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "12px",
            }}
          >
            <button
              type="button"
              onClick={() => verify(item.id)}
              disabled={deletingId === item.id}
            >
              Verify Integrity
            </button>

            <button
              type="button"
              onClick={() => deleteMedia(item.id)}
              disabled={deletingId === item.id}
              className="delete-evidence-btn"
            >
              {deletingId === item.id
                ? "Deleting..."
                : "🗑 Delete Recording"}
            </button>
          </div>

          {/* Verification Result */}
          {checks[item.id] && (
            <p className="muted">
              {checks[item.id]}
            </p>
          )}
        </article>
      ))}
    </section>
  );
}
