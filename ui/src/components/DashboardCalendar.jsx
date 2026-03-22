import { useState, useEffect, useRef, useCallback } from 'react';
import { getUpcomingPayments } from '../services/recurringPaymentService';
import { creditCardService } from '../services/creditCardService';
import { getExpensesByDateRange } from '../services/expenseService';
import { useTranslation } from 'react-i18next';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiGrid, FiList } from 'react-icons/fi';

const Tooltip = ({ payment, anchorRef }) => {
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
        <>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Min. Ödeme</span>
            <span className="text-yellow-300 font-medium">{fmt(payment.amount)}</span>
          </div>
          <div className="flex justify-between gap-4 mt-0.5">
            <span className="text-gray-400">Toplam Borç</span>
            <span className="text-red-300 font-medium">{fmt(payment.totalAmount)}</span>
          </div>
        </>
      ) : isExpense ? (
        <>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Tutar</span>
            <span className="text-yellow-300 font-medium">{fmt(payment.amount)}</span>
          </div>
          <div className="text-gray-500 mt-1 border-t border-gray-700 pt-1">
            {payment._expenseType === 'pending' ? 'Bekliyor' : 'Tamamlandı'}
          </div>
        </>
      ) : (
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Tutar</span>
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

const DashboardCalendar = () => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('monthly');
  const [currentWeek, setCurrentWeek] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(0);
  const loadedMonths = useRef(new Set());

  const fetchMonth = useCallback(async (monthOffset) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0, 23, 59, 59);
    const key = `${monthStart.getFullYear()}-${monthStart.getMonth()}`;

    if (loadedMonths.current.has(key)) return;

    setLoading(true);
    try {
      const [recurring, ccData, expenses] = await Promise.all([
        getUpcomingPayments(monthStart.toISOString(), monthEnd.toISOString()),
        creditCardService.getPaymentCalendar(monthStart.getMonth() + 1, monthStart.getFullYear()),
        getExpensesByDateRange(monthStart.toISOString(), monthEnd.toISOString()),
      ]);

      const ccItems = (ccData || []).filter(item => item.type === 'card_payment').map(item => ({
        _id: `cc_${item.cardInfo?.id}_${item.date}`,
        name: item.title,
        nextDue: item.date,
        amount: item.amount,
        effectiveAmount: item.amount,
        totalAmount: item.totalAmount,
        category: { name: 'Kredi Kartı Ödemesi' },
        amountInfo: { isDynamic: false },
        _ccType: item.type,
        _cardInfo: item.cardInfo,
      }));

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

  const weekDays = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const weekDates = getWeekDates();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FiCalendar className="text-blue-500" size={20} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upcoming Payments</h3>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setViewMode('weekly')}
              className={`p-2 rounded ${viewMode === 'weekly' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
              title="Haftalık"
            >
              <FiList size={16} />
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`p-2 rounded ${viewMode === 'monthly' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
              title="Aylık"
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
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[140px] text-center">
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
          {/* Aylık Toplam */}
          {(() => {
            const today = new Date();
            const displayedYear = today.getFullYear();
            const displayedMonth = (today.getMonth() + currentMonth + 12) % 12;
            const displayedFullYear = today.getFullYear() + Math.floor((today.getMonth() + currentMonth) / 12);
            const monthPayments = payments.filter(p => {
              const d = new Date(p.nextDue);
              return d.getFullYear() === displayedFullYear && d.getMonth() === displayedMonth;
            });
            const monthTotal = monthPayments.reduce((sum, p) => sum + (p.effectiveAmount || p.amount || 0), 0);
            return (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Bu ay toplam ödeme</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {monthTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">({monthPayments.length} kalem)</span>
                </span>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
};

export default DashboardCalendar;
