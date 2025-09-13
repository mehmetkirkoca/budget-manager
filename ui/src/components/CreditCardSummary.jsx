import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCreditCard, FiTrendingUp, FiCalendar, FiAlertCircle, FiPlus } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { creditCardService, creditCardInstallmentService, creditCardUtils } from '../services/creditCardService';

const CreditCardSummary = () => {
  const { t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCreditCardData();
  }, []);

  const fetchCreditCardData = async () => {
    try {
      setLoading(true);
      const [summaryData, upcomingData] = await Promise.all([
        creditCardService.getCreditCardSummary(),
        creditCardInstallmentService.getUpcomingPayments(7)
      ]);
      
      setSummary(summaryData);
      setUpcomingPayments(upcomingData);
    } catch (error) {
      console.error('Error fetching credit card data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center text-red-500">
          <FiAlertCircle className="mx-auto mb-2 text-2xl" />
          <p className="text-sm">{t('errorLoadingData')}</p>
        </div>
      </div>
    );
  }

  if (!summary || summary.utilization.cardCount === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <FiCreditCard className="mr-2" />
            {t('creditCards')}
          </h3>
        </div>
        
        <div className="text-center py-6">
          <FiCreditCard className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{t('noCreditCards')}</p>
          <Link
            to="/credit-cards/new"
            className="inline-flex items-center px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm"
          >
            <FiPlus className="mr-1" />
            {t('addCreditCard')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <FiCreditCard className="mr-2" />
            {t('creditCards')}
          </h3>
          <Link
            to="/credit-cards"
            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
          >
            {t('seeAll')}
          </Link>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {summary.utilization.cardCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t('totalCards')}</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              summary.utilization.utilizationRate >= 80 ? 'text-red-600 dark:text-red-400' :
              summary.utilization.utilizationRate >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-green-600 dark:text-green-400'
            }`}>
              {summary.utilization.utilizationRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t('utilizationRate')}</div>
          </div>
        </div>

        {/* Total Limits */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500 dark:text-gray-400">{t('totalUsed')}</span>
            <span className="text-gray-500 dark:text-gray-400">{t('totalLimit')}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {creditCardUtils.formatCurrency(summary.utilization.totalUsed)}
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {creditCardUtils.formatCurrency(summary.utilization.totalLimit)}
            </span>
          </div>
          
          {/* Utilization Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                summary.utilization.utilizationRate >= 80 ? 'bg-red-500' :
                summary.utilization.utilizationRate >= 60 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(summary.utilization.utilizationRate, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Upcoming Payments */}
        {upcomingPayments.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
              <FiCalendar className="mr-2" />
              {t('upcomingPayments')} (7 {t('days')})
            </h4>
            <div className="space-y-2">
              {upcomingPayments.slice(0, 3).map(payment => (
                <div key={payment._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {payment.purchaseDescription}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {payment.creditCard?.bankName} {payment.creditCard?.name}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {creditCardUtils.formatCurrency(payment.installmentAmount)}
                    </div>
                    <div className={`text-xs ${
                      creditCardUtils.getDaysUntilPayment(payment.nextPaymentDate) <= 3 ? 'text-red-600 dark:text-red-400' :
                      creditCardUtils.getDaysUntilPayment(payment.nextPaymentDate) <= 7 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>
                      {creditCardUtils.getDaysUntilPayment(payment.nextPaymentDate)} {t('days')}
                    </div>
                  </div>
                </div>
              ))}
              
              {upcomingPayments.length > 3 && (
                <div className="text-center pt-2">
                  <Link
                    to="/credit-cards"
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm"
                  >
                    +{upcomingPayments.length - 3} {t('more')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 mt-6">
          <Link
            to="/credit-cards/new"
            className="flex-1 bg-indigo-500 text-white px-3 py-2 rounded-lg hover:bg-indigo-600 transition-colors text-center text-sm"
          >
            {t('addCard')}
          </Link>
          <Link
            to="/credit-cards"
            className="flex-1 bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors text-center text-sm"
          >
            {t('manageCards')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CreditCardSummary;