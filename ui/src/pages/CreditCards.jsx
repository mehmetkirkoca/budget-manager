import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiCreditCard, FiBarChart, FiCalendar, FiAlertCircle, FiTrash } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { creditCardService, creditCardUtils } from '../services/creditCardService';
import Modal from '../components/Modal';
import InstallmentForm from '../components/InstallmentForm';
import CreditCardForm from '../components/CreditCardForm';

const CreditCards = () => {
  const { t } = useTranslation();
  const [creditCards, setCreditCards] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [showCreditCardModal, setShowCreditCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  useEffect(() => {
    document.title = `${t('creditCards')} - ${t('appTitle')}`;
    fetchCreditCardData();
  }, [t]);

  const fetchCreditCardData = async () => {
    try {
      setLoading(true);
      const [cardsData, summaryData] = await Promise.all([
        creditCardService.getAllCreditCards(),
        creditCardService.getCreditCardSummary()
      ]);
      
      setCreditCards(cardsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching credit card data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm(t('confirmDeleteCard'))) return;
    
    try {
      await creditCardService.deleteCreditCard(cardId);
      setCreditCards(creditCards.filter(card => card._id !== cardId));
    } catch (error) {
      console.error('Error deleting credit card:', error);
      alert(t('errorDeletingCard'));
    }
  };

  const handleAddInstallment = (cardId) => {
    setSelectedCardId(cardId);
    setShowInstallmentModal(true);
  };

  const handleInstallmentSave = (savedInstallment) => {
    setShowInstallmentModal(false);
    setSelectedCardId(null);
    fetchCreditCardData(); // Refresh data
  };

  const handleInstallmentCancel = () => {
    setShowInstallmentModal(false);
    setSelectedCardId(null);
  };

  const handleAddCard = () => {
    setEditingCard(null);
    setShowCreditCardModal(true);
  };

  const handleEditCard = (card) => {
    setEditingCard(card);
    setShowCreditCardModal(true);
  };

  const handleCreditCardSave = (savedCard) => {
    setShowCreditCardModal(false);
    setEditingCard(null);
    fetchCreditCardData(); // Refresh data
  };

  const handleCreditCardCancel = () => {
    setShowCreditCardModal(false);
    setEditingCard(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto">
        <div className="text-center py-8">{t('loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto">
        <div className="text-center py-8 text-red-500">
          <FiAlertCircle className="mx-auto mb-2 text-4xl" />
          <p>{t('errorLoadingData')}: {error}</p>
          <button 
            onClick={fetchCreditCardData}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
            <FiCreditCard className="mr-2" />
            {t('creditCards')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{t('manageCreditCards')}</p>
        </div>
        
        <div className="flex space-x-3">
          <Link
            to="/credit-cards/installments"
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center"
          >
            <FiBarChart className="mr-2" />
            {t('installments')}
          </Link>
          <Link
            to="/credit-cards/calendar"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
          >
            <FiCalendar className="mr-2" />
            {t('paymentCalendar')}
          </Link>
          <button
            onClick={handleAddCard}
            className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center"
          >
            <FiPlus className="mr-2" />
            {t('addCreditCard')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                <FiCreditCard />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('totalCards')}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {summary.utilization.cardCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
                <FiBarChart />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('totalLimit')}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {creditCardUtils.formatCurrency(summary.utilization.totalLimit)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400">
                <FiBarChart />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('totalUsed')}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {creditCardUtils.formatCurrency(summary.utilization.totalUsed)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${
                summary.utilization.utilizationRate >= 80 ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400' :
                summary.utilization.utilizationRate >= 60 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400' :
                'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
              }`}>
                <FiBarChart />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('utilizationRate')}</p>
                <p className={`text-2xl font-semibold ${creditCardUtils.getUtilizationColor(summary.utilization.utilizationRate)}`}>
                  {summary.utilization.utilizationRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit Cards List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('yourCreditCards')}</h2>
        </div>
        
        <div className="p-6">
          {creditCards.length === 0 ? (
            <div className="text-center py-8">
              <FiCreditCard className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('noCreditCards')}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{t('addFirstCreditCard')}</p>
              <button
                onClick={handleAddCard}
                className="inline-flex items-center px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                <FiPlus className="mr-2" />
                {t('addCreditCard')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creditCards.map(card => (
                <CreditCardItem 
                  key={card._id} 
                  card={card} 
                  onDelete={() => handleDeleteCard(card._id)}
                  onAddInstallment={() => handleAddInstallment(card._id)}
                  onEdit={() => handleEditCard(card)}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Installment Modal */}
      <Modal
        isOpen={showInstallmentModal}
        onClose={handleInstallmentCancel}
        title={t('addInstallment')}
        size="lg"
      >
        <InstallmentForm
          creditCardId={selectedCardId}
          onSave={handleInstallmentSave}
          onCancel={handleInstallmentCancel}
        />
      </Modal>

      {/* Credit Card Form Modal */}
      <Modal
        isOpen={showCreditCardModal}
        onClose={handleCreditCardCancel}
        title={editingCard ? t('editCreditCard') : t('addCreditCard')}
        size="lg"
      >
        <CreditCardForm
          creditCard={editingCard}
          onSave={handleCreditCardSave}
          onCancel={handleCreditCardCancel}
        />
      </Modal>
    </div>
  );
};

const CreditCardItem = ({ card, onDelete, onAddInstallment, onEdit, t }) => {
  const utilizationRate = ((card.totalLimit - card.availableLimit) / card.totalLimit) * 100;
  const daysUntilPayment = creditCardUtils.getDaysUntilPayment(card.nextPaymentDue);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{card.name}</h3>
          <p className="text-gray-600 dark:text-gray-300">{card.bankName}</p>
        </div>
        <div className="text-2xl">
          {creditCardUtils.getCardTypeIcon(card.cardType)}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('cardNumber')}</p>
        <p className="font-mono text-lg text-gray-700 dark:text-gray-200">
          {creditCardUtils.formatCardNumber(card.cardNumber)}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">{t('available')}</span>
            <span className="text-gray-500 dark:text-gray-400">{t('limit')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {creditCardUtils.formatCurrency(card.availableLimit)}
            </span>
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {creditCardUtils.formatCurrency(card.totalLimit)}
            </span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">{t('utilization')}</span>
            <span className="text-gray-500 dark:text-gray-400">{utilizationRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                utilizationRate >= 80 ? 'bg-red-500' :
                utilizationRate >= 60 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(utilizationRate, 100)}%` }}
            ></div>
          </div>
        </div>

        {card.nextPaymentDue && (
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">{t('nextPayment')}: </span>
            <span className={`font-medium ${
              daysUntilPayment <= 3 ? 'text-red-600 dark:text-red-400' :
              daysUntilPayment <= 7 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-green-600 dark:text-green-400'
            }`}>
              {daysUntilPayment > 0 ? `${daysUntilPayment} ${t('days')}` : t('overdue')}
            </span>
          </div>
        )}
      </div>

      <div className="flex space-x-2 mt-4">
        <button
          onClick={onEdit}
          className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded text-center text-sm transition-colors"
        >
          {t('edit')}
        </button>
        <button
          onClick={onAddInstallment}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-center text-sm transition-colors"
        >
          {t('addInstallment')}
        </button>
        <button
          onClick={() => {
            if (window.confirm(t('confirmDeleteCard'))) {
              onDelete();
            }
          }}
          className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-center text-sm transition-colors"
          title={t('delete')}
        >
          <FiTrash />
        </button>
      </div>
    </div>
  );
};

export default CreditCards;