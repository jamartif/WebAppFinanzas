import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { getBanks, createBank, updateBank, deleteBank, getDashboardEvolution } from '../services/api';
import { useProfile } from '../contexts/ProfileContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function formatMoney(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}

function formatMonth(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
}

export default function BankBalances() {
  const { activeProfileId } = useProfile();
  const { data: banks, loading, refetch } = useApi(() => getBanks(activeProfileId), [activeProfileId]);
  const { data: evolution } = useApi(() => getDashboardEvolution(activeProfileId), [activeProfileId]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editing, setEditing] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await updateBank(editing, form);
      setEditing(null);
    } else {
      await createBank(activeProfileId, form);
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

  const chartData = (evolution || []).map((snap) => ({
    month: formatMonth(snap.month),
    total: snap.liquidity,
  }));

  return (
    <div className="space-y-4 lg:space-y-6">
      <h2 className="text-xl lg:text-2xl font-bold text-gray-800">Liquidez (Bancos)</h2>

      {/* Bank list */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[400px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Banco</th>
                <th className="px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Descripcion</th>
                <th className="px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(banks || []).map((bank) => (
                <tr key={bank.id}>
                  <td className="px-4 lg:px-6 py-4 font-medium">{bank.name}</td>
                  <td className="px-4 lg:px-6 py-4 text-gray-500 text-sm">{bank.description}</td>
                  <td className="px-4 lg:px-6 py-4 space-x-3">
                    <button onClick={() => handleEdit(bank)} className="text-blue-600 hover:underline text-sm">Editar</button>
                    <button onClick={() => handleDelete(bank.id)} className="text-red-600 hover:underline text-sm">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/edit form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-4 lg:p-5 flex flex-col sm:flex-row gap-3 sm:items-end">
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
        <div className="flex gap-2">
          <button type="submit" className="flex-1 sm:flex-none bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            {editing ? 'Guardar' : 'Crear'}
          </button>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm({ name: '', description: '' }); }}
              className="flex-1 sm:flex-none text-gray-500 hover:underline px-3 py-2">Cancelar</button>
          )}
        </div>
      </form>

      {/* Liquidity evolution chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4 lg:p-5">
          <h3 className="text-base lg:text-lg font-semibold mb-4">Liquidez Total</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `${Number(v).toLocaleString('es-ES')} EUR`} />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Liquidez Total" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
