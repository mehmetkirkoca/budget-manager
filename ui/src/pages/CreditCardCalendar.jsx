import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiArrowLeft, FiCreditCard } from 'react-icons/fi';
import { creditCardService } from '../services/creditCardService';

const fmt = (v) => Number(v).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });

const Tooltip = ({ item, anchorRef }) => {
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

  return (
    <div
      ref={tooltipRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 50 }}
      className="bg-gray-900 text-white text-xs rounded-lg shadow-lg p-2.5 min-w-[200px] pointer-events-none"
    >
      <div className="font-semibold mb-1.5">{item.title}</div>
      {item.cardInfo && (
        <div className="text-gray-400 mb-1 text-xs">{item.cardInfo.bankName}</div>
      )}
      {item.type === 'card_payment' ? (
        <>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Min. Ödeme</span>
            <span className="text-yellow-300 font-medium">{fmt(item.amount)}</span>
          </div>
          <div className="flex justify-between gap-4 mt-0.5">
            <span className="text-gray-400">Toplam Borç</span>
            <span className="text-red-300 font-medium">{fmt(item.totalAmount)}</span>
          </div>
        </>
      ) : (
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Taksit Tutarı</span>
          <span className="text-yellow-300 font-medium">{fmt(item.amount)}</span>
        </div>
      )}
    </div>
  );
};

const CalendarItem = ({ item }) => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  const isCard = item.type === 'card_payment';

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`text-xs px-1 py-0.5 rounded truncate cursor-default ${
        isCard
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      }`}
    >
      {item.title}
      {hovered && <Tooltip item={item} anchorRef={ref} />}
    </div>
  );
};

const CreditCardCalendar = () => {
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  useEffect(() => {
    document.title = 'Kredi Kartı Takvimi - Budget';
  }, []);

  useEffect(() => {
    setLoading(true);
    creditCardService.getPaymentCalendar(month, year)
      .then(data => setItems(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [month, year]);

  const getItemsForDate = (date) => {
    const dateStr = date.toISOString().slice(0, 10);
    return items.filter(item => item.date?.slice(0, 10) === dateStr);
  };

  const getMonthDates = () => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay());
    const end = new Date(lastDay);
    end.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    const dates = [];
    const cur = new Date(start);
    while (cur <= end) { dates.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
    return dates;
  };

  const formatMonthYear = () =>
    currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  const weekDays = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  const cardPayments = items.filter(i => i.type === 'card_payment');
  const installmentPayments = items.filter(i => i.type === 'installment_payment');
  const totalCardAmount = cardPayments.reduce((s, i) => s + (i.totalAmount || 0), 0);

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/credit-cards"
          className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <FiArrowLeft size={14} />
          Kredi Kartları
        </Link>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <div className="flex items-center gap-2">
          <FiCreditCard className="text-blue-500" size={20} />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Kredi Kartı Takvimi</h1>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMonthOffset(m => m - 1)}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            >
              <FiChevronLeft size={16} />
            </button>
            <span className="text-base font-semibold text-gray-800 dark:text-gray-100 min-w-[180px] text-center capitalize">
              {formatMonthYear()}
            </span>
            <button
              onClick={() => setMonthOffset(m => m + 1)}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            >
              <FiChevronRight size={16} />
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-blue-400" />
              Kart Ödemesi
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-purple-400" />
              Taksit
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500 dark:text-gray-400">
            Yükleniyor...
          </div>
        ) : (
          <>
            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekDays.map(d => (
                <div key={d} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {getMonthDates().map((date, i) => {
                const dayItems = getItemsForDate(date);
                const isToday = date.toDateString() === today.toDateString();
                const isCurrentMonth = date.getMonth() === month - 1;
                return (
                  <div
                    key={i}
                    className={`p-1 min-h-[80px] border rounded ${
                      isCurrentMonth
                        ? 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'
                        : 'border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-900'
                    }`}
                  >
                    <div className={`text-xs mb-1 ${
                      isToday
                        ? 'w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold'
                        : isCurrentMonth
                          ? 'text-gray-800 dark:text-gray-200 font-medium'
                          : 'text-gray-400 dark:text-gray-600'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayItems.slice(0, 3).map((item, pi) => (
                        <CalendarItem key={pi} item={item} />
                      ))}
                      {dayItems.length > 3 && (
                        <div className="text-xs text-gray-400">+{dayItems.length - 3}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Monthly Summary */}
      {!loading && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Kart Ödemeleri</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{fmt(totalCardAmount)}</div>
            <div className="text-xs text-gray-400 mt-0.5">{cardPayments.length} kart</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Taksit Kalemleri</div>
            <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">{installmentPayments.length} adet</div>
            <div className="text-xs text-gray-400 mt-0.5">bilgi amaçlı, toplama dahil değil</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Toplam Borç</div>
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {fmt(totalCardAmount)}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{cardPayments.length} kart</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditCardCalendar;
