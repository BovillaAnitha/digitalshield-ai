
import { useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function AuthScreen({ onSuccess }) {
  const [registering, setRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = registering ? "register" : "login";
      const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

      const response = await fetch(`${API}/auth/${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Authentication failed."
        );
      }

      onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="ds-auth-page">
      <form className="ds-auth-card" onSubmit={submit}>
        <div className="ds-auth-logo">🛡️</div>

        <h1>DigitalShield AI</h1>
        <p>Your personal digital safety workspace</p>

        <h2>{registering ? "Create Account" : "Welcome Back"}</h2>

        <label htmlFor="auth-email">Email</label>
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="auth-password">Password</label>
        <input
          id="auth-password"
          type={showPassword ? "text" : "password"}
          autoComplete={
            registering ? "new-password" : "current-password"
          }
          minLength={12}
          maxLength={128}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          
        />

        {/* Show / Hide Password */}
        <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="password-toggle"
        >
        {showPassword ? "🙈 Hide Password" : "👁 Show Password"}
        </button>

        {registering && (
        <small>Use at least 12 characters.</small>
        )}

        {registering && password.length < 12 && (
  <small style={{ color: "#765c9a" }}>
    Use at least 12 characters. ({password.length}/12)
  </small>
)}

        {error && <p role="alert" className="ds-auth-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading
            ? "Please wait..."
            : registering
              ? "Create Account"
              : "Sign In"}
        </button>

        <button
          type="button"
          className="ds-auth-switch"
          onClick={() => {
            setRegistering(!registering);
            setError("");
          }}
        >
          {registering
            ? "Already have an account? Sign In"
            : "New here? Create an Account"}
        </button>
      </form>
    </main>
  );
}
