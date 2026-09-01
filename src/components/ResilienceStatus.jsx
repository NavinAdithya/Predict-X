import { useState, useEffect } from "react";
import predictXData from "../services/predictXData";

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

function CLbl({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, letterSpacing: "1.1px", textTransform: "uppercase", marginBottom: 12 }}>
      {children}
    </div>
  );
}

function Tog({ on, set, label }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", userSelect: "none" }}>
      <span style={{ position: "relative", width: 32, height: 17, display: "inline-block" }} onClick={() => set(!on)}>
        <span style={{ position: "absolute", inset: 0, background: on ? T.gDim : T.bg4, border: `1px solid ${on ? T.bdG2 : T.bd}`, borderRadius: 999, transition: "all .2s" }} />
        <span style={{ position: "absolute", top: 2, left: on ? 17 : 2, width: 11, height: 11, borderRadius: "50%", background: on ? T.g : T.t3, boxShadow: on ? `0 0 7px ${T.g}` : "none", transition: "all .22s" }} />
      </span>
      {label && <span style={{ fontSize: 11, color: T.t3 }}>{label}</span>}
    </label>
  );
}

export default function ResilienceStatus() {
  const [awsStatus, setAwsStatus] = useState({ outage: false, status: "online", queuedEvents: 0 });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      setAwsStatus(predictXData.getAwsStatus());
    };
    
    updateStatus();
    const unsub = predictXData.subscribe(updateStatus);
    
    return () => unsub();
  }, []);

  const handleToggle = () => {
    predictXData.setAwsOutage(!awsStatus.outage);
  };

  const handleSync = () => {
    setSyncing(true);
    
    setTimeout(() => {
      const count = predictXData.syncPendingEvents();
      setSyncing(false);
    }, 1500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <CLbl>Resilience Status</CLbl>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{
            background: awsStatus.outage ? "rgba(255,68,68,.08)" : "rgba(57,255,60,.08)",
            border: `1px solid ${awsStatus.outage ? "rgba(255,68,68,.25)" : "rgba(57,255,60,.25)"}`,
            borderRadius: 12, padding: 16, textAlign: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
              <span style={{
                width: 10, height: 10, borderRadius: "50%",
                background: awsStatus.outage ? "#ff4444" : T.g,
                boxShadow: `0 0 8px ${awsStatus.outage ? "#ff4444" : T.g}`,
                animation: "pulse 2s ease-in-out infinite"
              }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: awsStatus.outage ? "#ff4444" : T.g }}>
                {awsStatus.outage ? "Edge-Only Mode" : "Cloud Connected"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: T.t2 }}>Cowrie-backed data is local. Outage simulation has been removed.</div>
          </div>
          
          <div style={{
            background: T.bg2, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 16, textAlign: "center"
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: awsStatus.queuedEvents > 0 ? "#ffaa00" : T.g, marginBottom: 4 }}>
              {awsStatus.queuedEvents}
            </div>
            <div style={{ fontSize: 11, color: T.t3 }}>
              {awsStatus.outage ? "Events queued for sync" : "Pending sync events"}
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: 14 }}>
          <button onClick={handleSync} disabled={syncing || awsStatus.queuedEvents === 0} style={{
            width: "100%", padding: "12px", background: syncing ? "rgba(57,255,60,.3)" : awsStatus.queuedEvents > 0 ? T.g : "rgba(255,255,255,.05)",
            border: `1px solid ${syncing ? T.bdG2 : awsStatus.queuedEvents > 0 ? "transparent" : T.bd}`,
            borderRadius: 8, color: awsStatus.queuedEvents > 0 ? T.bg0 : T.t3,
            fontSize: 12, fontWeight: 700, cursor: awsStatus.queuedEvents > 0 && !syncing ? "pointer" : "not-allowed",
            transition: "all .22s"
          }}>
            {syncing ? "Syncing..." : awsStatus.queuedEvents > 0 ? `Sync Now (${awsStatus.queuedEvents} events)` : "No events to sync"}
          </button>
        </div>
      </Card>
      
      <div style={{ padding: 12, background: T.bg2, border: `1px solid ${T.bd}`, borderRadius: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
          Local Cowrie Integration
        </div>
        <div style={{ fontSize: 11, color: T.t2, lineHeight: 1.7 }}>
          Cowrie logs are polled from your local machine and surfaced in the dashboard. The outage simulation and fake queue seeding have been removed.
        </div>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {[
          { label: "Edge Nodes", value: "12 Active", ok: true },
          { label: "Local Decisions", value: "99.7%", ok: true },
          { label: "Queue Capacity", value: "10,000", ok: true },
        ].map((item, i) => (
          <div key={i} style={{ background: T.bg2, border: `1px solid ${T.bd}`, borderRadius: 8, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: item.ok ? T.g : "#ff4444", marginBottom: 2 }}>{item.value}</div>
            <div style={{ fontSize: 9.5, color: T.t3, textTransform: "uppercase", letterSpacing: 0.5 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
