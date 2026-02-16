import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { getBanks, createBank, updateBank, deleteBank, getDashboardEvolution } from '../services/api';
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function BankBalances() {
  const { data: banks, loading, refetch } = useApi(getBanks);
  const { data: evolution } = useApi(getDashboardEvolution);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editing, setEditing] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await updateBank(editing, form);
      setEditing(null);
    } else {
      await createBank(form);
    }
    setForm({ name: '', description: '' });
    refetch();
  };

  const handleEdit = (bank) => {
    setEditing(bank.id);
    setForm({ name: bank.name, description: bank.description || '' });
  };

  const handleDelete = async (id) => {
    if (confirm('Eliminar este banco?')) {
      await deleteBank(id);
      refetch();
    }
  };

  if (loading) return <p className="text-gray-500 p-8">Cargando...</p>;

  // Build chart data from evolution
  const chartData = (evolution || []).map((snap) => {
    const row = { month: formatMonth(snap.month), total: snap.liquidity };
    return row;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Liquidez (Bancos)</h2>

      {/* Bank list */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Banco</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Descripcion</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(banks || []).map((bank) => (
              <tr key={bank.id}>
                <td className="px-6 py-4 font-medium">{bank.name}</td>
                <td className="px-6 py-4 text-gray-500">{bank.description}</td>
                <td className="px-6 py-4 space-x-2">
                  <button onClick={() => handleEdit(bank)} className="text-blue-600 hover:underline text-sm">Editar</button>
                  <button onClick={() => handleDelete(bank.id)} className="text-red-600 hover:underline text-sm">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/edit form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-5 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          {editing ? 'Guardar' : 'Crear'}
        </button>
        {editing && (
          <button type="button" onClick={() => { setEditing(null); setForm({ name: '', description: '' }); }}
            className="text-gray-500 hover:underline">Cancelar</button>
        )}
      </form>

      {/* Liquidity evolution chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-lg font-semibold mb-4">Liquidez Total</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v) => `${Number(v).toLocaleString('es-ES')} EUR`} />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Liquidez Total" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
