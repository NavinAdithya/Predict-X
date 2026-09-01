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

function CLbl({ children, right }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: T.t3, letterSpacing: "1.1px", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span>{children}</span>
      {right && <span style={{ color: T.g, fontSize: 11, fontWeight: 500, letterSpacing: 0, textTransform: "none" }}>{right}</span>}
    </div>
  );
}

// ── Interactive Terminal Emulator Simulator ──────────────────────────────────
function TerminalSimulator() {
  const [history, setHistory] = useState([
    { type: "sys", text: "Cowrie Deception Terminal Simulator v2.4 initialized." },
    { type: "sys", text: "Connected to emulated SSH session (Debian Linux 5.10.0)." },
    { type: "sys", text: "Type any command (e.g. 'cat /etc/passwd', 'wget payload.sh', 'whoami') to test honeypot emulation." },
  ]);
  const [inputCommand, setInputCommand] = useState("");

  const handleRunCommand = (e) => {
    e.preventDefault();
    if (!inputCommand.trim()) return;

    const cmd = inputCommand.trim();
    const newEntry = { type: "user", text: `root@debian-target:~# ${cmd}` };
    
    let responseText = "";
    if (cmd.includes("cat /etc/passwd") || cmd.includes("cat /etc/shadow")) {
      responseText = "root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nbin:x:2:2:bin:/bin:/usr/sbin/nologin\nsys:x:3:3:sys:/dev:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin";
    } else if (cmd.includes("wget") || cmd.includes("curl")) {
      responseText = `--2026-08-08 12:30:00--  ${cmd.split(" ")[1] || "http://malicious.test/loader"}\nResolving malicious.test... 185.220.101.12\nConnecting to malicious.test|185.220.101.12|:80... connected.\nHTTP request sent, awaiting response... 200 OK\nLength: 14820 (14K) [application/x-sh]\nSaving to: 'payload.sh'\n\npayload.sh          100%[===================>]  14.47K  --.-KB/s    in 0.02s\n\n2026-08-08 12:30:00 (680 KB/s) - 'payload.sh' saved [14820/14820]`;
    } else if (cmd.includes("whoami")) {
      responseText = "root";
    } else if (cmd.includes("uname")) {
      responseText = "Linux debian-target 5.10.0-21-amd64 #1 SMP Debian 5.10.162-1 (2023-01-22) x86_64 GNU/Linux";
    } else if (cmd.includes("ls")) {
      responseText = "bin  boot  dev  etc  home  lib  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var";
    } else if (cmd.includes("id")) {
      responseText = "uid=0(root) gid=0(root) groups=0(root)";
    } else {
      responseText = `bash: ${cmd.split(" ")[0]}: command executed in emulated honeypot jail. Event SHA256 hashed and logged.`;
    }

    setHistory((prev) => [...prev, newEntry, { type: "out", text: responseText }]);
    setInputCommand("");
  };

  return (
    <Card glow>
      <CLbl right="Interactive Sandbox">Honeypot Shell Deception Console</CLbl>
      <div style={{ background: T.bg0, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 14, fontFamily: "monospace", fontSize: 11, minHeight: 180, maxHeight: 240, overflowY: "auto", marginBottom: 12 }}>
        {history.map((h, i) => (
          <div key={i} style={{
            color: h.type === "user" ? T.g : h.type === "sys" ? T.t3 : "#ffcc66",
            marginBottom: 4, whiteSpace: "pre-wrap", wordBreak: "break-all"
          }}>
            {h.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleRunCommand} style={{ display: "flex", gap: 8 }}>
        <input
          value={inputCommand}
          onChange={(e) => setInputCommand(e.target.value)}
          placeholder="Test command (e.g. 'cat /etc/passwd', 'wget bot.sh', 'whoami')..."
          style={{
            flex: 1, background: T.bg2, border: `1px solid ${T.bdG}`, borderRadius: 8,
            padding: "9px 12px", fontSize: 11, color: T.t0, fontFamily: "monospace", outline: "none"
          }}
        />
        <button type="submit" style={{ padding: "9px 16px", background: T.g, border: "none", borderRadius: 8, color: T.bg0, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
          Execute
        </button>
      </form>
    </Card>
  );
}

export default function HoneypotDetails() {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    honeypotApi.healthCheck().then(setHealth).catch(() => {});
    honeypotApi.getStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Top Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: T.gDim, border: `1px solid ${T.bdG}`, borderRadius: 999, padding: "3px 10px", fontSize: 10, fontWeight: 600, color: T.g }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.g, boxShadow: `0 0 6px ${T.g}`, animation: "pulse 2s ease-in-out infinite" }} />
            DAEMON ONLINE
          </span>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.t0 }}>Cowrie Honeypot Architecture & Deception Topology</span>
        </div>
        <span style={{ fontSize: 10, color: T.t3 }}>Version: v2.4.0 (Cowrie Deception Suite)</span>
      </div>

      {/* Overview Status Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        <Card glow>
          <CLbl>Service Daemon</CLbl>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.g, marginBottom: 4 }}>Cowrie SSH / Telnet</div>
          <div style={{ fontSize: 11, color: T.t2 }}>Port 2222 (SSH) & Port 2223 (Telnet)</div>
          <div style={{ fontSize: 10, color: T.t3, marginTop: 6 }}>Emulated target OS: Debian 11 OpenSSH 8.4p1</div>
        </Card>

        <Card>
          <CLbl>Log Feed Ingestion</CLbl>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.t0, fontFamily: "monospace", wordBreak: "break-all", marginBottom: 4 }}>
            {health?.table || "/home/user/my-honeypot/var/log/cowrie/cowrie.json"}
          </div>
          <div style={{ fontSize: 11, color: T.g }}>JSON Stream Active</div>
          <div style={{ fontSize: 10, color: T.t3, marginTop: 6 }}>Events Ingested: {stats?.total_events || 268} events</div>
        </Card>

        <Card>
          <CLbl>Deception Storage</CLbl>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.t0, marginBottom: 4 }}>Malware Downloads</div>
          <div style={{ fontSize: 11, color: T.t2, fontFamily: "monospace" }}>var/lib/cowrie/downloads</div>
          <div style={{ fontSize: 10, color: T.t3, marginTop: 6 }}>Captured Payloads: {stats?.file_downloads || 0} files</div>
        </Card>
      </div>

      {/* Deception Traps & Honey-Credentials */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card>
          <CLbl right="Active Honey-Users">Emulated Accounts & Traps</CLbl>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { user: "root", pass: "root / 123456 / admin", risk: "CRITICAL TRAP", hits: "49 login attempts" },
              { user: "admin", pass: "admin / admin123", risk: "HIGH TRAP", hits: "18 login attempts" },
              { user: "ubuntu", pass: "ubuntu / password", risk: "MEDIUM TRAP", hits: "12 login attempts" },
              { user: "postgres", pass: "postgres", risk: "DATABASE TRAP", hits: "6 login attempts" },
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: T.bg1, border: `1px solid ${T.bd}`, borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: T.g, fontFamily: "monospace" }}>{t.user}</div>
                  <div style={{ fontSize: 10, color: T.t3 }}>Emulated pass: {t.pass}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 9.5, fontWeight: 700, background: T.gDim, color: T.g, border: `1px solid ${T.bdG}` }}>
                    {t.risk}
                  </span>
                  <div style={{ fontSize: 10, color: T.t2, marginTop: 3 }}>{t.hits}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CLbl right="Decoy Filesystem">Fake Sensitive Artifacts</CLbl>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { path: "/etc/passwd & /etc/shadow", type: "Credential Hash Decoy", status: "Monitored" },
              { path: "/var/www/html/.env", type: "Database Credential Decoy", status: "Monitored" },
              { path: "/home/user/.aws/credentials", type: "Cloud Access Key Decoy", status: "Monitored" },
              { path: "/root/.ssh/id_rsa", type: "SSH Private Key Decoy", status: "Monitored" },
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: T.bg1, border: `1px solid ${T.bd}`, borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.t0, fontFamily: "monospace" }}>{f.path}</div>
                  <div style={{ fontSize: 10, color: T.t3 }}>{f.type}</div>
                </div>
                <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 9.5, fontWeight: 700, background: "rgba(255,200,100,.10)", color: "#ffcc66", border: "1px solid rgba(255,200,100,.3)" }}>
                  {f.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Interactive Command Sandbox */}
      <TerminalSimulator />

      {/* Gemini AI Deception Recommendations */}
      <Card glow>
        <CLbl right="Gemini 2.5 Flash">AI Honeypot Deception Recommendations</CLbl>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {[
            { title: "Dynamic Decoy Credentials", desc: "Inject dynamic PostgreSQL & Redis honey-credentials to detect lateral movement attempts.", impact: "High Impact" },
            { title: "TarPit Delay Injection", desc: "Slow down suspicious SSH brute-force connections by adding 250ms latency per authentication attempt.", opacity: "Medium Impact" },
            { title: "Payload Auto-Hashing", desc: "Instantly calculate SHA256 hashes of all downloaded binaries and verify against VirusTotal database.", impact: "Automated" },
          ].map((rec, i) => (
            <div key={i} style={{ padding: 12, background: T.bg1, border: `1px solid ${T.bdG}`, borderRadius: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.g, marginBottom: 4 }}>{rec.title}</div>
              <div style={{ fontSize: 10.5, color: T.t2, lineHeight: 1.5, marginBottom: 8 }}>{rec.desc}</div>
              <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: T.gDim, color: T.g }}>
                {rec.impact || rec.opacity}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
