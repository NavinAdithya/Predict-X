const API_BASE = "/api";

export async function healthCheck() {
  const response = await fetch(`${API_BASE}/health`, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }
  return response.json();
}

export async function getStats() {
  const response = await fetch(`${API_BASE}/stats`, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.statusText}`);
  }
  return response.json();
}

export async function getEvents(params = {}) {
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
  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.statusText}`);
  }
  return response.json();
}

export async function getCustody(params = {}) {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set("limit", params.limit);
  if (params.type) query.set("type", params.type);

  const url = `${API_BASE}/custody${query.toString() ? `?${query.toString()}` : ""}`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch custody records: ${response.statusText}`);
  }
  return response.json();
}

export async function verifyHash(hash) {
  if (!hash) {
    return { verified: false, message: "Missing hash parameter", hash: "" };
  }
  const url = `${API_BASE}/verify?hash=${encodeURIComponent(hash)}`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!response.ok) {
    throw new Error(`Failed to verify hash: ${response.statusText}`);
  }
  return response.json();
}

export async function getFiles(params = {}) {
  const query = new URLSearchParams();
  if (params.prefix) query.set("prefix", params.prefix);

  const url = `${API_BASE}/files${query.toString() ? `?${query.toString()}` : ""}`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch files: ${response.statusText}`);
  }
  return response.json();
}

export default {
  healthCheck,
  getStats,
  getEvents,
  getCustody,
  verifyHash,
  getFiles,
};
