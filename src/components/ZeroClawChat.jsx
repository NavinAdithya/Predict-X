import { useState, useEffect, useRef } from "react";
import zeroClawApi from "../services/zeroClawApi";
import honeypotApi from "../services/honeypotApi";

const T = {
  bg0: "#050c06", bg1: "#071008", bg2: "#091409", bg3: "#0c1a0d", bg4: "#0f1f10", bg5: "#132413",
  card: "#0d1a0e", cardIn: "#0a1509",
  g: "#39ff3c", gDim: "rgba(57,255,60,0.10)", gDim2: "rgba(57,255,60,0.05)",
  bd: "rgba(255,255,255,0.055)", bdG: "rgba(57,255,60,0.18)", bdG2: "rgba(57,255,60,0.35)",
  t0: "#ffffff", t1: "#c5dac6", t2: "#8aaa8b", t3: "#4e6b4f", t4: "#263827",
};

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

const SUGGESTIONS = [
  { label: "Analyze Recent Logs", action: "analyze_logs", icon: "📊" },
  { label: "Risk Assessment", action: "risk_assessment", icon: "⚠" },
  { label: "Generate Report", action: "generate_report", icon: "📋" },
  { label: "Explain Incident", action: "explain_incident", icon: "🔬" },
  { label: "Threat Patterns", action: "threat_patterns", icon: "🔍" },
  { label: "System Status", action: "system_status", icon: "◈" },
];

export default function ZeroClawChat({ selectedEvent }) {
  const [msgs, setMsgs] = useState([
    { role: "ai", text: "◈ Zero Claw AI online.\n\nI have access to all honeypot logs, events, and system statistics. I can:\n\n• Analyze logs and identify security risks\n• Generate detailed forensic reports\n• Explain AI decisions and risk assessments\n• Provide threat intelligence based on patterns\n• Help with incident response\n\nAsk me about recent incidents, risk analysis, or report generation." }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [connected, setConnected] = useState(true);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, statsData] = await Promise.all([
          honeypotApi.getEvents({ limit: 100 }),
          honeypotApi.getStats()
        ]);
        setEvents(eventsData.events || []);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    const status = await zeroClawApi.checkWebhookStatus();
    setConnected(status);
  };

  const sendMessage = async (text) => {
    const q = (text || input).trim();
    if (!q) return;
    setMsgs(m => [...m, { role: "user", text: q }]);
    setInput("");
    setTyping(true);

    try {
      const context = {
        selectedEvent: selectedEvent || null,
        allEvents: events,
        stats: stats,
        timestamp: new Date().toISOString()
      };
      const response = await zeroClawApi.chatWithZeroClaw(q, context);

      setTimeout(() => {
        setMsgs(m => [...m, { role: "ai", text: response.reply || response.message || "Response received" }]);
        setTyping(false);
      }, 800 + Math.random() * 600);
    } catch (err) {
      setTimeout(() => {
        setMsgs(m => [...m, {
          role: "ai",
          text: `⚠ AI service error\n\nFailed to reach Gemini API. Check that VITE_GEMINI_API_KEY is set in .env and is valid.\n\nError: ${err.message}`
        }]);
        setTyping(false);
      }, 500);
    }
  };

  const send = () => sendMessage(input);

  const handleSuggestion = (action) => {
    let message = "";
    switch (action) {
      case "analyze_logs":
        message = "Analyze the recent logs and identify any suspicious activities or patterns";
        break;
      case "risk_assessment":
        message = "Provide a risk assessment based on the current events and statistics";
        break;
      case "generate_report":
        message = selectedEvent
          ? `Generate a forensic investigation report for this event: ${JSON.stringify(selectedEvent)}`
          : "Generate a forensic investigation report for the most recent critical incident";
        break;
      case "explain_incident":
        message = selectedEvent
          ? `Explain why this event is a security risk: ${JSON.stringify(selectedEvent)}`
          : "Explain the risks associated with recent incidents";
        break;
      case "threat_patterns":
        message = "Identify any emerging threat patterns from the logs";
        break;
      case "system_status":
        message = "Provide an overview of the system status and any active alerts";
        break;
      default:
        message = action;
    }
    sendMessage(message);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: connected ? T.gDim : "rgba(255,100,100,.1)", border: `1px solid ${connected ? T.bdG : "rgba(255,100,100,.3)"}`, borderRadius: 999, padding: "3px 10px", fontSize: 10, fontWeight: 600, color: connected ? T.g : "#ff6666" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: connected ? T.g : "#ff6666", boxShadow: `0 0 6px ${connected ? T.g : "#ff6666"}`, animation: connected ? "pulse 2s ease-in-out infinite" : "none" }} />
            {connected ? "ONLINE" : "OFFLINE"}
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.t0 }}>Zero Claw AI</span>
        </div>
        {selectedEvent && (
          <span style={{ fontSize: 10, color: T.t3, background: T.bg2, padding: "4px 8px", borderRadius: 4 }}>
            Event: {selectedEvent.session || selectedEvent.src_ip}
          </span>
        )}
      </div>

      <Card glow>
        <div style={{ display: "flex", flexDirection: "column", height: 420 }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%", padding: "9px 12px", borderRadius: m.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                  background: m.role === "user" ? T.gDim : T.bg2,
                  border: `1px solid ${m.role === "user" ? T.bdG : T.bd}`,
                  fontSize: 11.5, color: T.t1, lineHeight: 1.65, whiteSpace: "pre-line"
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", background: T.bg2, border: `1px solid ${T.bd}`, borderRadius: "12px 12px 12px 3px", width: "fit-content" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: T.g, animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Suggestions */}
          <div style={{ padding: "10px 12px", borderTop: `1px solid ${T.bd}`, borderBottom: `1px solid ${T.bd}`, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SUGGESTIONS.map(s => (
              <button key={s.action} onClick={() => handleSuggestion(s.action)}
                style={{ padding: "4px 10px", background: T.bg2, border: `1px solid ${T.bd}`, borderRadius: 999, fontSize: 10, color: T.t2, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "all .18s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.bdG; e.currentTarget.style.color = T.g; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.bd; e.currentTarget.style.color = T.t2; }}>
                <span>{s.icon}</span> {s.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px", display: "flex", gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask Zero Claw to generate reports, explain decisions..."
              style={{ flex: 1, background: T.bg2, border: `1px solid ${T.bd}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: T.t0, outline: "none", fontFamily: "'Sora',sans-serif", caretColor: T.g }} />
            <button onClick={send} style={{ padding: "8px 14px", background: T.g, border: "none", borderRadius: 8, color: T.bg0, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>↑</button>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, letterSpacing: "1.1px", textTransform: "uppercase", marginBottom: 12 }}>Capabilities</div>
          {[
            { icon: "📋", title: "Forensic PDF Reports", desc: "Court-admissible evidence with cryptographic verification" },
            { icon: "🔬", title: "AI Decision Explainability", desc: "Model state snapshots for reanimation" },
            { icon: "✓", title: "Evidence Verification", desc: "QLDB chain of custody validation" },
            { icon: "◈", title: "Threat Intelligence", desc: "Real-time incident analysis" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.025)" }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: T.t1 }}>{item.title}</div>
                <div style={{ fontSize: 10, color: T.t3 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, letterSpacing: "1.1px", textTransform: "uppercase", marginBottom: 12 }}>Webhook Status</div>
          {[
            { label: "Service", value: connected ? "Running" : "Offline", ok: connected },
            { label: "Endpoint", value: "generativelanguage.googleapis.com", ok: true },
            { label: "Response Time", value: "~200ms", ok: true },
            { label: "Last Check", value: toISTTime(new Date()), ok: true },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.025)" }}>
              <span style={{ fontSize: 11, color: T.t3 }}>{item.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: item.ok ? T.g : "#ff6666" }}>{item.value}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
