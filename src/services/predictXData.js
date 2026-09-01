const API_BASE = "/api";

const EMPTY_SNAPSHOT = {
  liveSessions: [],
  safeRedirects: [],
  highRiskAlerts: [],
  pendingSync: [],
  awsStatus: { outage: false, status: "online", queuedEvents: 0 },
};

class PredictXDataService {
  constructor() {
    this.snapshot = { ...EMPTY_SNAPSHOT };
    this.listeners = [];
    this.pollId = null;
    this.loading = false;
  }

  startPolling() {
    if (this.pollId) return;
    this.refresh();
    this.pollId = setInterval(() => this.refresh(), 5000);
  }

  async refresh() {
    if (this.loading) return;
    this.loading = true;
    try {
      const response = await fetch(`${API_BASE}/dashboard`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });

      if (response.ok) {
        const data = await response.json();
        this.snapshot = {
          ...EMPTY_SNAPSHOT,
          ...data,
        };
        this.notify();
      }
    } catch {
      // Keep the last known snapshot if Cowrie is unavailable.
    } finally {
      this.loading = false;
    }
  }

  subscribe(listener) {
    this.startPolling();
    this.listeners.push(listener);
    listener();
    return () => {
      this.listeners = this.listeners.filter((current) => current !== listener);
    };
  }

  notify() {
    this.listeners.forEach((listener) => listener());
  }

  getLiveSessions() {
    return [...this.snapshot.liveSessions];
  }

  getSafeRedirects() {
    return [...this.snapshot.safeRedirects];
  }

  getHighRiskAlerts() {
    return [...this.snapshot.highRiskAlerts];
  }

  getPendingSync() {
    return [...this.snapshot.pendingSync];
  }

  getAwsStatus() {
    return this.snapshot.awsStatus || { outage: false, status: "online", queuedEvents: 0 };
  }

  setAwsOutage(outage) {
    this.snapshot.awsStatus = {
      ...this.snapshot.awsStatus,
      outage: Boolean(outage),
      status: outage ? "offline" : "online",
      queuedEvents: outage ? (this.snapshot.awsStatus.queuedEvents || 0) + 47 : 0,
    };
    this.notify();
    return this.snapshot.awsStatus;
  }

  addPendingSync(count = 1) {
    this.snapshot.awsStatus = {
      ...this.snapshot.awsStatus,
      queuedEvents: (this.snapshot.awsStatus.queuedEvents || 0) + count,
    };
    this.notify();
    return this.snapshot.awsStatus.queuedEvents;
  }

  syncPendingEvents() {
    this.snapshot.awsStatus = {
      ...this.snapshot.awsStatus,
      outage: false,
      status: "online",
      queuedEvents: 0,
    };
    this.notify();
    return 0;
  }

  updateHighRiskSession(sessionId, updates = {}) {
    this.snapshot.highRiskAlerts = this.snapshot.highRiskAlerts.map((alert) =>
      alert.session_id === sessionId ? { ...alert, ...updates } : alert
    );
    this.notify();
    return true;
  }

  simulateSafeUser(userId = "user_a", riskScore = 15, redirectUrl = "https://www.kyndryl.com/in/en") {
    const sessionId = "sim_" + Math.random().toString(36).substring(2, 8);
    const session = {
      session_id: sessionId,
      user_id: userId,
      risk_score: riskScore,
      status: "safe",
      location: "San Jose (US)",
      device: "Chrome / macOS",
      last_updated: new Date().toISOString(),
      behavioral_fingerprint: {
        keystroke_profile: {
          avg_dwell_time: 72.4,
          avg_flight_time: 138.2,
          error_rate: 0.02,
        },
        mouse_profile: {
          avg_velocity: 580.4,
          curvature_variance: 0.12,
        },
      },
      factors: [],
      poisoning_active: false,
    };

    const redirect = {
      user_id: userId,
      session_id: sessionId,
      risk_score: riskScore,
      redirect_url: redirectUrl,
      timestamp: new Date().toISOString(),
      behavioral_fingerprint: session.behavioral_fingerprint,
    };

    this.snapshot.liveSessions = [session, ...this.snapshot.liveSessions.filter((s) => s.session_id !== sessionId)];
    this.snapshot.safeRedirects = [redirect, ...this.snapshot.safeRedirects];
    this.notify();
    return session;
  }

  simulateHighRiskUser(userId = "attacker_99", factors = ["impossible_travel", "behavioral_anomaly"]) {
    const sessionId = "sim_atk_" + Math.random().toString(36).substring(2, 8);
    const alertId = "HR-" + String(this.snapshot.highRiskAlerts.length + 1).padStart(3, "0");
    const session = {
      session_id: sessionId,
      user_id: userId,
      risk_score: 97,
      status: "high_risk",
      location: "Tor Exit Node (NL)",
      device: "Headless Chrome / Linux",
      last_updated: new Date().toISOString(),
      behavioral_fingerprint: {
        keystroke_profile: {
          avg_dwell_time: 14.1,
          avg_flight_time: 29.3,
          error_rate: 0.0,
        },
        mouse_profile: {
          avg_velocity: 2800.0,
          curvature_variance: 0.01,
        },
      },
      factors: factors,
      poisoning_active: true,
    };

    const alert = {
      alert_id: alertId,
      user_id: userId,
      session_id: sessionId,
      risk_score: 97,
      factors: factors,
      poisoning_active: true,
      timestamp: new Date().toISOString(),
      raw_data: {
        source: "predictx_edge",
        session_id: sessionId,
        user_id: userId,
        location: "Tor Exit Node (NL)",
        flight_speed_anomaly: "NYC 09:00 -> LON 09:05",
        typing_speed: "2400 WPM",
      },
      poison_stream_sample: {
        injected_dwell: 42,
        injected_flight: 210,
        pattern_id: "PS-" + Math.random().toString(36).substring(2, 8),
        timestamp: new Date().toISOString(),
        injected_curvature: "0.0215",
        injected_velocity: "7.80",
      },
    };

    this.snapshot.liveSessions = [session, ...this.snapshot.liveSessions.filter((s) => s.session_id !== sessionId)];
    this.snapshot.highRiskAlerts = [alert, ...this.snapshot.highRiskAlerts];
    this.notify();
    return alert;
  }
}

export const predictXData = new PredictXDataService();
export default predictXData;