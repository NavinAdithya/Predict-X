import { useState, useEffect, useCallback } from "react";
import honeypotApi from "../services/honeypotApi";

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

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function toIST(d) {
  if (!d) return "—";
  try {
    const ist  = new Date(new Date(d).getTime() + 5.5 * 60 * 60 * 1000);
    const yyyy = String(ist.getUTCFullYear());
    const mo   = String(ist.getUTCMonth() + 1).padStart(2, "0");
    const dd   = String(ist.getUTCDate()).padStart(2, "0");
    const hh   = String(ist.getUTCHours()).padStart(2, "0");
    const mi   = String(ist.getUTCMinutes()).padStart(2, "0");
    const ss   = String(ist.getUTCSeconds()).padStart(2, "0");
    return `${yyyy}-${mo}-${dd} ${hh}:${mi}:${ss} IST`;
  } catch { return String(d); }
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

function getFileIcon(key) {
  if (key?.includes("raw/") || key?.includes(".json")) return { icon: "⬡", color: T.g };
  if (key?.includes("tty/")) return { icon: "◈", color: "#6699ff" };
  if (key?.includes("malware/")) return { icon: "⬢", color: "#ff6666" };
  return { icon: "◎", color: T.t2 };
}

const PREFIX_TABS = [
  { label: "All Files", value: "" },
  { label: "raw/", value: "raw/" },
  { label: "tty/", value: "tty/" },
  { label: "malware/", value: "malware/" },
];

export default function S3Storage() {
  const [files,       setFiles]       = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [prefix,      setPrefix]      = useState("");
  const [totalSize,   setTotalSize]   = useState(0);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [sortOrder,   setSortOrder]   = useState("desc"); // newest first

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (prefix) params.prefix = prefix;
      
      const data = await honeypotApi.getFiles(params);
      // Sort newest first so latest S3 logs always appear at the top
      const sorted = (data.files || []).slice().sort((a, b) => {
        const ta = a.last_modified ? new Date(a.last_modified).getTime() : 0;
        const tb = b.last_modified ? new Date(b.last_modified).getTime() : 0;
        return tb - ta;
      });
      setFiles(sorted);
      setTotal(data.total || sorted.length);
      setTotalSize(sorted.reduce((sum, f) => sum + (f.size_bytes || 0), 0));
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [prefix]);

  useEffect(() => {
    fetchFiles();
    const interval = setInterval(fetchFiles, 30000);
    return () => clearInterval(interval);
  }, [fetchFiles]);

  if (loading && files.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Card><div style={{ color: T.t3, textAlign: "center", padding: 40 }}>Loading S3 files...</div></Card>
      </div>
    );
  }

  if (error && files.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Card>
          <div style={{ textAlign: "center", padding: 20 }}>
            <div style={{ color: "#ff6666", marginBottom: 10 }}>Failed to load S3 files</div>
            <div style={{ fontSize: 11, color: T.t3, marginBottom: 12 }}>{error}</div>
            <button onClick={fetchFiles} style={{ padding: "8px 16px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 8, color: T.g, fontSize: 12, cursor: "pointer" }}>Retry</button>
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
            AI SCANNER: SAFE ARCHIVE
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.t0 }}>Honeypot File Archive</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: T.t3 }}>Total: {total} files · {formatBytes(totalSize)} · Last: {toISTTime(lastRefresh)}</span>
          <button onClick={fetchFiles} disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 11px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 6, color: T.g, fontSize: 10.5, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, whiteSpace: "nowrap" }}>
            ↻ Reload
          </button>
        </div>
      </div>

      <Card glow>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {PREFIX_TABS.map(tab => (
            <button key={tab.value} onClick={() => setPrefix(tab.value)}
              style={{ padding: "5px 12px", background: prefix === tab.value ? T.gDim : "transparent", border: `1px solid ${prefix === tab.value ? T.bdG : T.bd}`, borderRadius: 999, color: prefix === tab.value ? T.g : T.t3, fontSize: 10.5, fontWeight: 600, cursor: "pointer", transition: "all .18s" }}>
              {tab.label}
            </button>
          ))}
          <button onClick={() => setSortOrder(o => o === "desc" ? "asc" : "desc")}
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, padding: "5px 11px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 6, color: T.g, fontSize: 10.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
            {sortOrder === "desc" ? "↓ Newest" : "↑ Oldest"}
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
            <thead>
              <tr>
                {["File Key", "Size", "Last Modified (IST)"].map(h => (
                  <th key={h} style={{ padding: "7px 9px", textAlign: "left", fontSize: 9, fontWeight: 600, color: T.t3, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${T.bd}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(sortOrder === "desc" ? files : [...files].reverse()).map((file, i) => {
                const { icon, color } = getFileIcon(file.key);
                return (
                  <tr key={i}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(57,255,60,.03)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    style={{ transition: "background .14s" }}>
                    <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, color }}>{icon}</span>
                        <span style={{ fontFamily: "monospace", fontSize: 11, color: T.t1 }}>{file.key}</span>
                      </div>
                    </td>
                    <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", fontFamily: "monospace", fontSize: 11, color: T.g }}>
                      {formatBytes(file.size_bytes)}
                    </td>
                    <td style={{ padding: "7px 9px", borderBottom: "1px solid rgba(255,255,255,.025)", fontSize: 11, color: T.t2, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                      {toIST(file.last_modified)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        <Card>
          <CLbl>S3 Bucket</CLbl>
          <div style={{ fontSize: 12, color: T.t1, fontFamily: "monospace", wordBreak: "break-all" }}>predictx-honeypot-logs</div>
        </Card>
        <Card>
          <CLbl>Storage Summary</CLbl>
          {[["Total Files", total], ["Total Size", formatBytes(totalSize)], ["Encryption", "AES-256"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,.025)" }}>
              <span style={{ fontSize: 11, color: T.t3 }}>{k}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.g }}>{v}</span>
            </div>
          ))}
        </Card>
        <Card>
          <CLbl>Sync Status</CLbl>
          {[["Sync Interval", "30 seconds"], ["Last Sync (IST)", toISTTime(lastRefresh)], ["Status", "Active"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,.025)" }}>
              <span style={{ fontSize: 11, color: T.t3 }}>{k}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.g }}>{v}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
