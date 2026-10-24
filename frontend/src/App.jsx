import IncidentTimeline from "./IncidentTimeline";
import EvidenceVault from "./EvidenceVault";
import { useState } from "react";
import "./App.css";

const example = `Hey, why aren't you replying?
I know which college you attend.
If you block me, I'll create another account.
I'll share your private photos unless you respond.`;

function App() {
  const [conversation, setConversation] = useState(example);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyze() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/analyze",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: conversation }),
        }
      );

      if (!response.ok) {
        throw new Error("Analysis request failed.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">🛡 DigitalShield AI</div>
        <span className="subtitle">Digital Safety Assistant</span>
      </header>

      <main className="container">
        <section className="hero">
          <h1>Understand the warning signs.</h1>
          <p>
            Review conversations for potential harassment,
            intimidation and coercion.
          </p>
        </section>

        <section className="panel">
          <h2>Conversation Analyzer</h2>
          <p className="muted">
            Enter one message per line. Use fictional data
            while testing this prototype.
          </p>

          <textarea
            value={conversation}
            onChange={(e) => setConversation(e.target.value)}
            placeholder="Paste conversation messages..."
            rows={8}
          />

          <button
            onClick={analyze}
            disabled={loading || !conversation.trim()}
          >
            {loading ? "Analyzing..." : "Analyze Conversation"}
          </button>

          {error && <p className="error">{error}</p>}
        </section>

        {result && (
          <section className="panel results">
            <div className="result-header">
              <h2>Analysis Results</h2>
              <span className={`risk ${result.overall_level}`}>
                {result.overall_level.toUpperCase()} CONCERN
              </span>
            </div>

            <div className="stats">
              <div>
                <strong>{result.total_messages}</strong>
                <span>Messages reviewed</span>
              </div>
              <div>
                <strong>{result.flagged_messages}</strong>
                <span>Messages flagged</span>
              </div>
              <div>
                <strong>{result.findings.length}</strong>
                <span>Warning signs</span>
              </div>
            </div>

            <p>{result.summary}</p>

            <h3>Detected Warning Signs</h3>

            {result.findings.length === 0 ? (
              <p>
                No predefined warning patterns detected.
                This does not mean the conversation is safe.
              </p>
            ) : (
              result.findings.map((finding, index) => (
                <div className="finding" key={index}>
                  <div className="finding-title">
                    <strong>{finding.category}</strong>
                    <span className={`risk ${finding.level}`}>
                      {finding.level}
                    </span>
                  </div>

                  <p className="message">
                    Message {finding.message_number}:{" "}
                    "{finding.message}"
                  </p>
                  <p>{finding.explanation}</p>
                </div>
              ))
            )}

            <h3>Suggested Safety Steps</h3>
            <ul>
              {result.recommendations.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <p className="disclaimer">{result.disclaimer}</p>
          </section>
        )}
        <EvidenceVault />
        <IncidentTimeline />
      </main>
    </div>
  );
}

export default App;
