import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Incomes from './pages/Incomes';
import Assets from './pages/Assets';
import Categories from './pages/Categories';
import RecurringPayments from './pages/RecurringPayments';
import CreditCards from './pages/CreditCards';
import CreditCardForm from './components/CreditCardForm';
import CreditCardInstallments from './pages/CreditCardInstallments';
import Export from './pages/Export';
import ImportData from './pages/ImportData';

function App() {
  return (
    <div className="bg-gray-900 min-h-screen">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="incomes" element={<Incomes />} />
          <Route path="assets" element={<Assets />} />
          <Route path="categories" element={<Categories />} />
          <Route path="recurring-payments" element={<RecurringPayments />} />
          <Route path="credit-cards" element={<CreditCards />} />
          <Route path="credit-cards/new" element={<CreditCardForm />} />
          <Route path="credit-cards/installments" element={<CreditCardInstallments />} />
          <Route path="export" element={<Export />} />
          <Route path="import" element={<ImportData />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;