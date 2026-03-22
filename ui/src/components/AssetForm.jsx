
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AssetForm = ({ onClose, asset, onSave }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [unit, setUnit] = useState('TRY');
  const [assetType, setAssetType] = useState('currency');
  const [goldKarat, setGoldKarat] = useState(24);

  useEffect(() => {
    if (asset) {
      setName(asset.name || '');
      setType(asset.type || '');
      setDescription(asset.description || '');
      setCurrentAmount(asset.currentAmount?.toString() || '0');
      setTargetAmount(asset.targetAmount?.toString() || '');
      setUnit(asset.unit || 'TRY');
      setAssetType(asset.assetType || 'currency');
      setGoldKarat(asset.goldKarat || 24);
    } else {
      setName('');
      setType('');
      setDescription('');
      setCurrentAmount('0');
      setTargetAmount('');
      setUnit('TRY');
      setAssetType('currency');
      setGoldKarat(24);
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
      targetAmount: parseFloat(targetAmount),
      unit: unit.trim(),
      assetType,
      ...(assetType === 'gold' && { goldKarat: parseInt(goldKarat) }),
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
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
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
        <label htmlFor="assetType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('assetKind')}</label>
        <select
          id="assetType"
          value={assetType}
          onChange={e => {
            setAssetType(e.target.value);
            if (e.target.value === 'gold' || e.target.value === 'silver') setUnit('gr');
            else if (e.target.value === 'currency') setUnit('TRY');
          }}
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="currency">{t('currencyType')}</option>
          <option value="gold">{t('gold')}</option>
          <option value="silver">{t('silver')}</option>
          <option value="crypto">{t('crypto')}</option>
          <option value="stock">{t('stock')}</option>
        </select>
      </div>

      {assetType === 'gold' && (
        <div>
          <label htmlFor="goldKarat" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('purity')}</label>
          <select
            id="goldKarat"
            value={goldKarat}
            onChange={e => setGoldKarat(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={8}>{t('karat8')}</option>
            <option value={14}>{t('karat14')}</option>
            <option value={18}>{t('karat18')}</option>
            <option value={21}>{t('karat21')}</option>
            <option value={22}>{t('karat22')}</option>
            <option value={24}>{t('karat24')}</option>
          </select>
        </div>
      )}

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

      <div>
        <label htmlFor="unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('unit')}</label>
        <input 
          type="text" 
          id="unit" 
          value={unit} 
          onChange={e => setUnit(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="TRY, gr, adet, m², vb."
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
