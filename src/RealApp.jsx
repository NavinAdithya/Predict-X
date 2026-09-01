import { useState } from "react";
import FraudDefenseDashboard from "./components/FraudDefenseDashboard";
import HoneypotOverview from "./components/HoneypotOverview";
import HoneypotDetails from "./components/HoneypotDetails";
import HoneypotMonitor from "./components/HoneypotMonitor";
import ChainOfCustody from "./components/ChainOfCustody";
import S3Storage from "./components/S3Storage";
import ApiHealthStatus from "./components/ApiHealthStatus";
import ZeroClawChat from "./components/ZeroClawChat";

import UserDashboard from "./components/UserDashboard";

const T = {
  bg0: "#050c06",
  bg1: "#071008",
  bg2: "#091409",
  card: "#0d1a0e",
  g: "#39ff3c",
  bd: "rgba(255,255,255,0.055)",
  bdG: "rgba(57,255,60,0.18)",
  t0: "#ffffff",
  t1: "#c5dac6",
  t2: "#8aaa8b",
  t3: "#4e6b4f",
};

function Panel({ children, style = {} }) {
  return <div style={{ background: T.card, border: `1px solid ${T.bd}`, borderRadius: 16, padding: 20, ...style }}>{children}</div>;
}

function roleButtonStyle(active) {
  return {
    padding: "14px 16px",
    borderRadius: 12,
    border: `1px solid ${active ? T.bdG : T.bd}`,
    background: active ? "rgba(57,255,60,0.10)" : T.bg2,
    color: active ? T.g : T.t1,
    fontWeight: 700,
    cursor: "pointer",
  };
}

const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: 12,
  border: `1px solid ${T.bd}`,
  background: T.bg2,
  color: T.t0,
  outline: "none",
};

export default function RealApp() {
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("overview");

  const adminTabs = [
    ["overview", "Overview"],
    ["fraud", "Fraud Defense"],
    ["honeypot", "Honeypot"],
    ["logs", "Logs Feed"],
    ["custody", "Custody"],
    ["storage", "Files"],
    ["health", "API Health"],
    ["ai", "Zero Claw AI"],
  ];

  const submit = (event) => {
    event.preventDefault();
    if (!role) {
      setError("Select a role first.");
      return;
    }
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password.trim()) {
      setError("Enter a password.");
      return;
    }

    setError("");
    setUser({ role, email, id: email.split("@")[0] });
  };

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg0, color: T.t1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: 920, maxWidth: "100%", display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 18 }}>
          <Panel style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.t0, marginBottom: 10 }}>Predict<span style={{ color: T.g }}>-X</span></div>
            <div style={{ color: T.t3, marginBottom: 18 }}>
              Real-time threat defense with edge classification and autonomous deception layers.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <button onClick={() => setRole("admin")} style={roleButtonStyle(role === "admin")}>
                Administrator
              </button>
              <button onClick={() => setRole("user")} style={roleButtonStyle(role === "user")}>
                End User
              </button>
            </div>
            <div style={{ marginTop: 18, fontSize: 12, color: T.t2, lineHeight: 1.7 }}>
              {role === "user" ? (
                <>
                  <strong style={{ color: T.t0 }}>End User Classification:</strong>
                  <br />• Safe: <code style={{ color: T.g }}>safe1@company.com</code>
                  <br />• High Risk: <code style={{ color: "#ff6666" }}>critical@company.com</code>
                  <br />• Medium: <code style={{ color: T.t1 }}>anyother@email.com</code>
                </>
              ) : (
                <>
                  <strong style={{ color: T.t0 }}>Administrator Console:</strong>
                  <br />Sign in with <code style={{ color: T.g }}>admin@predictx.io</code> to inspect honeypot logs, live sessions, custody evidence, and Zero Claw AI.
                </>
              )}
            </div>
          </Panel>

          <Panel>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.t0 }}>
                {role === "user" ? "End User Sign In" : "Administrator Sign In"}
              </div>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={role === "user" ? "safe1@company.com" : "admin@predictx.io"}
                style={inputStyle}
              />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="Password"
                style={inputStyle}
              />
              {error ? (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,100,100,.3)",
                    background: "rgba(255,100,100,.08)",
                    color: "#ffaaaa",
                    fontSize: 12,
                  }}
                >
                  {error}
                </div>
              ) : null}
              <button
                type="submit"
                style={{
                  padding: "13px 16px",
                  borderRadius: 12,
                  border: "none",
                  background: T.g,
                  color: T.bg0,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Sign In →
              </button>
            </form>
          </Panel>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <UserDashboard
        user={user}
        onLogout={() => {
          setUser(null);
          setRole(null);
          setEmail("");
          setPassword("");
        }}
      />
    );
  }

  const page = {
    overview: <HoneypotOverview />,
    fraud: <FraudDefenseDashboard />,
    honeypot: <HoneypotDetails />,
    logs: <HoneypotMonitor />,
    custody: <ChainOfCustody />,
    storage: <S3Storage />,
    health: <ApiHealthStatus />,
    ai: <ZeroClawChat />,
  }[tab] || <HoneypotOverview />;

  return (
    <div style={{ minHeight: "100vh", background: T.bg0, color: T.t1 }}>
      <header style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px 20px", borderBottom: `1px solid ${T.bd}`, background: "rgba(5,12,6,.96)", backdropFilter: "blur(12px)" }}>
        <div>
          <div style={{ fontSize: 13, color: T.t3 }}>Predict-X</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.t0 }}>Administrator Console</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ color: T.t2, fontSize: 12 }}>{user.email}</div>
          <button onClick={() => { setUser(null); setRole(null); setEmail(""); setPassword(""); }} style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.bd}`, background: T.bg2, color: T.t1, cursor: "pointer" }}>Sign out</button>
        </div>
      </header>

      <main style={{ maxWidth: 1440, margin: "0 auto", padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
          <Panel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {adminTabs.map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)} style={{
                  width: "100%", padding: "11px 12px", borderRadius: 10,
                  border: `1px solid ${tab === key ? T.bdG : T.bd}`,
                  background: tab === key ? "rgba(57,255,60,0.10)" : T.bg2,
                  color: tab === key ? T.g : T.t1,
                  textAlign: "left", cursor: "pointer", fontWeight: 700,
                }}>{label}</button>
              ))}
            </div>
          </Panel>
          <div>{page}</div>
        </div>
      </main>
    </div>
  );
}