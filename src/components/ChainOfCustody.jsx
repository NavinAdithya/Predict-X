import { useState, useEffect, useCallback } from "react";
import honeypotApi from "../services/honeypotApi";
import ForensicReportGenerator from "./ForensicReportGenerator";
import { verifyEvidence } from "../services/zeroClawApi";

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

function TypeBadge({ type }) {
  const isEvent = type === "EVENT";
  return (
    <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, background: isEvent ? T.gDim : "rgba(255,200,100,.10)", color: isEvent ? T.g : "#ffcc66", border: `1px solid ${isEvent ? T.bdG : "rgba(255,200,100,.3)"}` }}>
      {type}
    </span>
  );
}

function VerifyModal({ hash, onClose }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(!!hash);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (hash) {
      setLoading(true);
      setError(null);
      setResult(null);
      honeypotApi.verifyHash(hash)
        .then(data => setResult(data))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [hash, retryCount]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(3,7,3,.90)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg3, border: `1px solid ${T.bdG}`, borderRadius: 16, padding: 24, width: 500, maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto", position: "relative", boxShadow: `0 32px 80px rgba(0,0,0,.75)` }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${T.bdG2},transparent)` }} />
        <button onClick={onClose} style={{ position: "absolute", top: 13, right: 13, width: 25, height: 25, background: T.bg4, border: `1px solid ${T.bd}`, borderRadius: 6, color: T.t3, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        
        <div style={{ fontSize: 14, fontWeight: 700, color: T.t0, marginBottom: 15, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: T.g }}>◈</span> Tamper Verification
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: T.t3 }}>
            <div style={{ marginBottom: 10 }}>Verifying hash integrity...</div>
            <div style={{ fontSize: 11, fontFamily: "monospace", color: T.t4 }}>{hash?.substring(0, 20)}...</div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: 20 }}>
            <div style={{ color: "#ff6666", marginBottom: 6 }}>Verification failed</div>
            <div style={{ fontSize: 11, color: T.t3, marginBottom: 14, background: T.bg1, border: `1px solid rgba(255,100,100,.2)`, borderRadius: 8, padding: "10px 12px", textAlign: "left", fontFamily: "monospace" }}>{error}</div>
            <button
              onClick={() => setRetryCount(c => c + 1)}
              style={{ padding: "8px 16px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 8, color: T.g, fontSize: 12, cursor: "pointer" }}
            >Retry</button>
          </div>
        )}

        {result && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, background: result.verified ? T.gDim : "rgba(255,100,100,.1)", border: `1px solid ${result.verified ? T.bdG : "rgba(255,100,100,.3)"}`, borderRadius: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 24 }}>{result.verified ? "✓" : "✗"}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: result.verified ? T.g : "#ff6666" }}>{result.verified ? "Hash Verified" : "Verification Failed"}</div>
                <div style={{ fontSize: 11, color: T.t2 }}>{result.message}</div>
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9.5, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Hash</div>
              <div style={{ background: T.bg1, border: `1px solid ${T.bd}`, borderRadius: 8, padding: 10, fontFamily: "monospace", fontSize: 11, color: T.t2, wordBreak: "break-all" }}>
                {result.hash}
              </div>
            </div>

            {result.records && result.records.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9.5, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Associated Records</div>
                <div style={{ background: T.bg1, border: `1px solid ${T.bd}`, borderRadius: 8, padding: 10, maxHeight: 160, overflowY: "auto" }}>
                  {result.records.map((r, i) => (
                    <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.025)", fontSize: 11 }}>
                      <div style={{ color: T.t1, fontFamily: "monospace" }}>{r.event_id || r.eventid}</div>
                      <div style={{ color: T.t3, fontSize: 10 }}>{r.timestamp}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.bd}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.g, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>🤖</span> Gemini AI Evidence Analysis
                </div>
                <button
                  onClick={async () => {
                    try {
                      const res = await verifyEvidence(result.hash);
                      setResult(prev => ({ ...prev, aiAnalysis: res.reply }));
                    } catch {
                      setResult(prev => ({ ...prev, aiAnalysis: "AI evidence check unavailable." }));
                    }
                  }}
                  style={{ padding: "6px 14px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 8, color: T.g, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  Analyze Hash with AI
                </button>
              </div>
              {result.aiAnalysis && (
                <div style={{ padding: 12, background: T.bg1, border: `1px solid ${T.bdG}`, borderRadius: 10, fontSize: 11, color: T.t1, lineHeight: 1.6 }}>
                  {result.aiAnalysis}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const FILTER_TABS = [
  { label: "All", value: "" },
  { label: "EVENT", value: "EVENT" },
  { label: "FILE_HASH", value: "FILE_HASH" },
];

function formatTs(ts) {
  if (!ts) return { date: "—", time: "—" };
  const utc = new Date(ts);
  if (isNaN(utc.getTime())) return { date: ts, time: "" };
  // Convert to IST = UTC + 5h 30m
  const ist = new Date(utc.getTime() + (5 * 60 + 30) * 60 * 1000);
  const yyyy = ist.getUTCFullYear();
  const mm   = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const dd   = String(ist.getUTCDate()).padStart(2, "0");
  const hh   = String(ist.getUTCHours()).padStart(2, "0");
  const mi   = String(ist.getUTCMinutes()).padStart(2, "0");
  const ss   = String(ist.getUTCSeconds()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}:${ss}` };
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

export default function ChainOfCustody() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [verifyHash, setVerifyHash] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showPdfGenerator, setShowPdfGenerator] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (filter) params.type = filter;
      
      const data = await honeypotApi.getCustody(params);
      const sorted = (data.records || []).slice().sort((a, b) => {
        const ta = new Date(a.timestamp || 0).getTime();
        const tb = new Date(b.timestamp || 0).getTime();
        return tb - ta; // store newest-first; UI sort flips display
      });
      setRecords(sorted);
      setTotal(data.total || 0);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRecords();
    const interval = setInterval(fetchRecords, 30000);
    return () => clearInterval(interval);
  }, [fetchRecords]);

  if (loading && records.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Card><div style={{ color: T.t3, textAlign: "center", padding: 40 }}>Loading chain of custody records...</div></Card>
      </div>
    );
  }

  if (error && records.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Card>
          <div style={{ textAlign: "center", padding: 20 }}>
            <div style={{ color: "#ff6666", marginBottom: 10 }}>Failed to load records</div>
            <div style={{ fontSize: 11, color: T.t3, marginBottom: 12 }}>{error}</div>
            <button onClick={fetchRecords} style={{ padding: "8px 16px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 8, color: T.g, fontSize: 12, cursor: "pointer" }}>Retry</button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 999, padding: "3px 10px", fontSize: 10, fontWeight: 600, color: T.g }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.g, boxShadow: `0 0 6px ${T.g}`, animation: "pulse 2s ease-in-out infinite" }} />
            CHAIN OF CUSTODY
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.t0 }}>Cryptographic Evidence Log</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: T.t3 }}>Total: {total.toLocaleString()} · Last: {toISTTime(lastRefresh)}</span>
          <button onClick={fetchRecords} disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 11px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 6, color: T.g, fontSize: 10.5, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, whiteSpace: "nowrap" }}>
            ↻ Reload
          </button>
        </div>
      </div>

      <Card glow>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {FILTER_TABS.map(tab => (
              <button key={tab.value} onClick={() => setFilter(tab.value)}
                style={{ padding: "5px 12px", background: filter === tab.value ? T.gDim : "transparent", border: `1px solid ${filter === tab.value ? T.bdG : T.bd}`, borderRadius: 999, color: filter === tab.value ? T.g : T.t3, fontSize: 10.5, fontWeight: 600, cursor: "pointer", transition: "all .18s" }}>
                {tab.label}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: "auto" }}>
            <button onClick={() => setSortOrder(o => o === "desc" ? "asc" : "desc")}
              title={sortOrder === "desc" ? "Newest first — click for oldest first" : "Oldest first — click for newest first"}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 6, color: T.g, fontSize: 10.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
              {sortOrder === "desc" ? "↓ Newest" : "↑ Oldest"}
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
            <thead>
              <tr>
                {["Event ID", "Date (IST)", "Time (IST)", "Source IP", "Username", "Type", "SHA256 Hash", ""].map(h => (
                  <th key={h} style={{ padding: "7px 9px", textAlign: "left", fontSize: 9, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${T.bd}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(sortOrder === "desc" ? records : [...records].reverse()).map((record, i) => {
                const { date, time } = formatTs(record.timestamp);
                return (
                <tr key={i}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(57,255,60,.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  style={{ transition: "background .14s" }}>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", fontFamily: "monospace", fontSize: 10, color: T.g }}>{record.event_id?.substring(0, 20)}...</td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", fontFamily: "monospace", fontSize: 10.5, color: T.t2, whiteSpace: "nowrap" }}>
                    {date}
                  </td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", fontFamily: "monospace", fontSize: 10.5, color: T.g, whiteSpace: "nowrap", fontWeight: 600 }}>
                    {time}
                  </td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", fontFamily: "monospace", fontSize: 11, color: T.t1 }}>{record.src_ip || "—"}</td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", color: T.t2, fontFamily: "monospace" }}>{record.username || "—"}</td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)" }}><TypeBadge type={record.record_type} /></td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", fontFamily: "monospace", fontSize: 10, color: T.t3, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }} title={record.sha256_hash}>
                    {record.sha256_hash?.substring(0, 16)}...
                  </td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)" }}>
                    <button onClick={() => setVerifyHash(record.sha256_hash)}
                      style={{ padding: "3px 8px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 5, color: T.g, fontSize: 10, cursor: "pointer", marginRight: 4 }}>
                      Verify
                    </button>
                    <button onClick={() => { setSelectedRecord(record); setShowPdfGenerator(true); }}
                      style={{ padding: "3px 8px", background: "rgba(255,200,100,.1)", border: `1px solid rgba(255,200,100,.3)`, borderRadius: 5, color: "#ffcc66", fontSize: 10, cursor: "pointer" }}>
                      📋
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card>
          <CLbl>DynamoDB Storage</CLbl>
          {[["Total Records", total.toLocaleString()], ["Record Types", "EVENT, FILE_HASH"], ["Encryption", "AWS Managed"], ["Backup", "Continuous"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.025)" }}>
              <span style={{ fontSize: 11.5, color: T.t3 }}>{k}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.g }}>{v}</span>
            </div>
          ))}
        </Card>
        <Card>
          <CLbl>Integrity Verification</CLbl>
          <div style={{ fontSize: 11, color: T.t2, lineHeight: 1.7, marginBottom: 12 }}>
            Every event is hashed with SHA-256 before storage. Use the verify button to confirm log integrity.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.g, boxShadow: `0 0 6px ${T.g}` }} />
            <span style={{ fontSize: 11, color: T.g }}>All records cryptographically sealed</span>
          </div>
        </Card>
      </div>

      {verifyHash && (
        <VerifyModal hash={verifyHash} onClose={() => setVerifyHash(null)} />
      )}

      {showPdfGenerator && selectedRecord && (
        <ForensicReportGenerator event={selectedRecord} onClose={() => setShowPdfGenerator(false)} />
      )}
    </div>
  );
}
