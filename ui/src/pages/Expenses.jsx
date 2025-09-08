
import { useState, useEffect } from 'react';
import DynamicTable from '../components/DynamicTable';
import Modal from '../components/Modal';
import ExpenseForm from '../components/ExpenseForm';
import { getAllExpenses, createExpense, updateExpense, deleteExpense } from '../services/expenseService';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const Expenses = () => {
  const { t } = useTranslation();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `${t('expenses')} - ${t('appTitle')}`;
  }, [t]);

  // Fetch expenses from API on component mount
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await getAllExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      // You could show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setModalOpen(true);
  };

  const handleDelete = async (expense) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await deleteExpense(expense._id);
        setExpenses(expenses.filter(e => e._id !== expense._id));
      } catch (error) {
        console.error('Failed to delete expense:', error);
        alert('Failed to delete expense');
      }
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingExpense(null);
  };

  const handleSave = async (expenseData) => {
    try {
      if (editingExpense) {
        // Update existing expense
        const updatedExpense = await updateExpense(editingExpense._id, expenseData);
        setExpenses(expenses.map(expense => 
          expense._id === editingExpense._id ? updatedExpense : expense
        ));
      } else {
        // Add new expense
        const newExpense = await createExpense(expenseData);
        setExpenses([...expenses, newExpense]);
      }
      handleModalClose();
    } catch (error) {
      console.error('Failed to save expense:', error);
      alert('Failed to save expense');
    }
  };

  const columns = [
    { header: t('category'), key: 'category' },
    { header: t('description'), key: 'description' },
    {
      header: t('amount'),
      key: 'amount',
      render: (row) => <span className={row.status === 'pending' ? 'text-yellow-500' : 'text-green-500'}>{row.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
    },
    { 
      header: t('date'), 
      key: 'date',
      render: (row) => new Date(row.date).toLocaleDateString('tr-TR')
    },
    {
      header: t('status'),
      key: 'status',
      render: (row) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
          {row.status === 'pending' ? t('pending') : t('completed')}
        </span>
      )
    },
    {
      header: t('actions'),
      key: 'actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800 p-1 rounded"
            title={t('edit')}
          >
            <FiEdit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="text-red-600 hover:text-red-800 p-1 rounded"
            title={t('delete')}
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="container mx-auto">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t('expenseTransactions')}</h2>
        <button onClick={() => setModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            <FiPlus className="mr-2"/>
            {t('addExpense')}
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">{t('noData')}</p>
        </div>
      ) : (
        <DynamicTable columns={columns} data={expenses} />
      )}

      <Modal isOpen={isModalOpen} onClose={handleModalClose} title={editingExpense ? t('editExpense') : t('addExpense')}>
        <ExpenseForm onClose={handleModalClose} expense={editingExpense} onSave={handleSave} />
      </Modal>
    </div>
  );
};

export default Expenses;
