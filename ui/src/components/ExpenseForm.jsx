
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllCategories } from '../services/categoryService';

const ExpenseForm = ({ onClose, expense, onSave }) => {
  const { t } = useTranslation();
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('completed');
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await getAllCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (expense) {
      // Handle category - could be ObjectId string or populated object
      let categoryId = '';
      if (expense.category) {
        if (typeof expense.category === 'object' && expense.category._id) {
          categoryId = expense.category._id;
        } else if (typeof expense.category === 'string') {
          categoryId = expense.category;
        }
      }

      setCategory(categoryId);
      setAmount(expense.amount?.toString() || '');
      setDate(expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setDescription(expense.description || '');
      setStatus(expense.status || 'completed');
    } else {
      setCategory('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setStatus('completed');
    }
  }, [expense]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!category || !amount || !date) {
        alert(t('requiredFieldsError'));
        return;
    }
    const expenseData = { 
      category, 
      amount: parseFloat(amount), 
      date: new Date(date).toISOString(), 
      description, 
      status 
    };
    
    // Call the onSave callback with the expense data
    if (onSave) {
      onSave(expenseData);
    }
    
    // In the future, add API calls here:
    // if (expense) {
    //   fetch(`/api/expenses/${expense.id}`, { method: 'PUT', body: JSON.stringify(expenseData) })
    // } else {
    //   fetch('/api/expenses', { method: 'POST', body: JSON.stringify(expenseData) })
    // }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('category')}</label>
        <select 
          id="category" 
          value={category} 
          onChange={e => setCategory(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
          required
          disabled={loadingCategories}
        >
          <option value="">
            {loadingCategories ? t('loading') : t('selectCategory')}
          </option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('amount')}</label>
        <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
      </div>
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('date')}</label>
        <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('description')}</label>
        <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
      </div>
       <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('status')}</label>
        <select id="status" value={status} onChange={e => setStatus(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            <option value="completed">{t('completed')}</option>
            <option value="pending">{t('pending')}</option>
        </select>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('cancel')}</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
          {expense ? t('update') : t('save')}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
