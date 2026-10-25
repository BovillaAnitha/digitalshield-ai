
import { useEffect, useState } from "react";
import { confirmEvidenceUpload } from "./privacyConfirm";

const API = "https://digitalshield-ai-api.onrender.com";
export default function EvidenceVault() {
  const [file, setFile] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [verification, setVerification] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  // Load all stored evidence
  async function loadEvidence() {
    try {
      const response = await fetch(`${API}/evidence`);

      if (!response.ok) {
        throw new Error("Could not load evidence.");
      }

      const data = await response.json();
      setEvidence(data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadEvidence();
  }, []);

  // Upload evidence
  async function uploadEvidence(event) {
    event.preventDefault();

    if (!file) {
      setMessage("Please select a file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("File must be 5 MB or smaller.");
      return;
    }

    // Privacy confirmation before uploading
    if (!confirmEvidenceUpload()) {
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
            : "Upload failed."
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

  // Verify SHA-256 integrity
  async function verifyEvidence(id) {
    setMessage("");

    try {
      const response = await fetch(
        `${API}/evidence/verify/${encodeURIComponent(id)}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Verification failed.");
      }

      const result = await response.json();

      setVerification((previous) => ({
        ...previous,
        [id]: result.status,
      }));
    } catch (error) {
      setMessage(error.message);
    }
  }

  // Delete evidence
  async function deleteEvidence(id) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this evidence? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeletingId(id);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/evidence/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));

        throw new Error(
          typeof error.detail === "string"
            ? error.detail
            : "Failed to delete evidence."
        );
      }

      // Remove deleted item from the displayed list
      setEvidence((previous) =>
        previous.filter((item) => item.id !== id)
      );

      // Remove its verification result
      setVerification((previous) => {
        const updated = { ...previous };
        delete updated[id];
        return updated;
      });

      setMessage("Evidence deleted successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="panel">
      <h2>🔐 Evidence Vault</h2>

      <p className="muted">
        Upload fictional screenshots or documents and verify
        their SHA-256 fingerprints.
      </p>

      {/* Upload Form */}
      <form
        onSubmit={uploadEvidence}
        className="upload-form"
      >
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

      {/* Status Message */}
      {message && <p role="status">{message}</p>}

      {/* Stored Evidence */}
      <h3>Stored Evidence ({evidence.length})</h3>

      {evidence.length === 0 ? (
        <p className="muted">
          No evidence uploaded yet.
        </p>
      ) : (
        <div className="evidence-list">
          {evidence.map((item) => (
            <div className="evidence-card" key={item.id}>
              <h4>📄 {item.filename}</h4>

              <p>
                Uploaded:{" "}
                {new Date(item.uploaded_at).toLocaleString()}
              </p>

              <p>
                Size: {(item.size / 1024).toFixed(1)} KB
              </p>

              <p className="hash">
                <strong>SHA-256:</strong>{" "}
                {item.sha256}
              </p>

              {/* Action Buttons */}
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
                  onClick={() => verifyEvidence(item.id)}
                  disabled={deletingId === item.id}
                >
                  Verify Integrity
                </button>

                <button
                  type="button"
                  onClick={() => deleteEvidence(item.id)}
                  disabled={deletingId === item.id}
                  className="delete-evidence-btn"
                >
                  {deletingId === item.id
                    ? "Deleting..."
                    : "🗑 Delete Evidence"}
                </button>
              </div>

              {/* Verification Result */}
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
