import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DistributionPie({ summary }) {
  const data = [
    { name: 'Liquidez', value: summary.totalLiquidity },
    { name: 'Inversiones', value: summary.totalInvestmentValue },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return <p className="text-gray-400 text-center">Sin datos</p>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => `${Number(v).toLocaleString('es-ES')} EUR`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
