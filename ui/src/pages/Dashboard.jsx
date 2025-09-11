
import { useEffect, useState } from 'react';
import SummaryCard from '../components/SummaryCard';
import ExpensePieChart from '../components/ExpensePieChart';
import AssetProgress from '../components/AssetProgress';
import DashboardCalendar from '../components/DashboardCalendar';
import AutoProcessSummary from '../components/AutoProcessSummary';
import { getSummary } from '../services/dashboardService';
import { getAllExpenses } from '../services/expenseService';
import { getAllAssets } from '../services/assetService';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiTarget, FiActivity } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();
  const [summaryData, setSummaryData] = useState({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    totalBalance: 0,
    totalAssets: 0
  });
  const [expenseData, setExpenseData] = useState([]);
  const [assetData, setAssetData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    document.title = `${t('dashboard')} - ${t('appTitle')}`;
    fetchDashboardData();
  }, [t]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [summary, expenses, assets] = await Promise.all([
        getSummary(),
        getAllExpenses(),
        getAllAssets()
      ]);
      
      setSummaryData({
        monthlyIncome: summary.monthlyIncome,
        monthlyExpenses: summary.monthlyExpenses,
        totalBalance: summary.totalBalance,
        totalAssets: summary.totalAssets
      });
      
      setExpenseData(expenses);
      setAssetData(assets);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const cards = [
    { title: t('monthlyIncome'), value: summaryData.monthlyIncome, icon: <FiTrendingUp />, color: 'text-green-500' },
    { title: t('monthlyExpenses'), value: summaryData.monthlyExpenses, icon: <FiTrendingDown />, color: 'text-red-500' },
    { title: t('totalBalance'), value: summaryData.totalBalance, icon: <FiDollarSign />, color: 'text-blue-500' },
    { title: t('totalAssets'), value: summaryData.totalAssets, icon: <FiActivity />, color: 'text-indigo-500' },
  ];

  if (loading) {
    return (
      <div className="container mx-auto">
        <div className="text-center py-8">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        {cards.map(card => <SummaryCard key={card.title} {...card} />)}
      </div>

      {/* Charts and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
            <ExpensePieChart data={expenseData} />
        </div>
        <div>
            <AssetProgress assets={assetData} />
        </div>
      </div>

      {/* Calendar and Auto-Process Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardCalendar />
        </div>
        <div>
          <AutoProcessSummary />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
