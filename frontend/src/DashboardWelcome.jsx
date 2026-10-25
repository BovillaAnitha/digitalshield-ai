
export default function DashboardWelcome() {
  return (
    <section className="ds-welcome">
      <div className="ds-welcome-content">
        <span className="ds-welcome-label">
          DIGITAL SAFETY WORKSPACE
        </span>

        <h2>Your Safety. Your Evidence. Your Control.</h2>

        <p>
          Analyze concerning conversations, document incidents,
          organize evidence, and access safety resources from
          one secure-looking, privacy-aware workspace.
        </p>

        <div className="ds-welcome-tags">
          <span>Conversation Analysis</span>
          <span>Evidence Integrity</span>
          <span>Incident Documentation</span>
        </div>
      </div>

      <div className="ds-welcome-symbol" aria-hidden="true">
        🛡️
      </div>
    </section>
  );
}
