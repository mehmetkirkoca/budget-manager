import { useState, useEffect } from 'react';
import Modal from './Modal';
import { useTranslation } from 'react-i18next';
import { creditCardUtils } from '../services/creditCardService';
import { confirmDuePayment } from '../services/duePaymentService';
import { FiCheck, FiClock, FiDollarSign, FiCreditCard, FiCalendar, FiChevronRight } from 'react-icons/fi';

const fmt = value => creditCardUtils.formatCurrency(value || 0);

const DuePaymentsModal = ({ isOpen, onClose, pendingPayments = [], assets = [], onPaymentProcessed }) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  // Asset selection is optional (defaults to empty: do not deduct from asset)
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const currentPayment = (pendingPayments && pendingPayments.length > 0)
    ? (pendingPayments[currentIndex] || pendingPayments[0])
    : null;

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedAssetId('');
  }, [pendingPayments]);

  useEffect(() => {
    if (currentPayment) {
      if (currentPayment.type === 'creditCard' && currentPayment.minimumPaymentAmount) {
        setCustomAmount(String(currentPayment.minimumPaymentAmount));
      } else {
        setCustomAmount(String(currentPayment.amount || ''));
      }
    }
  }, [currentIndex, currentPayment]);

  if (!isOpen || !pendingPayments || pendingPayments.length === 0 || !currentPayment) {
    return null;
  }

  const handleConfirmPay = async () => {
    try {
      setLoading(true);
      await confirmDuePayment({
        id: currentPayment.id,
        type: currentPayment.type,
        assetId: selectedAssetId,
        amount: Number(customAmount) || currentPayment.amount
      });

      if (onPaymentProcessed) {
        onPaymentProcessed();
      }

      if (currentIndex + 1 < pendingPayments.length) {
        setCurrentIndex(prev => prev + 1);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (currentIndex + 1 < pendingPayments.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('duePaymentModalTitle')}
      size="xl"
    >
      <div className="space-y-5 p-2">
        {/* Progress indicator if multiple pending payments */}
        {pendingPayments.length > 1 && (
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/80 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
            <span>Ödeme {currentIndex + 1} / {pendingPayments.length}</span>
            <div className="flex space-x-1">
              {pendingPayments.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'w-6 bg-blue-600'
                      : idx < currentIndex
                      ? 'w-2 bg-green-500'
                      : 'w-2 bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Payment Card Info */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800/90 border border-blue-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 rounded-xl bg-blue-600 text-white shadow-md">
              {currentPayment.type === 'creditCard' ? <FiCreditCard size={24} /> : <FiCalendar size={24} />}
            </div>
            <div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                {currentPayment.categoryName}
              </span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
                {currentPayment.name}
              </h3>
              {currentPayment.dueDate && (
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1 flex items-center">
                  <FiCalendar className="mr-1.5 inline-block" size={13} />
                  <span>
                    {t('dueDate')}: {new Date(currentPayment.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </p>
              )}
              {currentPayment.remainingInstallments !== undefined && currentPayment.remainingInstallments > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {t('remainingInstallmentsCount', { count: currentPayment.remainingInstallments })}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500 dark:text-gray-400 block">{t('amount')}</span>
            <span className="text-2xl font-black text-red-600 dark:text-red-400">
              {fmt(currentPayment.amount)}
            </span>
          </div>
        </div>

        {/* Question Prompt */}
        <div className="text-center py-1">
          <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200">
            {t('didYouPayQuestion')}
          </h4>
        </div>

        {/* Credit Card Flexible Payment Amount Selection */}
        {currentPayment.type === 'creditCard' && (
          <div className="bg-blue-50/70 dark:bg-gray-800/80 p-4 rounded-xl border border-blue-100 dark:border-gray-700 space-y-3">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              {t('paymentAmountLabel')}
            </label>
            <div className="flex flex-wrap gap-2">
              {currentPayment.minimumPaymentAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setCustomAmount(String(currentPayment.minimumPaymentAmount))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    Number(customAmount) === currentPayment.minimumPaymentAmount
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t('minimumPaymentPill', { amount: fmt(currentPayment.minimumPaymentAmount) })}
                </button>
              )}
              <button
                type="button"
                onClick={() => setCustomAmount(String(currentPayment.amount))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  Number(customAmount) === currentPayment.amount
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t('fullBalancePill', { amount: fmt(currentPayment.amount) })}
              </button>
            </div>
            <div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Asset Dropdown Selector */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
            {t('selectAssetToPayFrom')} ({t('optional')})
          </label>
          <select
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">-- {t('doNotDeductFromAsset')} --</option>
            {assets.map(asset => (
              <option key={asset._id || asset.id} value={asset._id || asset.id}>
                {asset.name} ({asset.unit || 'TRY'}) — Bakiye: {fmt(asset.currentAmount || asset.currentValueTRY)}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleSkip}
            className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <FiClock className="mr-2" size={16} />
            {t('noRemindLater')}
          </button>

          <button
            type="button"
            onClick={handleConfirmPay}
            disabled={loading}
            className="flex items-center px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg shadow-md transition-all disabled:opacity-50"
          >
            <FiCheck className="mr-2" size={18} />
            {loading ? t('loading') : t('yesPaid')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DuePaymentsModal;
