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

function BehavioralFingerprintModal({ data, onClose }) {
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
          <span style={{ color: T.g }}>◈</span> Behavioral Fingerprint
        </div>
        
        <div style={{ background: T.bg1, border: `1px solid ${T.bd}`, borderRadius: 8, padding: 14, fontFamily: "monospace", fontSize: 11, color: T.t2, overflow: "auto" }}>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
        
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {Object.entries(data.keystroke_profile || {}).map(([k, v]) => (
            <div key={k} style={{ background: T.cardIn, border: `1px solid ${T.bd}`, borderRadius: 6, padding: 8 }}>
              <div style={{ fontSize: 9, color: T.t3, textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.g }}>{typeof v === "number" ? v.toFixed(2) : v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SafeUserRedirects() {
  const [redirects, setRedirects] = useState([]);
  const [selectedFingerprint, setSelectedFingerprint] = useState(null);

  useEffect(() => {
    const updateRedirects = () => {
      setRedirects(predictXData.getSafeRedirects());
    };
    
    updateRedirects();
    const unsub = predictXData.subscribe(updateRedirects);
    
    return () => unsub();
  }, []);

  const getPartnerName = (url) => {
    if (url.includes("aws.amazon.com")) return "AWS Academy";
    if (url.includes("kyndryl.com")) return "Kyndryl Careers";
    if (url.includes("partner")) return "Partner Site";
    return "External";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
          <CLbl>Safe User Redirects</CLbl>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 9.5, fontWeight: 700, background: "rgba(57,255,60,.12)", color: T.g, border: `1px solid ${T.bdG}` }}>
              AI Status: SAFE SORTED
            </span>
            <span style={{ fontSize: 10, color: T.t3 }}>{redirects.length} safe redirects detected</span>
          </div>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
            <thead>
              <tr>
                {["User ID", "AI Score", "Classification", "Destination", "Partner", "Timestamp", ""].map(h => (
                  <th key={h} style={{ padding: "7px 9px", textAlign: "left", fontSize: 9, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${T.bd}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {redirects.map((r, idx) => (
                <tr key={idx}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(57,255,60,.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  style={{ transition: "background .14s" }}>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", fontWeight: 700, color: T.t0 }}>{r.user_id}</td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 600, background: "rgba(57,255,60,.10)", color: T.g, border: "1px solid rgba(57,255,60,.24)" }}>
                      {r.risk_score}
                    </span>
                  </td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 9.5, fontWeight: 700, background: "rgba(57,255,60,.15)", color: T.g, border: `1px solid ${T.bdG}` }}>
                      SAFE
                    </span>
                  </td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", color: T.t2, fontFamily: "monospace", fontSize: 10.5, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{r.redirect_url}</td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, background: T.gDim, color: T.g, border: `1px solid ${T.bdG}` }}>
                      {getPartnerName(r.redirect_url)}
                    </span>
                  </td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", color: T.t3, fontSize: 10.5, fontFamily: "monospace" }}>{new Date(r.timestamp).toLocaleString()}</td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)" }}>
                    <button onClick={() => setSelectedFingerprint(r.behavioral_fingerprint)}
                      style={{ padding: "4px 10px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 999, color: T.g, fontSize: 10.5, fontWeight: 600, cursor: "pointer" }}>
                      View Fingerprint
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {redirects.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: T.t3, fontSize: 12 }}>
            No safe user traffic detected yet in the current live Cowrie logs.
          </div>
        )}
      </Card>
      
      {selectedFingerprint && (
        <BehavioralFingerprintModal data={selectedFingerprint} onClose={() => setSelectedFingerprint(null)} />
      )}
    </div>
  );
}
