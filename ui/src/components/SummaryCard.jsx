
import { IconContext } from 'react-icons';

const SummaryCard = ({ icon, title, value, color }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 flex items-center">
      <IconContext.Provider value={{ color: color, size: '2.5em' }}>
        <div className={`rounded-full p-3 bg-opacity-20 ${color.replace('text-', 'bg-')}`}>
            {icon}
        </div>
      </IconContext.Provider>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
      </div>
    </div>
  );
};

export default SummaryCard;
