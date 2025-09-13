import { useState } from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const WidgetSelector = ({ availableWidgets, onWidgetSelect, onClose }) => {
  const { t } = useTranslation();
  const [selectedWidget, setSelectedWidget] = useState('');

  const handleAdd = () => {
    if (selectedWidget && onWidgetSelect) {
      onWidgetSelect(selectedWidget);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('selectWidget')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('availableWidgets')}:
          </label>
          <select
            value={selectedWidget}
            onChange={(e) => setSelectedWidget(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">{t('selectWidget')}</option>
            {availableWidgets.map((widget) => (
              <option key={widget.id} value={widget.id}>
                {t(widget.name) || widget.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedWidget}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            <FiPlus className="inline mr-2" size={16} />
            {t('addWidget')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetSelector;