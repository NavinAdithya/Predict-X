import { useState, useEffect } from "react";
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

function StatusIndicator({ status }) {
  const isOk = status === "ok";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: isOk ? T.g : "#ff6666", boxShadow: isOk ? `0 0 8px ${T.g}` : "0 0 8px #ff6666" }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: isOk ? T.g : "#ff6666", textTransform: "uppercase" }}>{isOk ? "Operational" : "Error"}</span>
    </div>
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

export default function ApiHealthStatus() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await honeypotApi.healthCheck();
      setHealth(data);
      setLastCheck(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !health) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Card><div style={{ color: T.t3, textAlign: "center", padding: 40 }}>Checking API health...</div></Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: error ? "rgba(255,100,100,.1)" : T.gDim, border: `1px solid ${error ? "rgba(255,100,100,.3)" : T.bdG}`, borderRadius: 999, padding: "3px 10px", fontSize: 10, fontWeight: 600, color: error ? "#ff6666" : T.g }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: error ? "#ff6666" : T.g, boxShadow: `0 0 6px ${error ? "#ff6666" : T.g}` }} />
            {error ? "ERROR" : "HEALTHY"}
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.t0 }}>API Health Status</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: T.t3 }}>Last check: {toISTTime(lastCheck)}</span>
          <button onClick={fetchHealth} disabled={loading && !health}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 11px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 6, color: T.g, fontSize: 10.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
            ↻ Reload
          </button>
        </div>
      </div>

      {error && (
        <Card>
          <div style={{ textAlign: "center", padding: 20 }}>
            <div style={{ color: "#ff6666", marginBottom: 10 }}>Failed to connect to API</div>
            <button onClick={fetchHealth} style={{ padding: "8px 16px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 8, color: T.g, fontSize: 12, cursor: "pointer" }}>Retry</button>
          </div>
        </Card>
      )}

      {health && !error && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
            <Card glow>
              <CLbl>AWS Service Status</CLbl>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: T.bg1, borderRadius: 8, border: `1px solid ${T.bd}` }}>
                  <span style={{ fontSize: 12, color: T.t1 }}>Amazon S3</span>
                  <StatusIndicator status={health.s3} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: T.bg1, borderRadius: 8, border: `1px solid ${T.bd}` }}>
                  <span style={{ fontSize: 12, color: T.t1 }}>Amazon DynamoDB</span>
                  <StatusIndicator status={health.dynamodb} />
                </div>
              </div>
            </Card>

            <Card>
              <CLbl>Resource Configuration</CLbl>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["S3 Bucket", health.bucket],
                  ["DynamoDB Table", health.table],
                  ["API Region", "us-east-1"],
                  ["Endpoint", "API Gateway"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.025)" }}>
                    <span style={{ fontSize: 11, color: T.t3 }}>{k}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.g, fontFamily: k === "S3 Bucket" || k === "DynamoDB Table" ? "monospace" : "inherit" }}>{v || "—"}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <CLbl>System Architecture</CLbl>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
              {[
                { label: "Cowrie Honeypot", sub: "EC2 Instance", icon: "◈", status: "active" },
                { label: "S3 Bucket", sub: "Log Storage", icon: "⬡", status: "active" },
                { label: "Lambda", sub: "SHA256 Hashing", icon: "◇", status: "active" },
                { label: "DynamoDB", sub: "Chain of Custody", icon: "◎", status: "active" },
                { label: "API Gateway", sub: "REST Endpoints", icon: "◈", status: "active" },
              ].map((item, i, arr) => (
                <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: T.gDim, border: `1px solid ${T.bdG}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: T.g, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.t1, textAlign: "center" }}>{item.label}</div>
                    <div style={{ fontSize: 9.5, color: T.t3 }}>{item.sub}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ width: 20, height: 1, background: `linear-gradient(90deg,${T.bdG},transparent)`, marginBottom: 20 }} />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
