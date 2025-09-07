
import SummaryCard from '../components/SummaryCard';
import ExpensePieChart from '../components/ExpensePieChart';
import AssetProgress from '../components/AssetProgress';
import { summaryData, expenseData, assetData } from '../data/mockData';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiTarget, FiActivity } from 'react-icons/fi';

const Dashboard = () => {
  const cards = [
    { title: 'Aylık Gelir', value: summaryData.monthlyIncome, icon: <FiTrendingUp />, color: 'text-green-500' },
    { title: 'Aylık Gider', value: summaryData.monthlyExpenses, icon: <FiTrendingDown />, color: 'text-red-500' },
    { title: 'Net Kalan', value: summaryData.netBalance, icon: <FiDollarSign />, color: 'text-blue-500' },
    { title: 'Toplam Varlık', value: summaryData.totalAssets, icon: <FiActivity />, color: 'text-indigo-500' },
  ];

  return (
    <div className="container mx-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        {cards.map(card => <SummaryCard key={card.title} {...card} />)}
      </div>

      {/* Charts and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <ExpensePieChart data={expenseData} />
        </div>
        <div>
            <AssetProgress assets={assetData} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
