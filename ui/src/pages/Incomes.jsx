import { useState, useEffect } from 'react';
import DynamicTable from '../components/DynamicTable';
import Modal from '../components/Modal';
import IncomeForm from '../components/IncomeForm';
import { getAllIncomes, createIncome, updateIncome, deleteIncome } from '../services/incomeService';
import { FiPlus, FiEdit, FiTrash2, FiRefreshCw, FiCalendar } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const Incomes = () => {
  const { t } = useTranslation();
  const [isModalOpen, setModalOpen] = useState(false);
  const [incomes, setIncomes] = useState([]);
  const [editingIncome, setEditingIncome] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `${t('incomes')} - ${t('appTitle')}`;
    fetchIncomes();
  }, [t]);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const data = await getAllIncomes();
      setIncomes(data);
    } catch (error) {
      console.error('Error fetching incomes:', error);
      alert(t('errorFetchingIncomes'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (income) => {
    setEditingIncome(income);
    setModalOpen(true);
  };

  const handleDelete = async (incomeId) => {
    if (window.confirm(t('confirmDeleteIncome'))) {
      try {
        await deleteIncome(incomeId);
        await fetchIncomes();
      } catch (error) {
        console.error('Error deleting income:', error);
        alert(t('errorDeletingIncome'));
      }
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingIncome(null);
  };

  const handleIncomeSave = async (incomeData) => {
    try {
      if (editingIncome) {
        await updateIncome(editingIncome._id, incomeData);
      } else {
        await createIncome(incomeData);
      }
      handleModalClose();
      await fetchIncomes();
    } catch (error) {
      console.error('Error saving income:', error);
      alert(t('error'));
    }
  };

  const columns = [
    { header: t('source'), key: 'source' },
    { 
      header: t('amount'), 
      key: 'amount',
      render: (row) => row.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
    },
    { header: t('description'), key: 'description' },
    { 
      header: t('date'), 
      key: 'date',
      render: (row) => new Date(row.date).toLocaleDateString('tr-TR')
    },
    { 
      header: t('type'), 
      key: 'isRecurring',
      render: (row) => (
        <div className="flex items-center space-x-1">
          {row.isRecurring ? <FiRefreshCw size={14} /> : <FiCalendar size={14} />}
          <span>{row.isRecurring ? `${t('recurring')} (${t(row.frequency)})` : t('oneTime')}</span>
        </div>
      )
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
        <h2 className="text-2xl font-bold">{t('incomeManagement')}</h2>
        <button 
          onClick={() => setModalOpen(true)} 
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <FiPlus className="mr-2"/>
          {t('addIncome')}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4">{t('loading')}</div>
      ) : (
        <DynamicTable columns={columns} data={incomes} />
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
        title={editingIncome ? t('editIncome') : t('addIncome')}
      >
        <IncomeForm 
          onClose={handleModalClose} 
          income={editingIncome}
          onSave={handleIncomeSave}
        />
      </Modal>
    </div>
  );
};

export default Incomes;