
import { useState } from 'react';
import DynamicTable from '../components/DynamicTable';
import Modal from '../components/Modal';
import AssetForm from '../components/AssetForm';
import { assetData } from '../data/mockData';
import { FiPlus } from 'react-icons/fi';

const Assets = () => {
  const [isModalOpen, setModalOpen] = useState(false);

  const columns = [
    { header: 'Varlık Türü', key: 'name' },
    {
      header: 'Mevcut Değer',
      key: 'current',
      render: (row) => row.current.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
    },
    {
      header: 'Hedef Değer',
      key: 'target',
      render: (row) => row.target.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
    },
    {
        header: 'İlerleme',
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
        <h2 className="text-2xl font-bold">Varlık Yönetimi</h2>
        <button onClick={() => setModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            <FiPlus className="mr-2"/>
            Yeni Varlık Ekle
        </button>
      </div>

      <DynamicTable columns={columns} data={assetData} />

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Yeni Varlık Ekle">
        <AssetForm onClose={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default Assets;
