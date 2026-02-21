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

// Banks
export const getBanks = () => request('/banks');
export const createBank = (data) => request('/banks', { method: 'POST', body: JSON.stringify(data) });
export const updateBank = (id, data) => request(`/banks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteBank = (id) => request(`/banks/${id}`, { method: 'DELETE' });

// Categories
export const getCategories = () => request('/categories');
export const createCategory = (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) });
export const updateCategory = (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// Snapshots
export const getSnapshots = () => request('/snapshots');
export const getSnapshot = (id) => request(`/snapshots/${id}`);
export const createSnapshot = (data) => request('/snapshots', { method: 'POST', body: JSON.stringify(data) });
export const updateSnapshot = (id, data) => request(`/snapshots/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSnapshot = (id) => request(`/snapshots/${id}`, { method: 'DELETE' });

// Income
export const getIncome = (snapshotId) => request(`/income${snapshotId ? `?snapshotId=${snapshotId}` : ''}`);
export const createIncome = (data) => request('/income', { method: 'POST', body: JSON.stringify(data) });
export const updateIncome = (id, data) => request(`/income/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteIncome = (id) => request(`/income/${id}`, { method: 'DELETE' });

// Dashboard
export const getDashboardSummary = () => request('/dashboard/summary');
export const getDashboardEvolution = () => request('/dashboard/evolution');
export const getDashboardIncome = () => request('/dashboard/income');
