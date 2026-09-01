import { useState, useEffect } from "react";
import predictXData from "../services/predictXData";
import { explainDecision } from "../services/zeroClawApi";

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

function SevBadge({ sev }) {
  const map = {
    critical: ["rgba(255,255,255,.08)", T.t0, "rgba(255,255,255,.22)"],
    high: ["rgba(240,248,240,.07)", "#ddeedd", "rgba(240,248,240,.18)"],
    medium: ["rgba(221,238,221,.07)", "#b8d4b9", "rgba(221,238,221,.14)"],
    low: ["rgba(57,255,60,.10)", T.g, "rgba(57,255,60,.24)"]
  };
  const [bg, col, bd] = map[sev] || map.low;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999,
      fontSize: 10, fontWeight: 600, background: bg, color: col, border: `1px solid ${bd}`
    }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor" }} />
      {sev.toUpperCase()}
    </span>
  );
}

function PoisonStreamModal({ alert, onClose }) {
  const [streamData, setStreamData] = useState(alert.poison_stream_sample);
  const [liveUpdate, setLiveUpdate] = useState(false);

  useEffect(() => {
    if (!liveUpdate) return;
    const interval = setInterval(() => {
      setStreamData({
        injected_dwell: Math.floor(Math.random() * 30) + 30,
        injected_flight: Math.floor(Math.random() * 150) + 200,
        pattern_id: Math.random().toString(36).substr(2, 6),
        timestamp: new Date().toISOString(),
        injected_curvature: (Math.random() * 0.05).toFixed(4),
        injected_velocity: (Math.random() * 5 + 5).toFixed(2),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [liveUpdate]);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(3,7,3,.90)", zIndex: 500, display: "flex",
      alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)"
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.bg3, border: `1px solid ${T.bdG}`, borderRadius: 16, padding: 24, width: 560,
        maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto", position: "relative", boxShadow: `0 32px 80px rgba(0,0,0,.75)`
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${T.bdG2},transparent)` }} />
        <button onClick={onClose} style={{
          position: "absolute", top: 13, right: 13, width: 25, height: 25, background: T.bg4,
          border: `1px solid ${T.bd}`, borderRadius: 6, color: T.t3, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
        }}>✕</button>
        
        <div style={{ fontSize: 14, fontWeight: 700, color: T.t0, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#ff4444" }}>☠</span> Self-Poisoning Data Stream
        </div>
        <div style={{ fontSize: 11, color: T.t3, marginBottom: 16 }}>
          Live corrupted behavioral data being fed to attacker session: <span style={{ color: T.g, fontFamily: "monospace" }}>{alert.session_id}</span>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <button onClick={() => setLiveUpdate(!liveUpdate)} style={{
            padding: "6px 12px", background: liveUpdate ? "rgba(255,68,68,.15)" : T.gDim,
            border: `1px solid ${liveUpdate ? "rgba(255,68,68,.4)" : T.bdG}`, borderRadius: 6, color: liveUpdate ? "#ff4444" : T.g,
            fontSize: 11, fontWeight: 600, cursor: "pointer"
          }}>
            {liveUpdate ? "⏹ Stop Stream" : "▶ Start Live Stream"}
          </button>
          <span style={{ fontSize: 10, color: T.t3 }}>{liveUpdate ? "Updating every 1s..." : "Click to see live updates"}</span>
        </div>
        
        <div style={{ background: "rgba(255,68,68,.05)", border: `1px solid rgba(255,68,68,.2)`, borderRadius: 8, padding: 14, fontFamily: "monospace", fontSize: 11, color: "#ff6666", overflow: "auto" }}>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {JSON.stringify(streamData, null, 2)}
          </pre>
        </div>
        
        <div style={{ marginTop: 14, fontSize: 10, color: T.t3, lineHeight: 1.6 }}>
          <strong style={{ color: T.t2 }}>How self-poisoning works:</strong><br/>
          Corrupted behavioral patterns are injected into the attacker's session, making their data collection useless for future attacks. The attacker believes they're collecting valid data while we're actually feeding them garbage.
        </div>
        
        <div style={{ marginTop: 12, padding: 12, background: T.bg1, border: `1px solid ${T.bd}`, borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Detection Factors</div>
          {alert.factors.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <SevBadge sev={i === 0 ? "critical" : "high"} />
                <span style={{ fontSize: 11, color: T.t2 }}>{f.replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RawDataModal({ alert, onClose }) {
  const [aiExplain, setAiExplain] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const runAiExplanation = async () => {
    setAiLoading(true);
    try {
      const res = await explainDecision(alert);
      setAiExplain(res.reply);
    } catch {
      setAiExplain("Unable to fetch AI risk explanation.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(3,7,3,.90)", zIndex: 500, display: "flex",
      alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)"
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.bg3, border: `1px solid ${T.bdG}`, borderRadius: 16, padding: 24, width: 520,
        maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto", position: "relative", boxShadow: `0 32px 80px rgba(0,0,0,.75)`
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${T.bdG2},transparent)` }} />
        <button onClick={onClose} style={{
          position: "absolute", top: 13, right: 13, width: 25, height: 25, background: T.bg4,
          border: `1px solid ${T.bd}`, borderRadius: 6, color: T.t3, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
        }}>✕</button>
        
        <div style={{ fontSize: 14, fontWeight: 700, color: T.t0, marginBottom: 15, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: T.g }}>◈</span> Raw Session Data
        </div>
        
        <div style={{ background: T.bg1, border: `1px solid ${T.bd}`, borderRadius: 8, padding: 14, fontFamily: "monospace", fontSize: 11, color: T.t2, overflow: "auto" }}>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {JSON.stringify(alert.raw_data, null, 2)}
          </pre>
        </div>

        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.bd}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.g, display: "flex", alignItems: "center", gap: 6 }}>
              <span>🤖</span> Gemini AI Risk Analysis
            </div>
            <button onClick={runAiExplanation} disabled={aiLoading}
              style={{ padding: "6px 14px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 8, color: T.g, fontSize: 11, fontWeight: 700, cursor: aiLoading ? "not-allowed" : "pointer" }}>
              {aiLoading ? "Analyzing..." : "Explain Risk with AI"}
            </button>
          </div>

          {aiExplain && (
            <div style={{ padding: 12, background: T.bg1, border: `1px solid ${T.bdG}`, borderRadius: 10, fontSize: 11, color: T.t1, lineHeight: 1.6 }}>
              {aiExplain}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HighRiskAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [poisonModal, setPoisonModal] = useState(null);
  const [rawModal, setRawModal] = useState(null);

  useEffect(() => {
    const updateAlerts = () => {
      setAlerts(predictXData.getHighRiskAlerts());
    };
    
    updateAlerts();
    const unsub = predictXData.subscribe(updateAlerts);
    
    return () => {
      unsub();
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card glow>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
          <CLbl>High-Risk Alerts (Admin Only)</CLbl>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#ff4444" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#ff4444", boxShadow: `0 0 6px #ff4444`, animation: "pulse 1s ease-in-out infinite" }} />
            {alerts.length} Active
          </span>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {alerts.map((alert, idx) => (
            <div key={alert.alert_id} style={{
              padding: "14px 0", borderBottom: idx < alerts.length - 1 ? "1px solid rgba(255,255,255,.025)" : "none",
              display: "flex", flexDirection: "column", gap: 10
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <SevBadge sev="critical" />
                  <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: T.g }}>{alert.alert_id}</span>
                  <span style={{ fontSize: 11, color: T.t3 }}>•</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.t0 }}>{alert.user_id}</span>
                  <span style={{ fontSize: 11, color: T.t3 }}>•</span>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: T.t2 }}>{alert.session_id}</span>
                </div>
                <span style={{ fontSize: 10, color: T.t3 }}>{new Date(alert.timestamp).toLocaleString()}</span>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: T.t3 }}>Risk Score:</span>
                <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,.08)", color: "#ffffff", border: "1px solid rgba(255,255,255,.22)" }}>
                  {alert.risk_score}
                </span>
              </div>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
                {alert.factors.map((f, i) => (
                  <span key={i} style={{
                    padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 500,
                    background: i === 0 ? "rgba(255,68,68,.1)" : "rgba(255,255,255,.05)",
                    color: i === 0 ? "#ff6666" : T.t2,
                    border: `1px solid ${i === 0 ? "rgba(255,68,68,.3)" : "rgba(255,255,255,.09)"}`
                  }}>
                    {f.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {alert.poisoning_active && (
                    <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 600, background: "rgba(255,68,68,.12)", color: "#ff6666", border: "1px solid rgba(255,68,68,.3)" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#ff4444", boxShadow: `0 0 6px #ff4444` }} />
                      Self-Poisoning Active
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setPoisonModal(alert)} style={{
                    padding: "4px 12px", background: "rgba(255,68,68,.1)", border: `1px solid rgba(255,68,68,.3)`,
                    borderRadius: 6, color: "#ff6666", fontSize: 10.5, fontWeight: 600, cursor: "pointer"
                  }}>
                    View Poison Stream
                  </button>
                  <button onClick={() => setRawModal(alert)} style={{
                    padding: "4px 12px", background: T.gDim, border: `1px solid ${T.bdG}`,
                    borderRadius: 6, color: T.g, fontSize: 10.5, fontWeight: 600, cursor: "pointer"
                  }}>
                    View Raw Data
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {alerts.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: T.t3, fontSize: 12 }}>
              No high-risk alerts. The system is monitoring for suspicious activity.
            </div>
          )}
        </div>
        {alerts.length === 0 && (
          <div style={{ textAlign: "center", padding: 36, color: T.t3, fontSize: 12 }}>
            No high-risk Cowrie events yet.
          </div>
        )}
      </Card>
      
      {poisonModal && <PoisonStreamModal alert={poisonModal} onClose={() => setPoisonModal(null)} />}
      {rawModal && <RawDataModal alert={rawModal} onClose={() => setRawModal(null)} />}
    </div>
  );
}
