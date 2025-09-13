import { FiGrid, FiMinus, FiColumns, FiMoreHorizontal, FiPlus, FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const COLUMN_OPTIONS = [
  { value: 1, icon: <FiMinus size={16} />, label: '1 Column' },
  { value: 2, icon: <FiColumns size={16} />, label: '2 Columns' },
  { value: 3, icon: <FiMoreHorizontal size={16} />, label: '3 Columns' },
  { value: 4, icon: <FiGrid size={16} />, label: '4 Columns' }
];

const RowLayoutSelector = ({ rowIndex, columnCount, onColumnChange, onAddRow, onRemoveRow, canRemove }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-4">
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {t('row')} {rowIndex + 1}:
        </span>
        <div className="flex space-x-1">
          {COLUMN_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onColumnChange(rowIndex, option.value)}
              className={`
                p-2 rounded transition-colors duration-200 flex items-center justify-center
                ${columnCount === option.value
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }
              `}
              title={`${option.value} ${t('columns')}`}
            >
              {option.icon}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onAddRow(rowIndex + 1)}
          className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
          title={t('addRowBelow')}
        >
          <FiPlus size={16} />
        </button>
        
        {canRemove && (
          <button
            onClick={() => onRemoveRow(rowIndex)}
            className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title={t('removeRow')}
          >
            <FiX size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default RowLayoutSelector;