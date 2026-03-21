
import { useState, useEffect } from 'react';
import DynamicTable from '../components/DynamicTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ExpenseForm from '../components/ExpenseForm';
import { getAllExpenses, createExpense, updateExpense, deleteExpense } from '../services/expenseService';
import { getAllCategories } from '../services/categoryService';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 25;

const Expenses = () => {
  const { t } = useTranslation();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    document.title = `${t('expenses')} - ${t('appTitle')}`;
  }, [t]);

  useEffect(() => {
    fetchData(currentPage, statusFilter);
  }, [currentPage, statusFilter]);

  useEffect(() => {
    getAllCategories().then(setCategories).catch(console.error);
  }, []);

  const fetchData = async (page, status) => {
    try {
      setLoading(true);
      const data = await getAllExpenses(page, PAGE_SIZE, status);
      setExpenses(data.expenses);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryDisplayName = (categoryValue) => {
    if (categoryValue && typeof categoryValue === 'object' && categoryValue.name) {
      return categoryValue.name;
    }
    if (typeof categoryValue === 'string' && categoryValue.length < 24) {
      return categoryValue;
    }
    if (typeof categoryValue === 'string' && categoryValue.length === 24) {
      const category = categories.find(cat => cat._id === categoryValue);
      return category ? category.name : categoryValue;
    }
    return categoryValue || 'Unknown';
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setModalOpen(true);
  };

  const handleDelete = async (expense) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await deleteExpense(expense._id);
        // Sayfadaki son kayıt silindiyse bir önceki sayfaya dön
        const newTotal = pagination.total - 1;
        const newPages = Math.ceil(newTotal / PAGE_SIZE);
        const targetPage = currentPage > newPages ? Math.max(1, newPages) : currentPage;
        if (targetPage !== currentPage) {
          setCurrentPage(targetPage);
        } else {
          fetchData(currentPage);
        }
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
        await updateExpense(editingExpense._id, expenseData);
      } else {
        await createExpense(expenseData);
      }
      handleModalClose();
      fetchData(currentPage);
    } catch (error) {
      console.error('Failed to save expense:', error);
      alert('Failed to save expense');
    }
  };

  const columns = [
    {
      header: t('category'),
      key: 'category',
      render: (row) => getCategoryDisplayName(row.category)
    },
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{t('expenseTransactions')}</h2>
        <button onClick={() => setModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            <FiPlus className="mr-2"/>
            {t('addExpense')}
        </button>
      </div>

      <div className="flex space-x-2 mb-6">
        {['pending', 'completed', 'all'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
            className={`px-4 py-1.5 text-sm font-medium rounded-full border transition-colors ${
              statusFilter === s
                ? s === 'pending'
                  ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                  : s === 'completed'
                  ? 'bg-green-100 border-green-400 text-green-800'
                  : 'bg-blue-100 border-blue-400 text-blue-800'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'pending' ? t('pending') : s === 'completed' ? t('completed') : t('all')}
          </button>
        ))}
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">{t('noData')}</p>
        </div>
      ) : (
        <>
          <DynamicTable columns={columns} data={expenses} />
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.pages}
            onPageChange={setCurrentPage}
            totalItems={pagination.total}
            itemsPerPage={PAGE_SIZE}
          />
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={handleModalClose} title={editingExpense ? t('editExpense') : t('addExpense')}>
        <ExpenseForm onClose={handleModalClose} expense={editingExpense} onSave={handleSave} />
      </Modal>
    </div>
  );
};

export default Expenses;
