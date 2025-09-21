
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { getAllCategories } from '../services/categoryService';

const ExpensePieChart = ({ data }) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (data.length > 0 && categories.length > 0) {
      processExpenseData();
    }
  }, [data, categories]);

  const fetchCategories = async () => {
    try {
      const categoriesData = await getAllCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const processExpenseData = () => {
    // Group expenses by category
    const categoryTotals = {};

    data.forEach(expense => {
      // Handle category - could be ObjectId string or populated object
      let categoryId = '';
      if (expense.category) {
        if (typeof expense.category === 'object' && expense.category._id) {
          categoryId = expense.category._id;
        } else if (typeof expense.category === 'string') {
          categoryId = expense.category;
        }
      }

      if (categoryId) {
        if (categoryTotals[categoryId]) {
          categoryTotals[categoryId] += expense.amount;
        } else {
          categoryTotals[categoryId] = expense.amount;
        }
      }
    });

    // Create chart data with category colors
    const processedData = Object.entries(categoryTotals).map(([categoryId, total]) => {
      const category = categories.find(cat => cat._id === categoryId);
      return {
        name: category ? category.name : categoryId,
        value: total,
        color: category ? category.color : '#8884d8'
      };
    });

    setChartData(processedData);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 h-96">
        <h3 className="font-bold mb-4 text-lg">{t('expenseDistribution')}</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
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
