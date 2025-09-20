import { useState, useEffect } from 'react';
import DynamicTable from '../components/DynamicTable';
import Modal from '../components/Modal';
import InstallmentForm from '../components/InstallmentForm';
import { getAllInstallments, deleteInstallment, processPayment } from '../services/installmentService';
import { creditCardService } from '../services/creditCardService';
import { getAllCategories } from '../services/categoryService';
import { FiPlus, FiEdit2, FiTrash2, FiCreditCard, FiDollarSign } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const CreditCardInstallments = () => {
  const { t } = useTranslation();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState(null);
  const [processingInstallment, setProcessingInstallment] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    document.title = `Kredi Kartı Taksitleri - ${t('appTitle')}`;
  }, [t]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [installmentsResponse, creditCardsData, categoriesData] = await Promise.all([
        getAllInstallments({ limit: 100 }),
        creditCardService.getAllCreditCards(),
        getAllCategories()
      ]);
      setInstallments(installmentsResponse.installments || []);
      setCreditCards(creditCardsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'defaulted':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'completed':
        return 'Tamamlandı';
      case 'defaulted':
        return 'Gecikmiş';
      case 'cancelled':
        return 'İptal';
      default:
        return status;
    }
  };

  const handleEdit = (installment) => {
    setEditingInstallment(installment);
    setModalOpen(true);
  };

  const handleDelete = async (installment) => {
    if (installment.completedInstallments > 0) {
      alert('Ödeme yapılmış taksitler silinemez!');
      return;
    }

    if (window.confirm('Bu taksiti silmek istediğinizden emin misiniz?')) {
      try {
        await deleteInstallment(installment._id);
        setInstallments(installments.filter(i => i._id !== installment._id));
      } catch (error) {
        console.error('Failed to delete installment:', error);
        alert('Taksit silinirken hata oluştu');
      }
    }
  };

  const handlePayment = (installment) => {
    setProcessingInstallment(installment);
    setPaymentAmount(installment.installmentAmount?.toString() || '');
    setPaymentModalOpen(true);
  };

  const processInstallmentPayment = async () => {
    if (!processingInstallment || !paymentAmount) return;

    try {
      const updatedInstallment = await processPayment(processingInstallment._id, {
        paymentAmount: parseFloat(paymentAmount),
        paymentMethod: 'manual'
      });

      // Update the installment in the list
      setInstallments(installments.map(installment =>
        installment._id === processingInstallment._id ? updatedInstallment : installment
      ));

      setPaymentModalOpen(false);
      setProcessingInstallment(null);
      setPaymentAmount('');
    } catch (error) {
      console.error('Failed to process payment:', error);
      alert('Ödeme işlenirken hata oluştu');
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingInstallment(null);
  };

  const handlePaymentModalClose = () => {
    setPaymentModalOpen(false);
    setProcessingInstallment(null);
    setPaymentAmount('');
  };

  const handleSave = async (installmentData) => {
    try {
      // For new installments, refresh the data
      await fetchData();
      handleModalClose();
    } catch (error) {
      console.error('Failed to save installment:', error);
      alert('Taksit kaydedilirken hata oluştu');
    }
  };

  const columns = [
    {
      header: 'Kredi Kartı',
      key: 'creditCard',
      render: (row) => (
        <div>
          <div className="font-medium">{row.creditCard?.name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{row.creditCard?.bankName || ''}</div>
        </div>
      )
    },
    {
      header: 'Alışveriş',
      key: 'purchaseDescription',
      render: (row) => (
        <div>
          <div className="font-medium">{row.purchaseDescription}</div>
          {row.category && (
            <div className="text-sm text-gray-500">{row.category.name}</div>
          )}
        </div>
      )
    },
    {
      header: 'Toplam Tutar',
      key: 'originalAmount',
      render: (row) => (
        <span className="font-semibold">
          {row.originalAmount?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
        </span>
      )
    },
    {
      header: 'Taksit',
      key: 'installments',
      render: (row) => (
        <div className="text-center">
          <div className="font-medium">
            {row.completedInstallments || 0} / {row.totalInstallments || 0}
          </div>
          <div className="text-sm text-gray-500">
            {row.installmentAmount?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </div>
        </div>
      )
    },
    {
      header: 'Sonraki Ödeme',
      key: 'nextPaymentDate',
      render: (row) => (
        <div>
          <div>{new Date(row.nextPaymentDate).toLocaleDateString('tr-TR')}</div>
          <div className="text-sm text-gray-500">
            Kalan: {row.remainingInstallments || 0} taksit
          </div>
        </div>
      )
    },
    {
      header: 'Durum',
      key: 'paymentStatus',
      render: (row) => (
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(row.paymentStatus)}`}>
          {getStatusText(row.paymentStatus)}
        </span>
      )
    },
    {
      header: 'İşlemler',
      key: 'actions',
      render: (row) => (
        <div className="flex space-x-2">
          {row.paymentStatus === 'active' && (
            <button
              onClick={() => handlePayment(row)}
              className="text-green-600 hover:text-green-800 p-1 rounded"
              title="Ödeme Yap"
            >
              <FiDollarSign size={16} />
            </button>
          )}
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800 p-1 rounded"
            title="Düzenle"
          >
            <FiEdit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="text-red-600 hover:text-red-800 p-1 rounded"
            title="Sil"
            disabled={row.completedInstallments > 0}
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
          <p className="text-lg">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Kredi Kartı Taksitleri</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <FiPlus className="mr-2" />
          Yeni Taksit
        </button>
      </div>

      {installments.length === 0 ? (
        <div className="text-center py-8">
          <FiCreditCard size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Henüz taksit bulunmuyor</p>
        </div>
      ) : (
        <DynamicTable columns={columns} data={installments} />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={editingInstallment ? 'Taksiti Düzenle' : 'Yeni Taksit'}
      >
        <InstallmentForm
          onClose={handleModalClose}
          installment={editingInstallment}
          onSave={handleSave}
          creditCards={creditCards}
          categories={categories}
        />
      </Modal>

      <Modal
        isOpen={isPaymentModalOpen}
        onClose={handlePaymentModalClose}
        title="Taksit Ödemesi"
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">
              {processingInstallment?.purchaseDescription}
            </h3>
            <p className="text-sm text-gray-600">
              Kredi Kartı: {processingInstallment?.creditCard?.name}
            </p>
            <p className="text-sm text-gray-600">
              Taksit: {processingInstallment?.completedInstallments + 1 || 1} / {processingInstallment?.totalInstallments}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ödeme Tutarı (TRY)
            </label>
            <input
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handlePaymentModalClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={processInstallmentPayment}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              disabled={!paymentAmount}
            >
              Ödeme Yap
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CreditCardInstallments;