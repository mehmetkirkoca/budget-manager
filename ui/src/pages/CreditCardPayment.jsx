import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiCreditCard, FiAlertCircle, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { creditCardService, creditCardInstallmentService, creditCardUtils } from '../services/creditCardService';
import { deleteInstallment } from '../services/installmentService';
import Modal from '../components/Modal';
import InstallmentForm from '../components/InstallmentForm';

const fmt = creditCardUtils.formatCurrency;

const CreditCardPayment = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(searchParams.get('card') || '');
  const [card, setCard] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingInstallment, setEditingInstallment] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    document.title = 'Ödeme & Taksitler';
    creditCardService.getAllCreditCards().then(data => {
      setCards(data);
      if (!selectedCardId && data.length > 0) {
        setSelectedCardId(data[0]._id);
      }
    }).finally(() => setLoading(false));
  }, []);

  const fetchCardData = useCallback(async (cardId) => {
    if (!cardId) return;
    const [cardData, installmentsData] = await Promise.all([
      creditCardService.getCreditCardById(cardId),
      creditCardInstallmentService.getAllInstallments({ creditCard: cardId, status: 'active', limit: 100 }),
    ]);
    setCard(cardData);
    setInstallments(installmentsData.installments || []);
    setCalcResult(null);
    setPaymentAmount('');
  }, []);

  useEffect(() => {
    if (selectedCardId) {
      fetchCardData(selectedCardId);
      setSearchParams({ card: selectedCardId }, { replace: true });
    }
  }, [selectedCardId, fetchCardData]);

  const handleCardChange = (e) => {
    setSelectedCardId(e.target.value);
  };

  const debounceRef = useRef(null);

  useEffect(() => {
    if (!selectedCardId || paymentAmount === '') {
      setCalcResult(null);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCalcLoading(true);
      try {
        const result = await creditCardService.calculateInterest(selectedCardId, parseFloat(paymentAmount));
        setCalcResult(result);
      } catch (e) {
        console.error(e);
      } finally {
        setCalcLoading(false);
      }
    }, 150);
  }, [paymentAmount, selectedCardId]);

  const handleDeleteInstallment = async (installment) => {
    if (installment.completedInstallments > 0) {
      alert('Ödeme yapılmış taksitler silinemez!');
      return;
    }
    if (!window.confirm('Bu taksiti silmek istediğinizden emin misiniz?')) return;
    try {
      await deleteInstallment(installment._id);
      setInstallments(prev => prev.filter(i => i._id !== installment._id));
    } catch {
      alert('Taksit silinirken hata oluştu');
    }
  };

  const scenarioLabel = (type) => {
    if (!type) return '';
    const key = `scenario_${type}`;
    return t(key, { defaultValue: type });
  };

  const scenarioColor = (type) => {
    if (type === 'full_payment') return 'text-green-600 dark:text-green-400';
    if (type === 'akdi_faiz') return 'text-yellow-600 dark:text-yellow-400';
    if (type?.startsWith('gecikme')) return 'text-red-600 dark:text-red-400';
    return '';
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-500">{t('loading')}</div>;
  }

  return (
    <div className="container mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
        <FiCreditCard className="mr-2" />
        {t('paymentAndInstallments')}
      </h1>

      {/* Kart Seçici */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('creditCard')}</label>
        <select
          value={selectedCardId}
          onChange={handleCardChange}
          className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        >
          {cards.map(c => (
            <option key={c._id} value={c._id}>{c.bankName} — {c.name}</option>
          ))}
        </select>
      </div>

      {card && (
        <>
          {/* Ekstre Özeti */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">{t('statementDebt')}</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {fmt(card.currentBalance || 0)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">{t('minimumPayment')}</p>
              <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                {fmt(card.minimumPaymentAmount || 0)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">{t('paymentDueDate')}</p>
              <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                {card.nextPaymentDue
                  ? new Date(card.nextPaymentDue).toLocaleDateString('tr-TR')
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">{t('availableLimit')}</p>
              <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                {fmt(card.availableLimit || 0)}
              </p>
            </div>
          </div>

          {/* Ödeme Hesaplayıcı */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t('paymentCalculator')}</h2>
            <div className="flex gap-3 flex-wrap items-center">
              <input
                type="number"
                placeholder={t('paymentAmountPlaceholder')}
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                className="flex-1 min-w-[180px] border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
              <button
                onClick={() => setPaymentAmount(String(card.currentBalance || 0))}
                className="px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-900/50"
              >
                {t('fullPayment')}
              </button>
              <button
                onClick={() => setPaymentAmount(String(card.minimumPaymentAmount || 0))}
                className="px-3 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg text-sm hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
              >
                {t('minimumPayment')}
              </button>
              {calcLoading && <span className="text-sm text-gray-400">{t('calculating')}</span>}
            </div>

            {calcResult && calcResult.scenarios && (() => {
              const s = calcResult.scenarios.customPayment;
              const isFull = parseFloat(paymentAmount) >= (card.currentBalance || 0);
              const scenario = isFull ? calcResult.scenarios.fullPayment : s;
              const type = isFull ? 'full_payment' : s?.type;
              return (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">{t('thisMonthInterest')}</p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      {fmt(scenario?.interest ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">{t('nextMonthCarryOver')}</p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      {fmt(scenario?.nextMonthBalance ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">{t('status')}</p>
                    <p className={`text-lg font-semibold ${scenarioColor(type)}`}>
                      {scenarioLabel(type)}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Ekstre Harcama Kalemleri */}
          {card.lastStatementTransactions?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
                {t('statementTransactions', { count: card.lastStatementTransactions.length })}
              </h2>
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">{t('date')}</th>
                      <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">{t('description')}</th>
                      <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{t('amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {card.lastStatementTransactions.map((txn, i) => (
                      <tr
                        key={i}
                        className={`border-t dark:border-gray-700 ${
                          txn.isCredit
                            ? 'opacity-50 line-through'
                            : txn.isInstallment
                            ? 'bg-yellow-50 dark:bg-yellow-900/20'
                            : ''
                        }`}
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500 dark:text-gray-400">
                          {txn.date}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200 max-w-xs truncate" title={txn.description}>
                          {txn.description}
                          {txn.isInstallment && (
                            <span className="ml-2 px-1.5 py-0.5 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs rounded">
                              {t('installmentBadge')}
                            </span>
                          )}
                        </td>
                        <td className={`px-3 py-2 text-right font-medium ${txn.isCredit ? 'text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-gray-100'}`}>
                          {txn.isCredit ? '-' : ''}{fmt(txn.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Taksitler */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">
                {t('activeInstallments')}
                {installments.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({installments.length})</span>
                )}
              </h2>
            </div>

            {installments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FiAlertCircle className="mx-auto text-3xl mb-2" />
                <p>{t('noActiveInstallments')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">{t('purchase')}</th>
                      <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{t('total')}</th>
                      <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">{t('installmentBadge')}</th>
                      <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{t('monthly')}</th>
                      <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">{t('nextPayment')}</th>
                      <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installments.map(inst => (
                      <tr key={inst._id} className="border-t dark:border-gray-700">
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200 max-w-xs truncate" title={inst.purchaseDescription}>
                          {inst.purchaseDescription}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-100">
                          {fmt(inst.originalAmount)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-medium text-gray-800 dark:text-gray-100">
                            {inst.completedInstallments}/{inst.totalInstallments}
                          </span>
                          <br />
                          <span className="text-xs text-gray-400">{t('remainingCount', { count: inst.remainingInstallments })}</span>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                          {fmt(inst.installmentAmount)}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                          {inst.nextPaymentDate
                            ? new Date(inst.nextPaymentDate).toLocaleDateString('tr-TR')
                            : '—'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => { setEditingInstallment(inst); setModalOpen(true); }}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded"
                              title={t('edit')}
                            >
                              <FiEdit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteInstallment(inst)}
                              className="text-red-500 hover:text-red-700 p-1 rounded disabled:opacity-30"
                              title={t('delete')}
                              disabled={inst.completedInstallments > 0}
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setModalOpen(false); setEditingInstallment(null); }}
        title={t('editInstallmentTitle')}
      >
        <InstallmentForm
          onClose={() => { setModalOpen(false); setEditingInstallment(null); }}
          installment={editingInstallment}
          onSave={() => { setModalOpen(false); setEditingInstallment(null); fetchCardData(selectedCardId); }}
          creditCards={cards}
          categories={[]}
        />
      </Modal>
    </div>
  );
};

export default CreditCardPayment;
