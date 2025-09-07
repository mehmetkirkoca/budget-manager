
import { useState, useEffect } from 'react';
import DynamicTable from '../components/DynamicTable';
import Modal from '../components/Modal';
import AssetForm from '../components/AssetForm';
import { assetData } from '../data/mockData';
import { FiPlus } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const Assets = () => {
  const { t } = useTranslation();
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    document.title = `${t('assets')} - ${t('appTitle')}`;
  }, [t]);

  const columns = [
    { header: t('assetType'), key: 'name' },
    {
      header: t('currentValue'),
      key: 'current',
      render: (row) => row.current.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
    },
    {
      header: t('targetValue'),
      key: 'target',
      render: (row) => row.target.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
    },
    {
        header: t('progress'),
        key: 'progress',
        render: (row) => {
            const progress = row.target > 0 ? (row.current / row.target) * 100 : 0;
            return (
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div className={`${row.color} h-2.5 rounded-full`} style={{ width: `${progress}%` }}></div>
                </div>
            )
        }
    }
  ];

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t('assetManagement')}</h2>
        <button onClick={() => setModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            <FiPlus className="mr-2"/>
            {t('addAsset')}
        </button>
      </div>

      <DynamicTable columns={columns} data={assetData} />

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={t('addAsset')}>
        <AssetForm onClose={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default Assets;
