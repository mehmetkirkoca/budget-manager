
import { useState, useEffect } from 'react';
import DynamicTable from '../components/DynamicTable';
import Modal from '../components/Modal';
import AssetForm from '../components/AssetForm';
import { getAllAssets, createAsset, updateAsset, deleteAsset } from '../services/assetService';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const Assets = () => {
  const { t } = useTranslation();
  const [isModalOpen, setModalOpen] = useState(false);
  const [assets, setAssets] = useState([]);
  const [editingAsset, setEditingAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `${t('assets')} - ${t('appTitle')}`;
    fetchAssets();
  }, [t]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const data = await getAllAssets();
      setAssets(data);
    } catch (error) {
      console.error('Error fetching assets:', error);
      alert(t('errorFetchingAssets'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setModalOpen(true);
  };

  const handleDelete = async (assetId) => {
    if (window.confirm(t('confirmDeleteAsset'))) {
      try {
        await deleteAsset(assetId);
        await fetchAssets();
      } catch (error) {
        console.error('Error deleting asset:', error);
        alert(t('errorDeletingAsset'));
      }
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingAsset(null);
  };

  const handleAssetSave = async (assetData) => {
    try {
      if (editingAsset) {
        await updateAsset(editingAsset._id, assetData);
      } else {
        await createAsset(assetData);
      }
      handleModalClose();
      await fetchAssets();
    } catch (error) {
      console.error('Error saving asset:', error);
      alert(t('error'));
    }
  };

  const columns = [
    { header: t('name'), key: 'name' },
    { header: t('type'), key: 'type', render: (row) => t(row.type) },
    { header: t('description'), key: 'description' },
    {
      header: t('currentAmount'),
      key: 'currentAmount',
      render: (row) => `${row.currentAmount.toLocaleString('tr-TR')} ${row.unit || 'TRY'}`
    },
    {
      header: t('targetAmount'),
      key: 'targetAmount',
      render: (row) => `${row.targetAmount.toLocaleString('tr-TR')} ${row.unit || 'TRY'}`
    },
    {
        header: t('progress'),
        key: 'progress',
        render: (row) => {
            const progress = row.targetAmount > 0 ? (row.currentAmount / row.targetAmount) * 100 : 0;
            return (
                <div className="flex items-center space-x-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{Math.round(progress)}%</span>
                </div>
            )
        }
    },
    {
      header: t('actions'),
      key: 'actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-600"
          >
            <FiEdit size={16} />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      )
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

      {loading ? (
        <div className="text-center py-4">{t('loading')}</div>
      ) : (
        <DynamicTable columns={columns} data={assets} />
      )}

      <Modal isOpen={isModalOpen} onClose={handleModalClose} title={editingAsset ? t('editAsset') : t('addAsset')}>
        <AssetForm 
          onClose={handleModalClose} 
          asset={editingAsset}
          onSave={handleAssetSave}
        />
      </Modal>
    </div>
  );
};

export default Assets;
