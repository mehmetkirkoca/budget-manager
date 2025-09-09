import { useState, useEffect } from 'react';
import { getUpcomingPayments } from '../services/recurringPaymentService';
import { useTranslation } from 'react-i18next';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiClock } from 'react-icons/fi';

const DashboardCalendar = () => {
  const { t } = useTranslation();
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0); // 0 = this week, 1 = next week, etc.

  useEffect(() => {
    fetchUpcomingPayments();
  }, [currentWeek]);

  const fetchUpcomingPayments = async () => {
    try {
      setLoading(true);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + (currentWeek * 7));
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
      
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

  const getPaymentsForDate = (date) => {
    const dateStr = date.toDateString();
    return upcomingPayments.filter(payment => 
      new Date(payment.nextDue).toDateString() === dateStr
    );
  };

  const formatWeekRange = () => {
    const dates = getWeekDates();
    const start = dates[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    const end = dates[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    return `${start} - ${end}`;
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
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
            disabled={currentWeek === 0}
            className={`p-2 rounded ${
              currentWeek === 0 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <FiChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[100px] text-center">
            {formatWeekRange()}
          </span>
          <button
            onClick={() => setCurrentWeek(currentWeek + 1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
          >
            <FiChevronRight size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500 dark:text-gray-400">{t('loading')}</div>
        </div>
      ) : (
        <>
          {/* Week Calendar */}
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
                      {dayPayments.slice(0, 2).map((payment, pIndex) => (
                        <div
                          key={pIndex}
                          className="w-2 h-2 rounded-full bg-red-400"
                          title={`${payment.name} - ${payment.amount.toLocaleString('tr-TR')} TRY`}
                        />
                      ))}
                      {dayPayments.length > 2 && (
                        <div className="text-xs text-gray-500">+{dayPayments.length - 2}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Payment List */}
          <div className="border-t dark:border-gray-700 pt-4">
            {upcomingPayments.length === 0 ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                No payments scheduled for this week
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingPayments.slice(0, 5).map((payment, index) => {
                  const dueDate = new Date(payment.nextDue);
                  const today = new Date();
                  const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FiClock className={`${
                          daysUntil <= 1 ? 'text-red-500' : daysUntil <= 3 ? 'text-yellow-500' : 'text-gray-400'
                        }`} size={16} />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {payment.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {dueDate.toLocaleDateString('tr-TR')}
                            {daysUntil === 0 && <span className="ml-2 text-red-600 font-medium">Today</span>}
                            {daysUntil === 1 && <span className="ml-2 text-yellow-600 font-medium">Tomorrow</span>}
                            {daysUntil > 1 && <span className="ml-2 text-gray-500">{daysUntil} days</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {payment.amount.toLocaleString('tr-TR')} TRY
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
                      +{upcomingPayments.length - 5} more payments this week
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