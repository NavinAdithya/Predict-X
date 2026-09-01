import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function readJsonFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function dirExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

function firstExisting(paths) {
  return paths.find((candidate) => candidate && fileExists(candidate)) || null;
}

function firstExistingDir(paths) {
  return paths.find((candidate) => candidate && dirExists(candidate)) || null;
}

function getHomeDir() {
  return process.env.HOME || process.env.USERPROFILE || '';
}

function resolveCowrieJsonPath() {
  const home = getHomeDir();
  const candidates = [
    process.env.COWRIE_JSON_LOG,
    process.env.COWRIE_LOG_FILE,
    process.env.COWRIE_LOG_DIR && path.resolve(process.env.COWRIE_LOG_DIR, 'cowrie.json'),
    path.resolve(process.cwd(), 'var/log/cowrie/cowrie.json'),
    path.resolve(process.cwd(), '../cowrie/var/log/cowrie/cowrie.json'),
    home && path.resolve(home, 'cowrie/var/log/cowrie/cowrie.json'),
    home && path.resolve(home, 'my-honeypot/var/log/cowrie/cowrie.json'),
  ];

  return firstExisting(candidates);
}

function resolveCowrieLogDir() {
  const home = getHomeDir();
  const candidates = [
    process.env.COWRIE_LOG_DIR,
    process.env.COWRIE_HONEYPOT_LOG_DIR,
    path.resolve(process.cwd(), 'var/log/cowrie'),
    path.resolve(process.cwd(), '../cowrie/var/log/cowrie'),
    home && path.resolve(home, 'cowrie/var/log/cowrie'),
    home && path.resolve(home, 'my-honeypot/var/log/cowrie'),
  ];

  return firstExistingDir(candidates);
}

function resolveCowrieDownloadsDir() {
  const home = getHomeDir();
  const candidates = [
    process.env.COWRIE_DOWNLOAD_DIR,
    process.env.COWRIE_HONEYPOT_DOWNLOAD_DIR,
    path.resolve(process.cwd(), 'var/lib/cowrie/downloads'),
    path.resolve(process.cwd(), '../cowrie/var/lib/cowrie/downloads'),
    home && path.resolve(home, 'cowrie/var/lib/cowrie/downloads'),
    home && path.resolve(home, 'my-honeypot/var/lib/cowrie/downloads'),
  ];

  return firstExistingDir(candidates);
}

function normalizeEvent(raw, rawLine, index) {
  const timestamp = raw.timestamp || raw.time || new Date().toISOString();
  const eventid = raw.eventid || raw.event || raw.type || 'cowrie.unknown';
  const session = raw.session || raw.session_id || raw.sid || `session-${index}`;
  const srcIp = raw.src_ip || raw.srcip || raw.source_ip || raw.ip || '';
  const username = raw.username || raw.user || '';
  const password = raw.password || '';
  const input = raw.input || raw.command || raw.message || '';
  const sha256 = raw.sha256 || crypto.createHash('sha256').update(rawLine).digest('hex');
  const message = raw.message || input || eventid;

  return {
    ...raw,
    eventid,
    timestamp,
    session,
    src_ip: srcIp,
    username,
    password,
    input,
    message,
    sha256,
    _risk: scoreEvent({ eventid, username, password, input, srcIp }),
  };
}

function scoreEvent(event) {
  const text = `${event.eventid} ${event.username} ${event.password} ${event.input}`.toLowerCase();

  if (
    text.includes('/etc/passwd') ||
    text.includes('/etc/shadow') ||
    text.includes('wget ') ||
    text.includes('curl ') ||
    text.includes('chmod ') ||
    text.includes('sudo ') ||
    text.includes('bash -i') ||
    text.includes('rm -rf') ||
    text.includes('nc ') ||
    text.includes('exec')
  ) {
    return 'critical';
  }

  if (
    text.includes('login.failed') ||
    text.includes('password') ||
    text.includes('admin') ||
    text.includes('root') ||
    text.includes('command.input')
  ) {
    return 'mid';
  }

  if (text.includes('login.success') || text.includes('session.connect')) {
    return 'low';
  }

  return 'safe';
}

function loadCowrieData() {
  const logFile = resolveCowrieJsonPath();
  const logDir = resolveCowrieLogDir();
  const downloadsDir = resolveCowrieDownloadsDir();

  const events = [];
  const raw = logFile ? readJsonFile(logFile) : '';
  const lines = raw.split(/\r?\n/).filter(Boolean);

  lines.forEach((line, index) => {
    try {
      const parsed = JSON.parse(line);
      events.push(normalizeEvent(parsed, line, index));
    } catch {
      // Skip malformed lines.
    }
  });

  events.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

  const stats = buildStats(events);
  const sessions = buildSessions(events);
  const alerts = buildAlerts(sessions);
  const safeRedirects = buildSafeRedirects(sessions);
  const custody = buildCustody(events);
  const files = buildFiles({ logFile, logDir, downloadsDir, custody });

  return {
    events,
    stats,
    sessions,
    alerts,
    safeRedirects,
    custody,
    files,
    paths: { logFile, logDir, downloadsDir },
  };
}

function buildStats(events) {
  const uniqueIps = new Set();
  const ipCounts = new Map();
  const usernameCounts = new Map();
  const passwordCounts = new Map();
  let loginSuccess = 0;
  let loginFailed = 0;
  let connections = 0;
  let commands = 0;
  let fileDownloads = 0;
  let suspiciousAttempts = 0;
  let flaggedLogs = 0;

  for (const event of events) {
    if (event.src_ip) {
      uniqueIps.add(event.src_ip);
      ipCounts.set(event.src_ip, (ipCounts.get(event.src_ip) || 0) + 1);
    }
    if (event.username) usernameCounts.set(event.username, (usernameCounts.get(event.username) || 0) + 1);
    if (event.password) passwordCounts.set(event.password, (passwordCounts.get(event.password) || 0) + 1);

    const eventid = String(event.eventid || '').toLowerCase();
    if (eventid.includes('login.success')) loginSuccess += 1;
    if (eventid.includes('login.failed')) loginFailed += 1;
    if (eventid.includes('session.connect')) connections += 1;
    if (eventid.includes('command.input')) commands += 1;
    if (eventid.includes('download')) fileDownloads += 1;

    if (event._risk === 'mid' || event._risk === 'critical') {
      suspiciousAttempts += 1;
      flaggedLogs += 1;
    }
  }

  const toCountList = (entries) => [...entries.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total_events: events.length,
    login_success: loginSuccess,
    login_failed: loginFailed,
    connections,
    commands,
    file_downloads: fileDownloads,
    unique_ips: uniqueIps.size,
    suspicious_attempts: suspiciousAttempts,
    flagged_logs: flaggedLogs,
    top_ips: toCountList(ipCounts),
    top_usernames: toCountList(usernameCounts),
    top_passwords: toCountList(passwordCounts),
  };
}

function buildSessions(events) {
  const sessions = new Map();

  for (const event of events) {
    const sessionId = event.session || event.session_id || 'unknown';
    const existing = sessions.get(sessionId) || {
      session_id: sessionId,
      user_id: event.username || sessionId,
      risk_score: 0,
      status: 'safe',
      location: event.src_ip || 'Unknown',
      device: 'Cowrie',
      last_updated: event.timestamp,
      behavioral_fingerprint: {
        keystroke_profile: { avg_dwell_time: 0, avg_flight_time: 0, error_rate: 0 },
        mouse_profile: { avg_velocity: 0, curvature_variance: 0 },
      },
      factors: [],
      poisoning_active: false,
    };

    existing.last_updated = event.timestamp;
    if (event.username && existing.user_id === sessionId) existing.user_id = event.username;
    if (event.src_ip) existing.location = event.src_ip;

    const risk = riskScore(event);
    existing.risk_score = Math.max(existing.risk_score, risk.score);
    existing.factors = Array.from(new Set([...existing.factors, ...risk.factors]));
    existing.status = existing.risk_score >= 75 ? 'high_risk' : existing.risk_score >= 35 ? 'medium' : 'safe';
    existing.poisoning_active = existing.status === 'high_risk';

    if (event.eventid && String(event.eventid).includes('login.success')) {
      existing.redirected = false;
    }

    sessions.set(sessionId, existing);
  }

  return [...sessions.values()].sort((a, b) => new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime());
}

function riskScore(event) {
  const text = `${event.eventid} ${event.username} ${event.password} ${event.input}`.toLowerCase();
  const factors = [];
  let score = 0;

  if (text.includes('/etc/passwd') || text.includes('/etc/shadow')) {
    score += 35;
    factors.push('credential_enumeration');
  }
  if (text.includes('wget ') || text.includes('curl ') || text.includes('chmod ') || text.includes('bash -i') || text.includes('rm -rf')) {
    score += 40;
    factors.push('payload_delivery');
  }
  if (text.includes('sudo ') || text.includes('su ')) {
    score += 20;
    factors.push('privilege_escalation');
  }
  if (String(event.eventid).includes('login.failed')) {
    score += 15;
    factors.push('failed_auth');
  }
  if (String(event.eventid).includes('login.success') && event.username === 'root') {
    score += 25;
    factors.push('root_login');
  }
  if (String(event.eventid).includes('command.input')) {
    score += 10;
    factors.push('command_usage');
  }

  return { score: Math.min(100, score), factors };
}

function buildAlerts(sessions) {
  return sessions
    .filter((session) => session.status === 'high_risk')
    .map((session, index) => ({
      alert_id: `HR-${String(index + 1).padStart(3, '0')}`,
      user_id: session.user_id,
      session_id: session.session_id,
      risk_score: session.risk_score,
      factors: session.factors.length > 0 ? session.factors : ['cowrie_suspicious_activity'],
      poisoning_active: false,
      timestamp: session.last_updated,
      raw_data: {
        source: 'cowrie',
        session_id: session.session_id,
        user_id: session.user_id,
        location: session.location,
      },
      poison_stream_sample: null,
    }));
}

function buildSafeRedirects(sessions) {
  return sessions
    .filter((session) => session.status === 'safe')
    .map((session, index) => ({
      user_id: session.user_id,
      session_id: session.session_id,
      risk_score: session.risk_score,
      redirect_url: index % 2 === 0 ? "https://www.kyndryl.com/careers" : "https://aws.amazon.com",
      timestamp: session.last_updated,
      behavioral_fingerprint: session.behavioral_fingerprint,
    }));
}

function buildCustody(events) {
  return events.slice(0, 200).map((event, index) => ({
    id: `COWRIE-${String(index + 1).padStart(5, '0')}`,
    ts: event.timestamp,
    timestamp: event.timestamp,
    hash: event.sha256,
    status: event._risk === 'critical' ? 'flagged' : 'reviewed',
    user: event.username || event.src_ip || 'unknown',
    username: event.username || event.src_ip || 'unknown',
    src_ip: event.src_ip || '',
    type: event.eventid,
    event_type: event.eventid,
    event_id: event.eventid,
    record: event,
  }));
}

function buildFiles({ logFile, logDir, downloadsDir, custody }) {
  const files = [];

  if (logFile) {
    const stat = fs.statSync(logFile);
    files.push({
      key: `raw/${path.basename(logFile)}`,
      size_bytes: stat.size,
      last_modified: stat.mtime.toISOString(),
    });
  }

  if (logDir) {
    for (const name of ['cowrie.log']) {
      const filePath = path.join(logDir, name);
      if (fileExists(filePath)) {
        const stat = fs.statSync(filePath);
        files.push({
          key: `raw/${name}`,
          size_bytes: stat.size,
          last_modified: stat.mtime.toISOString(),
        });
      }
    }
  }

  if (downloadsDir) {
    const entries = fs.readdirSync(downloadsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const filePath = path.join(downloadsDir, entry.name);
      const stat = fs.statSync(filePath);
      files.push({
        key: `malware/${entry.name}`,
        size_bytes: stat.size,
        last_modified: stat.mtime.toISOString(),
      });
    }
  }

  const downloadedHashes = custody.slice(0, 25).map((record) => ({
    key: `raw/${record.id}.json`,
    size_bytes: Buffer.byteLength(JSON.stringify(record.record), 'utf8'),
    last_modified: record.ts,
  }));

  return [...files, ...downloadedHashes].sort((a, b) => new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime());
}

function parseQuery(url) {
  return Object.fromEntries(new URL(url, 'http://localhost').searchParams.entries());
}

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function handleDashboard(req, res) {
  const snapshot = loadCowrieData();
  json(res, 200, {
    liveSessions: snapshot.sessions,
    safeRedirects: snapshot.safeRedirects,
    highRiskAlerts: snapshot.alerts,
    pendingSync: [],
    awsStatus: {
      outage: false,
      status: 'online',
      queuedEvents: 0,
    },
  });
}

function sanitizePathDisplay(fullPath) {
  if (!fullPath) return '';
  const cwd = process.cwd();
  const rel = path.relative(cwd, fullPath).replace(/\\/g, '/');
  if (!rel.startsWith('..')) return rel;
  return path.basename(fullPath);
}

function handleHealth(req, res) {
  const snapshot = loadCowrieData();
  const ready = Boolean(snapshot.paths.logFile);
  json(res, 200, {
    ok: ready,
    source: 'cowrie',
    events: snapshot.events.length,
    s3: ready ? 'ok' : 'error',
    dynamodb: ready ? 'ok' : 'error',
    bucket: sanitizePathDisplay(snapshot.paths.logDir) || 'var/log/cowrie',
    table: sanitizePathDisplay(snapshot.paths.logFile) || 'var/log/cowrie/cowrie.json',
  });
}

function handleStats(req, res) {
  const snapshot = loadCowrieData();
  json(res, 200, snapshot.stats);
}

function handleEvents(req, res) {
  const snapshot = loadCowrieData();
  const query = parseQuery(req.url || '');
  const limit = Number(query.limit || 100);
  const offset = Number(query.offset || 0);
  const eventType = (query.event_type || '').toLowerCase();
  const ip = (query.ip || '').trim();

  let events = snapshot.events;
  if (eventType) {
    events = events.filter((event) => String(event.eventid || '').toLowerCase().includes(eventType));
  }
  if (ip) {
    events = events.filter((event) => String(event.src_ip || '').includes(ip));
  }

  json(res, 200, {
    total: events.length,
    events: events.slice(offset, offset + limit),
  });
}

function handleCustody(req, res) {
  const snapshot = loadCowrieData();
  const query = parseQuery(req.url || '');
  const limit = Number(query.limit || 50);
  const type = (query.type || '').toLowerCase();
  let records = snapshot.custody;

  if (type) {
    records = records.filter((record) => String(record.type || '').toLowerCase().includes(type));
  }

  json(res, 200, { total: records.length, records: records.slice(0, limit) });
}

function handleVerify(req, res) {
  const snapshot = loadCowrieData();
  const query = parseQuery(req.url || '');
  const hash = String(query.hash || '').trim();

  if (!hash) {
    json(res, 400, { verified: false, message: 'Missing hash parameter', hash: '' });
    return;
  }

  const matches = snapshot.custody.filter((record) => record.hash === hash);
  if (matches.length > 0) {
    json(res, 200, {
      verified: true,
      message: 'Hash matches a Cowrie custody record.',
      hash,
      records: matches.map((record) => ({
        event_id: record.event_id,
        timestamp: record.ts,
        user: record.user,
      })),
    });
    return;
  }

  const fileMatch = snapshot.files.find((file) => file.key && file.key.includes(hash));
  json(res, 200, {
    verified: Boolean(fileMatch),
    message: fileMatch ? 'Hash matched a file reference.' : 'No matching Cowrie record found.',
    hash,
    records: [],
  });
}

function handleFiles(req, res) {
  const snapshot = loadCowrieData();
  const query = parseQuery(req.url || '');
  const prefix = String(query.prefix || '').trim();
  const files = prefix ? snapshot.files.filter((file) => file.key.startsWith(prefix)) : snapshot.files;
  json(res, 200, { total: files.length, files });
}

export function createCowrieApiMiddleware() {
  return (req, res, next) => {
    if (!req.url || !req.url.startsWith('/api/')) {
      next();
      return;
    }

    if (req.method !== 'GET') {
      json(res, 405, { message: 'Method not allowed' });
      return;
    }

    if (req.url.startsWith('/api/dashboard')) {
      handleDashboard(req, res);
      return;
    }
    if (req.url.startsWith('/api/health')) {
      handleHealth(req, res);
      return;
    }
    if (req.url.startsWith('/api/stats')) {
      handleStats(req, res);
      return;
    }
    if (req.url.startsWith('/api/events')) {
      handleEvents(req, res);
      return;
    }
    if (req.url.startsWith('/api/custody')) {
      handleCustody(req, res);
      return;
    }
    if (req.url.startsWith('/api/verify')) {
      handleVerify(req, res);
      return;
    }
    if (req.url.startsWith('/api/files')) {
      handleFiles(req, res);
      return;
    }

    json(res, 404, { message: 'Unknown API route' });
  };
}

export function cowrieApiPlugin() {
  return {
    name: 'cowrie-local-api',
    configureServer(server) {
      server.middlewares.use(createCowrieApiMiddleware());
    },
  };
}