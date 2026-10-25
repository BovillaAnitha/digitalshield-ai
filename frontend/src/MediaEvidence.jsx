
import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

export default function MediaEvidence() {
  const [file, setFile] = useState(null);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [checks, setChecks] = useState({});

  async function refresh() {
    try {
      const response = await fetch(`${API}/media-evidence`);
      if (!response.ok) throw new Error("Unable to load media.");

      setItems(await response.json());
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function upload(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!file) return;
    const form = new FormData();
    form.append("file", file);

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/media-evidence/upload`,
        {
          method: "POST",
          body: form
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed.");
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

  async function verify(id) {
    try {
      const response = await fetch(
        `${API}/media-evidence/${id}/verify`
      );

      if (!response.ok) throw new Error("Verification failed.");

      const data = await response.json();

      setChecks((previous) => ({
        ...previous,
        [id]: data.verified
          ? "Fingerprint matches"
          : "File missing or modified"
      }));
    } catch (error) {
      setChecks((previous) => ({
        ...previous,
        [id]: error.message
      }));
    }
  }

  return (
    <section className="panel">
      <span className="section-eyebrow">MEDIA EVIDENCE</span>
      <h2>Audio & Video Evidence</h2>
      <p className="muted">
        Upload existing audio or video files and preserve
        their SHA-256 fingerprints.
      </p>

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

      {message && <p role="status">{message}</p>}

      <h3>Saved Media Evidence</h3>

      {items.length === 0 && (
        <p className="muted">No media evidence uploaded yet.</p>
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

          <p style={{ overflowWrap: "anywhere", fontSize: 12 }}>
            SHA-256: {item.sha256}
          </p>

          <button
            type="button"
            onClick={() => verify(item.id)}
          >
            Verify Integrity
          </button>

          {checks[item.id] && (
            <p className="muted">{checks[item.id]}</p>
          )}
        </article>
      ))}
    </section>
  );
}
