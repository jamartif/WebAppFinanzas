import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { getCategories, createCategory, updateCategory, getDashboardEvolution, getSnapshots } from '../services/api';
import { useProfile } from '../contexts/ProfileContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

function formatMoney(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}

function formatMonth(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Investments() {
  const { activeProfileId } = useProfile();
  const { data: categories, loading: l1, refetch } = useApi(() => getCategories(activeProfileId), [activeProfileId]);
  const { data: evolution, loading: l2 } = useApi(() => getDashboardEvolution(activeProfileId), [activeProfileId]);
  const { data: snapshots, loading: l3 } = useApi(() => getSnapshots(activeProfileId), [activeProfileId]);

  const [form, setForm] = useState({ name: '', type: 'FUND', description: '' });
  const [editing, setEditing] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await updateCategory(editing, form);
      setEditing(null);
    } else {
      await createCategory(activeProfileId, form);
    }
    setForm({ name: '', type: 'FUND', description: '' });
    refetch();
  };

  const handleEdit = (cat) => {
    setEditing(cat.id);
    setForm({ name: cat.name, type: cat.type, description: cat.description || '' });
  };

  if (l1 || l2 || l3) return <p className="text-gray-500 p-8">Cargando...</p>;

  const latest = snapshots && snapshots.length > 0 ? snapshots[0] : null;
  const investments = latest ? latest.investments : [];

  const chartData = (evolution || []).map((snap) => {
    const row = { month: formatMonth(snap.month) };
    Object.entries(snap.byCategory || {}).forEach(([cat, vals]) => {
      row[cat] = vals.value;
    });
    return row;
  });

  const categoryNames = [...new Set((evolution || []).flatMap((s) => Object.keys(s.byCategory || {})))];

  return (
    <div className="space-y-4 lg:space-y-6">
      <h2 className="text-xl lg:text-2xl font-bold text-gray-800">Inversiones</h2>

      {/* Categories management */}
      <div className="bg-white rounded-xl shadow p-4 lg:p-5">
        <h3 className="text-base lg:text-lg font-semibold mb-4">Categorias de Inversion</h3>
        <div className="mb-4 overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[500px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Descripcion</th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(categories || []).map((cat) => (
                <tr key={cat.id}>
                  <td className="px-4 py-2 font-medium">{cat.name}</td>
                  <td className="px-4 py-2">
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      {cat.type}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500">{cat.description}</td>
                  <td className="px-4 py-2">
                    <button onClick={() => handleEdit(cat)} className="text-blue-600 hover:underline text-xs">
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add/edit form */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: Fondos Indexados"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              required
            >
              <option value="FUND">Fondo</option>
              <option value="STOCK">Accion</option>
              <option value="COMMODITY">Commodity</option>
              <option value="CROWDFUNDING">Crowdfunding</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Descripcion</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Opcional"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 sm:flex-none bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm">
              {editing ? 'Guardar' : 'Crear'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => { setEditing(null); setForm({ name: '', type: 'FUND', description: '' }); }}
                className="text-gray-500 hover:underline text-sm px-2"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Current investments table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Categoria</th>
                <th className="px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Invertido Mes</th>
                <th className="px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Acumulado</th>
                <th className="px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Valor Actual</th>
                <th className="px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Rent.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {investments.map((inv) => {
                const investedThisMonth = Number(inv.investedAmount);
                const accumulated = Number(inv.accumulatedAmount);
                const current = Number(inv.currentValue);
                const ret = accumulated > 0 ? ((current - accumulated) / accumulated) * 100 : 0;
                return (
                  <tr key={inv.id}>
                    <td className="px-4 lg:px-6 py-4 font-medium">{inv.category.name}</td>
                    <td className="px-4 lg:px-6 py-4 text-gray-500 text-sm">{inv.category.type}</td>
                    <td className="px-4 lg:px-6 py-4 text-right text-blue-600 text-sm">{formatMoney(investedThisMonth)}</td>
                    <td className="px-4 lg:px-6 py-4 text-right font-semibold text-sm">{formatMoney(accumulated)}</td>
                    <td className="px-4 lg:px-6 py-4 text-right text-sm">{formatMoney(current)}</td>
                    <td className={`px-4 lg:px-6 py-4 text-right font-semibold text-sm ${ret >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {ret >= 0 ? '+' : ''}{ret.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
              {investments.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Sin datos de inversiones</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evolution chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4 lg:p-5">
          <h3 className="text-base lg:text-lg font-semibold mb-4">Valor por Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `${Number(v).toLocaleString('es-ES')} EUR`} />
              <Legend />
              {categoryNames.map((cat, i) => (
                <Line key={cat} type="monotone" dataKey={cat} stroke={COLORS[i % COLORS.length]} strokeWidth={2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
