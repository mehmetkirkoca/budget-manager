import { useState, useEffect } from 'react';
import { getTodaysSummary, triggerAutoProcess } from '../services/autoProcessService';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiClock, FiRefreshCw, FiDollarSign } from 'react-icons/fi';

const AutoProcessSummary = () => {
  const { t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await getTodaysSummary();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching auto-process summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualTrigger = async () => {
    try {
      setProcessing(true);
      await triggerAutoProcess();
      await fetchSummary(); // Refresh summary after processing
      alert('Manual processing triggered successfully!');
    } catch (error) {
      console.error('Error triggering manual process:', error);
      alert('Failed to trigger manual processing');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {summary.processedToday ? (
            <FiCheck className="text-green-500" size={20} />
          ) : (
            <FiClock className="text-yellow-500" size={20} />
          )}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Auto-Processed Payments
          </h3>
        </div>
        <button
          onClick={handleManualTrigger}
          disabled={processing}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm ${
            processing
              ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          <FiRefreshCw className={processing ? 'animate-spin' : ''} size={16} />
          <span>{processing ? 'Processing...' : 'Manual Trigger'}</span>
        </button>
      </div>

      {summary.processedToday ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full">
                <FiCheck className="text-green-600 dark:text-green-400" size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Processed Today
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {summary.count} payments automatically processed
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {summary.totalAmount.toLocaleString('tr-TR')} TRY
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Amount
              </p>
            </div>
          </div>

          {summary.todaysExpenses && summary.todaysExpenses.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                Today's Auto-Created Expenses:
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {summary.todaysExpenses.map((expense, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: expense.category?.color || '#6b7280' }}
                      ></div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {expense.recurringPaymentId?.name || 'Unknown Payment'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {expense.category?.name || 'No Category'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                      <FiDollarSign size={14} />
                      <span>{expense.amount.toLocaleString('tr-TR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <FiClock className="text-yellow-600 dark:text-yellow-400" size={24} />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            No payments processed today
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Auto-processing will run on the first API call of each day
          </p>
        </div>
      )}
    </div>
  );
};

export default AutoProcessSummary;