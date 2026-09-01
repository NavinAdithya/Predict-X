import { useState, useEffect } from "react";
import predictXData from "../services/predictXData";

const G = "#39ff3c";
const T = {
  bg0: "#050c06",
  bg1: "#071008",
  bg2: "#091409",
  bg3: "#0c1a0d",
  card: "#0d1a0e",
  g: G,
  gDim: "rgba(57,255,60,0.10)",
  bd: "rgba(255,255,255,0.055)",
  bdG: "rgba(57,255,60,0.18)",
  bdG2: "rgba(57,255,60,0.35)",
  t0: "#ffffff",
  t1: "#c5dac6",
  t2: "#8aaa8b",
  t3: "#4e6b4f",
  rsSafe: G,
  rsMed: "#ddeedd",
  rsCrit: "#ff5555",
};

const SAFE_USERS = ["safe", "user_a", "user_b", "john", "jane", "test", "leeben", "admin"];
const CRITICAL_USERS = ["critical", "highrisk", "attacker", "fraud", "hack", "malicious", "threat"];

function getRiskLevel(userId) {
  const id = (userId || "").toLowerCase();
  if (CRITICAL_USERS.some((u) => id.includes(u))) return "high";
  if (SAFE_USERS.some((u) => id.includes(u))) return "safe";
  return "medium";
}

export default function UserDashboard({ user, onLogout }) {
  const [redirecting, setRedirecting] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    setProgress(0);
    setResult(null);
    setScore(0);
    setRedirecting(false);

    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(t);
          const riskLevel = getRiskLevel(user.id);
          setResult(riskLevel);

          if (riskLevel === "safe") {
            const safeScore = Math.floor(Math.random() * 8) + 12; // 12-19
            setScore(safeScore);
            predictXData.simulateSafeUser(user.id, safeScore, "https://www.kyndryl.com/in/en");
          } else if (riskLevel === "high") {
            setScore(97);
            predictXData.simulateHighRiskUser(user.id, ["impossible_travel", "typing_anomaly", "behavioral_anomaly"]);
          } else {
            setScore(45);
          }

          return 100;
        }
        return p + 4;
      });
    }, 60);

    return () => clearInterval(t);
  }, [user.id]);

  const handleRedirect = () => {
    setRedirecting(true);
    setTimeout(() => {
      window.open("https://www.kyndryl.com/in/en", "_blank");
    }, 1200);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg0,
        color: T.t1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "fixed",
          width: 900,
          height: 600,
          top: -240,
          left: "50%",
          transform: "translateX(-50%)",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center,rgba(18,95,20,.40) 0%,transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          width: 500,
          height: 500,
          bottom: -160,
          right: -100,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center,rgba(10,65,12,.24) 0%,transparent 68%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 10, width: 520, maxWidth: "94vw" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.t0, letterSpacing: "-0.5px" }}>
            Predict<span style={{ color: G }}>-X</span>
          </div>
          <div style={{ fontSize: 10, color: T.t3, letterSpacing: "2.5px", marginTop: 4, textTransform: "uppercase" }}>
            Real-Time Session Risk Classification
          </div>
        </div>

        <div
          style={{
            background: T.card,
            border: `1px solid ${T.bd}`,
            borderRadius: 18,
            padding: "28px 28px 24px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 24px 70px rgba(0,0,0,.6)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "10%",
              right: "10%",
              height: 1,
              background: `linear-gradient(90deg,transparent,${T.bdG},transparent)`,
            }}
          />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.t0 }}>
                Session: <span style={{ color: G }}>{user.email}</span>
              </div>
              <div style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>Edge behavioral verification active</div>
            </div>
            <button
              onClick={onLogout}
              style={{
                padding: "6px 12px",
                background: T.bg2,
                border: `1px solid ${T.bd}`,
                borderRadius: 8,
                color: T.t2,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: T.t3, letterSpacing: 1, textTransform: "uppercase" }}>
                AI Classification Pipeline
              </span>
              <span style={{ fontSize: 10, color: G, fontWeight: 700 }}>{progress}%</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,.05)", borderRadius: 3, overflow: "hidden" }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: `linear-gradient(90deg,${G},rgba(57,255,60,.6))`,
                  borderRadius: 3,
                  transition: "width .1s linear",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, gap: 4 }}>
              {["Honeypot", "Cognitive", "Rules", "ML Engine", "Classify"].map((s, i) => (
                <div
                  key={s}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: 9.5,
                    color: progress >= (i + 1) * 20 ? G : T.t3,
                    fontWeight: progress >= (i + 1) * 20 ? 700 : 400,
                    transition: "color .2s",
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Result Card */}
          {result && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  textAlign: "center",
                  padding: "18px 16px",
                  background:
                    result === "safe"
                      ? T.gDim
                      : result === "medium"
                      ? "rgba(221,238,221,.07)"
                      : "rgba(255,68,68,.12)",
                  border: `1px solid ${
                    result === "safe"
                      ? T.bdG
                      : result === "medium"
                      ? "rgba(221,238,221,.18)"
                      : "rgba(255,68,68,.3)"
                  }`,
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: result === "safe" ? G : result === "medium" ? T.rsMed : "#ff6666",
                    marginBottom: 4,
                  }}
                >
                  {result === "safe"
                    ? `SAFE (Score: ${score})`
                    : result === "medium"
                    ? `LOW / MEDIUM RISK (Score: ${score})`
                    : `HIGH RISK (Score: ${score})`}
                </div>
                <div style={{ fontSize: 12, color: T.t1, lineHeight: 1.6 }}>
                  {result === "safe"
                    ? "✓ No threats detected. User classified as legitimate. Keystroke and mouse dynamics validated."
                    : result === "medium"
                    ? "⚠ Moderate anomaly score. Session flagged for background telemetry and honeypot monitoring."
                    : "☠ Critical threat detected. Impossible travel + typing anomaly. Self-poisoning data stream active. Admin notified."}
                </div>
              </div>

              {result === "safe" && (
                <div style={{ textAlign: "center" }}>
                  {redirecting ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 9,
                        fontSize: 12,
                        color: G,
                        fontWeight: 600,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: G,
                          boxShadow: `0 0 8px ${G}`,
                          animation: "pulse 1s ease-in-out infinite",
                        }}
                      />
                      Redirecting to Kyndryl Careers / Academy…
                    </div>
                  ) : (
                    <button
                      onClick={handleRedirect}
                      style={{
                        width: "100%",
                        padding: "12px",
                        background: G,
                        border: "none",
                        borderRadius: 10,
                        color: T.bg0,
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: "pointer",
                        boxShadow: "0 0 20px rgba(57,255,60,.3)",
                      }}
                    >
                      Proceed to Kyndryl Portal →
                    </button>
                  )}
                </div>
              )}

              {result === "high" && (
                <div
                  style={{
                    padding: 12,
                    background: T.bg2,
                    border: "1px solid rgba(255,68,68,.3)",
                    borderRadius: 9,
                    fontSize: 11,
                    color: "#ffaaaa",
                    lineHeight: 1.7,
                  }}
                >
                  <strong>Self-Poisoning Active:</strong> Injected synthetic keystroke latency and corrupted behavioral
                  signatures to neutralize adversary telemetry. Incident logged to Chain of Custody.
                </div>
              )}

              {result === "medium" && (
                <div
                  style={{
                    padding: 12,
                    background: T.bg2,
                    border: `1px solid ${T.bd}`,
                    borderRadius: 9,
                    fontSize: 11,
                    color: T.t2,
                    lineHeight: 1.7,
                  }}
                >
                  <strong>Active Monitoring:</strong> Your session is operating within monitored parameters. For assistance,
                  contact your security team at <span style={{ color: G }}>admin@predictx.io</span>.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Scenario Helper */}
        <div
          style={{
            marginTop: 16,
            background: T.bg2,
            border: `1px solid ${T.bd}`,
            borderRadius: 12,
            padding: "12px 14px",
            fontSize: 11,
            color: T.t3,
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: T.t2 }}>Test Accounts:</strong>
          <br />• Safe: <code style={{ color: G }}>safe1@company.com</code> or <code style={{ color: G }}>user_a@company.com</code>
          <br />• High Risk: <code style={{ color: "#ff6666" }}>critical@company.com</code> or <code style={{ color: "#ff6666" }}>attacker@hacker.com</code>
          <br />• Medium: <code style={{ color: T.t1 }}>anyother@email.com</code>
        </div>
      </div>
    </div>
  );
}
