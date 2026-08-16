
import { IconContext } from 'react-icons';
import { FiEye } from 'react-icons/fi';

const SummaryCard = ({ icon, title, value, color, onDetailClick, detailTitle }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 flex items-center justify-between">
      <div className="flex items-center min-w-0">
        <IconContext.Provider value={{ color: color, size: '2.5em' }}>
          <div className={`rounded-full p-3 bg-opacity-20 shrink-0 ${color.replace('text-', 'bg-')}`}>
            {icon}
          </div>
        </IconContext.Provider>
        <div className="ml-4 truncate">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
            {value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </p>
        </div>
      </div>
      {onDetailClick && (
        <button
          onClick={onDetailClick}
          className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
          title={detailTitle || `${title} Kalemleri`}
        >
          <FiEye className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default SummaryCard;
