import { useState } from "react";
import zeroClawApi from "../services/zeroClawApi";

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

export default function ForensicReportGenerator({ event, onClose }) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pdfData, setPdfData] = useState(null);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const generateReport = async () => {
    setGenerating(true);
    setProgress(0);
    setError(null);

    const steps = [
      { msg: "Gathering event data...", progress: 20 },
      { msg: "Computing cryptographic hash...", progress: 40 },
      { msg: "Retrieving AI model snapshot...", progress: 60 },
      { msg: "Building chain of custody...", progress: 80 },
      { msg: "Generating forensic PDF...", progress: 95 },
    ];

    for (const step of steps) {
      await new Promise(r => setTimeout(r, 400));
      setProgress(step.progress);
    }

    try {
      const response = await zeroClawApi.generateForensicPDF(event);
      setPdfData(response);
      setProgress(100);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (pdfData?.pdf) {
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${pdfData.pdf}`;
      link.download = `FORENSIC_REPORT_${pdfData.caseId || "EVENT"}.pdf`;
      link.click();
    } else if (pdfData?.pdfUrl) {
      window.open(pdfData.pdfUrl, "_blank");
    }
  };

  if (!event) {
    return (
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(3,7,3,.90)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}>
        <div onClick={e => e.stopPropagation()} style={{ background: T.bg3, border: `1px solid ${T.bdG}`, borderRadius: 16, padding: 24, width: 500, maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto", position: "relative", boxShadow: `0 32px 80px rgba(0,0,0,.75)` }}>
          <button onClick={onClose} style={{ position: "absolute", top: 13, right: 13, width: 25, height: 25, background: T.bg4, border: `1px solid ${T.bd}`, borderRadius: 6, color: T.t3, fontSize: 13, cursor: "pointer" }}>✕</button>
          <div style={{ textAlign: "center", color: T.t3, padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.t1, marginBottom: 8 }}>No Event Selected</div>
            <div style={{ fontSize: 12 }}>Select an event from the Attack Feed or Chain of Custody to generate a forensic report.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(3,7,3,.90)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg3, border: `1px solid ${T.bdG}`, borderRadius: 16, padding: 24, width: 600, maxWidth: "92vw", maxHeight: "90vh", overflowY: "auto", position: "relative", boxShadow: `0 32px 80px rgba(0,0,0,.75)` }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${T.bdG2},transparent)` }} />
        <button onClick={onClose} style={{ position: "absolute", top: 13, right: 13, width: 25, height: 25, background: T.bg4, border: `1px solid ${T.bd}`, borderRadius: 6, color: T.t3, fontSize: 13, cursor: "pointer" }}>✕</button>

        <div style={{ fontSize: 14, fontWeight: 700, color: T.t0, marginBottom: 15, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: T.g }}>◈</span> Forensic Report Generator
        </div>

        {/* Event Summary */}
        <div style={{ background: T.bg1, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Selected Event</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              ["Event Type", event.eventid?.replace("cowrie.", "") || "unknown"],
              ["Source IP", event.src_ip || "—"],
              ["Username", event.username || "—"],
              ["Session", event.session?.substring(0, 12) || "—"],
              ["Timestamp", event.timestamp?.replace("T", " ").replace("Z", "") || "—"],
              ["Hash", event.sha256?.substring(0, 16) + "..." || "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 9.5, color: T.t3, textTransform: "uppercase" }}>{k}</div>
                <div style={{ fontSize: 12, color: T.t1, fontFamily: "monospace" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Generation Progress */}
        {generating && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: T.t3, letterSpacing: 1 }}>GENERATING FORENSIC REPORT</span>
              <span style={{ fontSize: 10, color: T.g, fontWeight: 600 }}>{progress}%</span>
            </div>
            <div style={{ height: 5, background: "rgba(255,255,255,.05)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg,${T.g},rgba(57,255,60,.6))`, borderRadius: 3, transition: "width .3s" }} />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 16, padding: 12, background: "rgba(255,100,100,.1)", border: `1px solid rgba(255,100,100,.3)`, borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: "#ff6666", marginBottom: 4 }}>Failed to generate report</div>
            <div style={{ fontSize: 11, color: T.t3 }}>{error}</div>
            <button onClick={generateReport} style={{ marginTop: 8, padding: "6px 12px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 6, color: T.g, fontSize: 11, cursor: "pointer" }}>Retry</button>
          </div>
        )}

        {/* PDF Generated */}
        {pdfData && !generating && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 24 }}>✓</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.g }}>Report Generated Successfully</div>
                <div style={{ fontSize: 11, color: T.t2 }}>Case ID: {pdfData.caseId || "CASE-F-XXXX"}</div>
              </div>
              {pdfData.reportText && (
                <button onClick={() => setShowPreview(v => !v)} style={{ padding: "5px 10px", background: T.bg2, border: `1px solid ${T.bd}`, borderRadius: 6, color: T.t2, fontSize: 10, cursor: "pointer", flexShrink: 0 }}>
                  {showPreview ? "Hide Preview" : "Preview Report"}
                </button>
              )}
            </div>

            {pdfData.verificationHash && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9.5, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Verification Hash</div>
                <div style={{ background: T.bg1, border: `1px solid ${T.bd}`, borderRadius: 6, padding: 8, fontFamily: "monospace", fontSize: 10, color: T.t2, wordBreak: "break-all" }}>
                  {pdfData.verificationHash}
                </div>
              </div>
            )}

            {showPreview && pdfData.reportText && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9.5, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Report Preview</div>
                <div style={{ background: T.bg1, border: `1px solid ${T.bd}`, borderRadius: 8, padding: "12px 14px", fontSize: 11, color: T.t1, lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 320, overflowY: "auto" }}>
                  {pdfData.reportText}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          {!pdfData && !generating && (
            <button onClick={generateReport} style={{ flex: 1, padding: "12px", background: T.g, border: "none", borderRadius: 8, color: T.bg0, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span>📋</span> Generate Forensic PDF
            </button>
          )}
          {pdfData && (
            <button onClick={downloadPDF} style={{ flex: 1, padding: "12px", background: T.g, border: "none", borderRadius: 8, color: T.bg0, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span>⬇</span> Download PDF
            </button>
          )}
          {pdfData && (
            <button onClick={() => { setPdfData(null); setProgress(0); }} style={{ padding: "12px 16px", background: T.bg2, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.t2, fontSize: 12, cursor: "pointer" }}>
              Generate Another
            </button>
          )}
        </div>

        {/* Report Contents Preview */}
        <div style={{ marginTop: 20 }}>
          <CLbl>Report Contents</CLbl>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { icon: "◈", title: "Event Details", desc: "Timestamp, IP, username, session, commands" },
              { icon: "◇", title: "Cryptographic Verification", desc: "SHA256 hash, hardware signature" },
              { icon: "⬡", title: "AI Model Snapshot", desc: "SageMaker decision, confidence, factors" },
              { icon: "◎", title: "Chain of Custody", desc: "Full timeline from honeypot to QLDB" },
              { icon: "✓", title: "Court-Admissible Header", desc: "Case ID, classification, investigator info" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 10px", background: T.bg1, borderRadius: 6, border: `1px solid ${T.bd}` }}>
                <span style={{ color: T.g, fontSize: 14 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: T.t1 }}>{item.title}</div>
                  <div style={{ fontSize: 10, color: T.t3 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
