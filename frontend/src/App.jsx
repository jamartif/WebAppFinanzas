import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import BankBalances from './components/BankBalances';
import Investments from './components/Investments';
import PassiveIncome from './components/PassiveIncome';
import MonthlyForm from './components/MonthlyForm';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/banks" element={<BankBalances />} />
        <Route path="/investments" element={<Investments />} />
        <Route path="/income" element={<PassiveIncome />} />
        <Route path="/snapshot/new" element={<MonthlyForm />} />
        <Route path="/snapshot/:id" element={<MonthlyForm />} />
      </Routes>
    </Layout>
  );
}
