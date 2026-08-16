import { useState, useEffect, useRef, useCallback } from 'react';
import { getUpcomingPayments } from '../services/recurringPaymentService';
import { creditCardService } from '../services/creditCardService';
import { getExpensesByDateRange } from '../services/expenseService';
import { useTranslation } from 'react-i18next';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiGrid, FiList, FiRefreshCw, FiExternalLink, FiDownload } from 'react-icons/fi';
import Modal from './Modal';
import { downloadICSFile, getGoogleCalendarUrl } from '../services/calendarSyncService';

const Tooltip = ({ payment, anchorRef }) => {
  const { t } = useTranslation();
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!anchorRef?.current || !tooltipRef?.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const tip = tooltipRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;

    let top = rect.bottom + scrollY + 6;
    let left = rect.left + rect.width / 2 - tip.width / 2;
    if (left < 4) left = 4;
    if (left + tip.width > window.innerWidth - 4) left = window.innerWidth - tip.width - 4;
    setPos({ top, left });
  }, [anchorRef]);

  const isCC = payment._ccType === 'card_payment';
  const isExpense = !!payment._expenseType;
  const fmt = (v) => Number(v).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });

  return (
    <div
      ref={tooltipRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 50 }}
      className="bg-gray-900 text-white text-xs rounded-lg shadow-lg p-2.5 min-w-[200px] pointer-events-none"
    >
      <div className="font-semibold mb-1.5">{payment.name}</div>
      {isCC ? (
        payment.isUnbilled || (!payment.amount && !payment.totalAmount) ? (
          <div className="text-gray-400 italic text-[11px]">Ekstre henüz kesilmedi</div>
        ) : (
          <>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">{t('minPayment')}</span>
              <span className="text-yellow-300 font-medium">{fmt(payment.amount)}</span>
            </div>
            <div className="flex justify-between gap-4 mt-0.5">
              <span className="text-gray-400">{t('totalDebt')}</span>
              <span className="text-red-300 font-medium">{fmt(payment.totalAmount)}</span>
            </div>
          </>
        )
      ) : isExpense ? (
        <>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">{t('amount')}</span>
            <span className="text-yellow-300 font-medium">{fmt(payment.amount)}</span>
          </div>
          <div className="text-gray-500 mt-1 border-t border-gray-700 pt-1">
            {payment._expenseType === 'pending' ? t('awaitingPayment') : t('completed')}
          </div>
        </>
      ) : (
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">{t('amount')}</span>
          <span className="text-yellow-300 font-medium">{fmt(payment.effectiveAmount || payment.amount)}</span>
        </div>
      )}
      {payment.category?.name && (
        <div className="text-gray-500 mt-1 border-t border-gray-700 pt-1">{payment.category.name}</div>
      )}
    </div>
  );
};

const getPaymentColors = (payment) => {
  if (payment._ccType === 'card_payment') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  if (payment._ccType === 'installment_payment') return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
  if (payment._expenseType === 'pending') return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
  if (payment._expenseType === 'completed') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (payment.amountInfo?.isDynamic) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
};

const getDotColor = (payment) => {
  if (payment._ccType === 'card_payment') return 'bg-blue-500';
  if (payment._ccType === 'installment_payment') return 'bg-purple-500';
  if (payment._expenseType === 'pending') return 'bg-amber-400';
  if (payment._expenseType === 'completed') return 'bg-green-500';
  if (payment.amountInfo?.isDynamic) return 'bg-orange-400';
  return 'bg-red-400';
};

const PaymentDot = ({ payment }) => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`text-xs px-1 py-0.5 rounded truncate cursor-default ${getPaymentColors(payment)}`}
    >
      {payment.name}
      {hovered && <Tooltip payment={payment} anchorRef={ref} />}
    </div>
  );
};

const WeekPaymentDot = ({ payment }) => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`w-2.5 h-2.5 rounded-full cursor-default ${getDotColor(payment)}`}
    >
      {hovered && <Tooltip payment={payment} anchorRef={ref} />}
    </div>
  );
};

const DashboardCalendar = ({ monthlyIncome = 0, onCurrentMonthTotal }) => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('monthly');
  const [currentWeek, setCurrentWeek] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(0);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const loadedMonths = useRef(new Set());

  const getSelectedMonthPayments = () => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth() + currentMonth, 1);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();

    return payments.filter(p => {
      const d = new Date(p.nextDue);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    }).sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue));
  };

  const fetchMonth = useCallback(async (monthOffset) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0, 23, 59, 59);
    const key = `${monthStart.getFullYear()}-${monthStart.getMonth()}`;

    if (loadedMonths.current.has(key)) return;

    setLoading(true);
    try {
      const [recurring, ccData, expenses, cardsData] = await Promise.all([
        getUpcomingPayments(monthStart.toISOString(), monthEnd.toISOString()),
        creditCardService.getPaymentCalendar(monthStart.getMonth() + 1, monthStart.getFullYear()).catch(() => []),
        getExpensesByDateRange(monthStart.toISOString(), monthEnd.toISOString()),
        creditCardService.getAllCreditCards().catch(() => [])
      ]);

      const ccItems = [];
      const processedCardIds = new Set();

      (ccData || []).filter(item => item.type === 'card_payment').forEach(item => {
        const cardId = item.cardInfo?.id;
        if (cardId) processedCardIds.add(String(cardId));
        ccItems.push({
          _id: `cc_${cardId || 'card'}_${item.date}`,
          name: item.title,
          nextDue: item.date,
          amount: item.amount || 0,
          effectiveAmount: item.amount || 0,
          totalAmount: item.totalAmount || 0,
          category: { name: 'Kredi Kartı Ödemesi' },
          amountInfo: { isDynamic: false },
          _ccType: item.type,
          _cardInfo: item.cardInfo,
        });
      });

      if (Array.isArray(cardsData) && cardsData.length > 0) {
        const targetYear = monthStart.getFullYear();
        const targetMonth = monthStart.getMonth();
        const curMonthLastDay = monthEnd.getDate();

        const prevMonth = targetMonth === 0 ? 11 : targetMonth - 1;
        const prevYear = targetMonth === 0 ? targetYear - 1 : targetYear;
        const prevMonthLastDay = new Date(prevYear, prevMonth + 1, 0).getDate();

        cardsData.forEach(card => {
          if (card.isActive === false) return;
          if (processedCardIds.has(String(card._id))) return;

          let exactDue = null;
          if (card.nextPaymentDue) {
            const dbDue = new Date(card.nextPaymentDue);
            if (dbDue >= monthStart && dbDue <= monthEnd) {
              exactDue = dbDue;
            }
          }

          if (exactDue) {
            processedCardIds.add(String(card._id));
            ccItems.push({
              _id: `cc_${card._id}_${exactDue.toISOString()}`,
              name: `${card.bankName} ${card.name}`,
              nextDue: exactDue,
              amount: card.minimumPaymentAmount || 0,
              effectiveAmount: card.minimumPaymentAmount || 0,
              totalAmount: card.currentBalance || 0,
              category: { name: 'Kredi Kartı Ödemesi' },
              amountInfo: { isDynamic: false },
              _ccType: 'card_payment',
              _cardInfo: {
                id: card._id,
                name: card.name,
                bankName: card.bankName
              }
            });
          } else {
            const prevStDay = Math.min(card.statementDay || 24, prevMonthLastDay);
            const dueA = new Date(prevYear, prevMonth, prevStDay, 12, 0, 0);
            dueA.setDate(dueA.getDate() + 10);

            let dueInMonth = null;
            if (dueA.getMonth() === targetMonth && dueA.getFullYear() === targetYear) {
              dueInMonth = dueA;
            } else {
              const curStDay = Math.min(card.statementDay || 24, curMonthLastDay);
              const dueB = new Date(targetYear, targetMonth, curStDay, 12, 0, 0);
              dueB.setDate(dueB.getDate() + 10);
              if (dueB.getMonth() === targetMonth && dueB.getFullYear() === targetYear) {
                dueInMonth = dueB;
              }
            }

            if (dueInMonth) {
              processedCardIds.add(String(card._id));
              ccItems.push({
                _id: `cc_${card._id}_${dueInMonth.toISOString()}`,
                name: `${card.bankName} ${card.name}`,
                nextDue: dueInMonth,
                amount: 0,
                effectiveAmount: 0,
                totalAmount: 0,
                category: { name: 'Kredi Kartı Ödemesi' },
                amountInfo: { isDynamic: false },
                _ccType: 'card_payment',
                _cardInfo: {
                  id: card._id,
                  name: card.name,
                  bankName: card.bankName
                }
              });
            }
          }
        });
      }

      const expenseItems = (expenses || []).map(e => ({
        _id: `exp_${e._id}`,
        name: e.description,
        nextDue: e.date,
        amount: e.amount,
        effectiveAmount: e.amount,
        category: e.category,
        amountInfo: { isDynamic: false },
        _expenseType: e.status,
      }));

      const newItems = [...recurring, ...ccItems, ...expenseItems];
      setPayments(prev => {
        const existingIds = new Set(prev.map(p => p._id));
        return [...prev, ...newItems.filter(p => !existingIds.has(p._id))];
      });
      loadedMonths.current.add(key);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // İlk ay mount'ta yüklenir
  useEffect(() => { fetchMonth(0); }, [fetchMonth]);

  // Diğer aylar ok'a basınca yüklenir
  useEffect(() => { fetchMonth(currentMonth); }, [currentMonth, fetchMonth]);

  // Mevcut ayın toplamını üst bileşene bildir
  useEffect(() => {
    if (!onCurrentMonthTotal) return;
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const total = payments
      .filter(p => {
        const d = new Date(p.nextDue);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, p) => sum + (p.effectiveAmount || p.amount || 0), 0);
    onCurrentMonthTotal(total);
  }, [payments, onCurrentMonthTotal]);

  const getPaymentsForDate = (date) => {
    const dateStr = date.toDateString();
    return payments.filter(p => new Date(p.nextDue).toDateString() === dateStr);
  };

  const getWeekDates = () => {
    const start = new Date();
    start.setDate(start.getDate() + currentWeek * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const getMonthDates = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth() + currentMonth, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + currentMonth + 1, 0);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay());
    const end = new Date(lastDay);
    end.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    const dates = [];
    const cur = new Date(start);
    while (cur <= end) { dates.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
    return dates;
  };

  const formatWeekRange = () => {
    const dates = getWeekDates();
    return `${dates[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${dates[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}`;
  };

  const formatMonthYear = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() + currentMonth, 1)
      .toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  };

  const weekDays = t('weekdays', { returnObjects: true });
  const weekDates = getWeekDates();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        {/* Sol: Başlık */}
        <div className="flex items-center space-x-2 shrink-0">
          <FiCalendar className="text-blue-500" size={20} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{t('upcomingPayments')}</h3>
        </div>

        {/* Orta: Görünüm ve Tarih Seçimi */}
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setViewMode('weekly')}
              className={`p-2 rounded ${viewMode === 'weekly' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
              title={t('weeklyView')}
            >
              <FiList size={16} />
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`p-2 rounded ${viewMode === 'monthly' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
              title={t('monthlyView')}
            >
              <FiGrid size={16} />
            </button>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => viewMode === 'weekly' ? setCurrentWeek(w => Math.max(0, w - 1)) : setCurrentMonth(m => m - 1)}
              disabled={viewMode === 'weekly' && currentWeek === 0}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <FiChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[130px] text-center whitespace-nowrap">
              {viewMode === 'weekly' ? formatWeekRange() : formatMonthYear()}
            </span>
            <button
              onClick={() => viewMode === 'weekly' ? setCurrentWeek(w => w + 1) : setCurrentMonth(m => m + 1)}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Sağ: Google Takvim'e Aktar Butonu */}
        <button
          onClick={() => setShowSyncModal(true)}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-blue-200/60 dark:border-blue-800/50 shadow-sm whitespace-nowrap"
          title="Seçili ayı Google Calendar ile senkronize et"
        >
          <FiRefreshCw className="h-3.5 w-3.5" />
          <span>Google Takvim'e Aktar</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">{t('loading')}</div>
      ) : viewMode === 'weekly' ? (
        /* Weekly Grid */
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, i) => {
            const dayPayments = getPaymentsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div key={i} className="text-center">
                <div className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {weekDays[date.getDay()]}
                </div>
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm mb-1 ${isToday ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {date.getDate()}
                </div>
                <div className="flex flex-col items-center gap-1">
                  {dayPayments.map((p, pi) => <WeekPaymentDot key={pi} payment={p} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Monthly Grid */
        <>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekDays.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {getMonthDates().map((date, i) => {
              const dayPayments = getPaymentsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const today = new Date();
              const isCurrentMonth = date.getMonth() === (today.getMonth() + currentMonth + 12) % 12;
              return (
                <div
                  key={i}
                  className={`p-1 min-h-[72px] border border-gray-100 dark:border-gray-700 rounded ${
                    isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
                  }`}
                >
                  <div className={`text-xs mb-1 ${
                    isToday
                      ? 'w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold'
                      : isCurrentMonth ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-400 dark:text-gray-600'
                  }`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayPayments.slice(0, 3).map((p, pi) => <PaymentDot key={pi} payment={p} />)}
                    {dayPayments.length > 3 && (
                      <div className="text-xs text-gray-400">+{dayPayments.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Aylık Özet */}
          {(() => {
            const fmt = v => Number(v).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
            const today = new Date();
            const displayedMonth = (today.getMonth() + currentMonth + 12) % 12;
            const displayedFullYear = today.getFullYear() + Math.floor((today.getMonth() + currentMonth) / 12);
            const monthPayments = payments.filter(p => {
              const d = new Date(p.nextDue);
              return d.getFullYear() === displayedFullYear && d.getMonth() === displayedMonth;
            });
            const monthTotal = monthPayments.reduce((sum, p) => sum + (p.effectiveAmount || p.amount || 0), 0);
            const ccMin = monthPayments
              .filter(p => p._ccType === 'card_payment')
              .reduce((sum, p) => sum + (p.amount || 0), 0);
            const deficit = monthlyIncome - monthTotal;
            return (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">{t('thisMonthPayments')}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {fmt(monthTotal)}
                    <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">({monthPayments.length})</span>
                  </span>
                </div>
                {ccMin > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">{t('minimumPaymentCC')}</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">{fmt(ccMin)}</span>
                  </div>
                )}
                {monthlyIncome > 0 && (
                  <div className="flex justify-between items-center pt-1 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">{t('monthlyBalance')}</span>
                    <span className={`font-semibold ${deficit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {deficit >= 0 ? '+' : ''}{fmt(deficit)}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}

      {/* Google Calendar Sync Modal */}
      {showSyncModal && (
        <Modal
          isOpen={showSyncModal}
          onClose={() => setShowSyncModal(false)}
          title={`Google Takvim Senkronizasyonu - ${formatMonthYear()}`}
          size="lg"
        >
          {(() => {
            const currentMonthPayments = getSelectedMonthPayments();
            const totalAmount = currentMonthPayments.reduce((sum, p) => sum + (p.effectiveAmount || p.amount || 0), 0);

            return (
              <div className="space-y-4 text-xs text-gray-700 dark:text-gray-200">
                {/* Toplu İçe Aktarma Banner */}
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 shadow-sm flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold uppercase block">
                      {formatMonthYear()} Ayı Toplu Ödemeleri
                    </span>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100 mt-0.5">
                      {totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">
                        ({currentMonthPayments.length} Adet Ödeme)
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => downloadICSFile(currentMonthPayments, formatMonthYear())}
                      disabled={currentMonthPayments.length === 0}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <FiDownload className="h-4 w-4" />
                      Tüm Ayı İndir (.ics)
                    </button>
                    <a
                      href="https://calendar.google.com/calendar/u/0/r/settings/export"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      title="Google Takvim İçe Aktar Sayfasını Aç"
                    >
                      <span>Google Takvim İçe Aktar</span>
                      <FiExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                  <p>
                    <strong className="text-gray-800 dark:text-gray-200">💡 Nasıl Kullanılır?</strong><br />
                    1. <strong>"Tüm Ayı İndir (.ics)"</strong> butonuna basarak seçili ayın tüm ödemelerini tek takvim dosyası olarak indirin.<br />
                    2. İndirdiğiniz dosyayı <strong>"Google Takvim İçe Aktar"</strong> sayfasına sürükleyip bırakarak tüm ayı tek seferde takviminize işleyin.
                  </p>
                </div>

                {/* Payments Table */}
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">
                    {formatMonthYear()} Ayı Ödeme Listesi
                  </h4>
                  {currentMonthPayments.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 border border-dashed rounded-lg">Bu aya ait planlanmış ödeme bulunmuyor.</div>
                  ) : (
                    <div className="overflow-x-auto max-h-[40vh] border border-gray-200 dark:border-gray-700 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase sticky top-0">
                          <tr>
                            <th className="px-3 py-2">Vade Tarihi</th>
                            <th className="px-3 py-2">Ödeme Başlığı</th>
                            <th className="px-3 py-2">Kategori</th>
                            <th className="px-3 py-2">Tutar</th>
                            <th className="px-3 py-2 text-right">Doğrudan Aç</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {currentMonthPayments.map((payment, idx) => {
                            const dateObj = new Date(payment.nextDue);
                            const dateFormatted = !isNaN(dateObj.getTime())
                              ? dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' })
                              : payment.nextDue;
                            const isCC = payment.category?.name === 'Kredi Kartı Ödemesi' || payment._ccType;

                            return (
                              <tr key={payment._id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                  {dateFormatted}
                                </td>
                                <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                                  <div className="flex items-center gap-1.5">
                                    <span>{isCC ? '💳' : '📋'}</span>
                                    <span>{payment.name}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                                  {payment.category?.name || '-'}
                                </td>
                                <td className="px-3 py-2 font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                                  {(payment.effectiveAmount || payment.amount || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                </td>
                                <td className="px-3 py-2 text-right whitespace-nowrap">
                                  <a
                                    href={getGoogleCalendarUrl(payment)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded font-medium text-[11px] transition-colors"
                                  >
                                    <span>+ Takvime Ekle</span>
                                    <FiExternalLink className="h-3 w-3" />
                                  </a>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};

export default DashboardCalendar;
