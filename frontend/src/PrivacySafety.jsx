
import { useState } from "react";

const CHECKLIST = [
  "I am using a device I trust.",
  "Nobody else can view my screen.",
  "I understand uploaded files may remain on this device.",
  "I will avoid sharing reports with untrusted people.",
  "I know how to contact emergency services if needed.",
];

export default function PrivacySafety() {
  const [checked, setChecked] = useState([]);
  const [showTips, setShowTips] = useState(true);
  const [notice, setNotice] = useState("");

  const completed = checked.length;

  function toggleCheck(index) {
    setChecked((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    );
  }

  function quickExit() {
    window.location.replace("https://www.google.com/");
  }

  function clearSession() {
    const confirmed = window.confirm(
      "This will clear temporary Privacy & Safety Center " +
      "checklist selections only. It will NOT delete uploaded " +
      "evidence, incidents, browser history, or saved contacts. Continue?"
    );

    if (!confirmed) return;

    setChecked([]);
    setNotice("Temporary privacy checklist cleared.");
  }

  function showPrivacyWarning() {
    window.alert(
      "DigitalShield AI is currently a local prototype. " +
      "Uploaded evidence and incident records may be stored " +
      "unencrypted on the backend computer. Do not upload " +
      "sensitive real-world evidence until proper authentication, " +
      "encryption, and access controls are implemented."
    );
  }

  return (
    <section className="privacy-center">
      <div className="panel">
        <span className="section-eyebrow">
          PRIVACY & SAFETY
        </span>

        <h2>Privacy & Safety Center</h2>

        <p className="muted">
          Understand how to use DigitalShield AI more safely,
          protect sensitive information, and prepare before
          documenting incidents.
        </p>

        <div className="privacy-warning">
          <h3>Important Privacy Notice</h3>

          <p>
            DigitalShield AI is a prototype. Evidence and incident
            data may be stored locally without encryption or
            authentication. Use fictional test data until these
            protections are implemented.
          </p>

          <button
            type="button"
            onClick={showPrivacyWarning}
          >
            Read Full Privacy Warning
          </button>
        </div>
      </div>

      <div className="panel">
        <span className="section-eyebrow">
          PERSONAL SAFETY CHECK
        </span>

        <h2>Before You Continue</h2>

        <p className="muted">
          Review this checklist before uploading evidence or
          generating incident reports.
        </p>

        <p>
          <strong>
            {completed} of {CHECKLIST.length} completed
          </strong>
        </p>

        <div className="privacy-progress">
          <div
            className="privacy-progress-fill"
            style={{
              width: `${(completed / CHECKLIST.length) * 100}%`,
            }}
          />
        </div>

        <div className="privacy-checklist">
          {CHECKLIST.map((item, index) => (
            <label key={index} className="privacy-check-item">
              <input
                type="checkbox"
                checked={checked.includes(index)}
                onChange={() => toggleCheck(index)}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>

        {completed === CHECKLIST.length && (
          <p className="privacy-success">
            Checklist completed. This does not guarantee
            your device or data is secure.
          </p>
        )}
      </div>

      <div className="panel">
        <span className="section-eyebrow">
          DIGITAL SAFETY GUIDANCE
        </span>

        <h2>Safety Recommendations</h2>

        <button
          type="button"
          onClick={() => setShowTips(!showTips)}
        >
          {showTips ? "Hide Safety Tips" : "Show Safety Tips"}
        </button>

        {showTips && (
          <div className="privacy-tips">
            <article className="privacy-tip">
              <h3>Protect Your Evidence</h3>
              <p>
                Keep original files unchanged. Store backup copies
                securely and avoid sending sensitive files through
                untrusted channels.
              </p>
            </article>

            <article className="privacy-tip">
              <h3>Protect Your Accounts</h3>
              <p>
                Use strong, unique passwords and enable multi-factor
                authentication where available. Review active
                sessions on your accounts.
              </p>
            </article>

            <article className="privacy-tip">
              <h3>Think Before Sharing</h3>
              <p>
                Incident reports may contain names, messages,
                timestamps, and other personal information.
                Review them carefully before sharing.
              </p>
            </article>

            <article className="privacy-tip">
              <h3>Use a Safer Device</h3>
              <p>
                If you suspect someone is monitoring your device,
                consider using another trusted device to seek
                assistance. A quick exit cannot remove browsing
                traces.
              </p>
            </article>
          </div>
        )}
      </div>

      <div className="panel">
        <span className="section-eyebrow">
          QUICK ACTIONS
        </span>

        <h2>Privacy Controls</h2>

        <p className="muted">
          These controls help with on-screen privacy. They do not
          replace secure authentication or data encryption.
        </p>

        <div className="privacy-actions">
          <button
            type="button"
            onClick={clearSession}
          >
            Clear Temporary Checklist
          </button>

          <button
            type="button"
            className="privacy-exit-button"
            onClick={quickExit}
          >
            Quick Exit
          </button>
        </div>

        <p className="muted">
          Quick Exit navigates this tab to Google. It does not
          clear browser history, close other tabs, or delete data.
        </p>

        {notice && <p role="status">{notice}</p>}
      </div>

      <div className="panel">
        <span className="section-eyebrow">
          HELP & SUPPORT
        </span>

        <h2>Emergency Support in India</h2>

        <p>
          <strong>112</strong> — Emergency response
        </p>
        <p>
          <strong>181</strong> — Women's helpline
          (availability may vary by state)
        </p>
        <p>
          <strong>1930</strong> — Cybercrime financial fraud helpline
        </p>

        <p className="muted">
          For online cybercrime reporting, visit the official
          National Cyber Crime Reporting Portal.
        </p>

        <a
          href="https://cybercrime.gov.in/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Cybercrime Reporting Portal
        </a>
      </div>
    </section>
  );
}
