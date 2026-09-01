import { useState, useEffect, useRef } from "react";
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

function CLbl({ children, right }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, letterSpacing: "1.1px", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span>{children}</span>
      {right && <span style={{ color: T.g, fontSize: 11, fontWeight: 500, letterSpacing: 0, textTransform: "none" }}>{right}</span>}
    </div>
  );
}

function KPI({ label, val, sub, accent, dim, icon }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: T.card, border: `1px solid ${hov ? T.bdG2 : T.bd}`, borderRadius: 14, padding: "14px 16px",
        position: "relative", overflow: "hidden", cursor: "pointer", transition: "all .22s",
        transform: hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? `0 12px 36px rgba(0,0,0,.5),0 0 0 1px rgba(57,255,60,.10)` : "none"
      }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,rgba(57,255,60,.22),transparent)` }} />
      <div style={{ position: "absolute", top: -28, right: -28, width: 90, height: 90, background: `radial-gradient(ellipse,rgba(57,255,60,${hov ? .10 : .05}),transparent 68%)`, pointerEvents: "none", transition: "all .22s" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, position: "relative", zIndex: 1 }}>
        <div style={{ width: 30, height: 30, background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: accent ? T.g : T.t2, flexShrink: 0 }}>
          {icon || null}
        </div>
      </div>
      <div style={{
        fontSize: dim ? 18 : 28, fontWeight: 800, color: accent ? T.g : T.t0, lineHeight: 1, marginBottom: 3,
        position: "relative", zIndex: 1, textShadow: accent ? `0 0 18px rgba(57,255,60,.28)` : "none",
        paddingTop: dim ? 6 : 0
      }}>{val}</div>
      <div style={{ fontSize: 11, color: T.t3, position: "relative", zIndex: 1 }}>{label}</div>
      {sub && <div style={{ fontSize: 9.5, color: accent ? T.g : T.t4, marginTop: 4, position: "relative", zIndex: 1 }}>{sub}</div>}
    </div>
  );
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num?.toLocaleString() || "0";
}

function toISTTime(d) {
  if (!d) return "—";
  try {
    const ist = new Date(new Date(d).getTime() + 5.5 * 60 * 60 * 1000);
    const hh = String(ist.getUTCHours()).padStart(2, "0");
    const mi = String(ist.getUTCMinutes()).padStart(2, "0");
    const ss = String(ist.getUTCSeconds()).padStart(2, "0");
    return `${hh}:${mi}:${ss} IST`;
  } catch { return "—"; }
}

// ── SVG Threat Gauge Component ───────────────────────────────────────────────
function ThreatGauge({ suspicious = 0, total = 1 }) {
  const ratio = Math.min(1, Math.max(0, total > 0 ? suspicious / total : 0));
  const angle = ratio * 180;
  const needleRad = ((180 - angle) * Math.PI) / 180;
  const cx = 100, cy = 90, r = 70;
  const nx = cx + r * 0.75 * Math.cos(needleRad);
  const ny = cy - r * 0.75 * Math.sin(needleRad);

  let statusText = "SAFE / LOW";
  let statusColor = "#39ff3c";
  if (ratio > 0.4) { statusText = "ELEVATED THREAT"; statusColor = "#ff9621"; }
  if (ratio > 0.7) { statusText = "HIGH ATTACK VOLUME"; statusColor = "#ff4444"; }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
      <svg width="200" height="110" viewBox="0 0 200 110">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#39ff3c" />
            <stop offset="50%" stopColor="#ff9621" />
            <stop offset="100%" stopColor="#ff4444" />
          </linearGradient>
        </defs>
        <path d="M 30 90 A 70 70 0 0 1 170 90" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" strokeLinecap="round" />
        <path d="M 30 90 A 70 70 0 0 1 170 90" fill="none" stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round" opacity="0.85" />
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={statusColor} strokeWidth="3" strokeLinecap="round" style={{ transition: "all 0.5s ease" }} />
        <circle cx={cx} cy={cy} r="6" fill={statusColor} />
        <circle cx={cx} cy={cy} r="3" fill="#050c06" />
      </svg>
      <div style={{ fontSize: 18, fontWeight: 800, color: statusColor, marginTop: -15 }}>
        {(ratio * 100).toFixed(1)}%
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.t3, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>
        Threat Index: <span style={{ color: statusColor }}>{statusText}</span>
      </div>
    </div>
  );
}

// ── SVG Traffic Area Chart Component ─────────────────────────────────────────
function TrafficAreaChart({ totalEvents = 100 }) {
  const points = [
    Math.max(5, totalEvents * 0.2),
    Math.max(8, totalEvents * 0.35),
    Math.max(12, totalEvents * 0.28),
    Math.max(15, totalEvents * 0.45),
    Math.max(10, totalEvents * 0.6),
    Math.max(22, totalEvents * 0.75),
    Math.max(18, totalEvents * 0.65),
    Math.max(30, totalEvents * 0.85),
    Math.max(25, totalEvents * 0.9),
    Math.max(35, totalEvents * 0.95),
    Math.max(40, totalEvents),
  ];

  const max = Math.max(...points, 50);
  const width = 500;
  const height = 120;
  const step = width / (points.length - 1);

  const coords = points.map((val, idx) => ({
    x: idx * step,
    y: height - (val / max) * (height - 20) - 10,
  }));

  let pathD = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const xc = (coords[i].x + coords[i + 1].x) / 2;
    const yc = (coords[i].y + coords[i + 1].y) / 2;
    pathD += ` Q ${coords[i].x} ${coords[i].y}, ${xc} ${yc}`;
  }
  pathD += ` T ${coords[coords.length - 1].x} ${coords[coords.length - 1].y}`;

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#39ff3c" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#39ff3c" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((pct, i) => (
          <line key={i} x1="0" y1={height * pct} x2={width} y2={height * pct} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
        ))}
        <path d={areaD} fill="url(#trendGrad)" />
        <path d={pathD} fill="none" stroke="#39ff3c" strokeWidth="2.5" strokeLinecap="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="3" fill="#39ff3c" stroke="#050c06" strokeWidth="1.5" />
        ))}
      </svg>
    </div>
  );
}

// ── SVG Donut Event Distribution Chart ───────────────────────────────────────
function EventDonutChart({ stats }) {
  const categories = [
    { label: "Login Success", val: stats?.login_success || 0, color: "#39ff3c" },
    { label: "Login Failed", val: stats?.login_failed || 0, color: "#ff9621" },
    { label: "Connections", val: stats?.connections || 0, color: "#6699ff" },
    { label: "Commands", val: stats?.commands || 0, color: "#ffcc66" },
    { label: "Downloads", val: stats?.file_downloads || 0, color: "#cc66ff" },
  ];

  const total = categories.reduce((sum, c) => sum + c.val, 0) || 1;
  let cumAngle = 0;

  const slices = categories.map((cat) => {
    const pct = cat.val / total;
    const startAngle = cumAngle;
    const endAngle = cumAngle + pct * 360;
    cumAngle = endAngle;
    return { ...cat, pct, startAngle, endAngle };
  });

  function getArcPath(startAngle, endAngle, radius, innerRadius) {
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const x1 = 80 + radius * Math.cos(startRad);
    const y1 = 80 + radius * Math.sin(startRad);
    const x2 = 80 + radius * Math.cos(endRad);
    const y2 = 80 + radius * Math.sin(endRad);
    const x3 = 80 + innerRadius * Math.cos(endRad);
    const y3 = 80 + innerRadius * Math.sin(endRad);
    const x4 = 80 + innerRadius * Math.cos(startRad);
    const y4 = 80 + innerRadius * Math.sin(startRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 16, alignItems: "center" }}>
      <div style={{ position: "relative", width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 160 160">
          {slices.map((s, i) => {
            if (s.pct === 0) return null;
            if (s.pct >= 0.999) {
              return <circle key={i} cx="80" cy="80" r="60" fill="none" stroke={s.color} strokeWidth="24" />;
            }
            return <path key={i} d={getArcPath(s.startAngle, s.endAngle, 72, 48)} fill={s.color} opacity="0.9" />;
          })}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.t0 }}>{formatNumber(stats?.total_events)}</div>
          <div style={{ fontSize: 9, color: T.t3, textTransform: "uppercase", fontWeight: 600 }}>Total</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {categories.map((c, i) => {
          const pct = Math.round(((c.val || 0) / total) * 100);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                <span style={{ color: T.t2 }}>{c.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: T.t0, fontWeight: 700, fontFamily: "monospace" }}>{c.val}</span>
                <span style={{ color: T.t3, fontSize: 10, minWidth: 28, textAlign: "right" }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HoneypotOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const prevTotalRef = useRef(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await honeypotApi.getStats();
      setStats(data);
      setLastUpdate(new Date());
      setError(null);

      if (prevTotalRef.current !== null && data.total_events > prevTotalRef.current) {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR4EMGizxOLviEoXDT1ut8vk2oM7IAkQZ7jJ5eSFPSAQEmu3yePqfz0fCg5ktMnl4oE8IAgNaLPI5ep/PSAKDmO1yeXqgT0hCQ1ktMnl6n89IQoOY7XJ5eqBPSEJDWO1yeXqgT0hCg5jtcnl6oE9IQkNY7XJ5eqBPSEKDmO1yeXqgT0hCQ1jtcnl6oE9IQoOY7XJ5eqBPSEJDQ==');
        audio.volume = 0.1;
        audio.play().catch(() => { });
      }
      prevTotalRef.current = data.total_events;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 999, padding: "3px 10px", fontSize: 10, fontWeight: 600, color: T.g }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.g, boxShadow: `0 0 6px ${T.g}`, animation: "pulse 2s ease-in-out infinite" }} />
            Loading...
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.t0 }}>Honeypot Overview</span>
        </div>
        <Card><div style={{ color: T.t3, textAlign: "center", padding: 40 }}>Connecting to honeypot API...</div></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,100,100,.1)", border: `1px solid rgba(255,100,100,.3)`, borderRadius: 999, padding: "3px 10px", fontSize: 10, fontWeight: 600, color: "#ff6666" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#ff6666" }} />
            Error
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.t0 }}>Honeypot Overview</span>
        </div>
        <Card>
          <div style={{ color: "#ff6666", textAlign: "center", padding: 40 }}>
            <div style={{ marginBottom: 10 }}>Failed to connect to API</div>
            <button onClick={fetchStats} style={{ padding: "8px 16px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 8, color: T.g, fontSize: 12, cursor: "pointer" }}>Retry</button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 999, padding: "3px 10px", fontSize: 10, fontWeight: 600, color: T.g }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.g, boxShadow: `0 0 6px ${T.g}`, animation: "pulse 2s ease-in-out infinite" }} />
            LIVE
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.t0 }}>Honeypot Analytics & Threat Visualizer</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: T.t3 }}>Last: {toISTTime(lastUpdate)} · Auto: 5s</span>
          <button onClick={fetchStats} disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 11px", background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 6, color: T.g, fontSize: 10.5, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, whiteSpace: "nowrap" }}>
            ↻ Reload
          </button>
        </div>
      </div>

      {/* AI Active Banner */}


      {/* Top KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 11 }}>
        <KPI label="Total Events" val={formatNumber(stats?.total_events)} accent
          icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6" /><line x1="8" y1="5" x2="8" y2="8" /><circle cx="8" cy="10.5" r=".8" fill="currentColor" stroke="none" /></svg>}
        />
        <KPI label="Suspicious Attempts" val={formatNumber(stats?.suspicious_attempts)}
          icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2.5L14 12.5H2L8 2.5z" /><line x1="8" y1="7" x2="8" y2="9.5" /><circle cx="8" cy="11.2" r=".7" fill="currentColor" stroke="none" /></svg>}
        />
        <KPI label="Flagged Logs" val={formatNumber(stats?.flagged_logs)}
          icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2h7l2 2v10H4z" /><path d="M6 7h4" /><path d="M6 9h4" /><path d="M6 11h3" /></svg>}
        />
        <KPI label="Connections" val={formatNumber(stats?.connections)}
          icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="4" cy="8" r="2" /><circle cx="12" cy="4" r="2" /><circle cx="12" cy="12" r="2" /><line x1="6" y1="6" x2="10" y2="5" /><line x1="6" y1="9" x2="10" y2="11" /></svg>}
        />
      </div>

      {/* Visual Charts Row 1: Threat Gauge & Event Distribution Donut */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12 }}>
        <Card glow>
          <CLbl>Threat Level Meter</CLbl>
          <ThreatGauge suspicious={stats?.suspicious_attempts || 0} total={stats?.total_events || 1} />
        </Card>

        <Card>
          <CLbl>Event Type Distribution</CLbl>
          <EventDonutChart stats={stats} />
        </Card>
      </div>

      {/* Visual Charts Row 2: Live Activity Area Trend Graph */}
      <Card glow>
        <CLbl right="Live Stream">Real-Time Ingestion Traffic Volume</CLbl>
        <TrafficAreaChart totalEvents={stats?.total_events || 50} />
      </Card>

      {/* Visual Charts Row 3: Top IP Bar Chart & Credentials Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "58% 42%", gap: 12 }}>
        <Card>
          <CLbl right={stats?.top_ips?.length ? `${stats.top_ips.length} IPs recorded` : null}>IP Attack Volume Visualizer</CLbl>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {(stats?.top_ips || []).slice(0, 5).map((ip, i) => {
              const maxC = stats?.top_ips?.[0]?.count || 1;
              const pct = Math.round((ip.count / maxC) * 100);
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 18, height: 18, borderRadius: 5, background: i === 0 ? T.gDim : T.bg2, border: `1px solid ${i === 0 ? T.bdG : T.bd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, fontWeight: 700, color: i === 0 ? T.g : T.t3 }}>{i + 1}</span>
                      <span style={{ fontFamily: "monospace", fontSize: 11.5, color: i === 0 ? T.t0 : T.t1, fontWeight: i === 0 ? 700 : 500 }}>{ip.value}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? T.g : T.t2 }}>{formatNumber(ip.count)} hits</span>
                  </div>
                  <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,.05)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: i === 0 ? `linear-gradient(90deg, #39ff3c, #80ff82)` : `linear-gradient(90deg, #4e6b4f, #8aaa8b)`, borderRadius: 4, transition: "width 0.4s ease" }} />
                  </div>
                </div>
              );
            })}
            {(!stats?.top_ips || stats.top_ips.length === 0) && <div style={{ color: T.t3, fontSize: 11 }}>No IP attack data available</div>}
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 11 }}>
          <Card>
            <CLbl right={stats?.top_usernames?.length ? `${stats.top_usernames.length} usernames` : null}>Targeted Usernames</CLbl>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {stats?.top_usernames?.slice(0, 3).map((u, i) => {
                const maxU = stats?.top_usernames?.[0]?.count || 1;
                const pct = Math.round((u.count / maxU) * 100);
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                      <span style={{ fontFamily: "monospace", color: T.t1 }}>{u.value}</span>
                      <span style={{ fontWeight: 700, color: T.g }}>{u.count}</span>
                    </div>
                    <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,.05)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: T.g, borderRadius: 2 }} />
                    </div>
                  </div>
                );
              }) || <div style={{ color: T.t3, fontSize: 10.5 }}>No data</div>}
            </div>
          </Card>

          <Card>
            <CLbl right={stats?.top_passwords?.length ? `${stats.top_passwords.length} passwords` : null}>Flagged Credentials</CLbl>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {stats?.top_passwords?.slice(0, 3).map((p, i) => {
                const maxP = stats?.top_passwords?.[0]?.count || 1;
                const pct = Math.round((p.count / maxP) * 100);
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                      <span style={{ fontFamily: "monospace", color: T.t1 }}>{p.value}</span>
                      <span style={{ fontWeight: 700, color: T.g }}>{p.count}</span>
                    </div>
                    <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,.05)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "#ff9621", borderRadius: 2 }} />
                    </div>
                  </div>
                );
              }) || <div style={{ color: T.t3, fontSize: 10.5 }}>No data</div>}
            </div>
          </Card>
        </div>
      </div>

      {/* Visual Pipeline Flow */}
      <Card glow>
        <CLbl>Live Attack Pipeline Flow</CLbl>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0 4px" }}>
          {[
            { label: "Cowrie Listener", sub: "SSH/Telnet capture", svg: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#39ff3c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 1.5l5 2.9v5.2L8 12.5 3 9.6V4.4Z" /><circle cx="8" cy="7" r="2" /></svg> },
            { label: "Local Parser", sub: "JSON + risk scoring", svg: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#39ff3c" strokeWidth="1.4" strokeLinecap="round"><rect x="3" y="3" width="10" height="10" rx="2" /><line x1="6" y1="6" x2="10" y2="6" /><line x1="6" y1="8" x2="10" y2="8" /><line x1="6" y1="10" x2="9" y2="10" /></svg> },
            { label: "AI Safety Sorting", sub: "Gemini classification", svg: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#39ff3c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2h7l2 2v10H4z" /><path d="M6 7h4" /><path d="M6 9h4" /><path d="M6 11h3" /></svg> },
            { label: "Overview Visuals", sub: "Graphs & threat meters", svg: <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#39ff3c" strokeWidth="1.4" strokeLinecap="round"><circle cx="8" cy="8" r="5" /><path d="M8 5v3l2 2" /></svg> },
          ].map((item, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 7 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: T.gDim, border: `1px solid ${T.bdG}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(57,255,60,.08)" }}>
                  {item.svg}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.t1, textAlign: "center", lineHeight: 1.3 }}>{item.label}</div>
                <div style={{ fontSize: 9.5, color: T.t3, textAlign: "center" }}>{item.sub}</div>
              </div>
              {i < arr.length - 1 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0, marginBottom: 28 }}>
                  <div style={{ width: 28, height: 1, background: `linear-gradient(90deg,${T.bdG},rgba(57,255,60,.06))` }} />
                  <svg width="7" height="7" viewBox="0 0 8 8" fill="none"><path d="M2 1l4 3-4 3" stroke="rgba(57,255,60,.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
