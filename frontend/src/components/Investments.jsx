import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { getCategories, createCategory, updateCategory, getDashboardEvolution, getSnapshots } from '../services/api';
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
  const { data: categories, loading: l1, refetch } = useApi(getCategories);
  const { data: evolution, loading: l2 } = useApi(getDashboardEvolution);
  const { data: snapshots, loading: l3 } = useApi(getSnapshots);

  const [form, setForm] = useState({ name: '', type: 'FUND', description: '' });
  const [editing, setEditing] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await updateCategory(editing, form);
      setEditing(null);
    } else {
      await createCategory(form);
    }
    setForm({ name: '', type: 'FUND', description: '' });
    refetch();
  };

  const handleEdit = (cat) => {
    setEditing(cat.id);
    setForm({ name: cat.name, type: cat.type, description: cat.description || '' });
  };

  if (l1 || l2 || l3) return <p className="text-gray-500 p-8">Cargando...</p>;

  // Latest snapshot investments
  const latest = snapshots && snapshots.length > 0 ? snapshots[0] : null;
  const investments = latest ? latest.investments : [];

  // Build chart data: value per category over time
  const chartData = (evolution || []).map((snap) => {
    const row = { month: formatMonth(snap.month) };
    Object.entries(snap.byCategory || {}).forEach(([cat, vals]) => {
      row[cat] = vals.value;
    });
    return row;
  });

  const categoryNames = [...new Set((evolution || []).flatMap((s) => Object.keys(s.byCategory || {})))];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Inversiones</h2>

      {/* Categories management */}
      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="text-lg font-semibold mb-4">Categorias de Inversion</h3>
        <div className="mb-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
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
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
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
              className="border rounded-lg px-3 py-2 text-sm"
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
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm">
            {editing ? 'Guardar' : 'Crear'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm({ name: '', type: 'FUND', description: '' });
              }}
              className="text-gray-500 hover:underline text-sm"
            >
              Cancelar
            </button>
          )}
        </form>
      </div>

      {/* Current investments table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Categoria</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Invertido Mes</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Total Acumulado</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Valor Actual</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Rentabilidad</th>
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
                  <td className="px-6 py-4 font-medium">{inv.category.name}</td>
                  <td className="px-6 py-4 text-gray-500">{inv.category.type}</td>
                  <td className="px-6 py-4 text-right text-blue-600">{formatMoney(investedThisMonth)}</td>
                  <td className="px-6 py-4 text-right font-semibold">{formatMoney(accumulated)}</td>
                  <td className="px-6 py-4 text-right">{formatMoney(current)}</td>
                  <td className={`px-6 py-4 text-right font-semibold ${ret >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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

      {/* Evolution chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-lg font-semibold mb-4">Valor por Categoria</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
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
