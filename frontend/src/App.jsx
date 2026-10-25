import DashboardWelcome from "./DashboardWelcome";
import PrivacySafety from "./PrivacySafety";
import IncidentMedia from "./IncidentMedia";
import MediaEvidence from "./MediaEvidence";
import IncidentSearch from "./IncidentSearch";
import { useState } from "react";
import EvidenceVault from "./EvidenceVault";
import IncidentTimeline from "./IncidentTimeline";
import EmergencyContacts from "./EmergencyContacts";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const example = `Hey, why aren't you replying?
I've sent you messages every day.
You can't ignore me forever.
I know where you live.`;

const navigation = [
  { id: "dashboard", icon: "▦", label: "Dashboard" },
  { id: "analyzer", icon: "◈", label: "Conversation Analyzer" },
  { id: "evidence", icon: "▣", label: "Evidence Vault" },
  { id: "incidents", icon: "▤", label: "Incident Timeline" },
  { id: "emergency", icon: "✚", label: "Emergency Assistance" },
  { id: "privacy", label: "Privacy & Safety" },
];

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [conversation, setConversation] = useState(example);
  const [result, setResult] = useState(null);
  const [incidentDraft, setIncidentDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function navigate(page) {
    setActivePage(page);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function analyze() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: conversation }),
      });

      if (!response.ok) {
        throw new Error("Analysis request failed.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function createIncidentFromAnalysis() {
    if (!result) return;

    const description = result.findings.length
      ? result.findings
          .map(
            (finding) =>
              `Message ${finding.message_number}: ${finding.message}
Category: ${finding.category}
Explanation: ${finding.explanation}`
          )
          .join("\n\n")
      : "Conversation reviewed. No predefined warning signs detected.";

    setIncidentDraft({
      title: "Conversation safety concern",
      description: description.slice(0, 3000),
      category: "Harassment",
      occurred_at: "",
      evidence_id: "",
    });

    navigate("incidents");
  }

  const showAnalyzer =
    activePage === "dashboard" || activePage === "analyzer";

  const pageTitle = {
    dashboard: "Safety Dashboard",
    analyzer: "Conversation Analyzer",
    evidence: "Evidence Vault",
    incidents: "Incident Timeline",
    emergency: "Emergency Assistance",
  }[activePage];

  return (
    <div className="app dashboard-layout">
      <aside
        className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}
      >
        <div className="sidebar-brand">
          <div className="brand-icon">🛡</div>
          <div>
            <h2>DigitalShield AI</h2>
            <p>Your Digital Safety Companion</p>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${
                activePage === item.id ? "active" : ""
              }`}
              onClick={() => navigate(item.id)}
              aria-current={
                activePage === item.id ? "page" : undefined
              }
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span>♡ Safety comes first</span>
            <p>
              Your documentation tools are one click away.
            </p>
          </div>
          <small>DigitalShield AI · Prototype</small>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="dashboard-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation"
            >
              ☰
            </button>
            <div>
              <h1>{pageTitle}</h1>
              <p>Digital safety, documentation and support</p>
            </div>
          </div>

          <div className="topbar-status">
            <span className="status-dot" />
            Local Prototype
          </div>
        </header>

        <main className="dashboard-content">
          {activePage === "dashboard" && (
            <>
              <section className="welcome-banner">
                <div>
                  <span className="welcome-eyebrow">
                    YOUR SAFETY WORKSPACE
                  </span>
                  <h2>Take control of your digital safety.</h2>
                  <p>
                    Understand warning signs, preserve evidence,
                    document incidents, and access support.
                  </p>
                  <button
                    type="button"
                    className="welcome-button"
                    onClick={() => navigate("analyzer")}
                  >
                    Analyze a Conversation →
                  </button>
                </div>
                <div className="welcome-symbol" aria-hidden="true">
                  🛡
                </div>
              </section>

              <div className="overview-grid">
                <button
                  type="button"
                  className="overview-card"
                  onClick={() => navigate("analyzer")}
                >
                  <span className="overview-icon purple">◈</span>
                  <strong>Analyze Conversations</strong>
                  <span>
                    Understand potential warning signs
                  </span>
                  <em>Open Analyzer →</em>
                </button>

                <button
                  type="button"
                  className="overview-card"
                  onClick={() => navigate("evidence")}
                >
                  <span className="overview-icon pink">▣</span>
                  <strong>Preserve Evidence</strong>
                  <span>
                    Store files and verify fingerprints
                  </span>
                  <em>Open Evidence Vault →</em>
                </button>

                <button
                  type="button"
                  className="overview-card"
                  onClick={() => navigate("incidents")}
                >
                  <span className="overview-icon blue">▤</span>
                  <strong>Document Incidents</strong>
                  <span>
                    Create timelines and PDF reports
                  </span>
                  <em>Open Timeline →</em>
                </button>
              </div>
            </>
          )}

          {showAnalyzer && (
            <>
              <section className="panel analyzer-panel">
                <div className="section-heading">
                  <div>
                    <span className="section-eyebrow">
                      EXPLAINABLE SCREENING
                    </span>
                    <h2>Conversation Analyzer</h2>
                    <p className="muted">
                      Paste one message per line to identify
                      potential warning signs.
                    </p>
                  </div>
                  <span className="feature-pill">
                    Rule-based analysis
                  </span>
                </div>

                <label
                  className="field-label"
                  htmlFor="conversation-input"
                >
                  Conversation Messages
                </label>

                <textarea
                  id="conversation-input"
                  className="conversation-input"
                  value={conversation}
                  onChange={(event) =>
                    setConversation(event.target.value)
                  }
                  rows={7}
                  placeholder="Paste conversation messages..."
                />

                <div className="analyzer-actions">
                  <span className="muted">
                    Use fictional messages for testing.
                  </span>
                  <button
                    type="button"
                    onClick={analyze}
                    disabled={loading || !conversation.trim()}
                  >
                    {loading
                      ? "Analyzing..."
                      : "◈ Analyze Conversation"}
                  </button>
                </div>

                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
              </section>

              {result && (
                <section className="panel results">
                  <div className="result-header">
                    <div>
                      <span className="section-eyebrow">
                        ANALYSIS COMPLETE
                      </span>
                      <h2>Safety Analysis Results</h2>
                    </div>

                    <span
                      className={`risk ${result.overall_level}`}
                    >
                      {result.overall_level.toUpperCase()} CONCERN
                    </span>
                  </div>

                  <div className="stats">
                    <div>
                      <strong>{result.total_messages}</strong>
                      <span>Messages Reviewed</span>
                    </div>
                    <div>
                      <strong>{result.flagged_messages}</strong>
                      <span>Messages Flagged</span>
                    </div>
                    <div>
                      <strong>{result.findings.length}</strong>
                      <span>Warning Signs</span>
                    </div>
                  </div>

                  <p className="analysis-summary">
                    {result.summary}
                  </p>

                  <h3>Detected Warning Signs</h3>

                  {result.findings.length === 0 ? (
                    <p className="muted">
                      No predefined warning patterns detected.
                      This does not guarantee safety.
                    </p>
                  ) : (
                    result.findings.map((finding, index) => (
                      <article
                        className="finding"
                        key={`${finding.message_number}-${index}`}
                      >
                        <div className="finding-title">
                          <strong>{finding.category}</strong>
                          <span className={`risk ${finding.level}`}>
                            {finding.level}
                          </span>
                        </div>

                        <p className="message">
                          <strong>
                            Message {finding.message_number}:
                          </strong>{" "}
                          {finding.message}
                        </p>

                        <p>{finding.explanation}</p>
                      </article>
                    ))
                  )}

                  <h3>Suggested Safety Steps</h3>
                  <ul className="safety-list">
                    {result.recommendations.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>

                  <p className="disclaimer">
                    {result.disclaimer}
                  </p>

                  <button
                    type="button"
                    onClick={createIncidentFromAnalysis}
                    className="create-incident-button"
                  >
                    + Create Incident from Analysis
                  </button>
                </section>
              )}
            </>
          )}

          {activePage === "evidence" && (
            <>
              <EvidenceVault />
              <MediaEvidence />
            </>
          )}

          {/* Keep mounted so saved drafts survive navigation */}
          <div
            id="incident-timeline"
              style={{
                display:
                  activePage === "incidents" ? "block" : "none",
          }}
          >
          <IncidentTimeline incidentDraft={incidentDraft} />
          <IncidentSearch />
          <IncidentMedia />
          </div>

          {activePage === "incidents" && (
          <section className="panel">
            <span className="section-eyebrow">ENHANCED REPORTING</span>
              <h2>Complete Incident & Media Report</h2>

              <p className="muted">
                Generate a PDF containing documented incidents,
                linked audio/video evidence, SHA-256 fingerprints,
                and file integrity results.
              </p>

              <button
                type="button"
                onClick={() => {
                const confirmed = window.confirm(
                "This report may contain sensitive information. " +
                "Download it only on a device you trust. Continue?"
            );

            if (confirmed) {
              window.open(
                "http://127.0.0.1:8000/reports/enhanced",
                "_blank",
                "noopener,noreferrer"
              );
            }
            }}
            >
          Download Enhanced PDF Report
          </button>
          </section>
          )}

          {activePage === "emergency" && (
            <EmergencyContacts />
          )}
          {activePage === "privacy" && <PrivacySafety />}

          <footer className="dashboard-footer">
            DigitalShield AI · Explainable Digital Safety
            · Hackathon Prototype
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
