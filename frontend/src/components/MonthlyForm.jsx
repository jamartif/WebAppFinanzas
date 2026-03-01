import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useProfile } from '../contexts/ProfileContext';
import {
  getBanks, getCategories, getSnapshot, getSnapshots,
  createSnapshot, updateSnapshot, deleteSnapshot,
} from '../services/api';

function formatMonth(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().slice(0, 7);
}

export default function MonthlyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { activeProfileId } = useProfile();

  const { data: banks, loading: l1 } = useApi(() => getBanks(activeProfileId), [activeProfileId]);
  const { data: categories, loading: l2 } = useApi(() => getCategories(activeProfileId), [activeProfileId]);
  const { data: snapshots, loading: l3 } = useApi(() => getSnapshots(activeProfileId), [activeProfileId]);

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState('');
  const [bankBalances, setBankBalances] = useState({});
  const [investmentData, setInvestmentData] = useState({});
  const [incomeEntries, setIncomeEntries] = useState([]);
  const [saving, setSaving] = useState(false);

  // Limpiar estado al cambiar de perfil
  useEffect(() => {
    if (!isEditing) {
      setNotes('');
      setBankBalances({});
      setInvestmentData({});
      setIncomeEntries([]);
    }
  }, [activeProfileId, isEditing]);

  // Load snapshot data for editing
  useEffect(() => {
    if (isEditing && id) {
      getSnapshot(parseInt(id)).then((snap) => {
        setMonth(formatMonth(snap.month));
        setNotes(snap.notes || '');
        const bb = {};
        snap.banks.forEach((b) => { bb[b.bankId] = Number(b.balance); });
        setBankBalances(bb);
        const inv = {};
        snap.investments.forEach((i) => {
          inv[i.categoryId] = {
            investedAmount: Number(i.investedAmount),
            currentValue: Number(i.currentValue),
          };
        });
        setInvestmentData(inv);
        setIncomeEntries(snap.income.map((inc) => ({
          categoryId: inc.categoryId,
          amount: Number(inc.amount),
          source: inc.source,
          description: inc.description || '',
        })));
      });
    }
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      month: `${month}-01`,
      notes,
      banks: Object.entries(bankBalances)
        .filter(([, v]) => v !== '' && v !== undefined)
        .map(([bankId, balance]) => ({ bankId: parseInt(bankId), balance: Number(balance) })),
      investments: Object.entries(investmentData)
        .filter(([, v]) => v.investedAmount !== '' || v.currentValue !== '')
        .map(([categoryId, vals]) => ({
          categoryId: parseInt(categoryId),
          investedAmount: Number(vals.investedAmount) || 0,
          currentValue: Number(vals.currentValue) || 0,
        })),
      income: incomeEntries.filter((e) => e.source && e.amount),
    };

    try {
      if (isEditing) {
        await updateSnapshot(parseInt(id), data);
      } else {
        await createSnapshot(activeProfileId, data);
      }
      navigate('/');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Eliminar este registro mensual?')) {
      await deleteSnapshot(parseInt(id));
      navigate('/');
    }
  };

  const addIncomeEntry = () => {
    setIncomeEntries([...incomeEntries, { categoryId: '', amount: '', source: '', description: '' }]);
  };

  const removeIncomeEntry = (idx) => {
    setIncomeEntries(incomeEntries.filter((_, i) => i !== idx));
  };

  const updateIncomeEntry = (idx, field, value) => {
    const updated = [...incomeEntries];
    updated[idx] = { ...updated[idx], [field]: field === 'amount' || field === 'categoryId' ? Number(value) : value };
    setIncomeEntries(updated);
  };

  const handleSelectSnapshot = (snapId) => {
    if (snapId) navigate(`/snapshot/${snapId}`);
  };

  if (l1 || l2 || l3) return <p className="text-gray-500 p-8">Cargando...</p>;

  return (
    <div className="max-w-4xl space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-800">
          {isEditing ? 'Editar Registro Mensual' : 'Nuevo Registro Mensual'}
        </h2>
        {!isEditing && snapshots && snapshots.length > 0 && (
          <select
            onChange={(e) => handleSelectSnapshot(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-full sm:w-auto"
            defaultValue=""
          >
            <option value="">Editar mes existente...</option>
            {snapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {new Date(s.month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
        {/* Month and Notes */}
        <div className="bg-white rounded-xl shadow p-4 lg:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Notas opcionales..."
              />
            </div>
          </div>
        </div>

        {/* Bank Balances */}
        <div className="bg-white rounded-xl shadow p-4 lg:p-5">
          <h3 className="text-base lg:text-lg font-semibold mb-4">Saldos Bancarios</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(banks || []).map((bank) => (
              <div key={bank.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{bank.name}</label>
                <input
                  type="number"
                  step="0.01"
                  value={bankBalances[bank.id] ?? ''}
                  onChange={(e) => setBankBalances({ ...bankBalances, [bank.id]: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="0.00"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Investment Balances */}
        <div className="bg-white rounded-xl shadow p-4 lg:p-5">
          <h3 className="text-base lg:text-lg font-semibold mb-2">Inversiones</h3>
          <p className="text-sm text-gray-600 mb-4">
            💡 <strong>Invertido este mes:</strong> Solo la cantidad nueva que aportas. El acumulado se calcula automáticamente.
          </p>
          <div className="space-y-3">
            {(categories || []).map((cat) => (
              <div key={cat.id} className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
                {/* Nombre de categoría — ocupa fila completa en móvil */}
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                  <span className="text-xs text-gray-400 ml-1">({cat.type})</span>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Invertido 💰</label>
                  <input
                    type="number"
                    step="0.01"
                    value={investmentData[cat.id]?.investedAmount ?? ''}
                    onChange={(e) => setInvestmentData({
                      ...investmentData,
                      [cat.id]: { ...investmentData[cat.id], investedAmount: e.target.value },
                    })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Valor Actual 📈</label>
                  <input
                    type="number"
                    step="0.01"
                    value={investmentData[cat.id]?.currentValue ?? ''}
                    onChange={(e) => setInvestmentData({
                      ...investmentData,
                      [cat.id]: { ...investmentData[cat.id], currentValue: e.target.value },
                    })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Passive Income */}
        <div className="bg-white rounded-xl shadow p-4 lg:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-semibold">Ingresos Pasivos</h3>
            <button type="button" onClick={addIncomeEntry}
              className="bg-purple-600 text-white px-4 py-1 rounded-lg text-sm hover:bg-purple-700">
              + Agregar
            </button>
          </div>
          {incomeEntries.length === 0 && (
            <p className="text-gray-400 text-sm">Sin ingresos pasivos este mes</p>
          )}
          {incomeEntries.map((entry, idx) => (
            <div key={idx} className="mb-3 p-3 bg-gray-50 rounded-lg sm:p-0 sm:bg-transparent">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs text-gray-500 mb-1">Categoria</label>
                  <select
                    value={entry.categoryId}
                    onChange={(e) => updateIncomeEntry(idx, 'categoryId', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Seleccionar</option>
                    {(categories || []).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fuente</label>
                  <input
                    value={entry.source}
                    onChange={(e) => updateIncomeEntry(idx, 'source', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Ej: MSFT"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Importe</label>
                  <input
                    type="number"
                    step="0.01"
                    value={entry.amount}
                    onChange={(e) => updateIncomeEntry(idx, 'amount', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs text-gray-500 mb-1">Descripcion</label>
                  <input
                    value={entry.description}
                    onChange={(e) => updateIncomeEntry(idx, 'description', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 flex sm:block justify-end">
                  <button type="button" onClick={() => removeIncomeEntry(idx)}
                    className="text-red-500 hover:text-red-700 text-sm py-2">Quitar</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving}
            className="flex-1 sm:flex-none bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
            {saving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar Registro'}
          </button>
          {isEditing && (
            <button type="button" onClick={handleDelete}
              className="flex-1 sm:flex-none bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700">
              Eliminar
            </button>
          )}
          <button type="button" onClick={() => navigate('/')}
            className="text-gray-500 hover:underline px-4 py-3">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
