import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

function formatMonth(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
}

export default function PatrimonyChart({ data }) {
  const chartData = data.map((d) => ({
    month: formatMonth(d.month),
    Liquidez: d.liquidity,
    Inversiones: d.investmentValue,
    Patrimonio: d.patrimony,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(v) => `${Number(v).toLocaleString('es-ES')} EUR`} />
        <Legend />
        <Area type="monotone" dataKey="Liquidez" stackId="1" stroke="#3b82f6" fill="#93c5fd" />
        <Area type="monotone" dataKey="Inversiones" stackId="1" stroke="#10b981" fill="#6ee7b7" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
