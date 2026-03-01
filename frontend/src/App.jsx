import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import BankBalances from './components/BankBalances';
import Investments from './components/Investments';
import PassiveIncome from './components/PassiveIncome';
import MonthlyForm from './components/MonthlyForm';
import Profiles from './components/Profiles';
import { useProfile } from './contexts/ProfileContext';

export default function App() {
  const { loading } = useProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <p className="text-gray-500 text-lg">Cargando perfiles...</p>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/banks" element={<BankBalances />} />
        <Route path="/investments" element={<Investments />} />
        <Route path="/income" element={<PassiveIncome />} />
        <Route path="/snapshot/new" element={<MonthlyForm />} />
        <Route path="/snapshot/:id" element={<MonthlyForm />} />
        <Route path="/profiles" element={<Profiles />} />
      </Routes>
    </Layout>
  );
}
