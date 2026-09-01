import { useState, useEffect } from "react";
import predictXData from "../services/predictXData";
import { classifyLogWithAI } from "../services/zeroClawApi";

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

function RiskBadge({ score, status }) {
  let color = T.g;
  let label = "SAFE";
  if (score >= 70 || status === "high_risk") { color = "#ff6666"; label = "HIGH RISK"; }
  else if (score >= 40 || status === "medium") { color = "#ffcc66"; label = "MID"; }
  else if (score >= 20) { color = "#39ff3c"; label = "LOW"; }
  
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999,
      fontSize: 10, fontWeight: 700, background: label === "HIGH RISK" ? "rgba(255,100,100,.15)" : label === "MID" ? "rgba(255,200,100,.15)" : "rgba(57,255,60,.12)",
      color: color, border: `1px solid ${label === "HIGH RISK" ? "rgba(255,100,100,.3)" : label === "MID" ? "rgba(255,200,100,.3)" : T.bdG}`
    }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor" }} />
      AI: {label} ({score})
    </span>
  );
}

function toISTTime(d) {
  if (!d) return "—";
  try {
    const ist = new Date(new Date(d).getTime() + 5.5 * 60 * 60 * 1000);
    const hh  = String(ist.getUTCHours()).padStart(2, "0");
    const mi  = String(ist.getUTCMinutes()).padStart(2, "0");
    const ss  = String(ist.getUTCSeconds()).padStart(2, "0");
    return `${hh}:${mi}:${ss} IST`;
  } catch { return "—"; }
}

function SessionDetailModal({ session, onClose }) {
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const runAiAnalysis = async () => {
    setAiLoading(true);
    try {
      const res = await classifyLogWithAI(session);
      setAiAnalysis(res);
    } catch {
      setAiAnalysis({ reasoning: "Failed to classify session." });
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
        background: T.bg3, border: `1px solid ${T.bdG}`, borderRadius: 16, padding: 24, width: 580,
        maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto", position: "relative", boxShadow: `0 32px 80px rgba(0,0,0,.75)`
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${T.bdG2},transparent)` }} />
        <button onClick={onClose} style={{
          position: "absolute", top: 13, right: 13, width: 25, height: 25, background: T.bg4,
          border: `1px solid ${T.bd}`, borderRadius: 6, color: T.t3, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
        }}>✕</button>
        
        <div style={{ fontSize: 14, fontWeight: 700, color: T.t0, marginBottom: 15, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: T.g }}>◈</span> Session Detail — {session.session_id}
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9, marginBottom: 14 }}>
          {[
            ["User ID", session.user_id, T.t0],
            ["Risk Score", `${session.risk_score}/100`, session.risk_score >= 70 ? "#ff6666" : T.g],
            ["Status", session.status === "safe" ? "AI Safe" : "High Risk", session.status === "safe" ? T.g : "#ff6666"],
            ["Location", session.location, T.t0],
            ["Device", session.device, T.t0],
            ["Last Updated (IST)", toISTTime(session.last_updated), T.t0],
          ].map(([k, v, c]) => (
            <div key={k} style={{ background: T.cardIn, border: `1px solid ${T.bd}`, borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 9.5, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</div>
            </div>
          ))}
        </div>
        
        <div style={{ fontSize: 9.5, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Behavioral Fingerprint</div>
        <div style={{ background: T.bg1, border: `1px solid ${T.bd}`, borderRadius: 8, padding: 14, fontFamily: "monospace", fontSize: 11, color: T.t2, overflow: "auto" }}>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {JSON.stringify(session.behavioral_fingerprint, null, 2)}
          </pre>
        </div>

        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.bd}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.g, display: "flex", alignItems: "center", gap: 6 }}>
              <span>🤖</span> Gemini AI Session Classifier
            </div>
            <button onClick={runAiAnalysis} disabled={aiLoading}
              style={{ padding: "6px 14px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 8, color: T.g, fontSize: 11, fontWeight: 700, cursor: aiLoading ? "not-allowed" : "pointer" }}>
              {aiLoading ? "Classifying Session..." : "Classify Session with AI"}
            </button>
          </div>

          {aiAnalysis && (
            <div style={{ padding: 12, background: T.bg1, border: `1px solid ${T.bdG}`, borderRadius: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 800, background: aiAnalysis.classification === "SAFE" ? "rgba(57,255,60,.15)" : "rgba(255,100,100,.15)", color: aiAnalysis.classification === "SAFE" ? T.g : "#ff6666", border: `1px solid ${aiAnalysis.classification === "SAFE" ? T.bdG : "rgba(255,100,100,.3)"}` }}>
                  AI DETECTED: {aiAnalysis.classification || "SAFE"}
                </span>
                {aiAnalysis.confidence && <span style={{ fontSize: 10, color: T.t2 }}>Confidence: {aiAnalysis.confidence}%</span>}
              </div>
              <div style={{ fontSize: 11, color: T.t1, lineHeight: 1.6 }}>{aiAnalysis.reasoning || aiAnalysis.reply}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LiveSessions() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    const updateSessions = () => {
      setSessions(predictXData.getLiveSessions());
    };
    
    updateSessions();
    const unsub = predictXData.subscribe(updateSessions);
    
    return () => {
      unsub();
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
          <CLbl>Live Sessions</CLbl>
          <span style={{ fontSize: 10, color: T.t3, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.g, boxShadow: `0 0 6px ${T.g}`, animation: "pulse 2s ease-in-out infinite" }} />
            Auto-refresh: 3s
          </span>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
            <thead>
              <tr>
                {["Session ID", "User ID", "Risk", "Status", "Location", "Device", "Last Updated", ""].map(h => (
                  <th key={h} style={{ padding: "7px 9px", textAlign: "left", fontSize: 9, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${T.bd}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.session_id} onClick={() => setSelectedSession(s)}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(57,255,60,.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  style={{ cursor: "pointer", transition: "background .14s" }}>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", fontWeight: 700, color: T.g, fontFamily: "monospace", fontSize: 11 }}>{s.session_id}</td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", fontWeight: 600, color: T.t0 }}>{s.user_id}</td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)" }}><RiskBadge score={s.risk_score} /></td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", color: s.status === "safe" ? T.g : "#ffffff", fontSize: 10.5, fontWeight: 600 }}>
                    {s.poisoning_active ? "POISONING" : s.status}
                  </td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", color: T.t2, fontSize: 10.5 }}>{s.location}</td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", color: T.t3, fontSize: 10.5, whiteSpace: "nowrap" }}>{s.device}</td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", color: T.t3, fontSize: 10.5, fontFamily: "monospace" }}>{toISTTime(s.last_updated)}</td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)" }}>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedSession(s); }}
                      style={{ padding: "4px 10px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 999, color: T.g, fontSize: 10.5, fontWeight: 600, cursor: "pointer" }}>
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sessions.length === 0 && (
          <div style={{ textAlign: "center", padding: 36, color: T.t3, fontSize: 12 }}>
            No Cowrie sessions yet. Start Cowrie locally and generate traffic to populate this table.
          </div>
        )}
      </Card>
      
      {selectedSession && <SessionModal session={selectedSession} onClose={() => setSelectedSession(null)} />}
    </div>
  );
}
