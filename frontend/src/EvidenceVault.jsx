import { confirmEvidenceUpload } from "./privacyConfirm";
import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

export default function EvidenceVault() {
  const [file, setFile] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [verification, setVerification] = useState({});

  async function loadEvidence() {
    try {
      const response = await fetch(`${API}/evidence`);
      if (!response.ok) throw new Error("Could not load evidence");
      setEvidence(await response.json());
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadEvidence();
  }, []);

  async function uploadEvidence(event) {
    event.preventDefault();

    if (!confirmEvidenceUpload()) {
    return;
  }


    if (!file) {
      setMessage("Please select a file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("File must be 5 MB or smaller.");
      return;
    }

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API}/evidence/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          typeof error.detail === "string"
            ? error.detail
            : "Upload failed"
        );
      }

      setMessage("Evidence uploaded successfully.");
      setFile(null);
      event.target.reset();
      await loadEvidence();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyEvidence(id) {
    try {
      const response = await fetch(
        `${API}/evidence/verify/${id}`,
        { method: "POST" }
      );

      if (!response.ok) throw new Error("Verification failed");

      const result = await response.json();

      setVerification((previous) => ({
        ...previous,
        [id]: result.status,
      }));
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="panel">
      <h2>🔐 Evidence Vault</h2>

      <p className="muted">
        Upload fictional screenshots or documents and verify
        their SHA-256 fingerprints.
      </p>

      <form onSubmit={uploadEvidence} className="upload-form">
        <input
          type="file"
          accept=".png,.jpg,.jpeg,.pdf"
          onChange={(event) =>
            setFile(event.target.files?.[0] || null)
          }
        />

        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Upload Evidence"}
        </button>
      </form>

      {message && <p role="status">{message}</p>}

      <h3>Stored Evidence ({evidence.length})</h3>

      {evidence.length === 0 ? (
        <p className="muted">No evidence uploaded yet.</p>
      ) : (
        <div className="evidence-list">
          {evidence.map((item) => (
            <div className="evidence-card" key={item.id}>
              <h4>📄 {item.filename}</h4>

              <p>
                Uploaded:{" "}
                {new Date(item.uploaded_at).toLocaleString()}
              </p>

              <p>Size: {(item.size / 1024).toFixed(1)} KB</p>

              <p className="hash">
                <strong>SHA-256:</strong> {item.sha256}
              </p>

              <button
                type="button"
                onClick={() => verifyEvidence(item.id)}
              >
                Verify Integrity
              </button>

              {verification[item.id] && (
                <p
                  className={
                    verification[item.id] === "unchanged"
                      ? "verified"
                      : "modified"
                  }
                >
                  {verification[item.id] === "unchanged"
                    ? "✓ File fingerprint matches"
                    : `⚠ File status: ${verification[item.id]}`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
