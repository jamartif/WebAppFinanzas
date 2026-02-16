import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function formatMonth(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
}

export default function GrowthChart({ data }) {
  const chartData = data.map((d) => ({
    month: formatMonth(d.month),
    total: d.total,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(v) => `${Number(v).toLocaleString('es-ES')} EUR`} />
        <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Ingresos Pasivos" />
      </BarChart>
    </ResponsiveContainer>
  );
}
