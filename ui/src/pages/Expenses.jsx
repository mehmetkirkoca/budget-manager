
import { useState } from 'react';
import DynamicTable from '../components/DynamicTable';
import Modal from '../components/Modal';
import ExpenseForm from '../components/ExpenseForm';
import { transactionData } from '../data/mockData';
import { FiPlus } from 'react-icons/fi';

const Expenses = () => {
  const [isModalOpen, setModalOpen] = useState(false);

  const columns = [
    { header: 'Kategori', key: 'category' },
    { header: 'Açıklama', key: 'description' },
    {
      header: 'Tutar',
      key: 'amount',
      render: (row) => <span className={row.status === 'Beklenen' ? 'text-yellow-500' : 'text-green-500'}>{row.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
    },
    { header: 'Tarih', key: 'date' },
    {
      header: 'Durum',
      key: 'status',
      render: (row) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.status === 'Beklenen' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gider İşlemleri</h2>
        <button onClick={() => setModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            <FiPlus className="mr-2"/>
            Yeni Gider Ekle
        </button>
      </div>

      <DynamicTable columns={columns} data={transactionData} />

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Yeni Gider Ekle">
        <ExpenseForm onClose={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default Expenses;
