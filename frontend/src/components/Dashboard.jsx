import { useApi } from '../hooks/useApi';
import { getDashboardSummary, getDashboardEvolution, getDashboardIncome } from '../services/api';
import { useProfile } from '../contexts/ProfileContext';
import PatrimonyChart from './charts/PatrimonyChart';
import DistributionPie from './charts/DistributionPie';
import GrowthChart from './charts/GrowthChart';

function formatMoney(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 lg:p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-xl lg:text-2xl font-bold mt-1 ${color || 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { activeProfileId } = useProfile();
  const { data: summary, loading: l1 } = useApi(() => getDashboardSummary(activeProfileId), [activeProfileId]);
  const { data: evolution, loading: l2 } = useApi(() => getDashboardEvolution(activeProfileId), [activeProfileId]);
  const { data: incomeData, loading: l3 } = useApi(() => getDashboardIncome(activeProfileId), [activeProfileId]);

  if (l1 || l2 || l3) return <p className="text-gray-500 p-8">Cargando dashboard...</p>;

  const s = summary || {};

  return (
    <div className="space-y-4 lg:space-y-6">
      <h2 className="text-xl lg:text-2xl font-bold text-gray-800">Dashboard</h2>

      {/* KPI Cards — 2 cols en móvil, 4 en desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label="Patrimonio Total" value={formatMoney(s.totalPatrimony)} />
        <KpiCard label="Liquidez" value={formatMoney(s.totalLiquidity)} color="text-blue-600" />
        <KpiCard
          label="Valor Inversiones"
          value={formatMoney(s.totalInvestmentValue)}
          sub={`Invertido: ${formatMoney(s.totalInvested)}`}
          color="text-green-600"
        />
        <KpiCard
          label="Crecimiento Mensual"
          value={`${s.monthlyGrowthPercent >= 0 ? '+' : ''}${s.monthlyGrowthPercent}%`}
          sub={formatMoney(s.monthlyGrowth)}
          color={s.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:gap-4">
        <KpiCard
          label="Rentabilidad Global"
          value={`${s.globalReturn >= 0 ? '+' : ''}${s.globalReturn}%`}
          color={s.globalReturn >= 0 ? 'text-green-600' : 'text-red-600'}
        />
        <KpiCard
          label="Ingresos Pasivos (mes)"
          value={formatMoney(s.passiveIncomeMonth)}
          sub={`Acumulados: ${formatMoney(incomeData?.totalAccumulated || 0)}`}
          color="text-purple-600"
        />
      </div>

      {/* Charts */}
      {evolution && evolution.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-white rounded-xl shadow p-4 lg:p-5">
            <h3 className="text-base lg:text-lg font-semibold mb-4">Patrimonio</h3>
            <PatrimonyChart data={evolution} />
          </div>
          <div className="bg-white rounded-xl shadow p-4 lg:p-5">
            <h3 className="text-base lg:text-lg font-semibold mb-4">Distribucion Actual</h3>
            <DistributionPie summary={s} />
          </div>
        </div>
      )}

      {incomeData && incomeData.monthly && incomeData.monthly.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4 lg:p-5">
          <h3 className="text-base lg:text-lg font-semibold mb-4">Ingresos Pasivos</h3>
          <GrowthChart data={incomeData.monthly} />
        </div>
      )}
    </div>
  );
}
