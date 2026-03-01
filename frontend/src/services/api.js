const API_BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

function withProfile(url, profileId) {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}profileId=${profileId}`;
}

// Profiles
export const getProfiles = () => request('/profiles');
export const createProfile = (data) => request('/profiles', { method: 'POST', body: JSON.stringify(data) });
export const updateProfile = (id, data) => request(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProfile = (id) => request(`/profiles/${id}`, { method: 'DELETE' });

// Banks
export const getBanks = (profileId) => request(withProfile('/banks', profileId));
export const createBank = (profileId, data) => request(withProfile('/banks', profileId), { method: 'POST', body: JSON.stringify(data) });
export const updateBank = (id, data) => request(`/banks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteBank = (id) => request(`/banks/${id}`, { method: 'DELETE' });

// Categories
export const getCategories = (profileId) => request(withProfile('/categories', profileId));
export const createCategory = (profileId, data) => request(withProfile('/categories', profileId), { method: 'POST', body: JSON.stringify(data) });
export const updateCategory = (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// Snapshots
export const getSnapshots = (profileId) => request(withProfile('/snapshots', profileId));
export const getSnapshot = (id) => request(`/snapshots/${id}`);
export const createSnapshot = (profileId, data) => request(withProfile('/snapshots', profileId), { method: 'POST', body: JSON.stringify(data) });
export const updateSnapshot = (id, data) => request(`/snapshots/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSnapshot = (id) => request(`/snapshots/${id}`, { method: 'DELETE' });

// Income
export const getIncome = (profileId, snapshotId) =>
  request(withProfile(`/income${snapshotId ? `?snapshotId=${snapshotId}` : ''}`, profileId));
export const createIncome = (data) => request('/income', { method: 'POST', body: JSON.stringify(data) });
export const updateIncome = (id, data) => request(`/income/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteIncome = (id) => request(`/income/${id}`, { method: 'DELETE' });

// Dashboard
export const getDashboardSummary = (profileId) => request(withProfile('/dashboard/summary', profileId));
export const getDashboardEvolution = (profileId) => request(withProfile('/dashboard/evolution', profileId));
export const getDashboardIncome = (profileId) => request(withProfile('/dashboard/income', profileId));
