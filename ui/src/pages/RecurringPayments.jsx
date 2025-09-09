import { useState, useEffect } from 'react';
import DynamicTable from '../components/DynamicTable';
import Modal from '../components/Modal';
import RecurringPaymentForm from '../components/RecurringPaymentForm';
import { 
  getAllRecurringPayments, 
  createRecurringPayment, 
  updateRecurringPayment, 
  deleteRecurringPayment,
  markPaymentAsPaid 
} from '../services/recurringPaymentService';
import { FiPlus, FiEdit, FiTrash2, FiCheck, FiClock, FiCalendar } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const RecurringPayments = () => {
  const { t } = useTranslation();
  const [isModalOpen, setModalOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [editingPayment, setEditingPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `Recurring Payments - ${t('appTitle')}`;
    fetchPayments();
  }, [t]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await getAllRecurringPayments();
      setPayments(data);
    } catch (error) {
      console.error('Error fetching recurring payments:', error);
      alert('Error fetching recurring payments');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setModalOpen(true);
  };

  const handleDelete = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this recurring payment?')) {
      try {
        await deleteRecurringPayment(paymentId);
        await fetchPayments();
      } catch (error) {
        console.error('Error deleting recurring payment:', error);
        alert('Error deleting recurring payment');
      }
    }
  };

  const handleMarkAsPaid = async (paymentId) => {
    const createExpense = window.confirm('Do you want to create an expense record for this payment?');
    try {
      await markPaymentAsPaid(paymentId, createExpense);
      await fetchPayments();
      alert('Payment marked as paid successfully');
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      alert('Error marking payment as paid');
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingPayment(null);
  };

  const handlePaymentSave = async (paymentData) => {
    try {
      if (editingPayment) {
        await updateRecurringPayment(editingPayment._id, paymentData);
      } else {
        await createRecurringPayment(paymentData);
      }
      handleModalClose();
      await fetchPayments();
    } catch (error) {
      console.error('Error saving recurring payment:', error);
      alert('Error saving recurring payment');
    }
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      weekly: t('weekly'),
      monthly: t('monthly'),
      quarterly: 'Quarterly',
      yearly: t('yearly')
    };
    return labels[frequency] || frequency;
  };

  const getDaysUntilDue = (nextDue) => {
    const today = new Date();
    const dueDate = new Date(nextDue);
    const timeDiff = dueDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  };

  const columns = [
    { header: t('name'), key: 'name' },
    { 
      header: t('category'), 
      key: 'category',
      render: (row) => row.category?.name || 'N/A'
    },
    { 
      header: t('amount'), 
      key: 'amount',
      render: (row) => `${row.amount.toLocaleString('tr-TR')} TRY`
    },
    { 
      header: t('frequency'), 
      key: 'frequency',
      render: (row) => getFrequencyLabel(row.frequency)
    },
    { 
      header: 'Next Due', 
      key: 'nextDue',
      render: (row) => {
        const daysUntil = getDaysUntilDue(row.nextDue);
        const dueDate = new Date(row.nextDue).toLocaleDateString('tr-TR');
        return (
          <div className="flex flex-col">
            <span>{dueDate}</span>
            <span className={`text-xs ${
              daysUntil <= 0 ? 'text-red-600' : 
              daysUntil <= 3 ? 'text-yellow-600' : 
              'text-gray-500'
            }`}>
              {daysUntil <= 0 ? 'Overdue' : 
               daysUntil === 1 ? 'Tomorrow' : 
               `${daysUntil} days`}
            </span>
          </div>
        );
      }
    },
    { 
      header: 'Status', 
      key: 'isActive',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    { 
      header: 'Auto Create', 
      key: 'autoCreate',
      render: (row) => row.autoCreate ? '✓' : '✗'
    },
    {
      header: t('actions'),
      key: 'actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleMarkAsPaid(row._id)}
            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-600"
            title="Mark as paid"
          >
            <FiCheck size={16} />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-600"
            title="Edit"
          >
            <FiEdit size={16} />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600"
            title="Delete"
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
        <div className="flex items-center space-x-2">
          <FiCalendar className="text-blue-500" size={24} />
          <h2 className="text-2xl font-bold">Recurring Payments</h2>
        </div>
        <button 
          onClick={() => setModalOpen(true)} 
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <FiPlus className="mr-2"/>
          Add Recurring Payment
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4">{t('loading')}</div>
      ) : (
        <>
          <DynamicTable columns={columns} data={payments} />
          
          {payments.length === 0 && (
            <div className="text-center py-12">
              <FiClock className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500 dark:text-gray-400">
                No recurring payments found. Add your first recurring payment to get started.
              </p>
            </div>
          )}
        </>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
        title={editingPayment ? 'Edit Recurring Payment' : 'Add Recurring Payment'}
      >
        <RecurringPaymentForm 
          onClose={handleModalClose} 
          payment={editingPayment}
          onSave={handlePaymentSave}
        />
      </Modal>
    </div>
  );
};

export default RecurringPayments;