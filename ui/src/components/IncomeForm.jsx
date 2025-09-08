import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const IncomeForm = ({ onClose, income, onSave }) => {
  const { t } = useTranslation();
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('monthly');

  useEffect(() => {
    if (income) {
      setSource(income.source || '');
      setAmount(income.amount?.toString() || '');
      setDescription(income.description || '');
      setDate(income.date ? new Date(income.date).toISOString().split('T')[0] : '');
      setIsRecurring(income.isRecurring || false);
      setFrequency(income.frequency || 'monthly');
    } else {
      setSource('');
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsRecurring(false);
      setFrequency('monthly');
    }
  }, [income]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!source.trim() || !amount) {
      alert(t('incomeRequiredFieldsError'));
      return;
    }
    
    const incomeData = { 
      source: source.trim(),
      amount: parseFloat(amount),
      description: description.trim(),
      date: new Date(date).toISOString(),
      isRecurring,
      frequency
    };
    
    if (onSave) {
      onSave(incomeData);
    }
  };

  const frequencyOptions = [
    { value: 'weekly', label: t('weekly') },
    { value: 'monthly', label: t('monthly') },
    { value: 'yearly', label: t('yearly') }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('source')}</label>
        <input 
          type="text" 
          id="source" 
          value={source} 
          onChange={e => setSource(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
          required 
          placeholder={t('sourcePlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('amount')}</label>
        <input 
          type="number" 
          id="amount" 
          value={amount} 
          onChange={e => setAmount(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          min="0"
          step="0.01"
          required
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('description')}</label>
        <input 
          type="text" 
          id="description" 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder={t('descriptionPlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('date')}</label>
        <input 
          type="date" 
          id="date" 
          value={date} 
          onChange={e => setDate(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      <div className="flex items-center">
        <input 
          type="checkbox" 
          id="isRecurring" 
          checked={isRecurring} 
          onChange={e => setIsRecurring(e.target.checked)} 
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
          {t('isRecurring')}
        </label>
      </div>

      {isRecurring && (
        <div>
          <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('frequency')}</label>
          <select 
            id="frequency" 
            value={frequency} 
            onChange={e => setFrequency(e.target.value)} 
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {frequencyOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <button 
          type="button" 
          onClick={onClose} 
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
        >
          {t('cancel')}
        </button>
        <button 
          type="submit" 
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          {income ? t('update') : t('save')}
        </button>
      </div>
    </form>
  );
};

export default IncomeForm;