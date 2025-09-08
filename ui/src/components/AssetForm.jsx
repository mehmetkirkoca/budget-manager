
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AssetForm = ({ onClose, asset, onSave }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  useEffect(() => {
    if (asset) {
      setName(asset.name || '');
      setType(asset.type || '');
      setDescription(asset.description || '');
      setCurrentAmount(asset.currentAmount?.toString() || '0');
      setTargetAmount(asset.targetAmount?.toString() || '');
    } else {
      setName('');
      setType('');
      setDescription('');
      setCurrentAmount('0');
      setTargetAmount('');
    }
  }, [asset]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !type || !targetAmount) {
      alert(t('assetRequiredFieldsError'));
      return;
    }
    
    const assetData = { 
      name: name.trim(),
      type,
      description: description.trim(),
      currentAmount: parseFloat(currentAmount) || 0,
      targetAmount: parseFloat(targetAmount)
    };
    
    // Call the onSave callback with the asset data
    if (onSave) {
      onSave(assetData);
    }
  };

  const assetTypes = [
    { value: 'savings', label: t('savings') },
    { value: 'investment', label: t('investment') },
    { value: 'realEstate', label: t('realEstate') },
    { value: 'crypto', label: t('crypto') }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('name')}</label>
        <input 
          type="text" 
          id="name" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
          required 
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('type')}</label>
        <select 
          id="type" 
          value={type} 
          onChange={e => setType(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
          required
        >
          <option value="">{t('selectAssetType')}</option>
          {assetTypes.map(assetType => (
            <option key={assetType.value} value={assetType.value}>
              {assetType.label}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('description')}</label>
        <input 
          type="text" 
          id="description" 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="currentAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('currentAmount')}</label>
        <input 
          type="number" 
          id="currentAmount" 
          value={currentAmount} 
          onChange={e => setCurrentAmount(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          min="0"
          step="0.01"
        />
      </div>

      <div>
        <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('targetAmount')}</label>
        <input 
          type="number" 
          id="targetAmount" 
          value={targetAmount} 
          onChange={e => setTargetAmount(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          min="0"
          step="0.01"
          required
        />
      </div>

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
          {asset ? t('update') : t('save')}
        </button>
      </div>
    </form>
  );
};

export default AssetForm;
