const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const chat = (message, sessionId) =>
  fetch(`${BASE}/api/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId })
  }).then(r => {
    if (!r.ok) throw new Error("Agent request failed");
    return r.json();
  });

export const getAnalyticsOverview = () =>
  fetch(`${BASE}/api/analytics/overview`).then(r => {
    if (!r.ok) throw new Error("Failed to fetch analytics");
    return r.json();
  });

export const getCustomers = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.tier) params.append("tier", filters.tier);
  if (filters.city) params.append("city", filters.city);
  if (filters.channel) params.append("channel", filters.channel);
  if (filters.product) params.append("product", filters.product);
  if (filters.joined_last_days) params.append("joined_last_days", filters.joined_last_days);
  return fetch(`${BASE}/api/customers?${params.toString()}`).then(r => {
    if (!r.ok) throw new Error("Failed to fetch customers");
    return r.json();
  });
};

export const getCustomerDetail = (id) =>
  fetch(`${BASE}/api/customers/${id}`).then(r => {
    if (!r.ok) throw new Error("Failed to fetch customer detail");
    return r.json();
  });

export const getCampaigns = () =>
  fetch(`${BASE}/api/campaigns`).then(r => {
    if (!r.ok) throw new Error("Failed to fetch campaigns");
    return r.json();
  });

export const getCampaignStats = (id) =>
  fetch(`${BASE}/api/campaigns/${id}/stats`).then(r => {
    if (!r.ok) throw new Error("Failed to fetch campaign stats");
    return r.json();
  });

export const deleteCampaign = (id) =>
  fetch(`${BASE}/api/campaigns/${id}`, { method: 'DELETE' }).then(r => {
    if (!r.ok) throw new Error("Failed to delete campaign");
    return r.json();
  });

export const archiveCampaign = (id) =>
  fetch(`${BASE}/api/campaigns/${id}/archive`, { method: 'PUT' }).then(r => {
    if (!r.ok) throw new Error("Failed to archive campaign");
    return r.json();
  });

export const unarchiveCampaign = (id) =>
  fetch(`${BASE}/api/campaigns/${id}/unarchive`, { method: 'PUT' }).then(r => {
    if (!r.ok) throw new Error("Failed to unarchive campaign");
    return r.json();
  });

export const uploadCSV = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return fetch(`${BASE}/api/customers/upload`, {
    method: 'POST',
    body: fd
  }).then(r => {
    if (!r.ok) throw new Error("Failed to upload CSV");
    return r.json();
  });
};

export const previewSegment = (filters) =>
  fetch(`${BASE}/api/segment/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters)
  }).then(r => {
    if (!r.ok) throw new Error("Failed to preview segment");
    return r.json();
  });
