import { useState, useEffect, useCallback } from "react";
import honeypotApi from "../services/honeypotApi";
import ForensicReportGenerator from "./ForensicReportGenerator";
import { classifyLogWithAI } from "../services/zeroClawApi";

const T = {
  bg0: "#050c06", bg1: "#071008", bg2: "#091409", bg3: "#0c1a0d", bg4: "#0f1f10", bg5: "#132413",
  card: "#0d1a0e", cardIn: "#0a1509",
  g: "#39ff3c", gDim: "rgba(57,255,60,0.10)", gDim2: "rgba(57,255,60,0.05)",
  bd: "rgba(255,255,255,0.055)", bdG: "rgba(57,255,60,0.18)", bdG2: "rgba(57,255,60,0.35)",
  t0: "#ffffff", t1: "#c5dac6", t2: "#8aaa8b", t3: "#4e6b4f", t4: "#263827",
};

// ── Risk config ───────────────────────────────────────────────────────────────
const RISK = {
  critical: { label: "CRITICAL", bg: "rgba(255,50,50,.15)",  border: "rgba(255,50,50,.4)",  color: "#ff4444" },
  mid:      { label: "MID",      bg: "rgba(255,150,30,.12)", border: "rgba(255,150,30,.35)", color: "#ff9621" },
  low:      { label: "LOW",      bg: "rgba(255,220,60,.10)", border: "rgba(255,220,60,.3)",  color: "#ffdd3c" },
  safe:     { label: "SAFE",     bg: "rgba(57,255,60,.10)",  border: "rgba(57,255,60,.28)",  color: "#39ff3c" },
};

// ── ML risk classifier ────────────────────────────────────────────────────────
// Placeholder: uses rule-based heuristics. Replace classifyEvent() body
// with your ML API call (async or sync) when the model is ready.
function classifyEvent(event) {
  const type  = (event.eventid  || "").toLowerCase();
  const user  = (event.username || "").toLowerCase();
  const pass  = (event.password || "").toLowerCase();
  const input = (event.input    || "").toLowerCase();

  if (
    type.includes("exec") ||
    input.includes("wget") || input.includes("curl") || input.includes("chmod") ||
    input.includes("/etc/passwd") || input.includes("bash -i") ||
    input.includes("rm -rf") || input.includes("/bin/sh") ||
    (user === "root" && type.includes("success"))
  ) return "critical";

  if (
    type.includes("login.success") ||
    input.includes("sudo") || input.includes("su ") || input.includes("cat /") ||
    input.includes("python") || input.includes("perl") || input.includes("nc ")
  ) return "mid";

  if (
    type.includes("login.failed") ||
    type.includes("command") ||
    user === "admin" || user === "root" || user === "test" ||
    pass === "123456" || pass === "password" || pass === "admin"
  ) return "low";

  if (type.includes("connect") || type.includes("session")) return "safe";
  return "low";
}
// ─────────────────────────────────────────────────────────────────────────────

function Card({ children, style = {}, glow = false }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: T.card, border: `1px solid ${hov || glow ? T.bdG : T.bd}`,
        borderRadius: 14, padding: "17px 19px", position: "relative",
        overflow: "hidden", transition: "all .22s",
        transform: hov ? "translateY(-1px)" : "none",
        boxShadow: hov ? `0 8px 32px rgba(0,0,0,.45),0 0 0 1px rgba(57,255,60,.08)` : glow ? `0 0 24px rgba(57,255,60,.12)` : "none", ...style
      }}>
      <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: `linear-gradient(90deg,transparent,${T.bdG},transparent)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 18% 0%,rgba(57,255,60,${hov ? .07 : .035}),transparent 50%)`, pointerEvents: "none", transition: "all .22s" }} />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

function RiskBadge({ level }) {
  const r = RISK[level] || RISK.low;
  return (
    <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, background: r.bg, color: r.color, border: `1px solid ${r.border}`, letterSpacing: "0.4px" }}>
      {r.label}
    </span>
  );
}

function formatTs(ts) {
  if (!ts) return { date: "—", time: "—", full: "—" };
  const utc = new Date(ts);
  if (isNaN(utc.getTime())) return { date: ts, time: "", full: ts };
  const ist  = new Date(utc.getTime() + (5 * 60 + 30) * 60 * 1000);
  const yyyy = ist.getUTCFullYear();
  const mm   = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const dd   = String(ist.getUTCDate()).padStart(2, "0");
  const hh   = String(ist.getUTCHours()).padStart(2, "0");
  const mi   = String(ist.getUTCMinutes()).padStart(2, "0");
  const ss   = String(ist.getUTCSeconds()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}:${ss}`, full: `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss} IST` };
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

function EventBadge({ eventType }) {
  const getColor = () => {
    if (eventType?.includes("success")) return { bg: "rgba(57,255,60,.10)",   color: T.g,       border: T.bdG };
    if (eventType?.includes("failed"))  return { bg: "rgba(255,100,100,.10)", color: "#ff6666", border: "rgba(255,100,100,.3)" };
    if (eventType?.includes("command")) return { bg: "rgba(255,200,100,.10)", color: "#ffcc66", border: "rgba(255,200,100,.3)" };
    if (eventType?.includes("connect")) return { bg: "rgba(100,150,255,.10)", color: "#6699ff", border: "rgba(100,150,255,.3)" };
    return { bg: "rgba(255,255,255,.05)", color: T.t2, border: T.bd };
  };
  const c = getColor();
  return (
    <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {eventType?.replace("cowrie.", "") || "unknown"}
    </span>
  );
}

function EventDetailModal({ event, onClose }) {
  if (!event) return null;
  const { full } = formatTs(event.timestamp);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const runAiClassification = async () => {
    setAiLoading(true);
    try {
      const res = await classifyLogWithAI(event);
      setAiAnalysis(res);
    } catch {
      setAiAnalysis({ reasoning: "Failed to run AI classification." });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(3,7,3,.90)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg3, border: `1px solid ${T.bdG}`, borderRadius: 16, padding: 24, width: 600, maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto", position: "relative", boxShadow: `0 32px 80px rgba(0,0,0,.75)` }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${T.bdG2},transparent)` }} />
        <button onClick={onClose} style={{ position: "absolute", top: 13, right: 13, width: 25, height: 25, background: T.bg4, border: `1px solid ${T.bd}`, borderRadius: 6, color: T.t3, fontSize: 13, cursor: "pointer" }}>✕</button>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.t0, marginBottom: 15, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: T.g }}>◈</span> Event Detail
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 9, marginBottom: 14 }}>
          {[
            ["Event ID",         event.eventid,  T.t0],
            ["Timestamp (IST)",  full,            T.t1],
            ["Source IP",        event.src_ip,    T.g],
            ["Session",          event.session,   T.t2],
            ["Username",         event.username,  T.t0],
            ["Password",         event.password,  T.t2],
          ].map(([k, v, c]) => (
            <div key={k} style={{ background: T.cardIn, border: `1px solid ${T.bd}`, borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 9.5, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: c, fontFamily: k === "Session" || k === "Password" ? "monospace" : "inherit", wordBreak: "break-all" }}>{v || "—"}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9.5, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>SHA256 Hash</div>
          {event.sha256 ? (
            <div style={{ background: T.bg1, border: `1px solid ${T.bd}`, borderRadius: 8, padding: 10, fontFamily: "monospace", fontSize: 11, color: T.t2, wordBreak: "break-all" }}>{event.sha256}</div>
          ) : (
            <div style={{ background: T.bg1, border: `1px solid ${T.bd}`, borderRadius: 8, padding: 10, fontSize: 11, color: T.t3, fontStyle: "italic" }}>No hash recorded for this event type</div>
          )}
        </div>

        {event.input && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9.5, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Input Command</div>
            <div style={{ background: T.bg1, border: `1px solid ${T.bd}`, borderRadius: 8, padding: 10, fontFamily: "monospace", fontSize: 11, color: "#ffcc66" }}>{event.input}</div>
          </div>
        )}

        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.bd}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.g, display: "flex", alignItems: "center", gap: 6 }}>
              <span>🤖</span> Gemini AI Safety Classifier
            </div>
            <button onClick={runAiClassification} disabled={aiLoading}
              style={{ padding: "6px 14px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 8, color: T.g, fontSize: 11, fontWeight: 700, cursor: aiLoading ? "not-allowed" : "pointer" }}>
              {aiLoading ? "Analyzing Log with AI..." : "Run AI Classification"}
            </button>
          </div>

          {aiAnalysis && (
            <div style={{ padding: 12, background: T.bg1, border: `1px solid ${T.bdG}`, borderRadius: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 800, background: aiAnalysis.classification === "SAFE" ? "rgba(57,255,60,.15)" : "rgba(255,100,100,.15)", color: aiAnalysis.classification === "SAFE" ? T.g : "#ff6666", border: `1px solid ${aiAnalysis.classification === "SAFE" ? T.bdG : "rgba(255,100,100,.3)"}` }}>
                  AI DETECTED: {aiAnalysis.classification || "ANALYZED"}
                </span>
                {aiAnalysis.confidence && <span style={{ fontSize: 10, color: T.t2 }}>Confidence: {aiAnalysis.confidence}%</span>}
                {aiAnalysis.risk_score !== undefined && <span style={{ fontSize: 10, color: T.t3 }}>Risk Score: {aiAnalysis.risk_score}/100</span>}
              </div>
              <div style={{ fontSize: 11, color: T.t1, lineHeight: 1.6 }}>{aiAnalysis.reasoning || aiAnalysis.reply}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VerifyModal({ hash, onClose }) {
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(!!hash);
  const [error,      setError]      = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!hash) return;
    honeypotApi.verifyHash(hash)
      .then(data  => { setResult(data); setError(null); })
      .catch(err  => { setError(err.message); setResult(null); })
      .finally(() => setLoading(false));
  }, [hash, retryCount]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(3,7,3,.90)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg3, border: `1px solid ${T.bdG}`, borderRadius: 16, padding: 24, width: 520, maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto", position: "relative", boxShadow: `0 32px 80px rgba(0,0,0,.75)` }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${T.bdG2},transparent)` }} />
        <button onClick={onClose} style={{ position: "absolute", top: 13, right: 13, width: 25, height: 25, background: T.bg4, border: `1px solid ${T.bd}`, borderRadius: 6, color: T.t3, fontSize: 13, cursor: "pointer" }}>✕</button>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.t0, marginBottom: 15, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: T.g }}>◈</span> Tamper Verification
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9.5, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Hash being verified</div>
          <div style={{ background: T.bg1, border: `1px solid ${T.bd}`, borderRadius: 8, padding: 10, fontFamily: "monospace", fontSize: 10.5, color: T.t3, wordBreak: "break-all" }}>{hash}</div>
        </div>
        {loading && (
          <div style={{ textAlign: "center", padding: 32, color: T.t3 }}>
            <div style={{ marginBottom: 10, fontSize: 13 }}>Verifying hash integrity...</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: T.g, animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i*0.2}s` }} />)}
            </div>
          </div>
        )}
        {error && !loading && (
          <div style={{ textAlign: "center", padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#ff6666", marginBottom: 8 }}>Verification request failed</div>
            <div style={{ fontSize: 11, color: T.t3, marginBottom: 14, background: T.bg1, border: `1px solid rgba(255,100,100,.2)`, borderRadius: 8, padding: "10px 12px", textAlign: "left", fontFamily: "monospace" }}>{error}</div>
            <button onClick={() => { setLoading(true); setError(null); setResult(null); setRetryCount(c => c + 1); }} style={{ padding: "8px 18px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 8, color: T.g, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Retry</button>
          </div>
        )}
        {result && !loading && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, background: result.verified ? T.gDim : "rgba(255,100,100,.1)", border: `1px solid ${result.verified ? T.bdG : "rgba(255,100,100,.3)"}`, borderRadius: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 26 }}>{result.verified ? "✓" : "✗"}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: result.verified ? T.g : "#ff6666" }}>{result.verified ? "Hash Verified — Untampered" : "Verification Failed"}</div>
                <div style={{ fontSize: 11, color: T.t2, marginTop: 2 }}>{result.message}</div>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9.5, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Verified Hash</div>
              <div style={{ background: T.bg1, border: `1px solid ${T.bd}`, borderRadius: 8, padding: 10, fontFamily: "monospace", fontSize: 11, color: T.t2, wordBreak: "break-all" }}>{result.hash || hash}</div>
            </div>
            {result.records && result.records.length > 0 && (
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Associated Records ({result.records.length})</div>
                <div style={{ background: T.bg1, border: `1px solid ${T.bd}`, borderRadius: 8, padding: 10, maxHeight: 200, overflowY: "auto" }}>
                  {result.records.map((r, i) => (
                    <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.025)", fontSize: 11 }}>
                      <div style={{ color: T.t1, fontFamily: "monospace" }}>{r.event_id || r.eventid}</div>
                      <div style={{ color: T.t3, fontSize: 10 }}>{formatTs(r.timestamp).full}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Filter tab configs ────────────────────────────────────────────────────────
const EVENT_FILTER_TABS = [
  { label: "All Events",    value: "" },
  { label: "Login Success", value: "login.success" },
  { label: "Login Failed",  value: "login.failed" },
  { label: "Commands",      value: "command.input" },
  { label: "Connections",   value: "session.connect" },
];

const RISK_FILTER_TABS = [
  { label: "All",      value: "" },
  { label: "Critical", value: "critical" },
  { label: "Mid",      value: "mid" },
  { label: "Low",      value: "low" },
  { label: "Safe",     value: "safe" },
];

// ── Shared log table (used by All Logs + Suspicious tabs) ────────────────────
const PAGE_SIZE_OPTIONS = [25, 50, 100];

function Paginator({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;

  // Build window: always show first, last, current ±2, with ellipsis gaps
  const pages = [];
  const addPage = n => { if (!pages.includes(n) && n >= 0 && n < totalPages) pages.push(n); };
  addPage(0);
  addPage(totalPages - 1);
  for (let i = page - 2; i <= page + 2; i++) addPage(i);
  pages.sort((a, b) => a - b);

  const btnBase = { padding: "4px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${T.bd}`, transition: "all .15s", minWidth: 32, textAlign: "center" };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 14, flexWrap: "wrap" }}>
      <button onClick={() => onPage(0)} disabled={page === 0}
        style={{ ...btnBase, background: page === 0 ? T.bg1 : T.bg2, color: page === 0 ? T.t4 : T.t2, cursor: page === 0 ? "not-allowed" : "pointer" }}>
        «
      </button>
      <button onClick={() => onPage(page - 1)} disabled={page === 0}
        style={{ ...btnBase, background: page === 0 ? T.bg1 : T.bg2, color: page === 0 ? T.t4 : T.t2, cursor: page === 0 ? "not-allowed" : "pointer" }}>
        ‹
      </button>

      {pages.map((p, i) => {
        const gap = i > 0 && p - pages[i - 1] > 1;
        return (
          <span key={p} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {gap && <span style={{ color: T.t4, fontSize: 11, padding: "0 2px" }}>…</span>}
            <button onClick={() => onPage(p)}
              style={{ ...btnBase, background: p === page ? T.g : T.bg2, color: p === page ? T.bg0 : T.t2, border: `1px solid ${p === page ? T.g : T.bd}`, boxShadow: p === page ? `0 0 10px rgba(57,255,60,.3)` : "none" }}>
              {p + 1}
            </button>
          </span>
        );
      })}

      <button onClick={() => onPage(page + 1)} disabled={page === totalPages - 1}
        style={{ ...btnBase, background: page === totalPages - 1 ? T.bg1 : T.bg2, color: page === totalPages - 1 ? T.t4 : T.t2, cursor: page === totalPages - 1 ? "not-allowed" : "pointer" }}>
        ›
      </button>
      <button onClick={() => onPage(totalPages - 1)} disabled={page === totalPages - 1}
        style={{ ...btnBase, background: page === totalPages - 1 ? T.bg1 : T.bg2, color: page === totalPages - 1 ? T.t4 : T.t2, cursor: page === totalPages - 1 ? "not-allowed" : "pointer" }}>
        »
      </button>
    </div>
  );
}

function LogTable({ events, total, loading, error, onRetry, onInspect, onReport, showRisk, sortOrder, setSortOrder, filter, setFilter, ipFilter, setIpFilter, riskFilter, setRiskFilter }) {
  const [page,     setPage]     = useState(0);
  const [pageSize, setPageSize] = useState(50);

  // Full sorted list — sort applies to ALL records before paging
  const sortedEvents = sortOrder === "desc" ? events : [...events].reverse();
  const totalPages   = Math.max(1, Math.ceil(sortedEvents.length / pageSize));

  // Reset to page 0 whenever the underlying list or order changes
  useEffect(() => { setPage(0); }, [events, sortOrder, filter, ipFilter, riskFilter, pageSize]);

  // Clamp page if list shrinks
  const safePage   = Math.min(page, totalPages - 1);
  const pageEvents = sortedEvents.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const startIdx   = safePage * pageSize + 1;
  const endIdx     = Math.min((safePage + 1) * pageSize, sortedEvents.length);

  const tabs = showRisk ? RISK_FILTER_TABS : EVENT_FILTER_TABS;
  const activeFilter = showRisk ? riskFilter : filter;
  const setActiveFilter = showRisk ? setRiskFilter : setFilter;

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", flex: 1 }}>
          {tabs.map(tab => (
            <button key={tab.value} onClick={() => setActiveFilter(tab.value)}
              style={{ padding: "4px 11px", background: activeFilter === tab.value ? T.gDim : "transparent", border: `1px solid ${activeFilter === tab.value ? T.bdG : T.bd}`, borderRadius: 999, color: activeFilter === tab.value ? T.g : T.t3, fontSize: 10.5, fontWeight: 600, cursor: "pointer", transition: "all .18s" }}>
              {tab.label}
            </button>
          ))}
        </div>
        <input type="text" value={ipFilter} onChange={e => setIpFilter(e.target.value)} placeholder="Filter by IP…"
          style={{ background: T.bg2, border: `1px solid ${T.bd}`, borderRadius: 6, padding: "4px 9px", fontSize: 11, color: T.t0, fontFamily: "monospace", width: 148, outline: "none" }} />
        <button onClick={() => setSortOrder(o => o === "desc" ? "asc" : "desc")}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 6, color: T.g, fontSize: 10.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
          {sortOrder === "desc" ? "↓ Newest" : "↑ Oldest"}
        </button>
      </div>

      {/* Row count + page-size picker */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
        <span style={{ fontSize: 10, color: T.t3 }}>
          Rows <strong style={{ color: T.t1 }}>{sortedEvents.length > 0 ? startIdx : 0}–{endIdx}</strong> of <strong style={{ color: T.t1 }}>{sortedEvents.length}</strong>
          {total > sortedEvents.length && <span style={{ color: T.t4 }}> (API total: {total})</span>}
          {" · "}Page <strong style={{ color: T.t1 }}>{safePage + 1}</strong> / <strong style={{ color: T.t1 }}>{totalPages}</strong>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {loading && <span style={{ fontSize: 10, color: T.g }}>Refreshing…</span>}
          <span style={{ fontSize: 10, color: T.t3 }}>Rows/page:</span>
          {PAGE_SIZE_OPTIONS.map(s => (
            <button key={s} onClick={() => setPageSize(s)}
              style={{ padding: "2px 8px", background: pageSize === s ? T.gDim : "transparent", border: `1px solid ${pageSize === s ? T.bdG : T.bd}`, borderRadius: 5, color: pageSize === s ? T.g : T.t3, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: "9px 12px", background: "rgba(255,100,100,.08)", border: `1px solid rgba(255,100,100,.25)`, borderRadius: 8, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "#ff6666" }}>{error}</span>
          <button onClick={onRetry} style={{ padding: "4px 12px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 6, color: T.g, fontSize: 11, cursor: "pointer" }}>Retry</button>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
          <thead>
            <tr>
              {["#", "Date (IST)", "Time (IST)", ...(showRisk ? ["Risk"] : []), "Event Type", "Source IP", "Username", "Password", "Session", "Actions"].map(h => (
                <th key={h} style={{ padding: "7px 9px", textAlign: "left", fontSize: 9, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${T.bd}`, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageEvents.length === 0 && !loading && (
              <tr><td colSpan={11} style={{ padding: 40, textAlign: "center", color: T.t3, fontSize: 12 }}>No events match the current filter.</td></tr>
            )}
            {pageEvents.map((event, i) => {
              const { date, time } = formatTs(event.timestamp);
              const rk  = event._risk;
              const r   = RISK[rk] || RISK.low;
              const rowN = startIdx + i;
              return (
                <tr key={i} onClick={() => onInspect(event)}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(57,255,60,.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  style={{ cursor: "pointer", transition: "background .14s", borderLeft: showRisk ? `3px solid ${r.border}` : "3px solid transparent" }}>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", fontFamily: "monospace", fontSize: 9.5, color: T.t4, whiteSpace: "nowrap" }}>{rowN}</td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", fontFamily: "monospace", fontSize: 10.5, color: T.t2, whiteSpace: "nowrap" }}>{date}</td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", fontFamily: "monospace", fontSize: 10.5, color: T.g, whiteSpace: "nowrap", fontWeight: 600 }}>{time}</td>
                  {showRisk && <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)" }}><RiskBadge level={rk} /></td>}
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)" }}><EventBadge eventType={event.eventid} /></td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", fontFamily: "monospace", fontSize: 11, color: T.g }}>{event.src_ip || "—"}</td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", color: T.t1, fontFamily: "monospace" }}>{event.username || "—"}</td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", color: T.t3, fontFamily: "monospace", fontSize: 10.5 }}>{event.password || "—"}</td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", color: T.t2, fontFamily: "monospace", fontSize: 10.5 }}>{event.session ? event.session.substring(0,10)+"…" : "—"}</td>
                  <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", whiteSpace: "nowrap" }}>
                    <button onClick={ev => { ev.stopPropagation(); onInspect(event); }} style={{ padding: "3px 7px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 5, color: T.g, fontSize: 9.5, cursor: "pointer", marginRight: 3 }}>Inspect</button>
                    <button onClick={ev => { ev.stopPropagation(); onReport(event); }} style={{ padding: "3px 7px", background: "rgba(255,200,100,.1)", border: `1px solid rgba(255,200,100,.3)`, borderRadius: 5, color: "#ffcc66", fontSize: 9.5, cursor: "pointer" }}>📋</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Paginator page={safePage} totalPages={totalPages} onPage={setPage} />
    </Card>
  );
}

// ── Hash Verification Tab ─────────────────────────────────────────────────────
function HashVerificationTab({ pendingHash, onClearPending }) {
  const [inputHash, setInputHash] = useState(pendingHash || "");
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [history,   setHistory]   = useState([]);

  useEffect(() => {
    if (pendingHash) { setInputHash(pendingHash); onClearPending(); }
  }, [pendingHash, onClearPending]);

  const doVerify = useCallback(async (hashOverride) => {
    const h = (hashOverride || inputHash).trim();
    if (!h) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await honeypotApi.verifyHash(h);
      setResult(data);
      setHistory(prev => [{ hash: h, ts: toISTTime(new Date()), verified: data.verified }, ...prev.slice(0, 9)]);
    } catch (err) { setError(err.message); }
    finally      { setLoading(false); }
  }, [inputHash]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14 }}>
      <Card glow>
        <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Hash Integrity Verification</div>
        <div style={{ fontSize: 11, color: T.t2, marginBottom: 10 }}>Paste a SHA256 hash from any log entry to verify it against the chain of custody in DynamoDB.</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input value={inputHash} onChange={e => setInputHash(e.target.value)} onKeyDown={e => e.key === "Enter" && doVerify()}
            placeholder="Paste SHA256 hash here…"
            style={{ flex: 1, background: T.bg2, border: `1px solid ${inputHash ? T.bdG : T.bd}`, borderRadius: 8, padding: "9px 12px", fontSize: 11, color: T.t0, fontFamily: "monospace", outline: "none", caretColor: T.g }} />
          <button onClick={() => doVerify()} disabled={!inputHash.trim() || loading}
            style={{ padding: "9px 18px", background: inputHash.trim() ? T.g : T.bg2, border: "none", borderRadius: 8, color: T.bg0, fontSize: 12, fontWeight: 700, cursor: inputHash.trim() ? "pointer" : "not-allowed", opacity: loading ? 0.7 : 1, whiteSpace: "nowrap" }}>
            {loading ? "Verifying…" : "Verify Hash"}
          </button>
        </div>

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: T.bg2, borderRadius: 10 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: T.g, animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i*0.2}s` }} />)}
            <span style={{ fontSize: 12, color: T.t2 }}>Querying chain of custody…</span>
          </div>
        )}
        {error && !loading && (
          <div style={{ padding: 14, background: "rgba(255,100,100,.08)", border: `1px solid rgba(255,100,100,.25)`, borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#ff6666", marginBottom: 4 }}>Verification failed</div>
            <div style={{ fontSize: 11, color: T.t3, fontFamily: "monospace" }}>{error}</div>
          </div>
        )}
        {result && !loading && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, background: result.verified ? T.gDim : "rgba(255,100,100,.1)", border: `1px solid ${result.verified ? T.bdG : "rgba(255,100,100,.3)"}`, borderRadius: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 28 }}>{result.verified ? "✓" : "✗"}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: result.verified ? T.g : "#ff6666" }}>
                  {result.verified ? "Hash Verified — Log is Untampered" : "Verification Failed — Possible Tampering"}
                </div>
                <div style={{ fontSize: 11, color: T.t2, marginTop: 3 }}>{result.message}</div>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9.5, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Verified Hash</div>
              <div style={{ background: T.bg1, border: `1px solid ${T.bd}`, borderRadius: 8, padding: "10px 12px", fontFamily: "monospace", fontSize: 11, color: T.t2, wordBreak: "break-all" }}>{result.hash || inputHash}</div>
            </div>
            {result.records && result.records.length > 0 && (
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Matching Records ({result.records.length})</div>
                <div style={{ background: T.bg1, border: `1px solid ${T.bd}`, borderRadius: 10, overflow: "hidden" }}>
                  {result.records.map((r, i) => (
                    <div key={i} style={{ padding: "10px 13px", borderBottom: "1px solid rgba(255,255,255,.025)", display: "grid", gridTemplateColumns: "1fr auto" }}>
                      <div>
                        <div style={{ fontSize: 11, color: T.t1, fontFamily: "monospace", marginBottom: 2 }}>{r.event_id || r.eventid || "—"}</div>
                        <div style={{ fontSize: 10, color: T.t3 }}>{formatTs(r.timestamp).full}</div>
                      </div>
                      <div style={{ fontSize: 10, color: T.g, alignSelf: "center" }}>matched</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Card>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Recent Verifications</div>
          {history.length === 0 ? (
            <div style={{ fontSize: 11, color: T.t3, textAlign: "center", padding: "18px 0", fontStyle: "italic" }}>No verifications yet</div>
          ) : history.map((h, i) => (
            <div key={i} onClick={() => { setInputHash(h.hash); setResult(null); setError(null); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,.025)", cursor: "pointer" }}>
              <span style={{ fontSize: 13, color: h.verified ? T.g : "#ff6666", flexShrink: 0 }}>{h.verified ? "✓" : "✗"}</span>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontFamily: "monospace", fontSize: 10, color: T.t2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.hash}</div>
                <div style={{ fontSize: 9.5, color: T.t4 }}>{h.ts}</div>
              </div>
              <span style={{ fontSize: 9, color: h.verified ? T.g : "#ff6666", fontWeight: 700, background: h.verified ? T.gDim : "rgba(255,100,100,.1)", border: `1px solid ${h.verified ? T.bdG : "rgba(255,100,100,.3)"}`, borderRadius: 4, padding: "2px 5px", flexShrink: 0 }}>
                {h.verified ? "OK" : "FAIL"}
              </span>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>How it works</div>
          {[
            ["SHA256 Hash",      "Every honeypot event is hashed on capture"],
            ["DynamoDB Custody", "Hashes stored in chain-of-custody table"],
            ["Tamper Detection", "Modified logs will not match stored hash"],
            ["Court Admissible", "Verified logs usable as forensic evidence"],
          ].map(([k, v]) => (
            <div key={k} style={{ padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.025)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.t1 }}>{k}</div>
              <div style={{ fontSize: 10, color: T.t3 }}>{v}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── Main Logs Feed component ──────────────────────────────────────────────────
export default function HoneypotMonitor() {
  const [tab,              setTab]              = useState("all");
  const [events,           setEvents]           = useState([]);
  const [total,            setTotal]            = useState(0);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [filter,           setFilter]           = useState("");
  const [ipFilter,         setIpFilter]         = useState("");
  const [riskFilter,       setRiskFilter]       = useState("");
  const [sortOrder,        setSortOrder]        = useState("desc");
  const [selectedEvent,    setSelectedEvent]    = useState(null);
  const [showPdf,          setShowPdf]          = useState(false);
  const [lastRefresh,      setLastRefresh]      = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (filter)   params.event_type = filter;
      if (ipFilter) params.ip = ipFilter;
      const data   = await honeypotApi.getEvents(params);
      const sorted = (data.events || [])
        .slice()
        .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
        .map(ev => ({ ...ev, _risk: classifyEvent(ev) }));
      setEvents(sorted);
      setTotal(data.total || 0);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) { setError(err.message); }
    finally       { setLoading(false); }
  }, [filter, ipFilter]);

  useEffect(() => {
    fetchEvents();
    const iv = setInterval(fetchEvents, 5000);
    return () => clearInterval(iv);
  }, [fetchEvents]);

  const suspiciousEvents = events.filter(e => riskFilter ? e._risk === riskFilter : e._risk !== "safe");
  const safeEvents = events.filter(e => e._risk === "safe");

  const handleReport    = (ev)   => { setSelectedEvent(ev); setShowPdf(true); };

  const RISK_COUNTS = { critical: 0, mid: 0, low: 0, safe: 0 };
  events.forEach(e => { if (RISK_COUNTS[e._risk] !== undefined) RISK_COUNTS[e._risk]++; });

  const TABS = [
    { id: "all",        label: "All Logs",          count: events.length },
    { id: "safe",       label: "Safe Logs",        count: safeEvents.length },
    { id: "suspicious", label: "Suspicious Logs",   count: suspiciousEvents.length },
    { id: "verify",     label: "Hash Verification", count: null },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 999, padding: "3px 10px", fontSize: 10, fontWeight: 600, color: T.g }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.g, boxShadow: `0 0 6px ${T.g}`, animation: "pulse 2s ease-in-out infinite" }} />
            LIVE
          </span>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.t0 }}>Logs Feed</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: T.t3 }}>Last: {toISTTime(lastRefresh)} · Auto: 5s</span>
          <button onClick={fetchEvents} disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 11px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 6, color: T.g, fontSize: 10.5, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, whiteSpace: "nowrap" }}>
            ↻ Reload
          </button>
          {Object.entries(RISK_COUNTS).map(([level, count]) => (
            <span key={level} style={{ padding: "3px 9px", borderRadius: 5, fontSize: 10, fontWeight: 700, background: RISK[level].bg, color: RISK[level].color, border: `1px solid ${RISK[level].border}` }}>
              {count} {RISK[level].label}
            </span>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 5 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "7px 16px", background: tab === t.id ? T.gDim : "transparent", border: `1px solid ${tab === t.id ? T.bdG : T.bd}`, borderRadius: 8, color: tab === t.id ? T.g : T.t3, fontSize: 11.5, fontWeight: 600, cursor: "pointer", transition: "all .18s", display: "flex", alignItems: "center", gap: 7 }}>
            {t.label}
            {t.count !== null && (
              <span style={{ background: tab === t.id ? "rgba(57,255,60,.2)" : "rgba(255,255,255,.06)", borderRadius: 4, padding: "1px 6px", fontSize: 10 }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: All Logs */}
      {tab === "all" && (
        loading && events.length === 0 ? (
          <Card><div style={{ textAlign: "center", padding: 40, color: T.t3 }}>Loading events…</div></Card>
        ) : (
          <LogTable
            events={events} total={total} loading={loading} error={error} onRetry={fetchEvents}
            onInspect={setSelectedEvent} onReport={handleReport}
            showRisk={false}
            sortOrder={sortOrder} setSortOrder={setSortOrder}
            filter={filter} setFilter={setFilter}
            ipFilter={ipFilter} setIpFilter={setIpFilter}
            riskFilter={riskFilter} setRiskFilter={setRiskFilter}
          />
        )
      )}

      {/* Tab: Safe Logs */}
      {tab === "safe" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ padding: "12px 16px", background: "rgba(57,255,60,.06)", border: `1px solid ${T.bdG}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.g }}>AI Detected Safe Logs ({safeEvents.length})</div>
              <div style={{ fontSize: 11, color: T.t2, marginTop: 2 }}>Events & sessions classified as non-malicious honeypot interactions sorted by AI risk scoring.</div>
            </div>
            <span style={{ padding: "4px 12px", borderRadius: 999, background: T.gDim, color: T.g, fontSize: 11, fontWeight: 700, border: `1px solid ${T.bdG}` }}>
              AI Detector: ONLINE
            </span>
          </div>
          {loading && events.length === 0 ? (
            <Card><div style={{ textAlign: "center", padding: 40, color: T.t3 }}>Loading safe events…</div></Card>
          ) : (
            <LogTable
              events={safeEvents} total={safeEvents.length} loading={loading} error={error} onRetry={fetchEvents}
              onInspect={setSelectedEvent} onReport={handleReport}
              showRisk={true}
              sortOrder={sortOrder} setSortOrder={setSortOrder}
              filter={filter} setFilter={setFilter}
              ipFilter={ipFilter} setIpFilter={setIpFilter}
              riskFilter={riskFilter} setRiskFilter={setRiskFilter}
            />
          )}
        </div>
      )}

      {/* Tab: Suspicious Logs */}
      {tab === "suspicious" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {Object.entries(RISK_COUNTS).map(([level, count]) => {
              const r = RISK[level];
              return (
                <div key={level} onClick={() => setRiskFilter(riskFilter === level ? "" : level)}
                  style={{ padding: "12px 14px", background: riskFilter === level ? r.bg : T.card, border: `1px solid ${riskFilter === level ? r.border : T.bd}`, borderRadius: 10, cursor: "pointer", transition: "all .18s" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: r.color }}>{count}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: r.color, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>{r.label}</div>
                  <div style={{ fontSize: 9.5, color: T.t3, marginTop: 2 }}>
                    {level === "critical" && "Immediate action required"}
                    {level === "mid"      && "Investigate promptly"}
                    {level === "low"      && "Monitor closely"}
                    {level === "safe"     && "Normal traffic"}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: T.t3, padding: "8px 12px", background: "rgba(255,200,60,.05)", border: `1px solid rgba(255,200,60,.15)`, borderRadius: 8 }}>
            ⚠ Risk levels are scored by rule-based heuristics. Swap <code style={{ color: "#ffdd3c" }}>classifyEvent()</code> in HoneypotMonitor.jsx with your ML API call to enable live model predictions.
          </div>
          {loading && events.length === 0 ? (
            <Card><div style={{ textAlign: "center", padding: 40, color: T.t3 }}>Loading events…</div></Card>
          ) : (
            <LogTable
              events={suspiciousEvents} total={suspiciousEvents.length} loading={loading} error={error} onRetry={fetchEvents}
              onInspect={setSelectedEvent} onReport={handleReport}
              showRisk={true}
              sortOrder={sortOrder} setSortOrder={setSortOrder}
              filter={filter} setFilter={setFilter}
              ipFilter={ipFilter} setIpFilter={setIpFilter}
              riskFilter={riskFilter} setRiskFilter={setRiskFilter}
            />
          )}
        </div>
      )}

      {/* Tab: Hash Verification */}
      {tab === "verify" && (
        <HashVerificationTab pendingHash={null} onClearPending={() => {}} />
      )}

      {/* Modals */}
      {selectedEvent && !showPdf && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
      {showPdf && selectedEvent && (
        <ForensicReportGenerator event={selectedEvent} onClose={() => { setShowPdf(false); setSelectedEvent(null); }} />
      )}


    </div>
  );
}
