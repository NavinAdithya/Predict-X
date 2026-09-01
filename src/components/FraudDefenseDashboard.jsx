import { useState } from "react";
import LiveSessions from "./LiveSessions";
import SafeUserRedirects from "./SafeUserRedirects";
import HighRiskAlerts from "./HighRiskAlerts";
import ResilienceStatus from "./ResilienceStatus";

const T = {
  bg0: "#050c06", bg1: "#071008", bg2: "#091409", bg3: "#0c1a0d", bg4: "#0f1f10", bg5: "#132413",
  card: "#0d1a0e", cardIn: "#0a1509",
  g: "#39ff3c", gDim: "rgba(57,255,60,0.10)", gDim2: "rgba(57,255,60,0.05)",
  bd: "rgba(255,255,255,0.055)", bdG: "rgba(57,255,60,0.18)", bdG2: "rgba(57,255,60,0.35)",
  t0: "#ffffff", t1: "#c5dac6", t2: "#8aaa8b", t3: "#4e6b4f", t4: "#263827",
};

function Card({ children, style = {}, glow = false }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: T.card, border: `1px solid ${hov || glow ? T.bdG : T.bd}`, borderRadius: 14, padding: "17px 19px",
        position: "relative", overflow: "hidden", transition: "all .22s",
        transform: hov ? "translateY(-1px)" : "none",
        boxShadow: hov ? `0 8px 32px rgba(0,0,0,.45),0 0 0 1px rgba(57,255,60,.08)` : glow ? `0 0 24px rgba(57,255,60,.12)` : "none", ...style
      }}>
      <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: `linear-gradient(90deg,transparent,${T.bdG},transparent)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 18% 0%,rgba(57,255,60,${hov ? .07 : .035}),transparent 50%)`, pointerEvents: "none", transition: "all .22s" }} />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

function SectionBadge({ children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, background: T.gDim,
      border: `1px solid ${T.bdG}`, borderRadius: 999, padding: "3px 10px",
      fontSize: 10, fontWeight: 600, color: T.g
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.g, boxShadow: `0 0 6px ${T.g}` }} />
      {children}
    </span>
  );
}

export default function FraudDefenseDashboard() {
  const [activeTab, setActiveTab] = useState("sessions");

  const tabs = [
    { id: "sessions", label: "Live Sessions" },
    { id: "redirects", label: "Safe Redirects" },
    { id: "alerts", label: "High-Risk Alerts" },
    { id: "resilience", label: "Resilience" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SectionBadge>Fraud Defense</SectionBadge>
          <span style={{ fontSize: 16, fontWeight: 700, color: T.t0 }}>PREDICT-X Dashboard</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: "8px 16px", background: activeTab === tab.id ? T.g : "transparent",
                border: `1px solid ${activeTab === tab.id ? "transparent" : T.bd}`,
                borderRadius: 8, color: activeTab === tab.id ? T.bg0 : T.t2,
                fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all .18s"
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: activeTab === "sessions" ? "block" : "none" }}>
            <LiveSessions />
          </div>
          <div style={{ display: activeTab === "redirects" ? "block" : "none" }}>
            <SafeUserRedirects />
          </div>
          <div style={{ display: activeTab === "alerts" ? "block" : "none" }}>
            <HighRiskAlerts />
          </div>
          <div style={{ display: activeTab === "resilience" ? "block" : "none" }}>
            <ResilienceStatus />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, letterSpacing: "1.1px", textTransform: "uppercase", marginBottom: 12 }}>
              Live Summary
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Cowrie Sessions", value: "Live", color: T.g },
                { label: "Logs", value: "API-backed", color: T.t1 },
                { label: "Fake Data", value: "Removed", color: T.t1 },
                { label: "Local Mode", value: "Enabled", color: T.g },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
                  <span style={{ fontSize: 11, color: T.t3 }}>{item.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
          
          <Card>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, letterSpacing: "1.1px", textTransform: "uppercase", marginBottom: 12 }}>
              Data Status
            </div>
            <div style={{ color: T.t3, fontSize: 12, lineHeight: 1.7 }}>
              This dashboard now reads from local Cowrie logs only. Empty tables mean Cowrie has not generated events yet.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
