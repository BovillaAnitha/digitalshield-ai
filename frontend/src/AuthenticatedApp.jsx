
import { useEffect, useState } from "react";
import App from "./App";
import AuthScreen from "./AuthScreen";

const API = "https://digitalshield-ai-api.onrender.com";
export default function AuthenticatedApp() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [authError, setAuthError] = useState("");

  async function checkSession() {
    try {
      const response = await fetch(`${API}/auth/me`, {
        credentials: "include",
      });

      if (!response.ok) {
        setUser(null);
        return null;
      }

      const data = await response.json();
      setUser(data);
      setAuthError("");
      return data;
    } catch (error) {
      console.error("Session check failed:", error);
      setUser(null);
      return null;
    }
  }

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const response = await fetch(`${API}/auth/me`, {
          credentials: "include",
        });

        if (!active) return;

        if (response.ok) {
          const data = await response.json();
          if (active) setUser(data);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        if (active) setUser(null);
      } finally {
        if (active) setChecking(false);
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, []);

  async function handleLoginSuccess() {
    setChecking(true);
    setAuthError("");

    const verifiedUser = await checkSession();

    if (!verifiedUser) {
      setAuthError(
        "Login response received, but your session could not be verified. Please check the backend connection and browser cookies."
      );
    }

    setChecking(false);
  }

  async function logout() {
    try {
      const response = await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        console.warn("Logout API returned:", response.status);
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      setUser(null);
      setAuthError("");
    }
  }

  if (checking) {
    return (
      <main className="ds-auth-page">
        <p>Checking your DigitalShield AI session...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <>
        {authError && (
          <p
            role="alert"
            style={{
              color: "#b42345",
              textAlign: "center",
              padding: "12px",
            }}
          >
            {authError}
          </p>
        )}

        <AuthScreen onSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          right: 12,
          bottom: 12,
          zIndex: 1000,
        }}
      >
        <button
          type="button"
          onClick={logout}
          style={{
            background: "#583294",
            color: "white",
            padding: "12px 18px",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          Log Out
        </button>
      </div>

      <App />
    </>
  );
}
