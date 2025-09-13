import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiDownload, FiDatabase, FiCalendar, FiFile, FiCheck } from 'react-icons/fi';
import {
  getExportSummary,
  exportAllData,
  exportCollection,
  exportByDateRange,
  EXPORT_COLLECTIONS,
  EXPORT_FORMATS
} from '../services/exportService';

const Export = () => {
  const { t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState('all');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('json');
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [exportStatus, setExportStatus] = useState(null);

  useEffect(() => {
    loadExportSummary();
  }, []);

  const loadExportSummary = async () => {
    try {
      const data = await getExportSummary();
      setSummary(data);
    } catch (error) {
      console.error('Error loading export summary:', error);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setExportStatus(null);

    try {
      let result;
      
      switch (exportType) {
        case 'all':
          result = await exportAllData();
          break;
        case 'collection':
          if (!selectedCollection) {
            throw new Error('Please select a collection to export');
          }
          result = await exportCollection(selectedCollection, selectedFormat);
          break;
        case 'dateRange':
          if (!dateRange.startDate || !dateRange.endDate) {
            throw new Error('Please select both start and end dates');
          }
          result = await exportByDateRange(dateRange.startDate, dateRange.endDate);
          break;
        default:
          throw new Error('Invalid export type');
      }

      setExportStatus({
        type: 'success',
        message: `Export completed successfully! File: ${result.filename}`
      });
    } catch (error) {
      setExportStatus({
        type: 'error',
        message: error.message || 'Export failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('dataExport')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('exportDescription')}
          </p>
        </div>
        <FiDatabase className="w-8 h-8 text-blue-600 dark:text-blue-400" />
      </div>

      {/* Export Summary */}
      {summary && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('exportSummary')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {summary.totalDocuments}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('totalRecords')}
              </div>
            </div>
            {Object.entries(summary.collections).map(([name, info]) => (
              <div key={name} className="text-center">
                <div className="text-xl font-semibold text-gray-900 dark:text-white">
                  {info.count}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t(name)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {t('lastUpdated')}: {formatDate(summary.lastUpdated)}
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('exportOptions')}
        </h2>

        {/* Export Type Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('exportType')}
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportType"
                  value="all"
                  checked={exportType === 'all'}
                  onChange={(e) => setExportType(e.target.value)}
                  className="mr-2"
                />
                <FiDatabase className="w-4 h-4 mr-2" />
                {t('exportAllData')}
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportType"
                  value="collection"
                  checked={exportType === 'collection'}
                  onChange={(e) => setExportType(e.target.value)}
                  className="mr-2"
                />
                <FiFile className="w-4 h-4 mr-2" />
                {t('exportSpecificCollection')}
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportType"
                  value="dateRange"
                  checked={exportType === 'dateRange'}
                  onChange={(e) => setExportType(e.target.value)}
                  className="mr-2"
                />
                <FiCalendar className="w-4 h-4 mr-2" />
                {t('exportByDateRange')}
              </label>
            </div>
          </div>

          {/* Collection Selection */}
          {exportType === 'collection' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('selectCollection')}
                </label>
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">{t('selectCollection')}</option>
                  {EXPORT_COLLECTIONS.map(collection => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('format')}
                </label>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {EXPORT_FORMATS.map(format => (
                    <option key={format.id} value={format.id}>
                      {format.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Date Range Selection */}
          {exportType === 'dateRange' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('startDate')}
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('endDate')}
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Export Button */}
        <div className="mt-6">
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-md transition-colors"
          >
            {loading ? (
              <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <FiDownload className="w-4 h-4 mr-2" />
            )}
            {loading ? t('exporting') : t('exportData')}
          </button>
        </div>

        {/* Export Status */}
        {exportStatus && (
          <div className={`mt-4 p-4 rounded-md ${
            exportStatus.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center">
              {exportStatus.type === 'success' ? (
                <FiCheck className="w-4 h-4 mr-2" />
              ) : (
                <FiFile className="w-4 h-4 mr-2" />
              )}
              {exportStatus.message}
            </div>
          </div>
        )}
      </div>

      {/* Export Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('exportInformation')}
        </h2>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <p>• {t('exportInfo1')}</p>
          <p>• {t('exportInfo2')}</p>
          <p>• {t('exportInfo3')}</p>
          <p>• {t('exportInfo4')}</p>
        </div>
      </div>
    </div>
  );
};

export default Export;