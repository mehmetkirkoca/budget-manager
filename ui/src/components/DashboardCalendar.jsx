import { useState, useEffect } from 'react';
import { getUpcomingPayments } from '../services/recurringPaymentService';
import { useTranslation } from 'react-i18next';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiClock, FiGrid, FiList } from 'react-icons/fi';

const DashboardCalendar = () => {
  const { t } = useTranslation();
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('monthly'); // 'weekly' or 'monthly'
  const [currentWeek, setCurrentWeek] = useState(0); // 0 = this week, 1 = next week, etc.
  const [currentMonth, setCurrentMonth] = useState(0); // 0 = this month, 1 = next month, etc.

  useEffect(() => {
    fetchUpcomingPayments();
  }, [currentWeek, currentMonth, viewMode]);

  const fetchUpcomingPayments = async () => {
    try {
      setLoading(true);
      let startDate, endDate;

      if (viewMode === 'weekly') {
        startDate = new Date();
        startDate.setDate(startDate.getDate() + (currentWeek * 7));
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
      } else {
        // Monthly view
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() + currentMonth, 1);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
      }

      const data = await getUpcomingPayments(startDate.toISOString(), endDate.toISOString());
      setUpcomingPayments(data);
    } catch (error) {
      console.error('Error fetching upcoming payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDates = () => {
    const start = new Date();
    start.setDate(start.getDate() + (currentWeek * 7));
    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getMonthDates = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + currentMonth;

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Start from the beginning of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    // End at the end of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    const dates = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const getPaymentsForDate = (date) => {
    const dateStr = date.toDateString();
    return upcomingPayments.filter(payment =>
      new Date(payment.nextDue).toDateString() === dateStr
    );
  };

  const getPaymentDisplayAmount = (payment) => {
    // Use effective amount if available (for dynamic payments)
    if (payment.effectiveAmount !== undefined && payment.effectiveAmount > 0) {
      return payment.effectiveAmount;
    }
    // Fallback to original amount
    return payment.amount;
  };

  const getPaymentDisplayInfo = (payment) => {
    const amount = getPaymentDisplayAmount(payment);
    const isDynamic = payment.amountInfo?.isDynamic;
    const isCalculated = payment.amountInfo?.isCalculated;

    return {
      amount: amount,
      isDynamic: isDynamic,
      isCalculated: isCalculated,
      displayText: `${amount.toLocaleString('tr-TR')} TRY`,
      metadata: payment.amountInfo?.metadata
    };
  };

  const formatWeekRange = () => {
    const dates = getWeekDates();
    const start = dates[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    const end = dates[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    return `${start} - ${end}`;
  };

  const formatMonthYear = () => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth() + currentMonth, 1);
    return targetDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  };

  const weekDays = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const weekDates = getWeekDates();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FiCalendar className="text-blue-500" size={20} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Upcoming Payments
          </h3>
        </div>
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('weekly')}
              className={`p-2 rounded ${
                viewMode === 'weekly'
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title="Haftalık görünüm"
            >
              <FiList size={16} />
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`p-2 rounded ${
                viewMode === 'monthly'
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title="Aylık görünüm"
            >
              <FiGrid size={16} />
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (viewMode === 'weekly') {
                  setCurrentWeek(Math.max(0, currentWeek - 1));
                } else {
                  setCurrentMonth(currentMonth - 1);
                }
              }}
              disabled={viewMode === 'weekly' && currentWeek === 0}
              className={`p-2 rounded ${
                viewMode === 'weekly' && currentWeek === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <FiChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[140px] text-center">
              {viewMode === 'weekly' ? formatWeekRange() : formatMonthYear()}
            </span>
            <button
              onClick={() => {
                if (viewMode === 'weekly') {
                  setCurrentWeek(currentWeek + 1);
                } else {
                  setCurrentMonth(currentMonth + 1);
                }
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500 dark:text-gray-400">{t('loading')}</div>
        </div>
      ) : (
        <>
          {/* Calendar Grid */}
          {viewMode === 'weekly' ? (
            /* Week Calendar */
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDates.map((date, index) => {
                const dayPayments = getPaymentsForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <div key={index} className="text-center">
                    <div className={`text-xs font-medium mb-1 ${
                      isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {weekDays[date.getDay()]}
                    </div>
                    <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm ${
                      isToday
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {date.getDate()}
                    </div>
                    {dayPayments.length > 0 && (
                      <div className="flex flex-col items-center mt-1 space-y-1">
                        {dayPayments.slice(0, 2).map((payment, pIndex) => {
                          const displayInfo = getPaymentDisplayInfo(payment);
                          return (
                            <div
                              key={pIndex}
                              className={`w-2 h-2 rounded-full ${
                                displayInfo.isDynamic ? 'bg-orange-400' : 'bg-red-400'
                              }`}
                              title={`${payment.name} - ${displayInfo.displayText}${
                                displayInfo.isDynamic ? ' (Hesaplanmış)' : ''
                              }`}
                            />
                          );
                        })}
                        {dayPayments.length > 2 && (
                          <div className="text-xs text-gray-500">+{dayPayments.length - 2}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Monthly Calendar */
            <div className="mb-4">
              {/* Week day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day, index) => (
                  <div key={index} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {getMonthDates().map((date, index) => {
                  const dayPayments = getPaymentsForDate(date);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const today = new Date();
                  const currentMonthValue = today.getMonth() + currentMonth;
                  const isCurrentMonth = date.getMonth() === currentMonthValue;

                  return (
                    <div
                      key={index}
                      className={`p-2 min-h-[80px] border border-gray-200 dark:border-gray-700 ${
                        isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
                      }`}
                    >
                      <div className={`text-sm mb-1 ${
                        isToday
                          ? 'w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold'
                          : isCurrentMonth
                            ? 'text-gray-900 dark:text-gray-100 font-medium'
                            : 'text-gray-400 dark:text-gray-600'
                      }`}>
                        {date.getDate()}
                      </div>

                      {dayPayments.length > 0 && (
                        <div className="space-y-1">
                          {dayPayments.slice(0, 3).map((payment, pIndex) => {
                            const displayInfo = getPaymentDisplayInfo(payment);
                            return (
                              <div
                                key={pIndex}
                                className={`text-xs p-1 rounded truncate ${
                                  displayInfo.isDynamic
                                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}
                                title={`${payment.name} - ${displayInfo.displayText}${
                                  displayInfo.isDynamic ? ' (Hesaplanmış)' : ''
                                }`}
                              >
                                {payment.name}
                              </div>
                            );
                          })}
                          {dayPayments.length > 3 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              +{dayPayments.length - 3} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment List */}
          <div className="border-t dark:border-gray-700 pt-4">
            {upcomingPayments.length === 0 ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                {viewMode === 'weekly' ? 'No payments scheduled for this week' : 'No payments scheduled for this month'}
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingPayments.slice(0, 5).map((payment, index) => {
                  const dueDate = new Date(payment.nextDue);
                  const today = new Date();
                  const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                  const displayInfo = getPaymentDisplayInfo(payment);

                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <FiClock className={`${
                            daysUntil <= 1 ? 'text-red-500' : daysUntil <= 3 ? 'text-yellow-500' : 'text-gray-400'
                          }`} size={16} />
                          {displayInfo.isDynamic && (
                            <div
                              className="w-3 h-3 rounded-full bg-orange-400"
                              title="Dinamik hesaplanan tutar"
                            />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                            {payment.name}
                            {displayInfo.isDynamic && displayInfo.isCalculated && (
                              <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                Hesaplanmış
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {dueDate.toLocaleDateString('tr-TR')}
                            {daysUntil === 0 && <span className="ml-2 text-red-600 font-medium">Today</span>}
                            {daysUntil === 1 && <span className="ml-2 text-yellow-600 font-medium">Tomorrow</span>}
                            {daysUntil > 1 && <span className="ml-2 text-gray-500">{daysUntil} days</span>}
                            {displayInfo.metadata?.cardName && (
                              <span className="ml-2 text-xs text-blue-600">
                                ({displayInfo.metadata.bankName})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold text-gray-900 dark:text-gray-100 ${
                          displayInfo.isDynamic ? 'text-orange-700 dark:text-orange-300' : ''
                        }`}>
                          {displayInfo.displayText}
                        </div>
                        {payment.category && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {payment.category.name}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {upcomingPayments.length > 5 && (
                  <div className="text-center py-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      +{upcomingPayments.length - 5} more payments this {viewMode === 'weekly' ? 'week' : 'month'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardCalendar;