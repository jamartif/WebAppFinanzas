import { useApi } from '../hooks/useApi';
import { getDashboardIncome, getIncome } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

function formatMoney(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}

function formatMonth(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function PassiveIncome() {
  const { data: incomeData, loading: l1 } = useApi(getDashboardIncome);
  const { data: allIncome, loading: l2 } = useApi(getIncome);

  if (l1 || l2) return <p className="text-gray-500 p-8">Cargando...</p>;

  const monthly = incomeData?.monthly || [];
  const totalAccumulated = incomeData?.totalAccumulated || 0;

  // Aggregate by source for pie chart
  const bySource = {};
  (allIncome || []).forEach((inc) => {
    bySource[inc.source] = (bySource[inc.source] || 0) + Number(inc.amount);
  });
  const pieData = Object.entries(bySource).map(([name, value]) => ({ name, value }));

  const chartData = monthly.map((m) => ({
    month: formatMonth(m.month),
    total: m.total,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Ingresos Pasivos</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Total Acumulado</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">{formatMoney(totalAccumulated)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Ultimo Mes</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">
            {formatMoney(monthly.length > 0 ? monthly[monthly.length - 1].total : 0)}
          </p>
        </div>
      </div>

      {/* Entries table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Fuente</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Categoria</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Importe</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Descripcion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(allIncome || []).map((inc) => (
              <tr key={inc.id}>
                <td className="px-6 py-4 font-medium">{inc.source}</td>
                <td className="px-6 py-4 text-gray-500">{inc.category?.name}</td>
                <td className="px-6 py-4 text-right font-semibold text-green-600">{formatMoney(Number(inc.amount))}</td>
                <td className="px-6 py-4 text-gray-400">{inc.description}</td>
              </tr>
            ))}
            {(!allIncome || allIncome.length === 0) && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">Sin ingresos pasivos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly bar chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-lg font-semibold mb-4">Por Mes</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v) => `${Number(v).toLocaleString('es-ES')} EUR`} />
                <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Ingresos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* By source pie chart */}
        {pieData.length > 0 && (
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-lg font-semibold mb-4">Por Fuente</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${Number(v).toLocaleString('es-ES')} EUR`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
