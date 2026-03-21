
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { getExpensesByCategory } from '../services/expenseService';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const ExpensePieChart = () => {
  const { t } = useTranslation();
  const [chartData, setChartData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    getExpensesByCategory(currentMonth)
      .then(data => {
        setChartData(data.map(item => ({
          name: item.category?.name || 'Unknown',
          value: item.totalAmount,
          color: item.category?.color || '#8884d8'
        })));
      })
      .catch(console.error);
  }, [currentMonth]);

  const changeMonth = (delta) => {
    const [year, mon] = currentMonth.split('-').map(Number);
    const d = new Date(year, mon - 1 + delta, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthLabel = new Date(currentMonth + '-01').toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 h-96">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">{t('expenseDistribution')}</h3>
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => changeMonth(-1)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <FiChevronLeft size={16} />
          </button>
          <span className="font-medium w-32 text-center">{monthLabel}</span>
          <button onClick={() => changeMonth(1)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <FiChevronRight size={16} />
          </button>
        </div>
      </div>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 dark:text-gray-400">{t('noData')}</p>
        </div>
      )}
    </div>
  );
};

export default ExpensePieChart;
