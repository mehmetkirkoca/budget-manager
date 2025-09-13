import { FiGrid, FiSidebar, FiColumns } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const LAYOUT_OPTIONS = [
  {
    id: 'single',
    name: 'singleColumn',
    icon: <FiSidebar size={20} />,
    description: 'singleColumnDesc',
    className: 'w-full'
  },
  {
    id: 'two-column',
    name: 'twoColumn', 
    icon: <FiColumns size={20} />,
    description: 'twoColumnDesc',
    className: 'grid grid-cols-1 lg:grid-cols-2 gap-6'
  },
  {
    id: 'three-column',
    name: 'threeColumn',
    icon: <FiGrid size={20} />,
    description: 'threeColumnDesc', 
    className: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
  }
];

const LayoutSelector = ({ currentLayout, onLayoutChange }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
        {t('layout')}:
      </span>
      <div className="flex space-x-1">
        {LAYOUT_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => onLayoutChange(option.id)}
            className={`
              p-2 rounded-md transition-colors duration-200 flex items-center justify-center
              ${currentLayout === option.id
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
            title={t(option.description)}
          >
            {option.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export { LAYOUT_OPTIONS };
export default LayoutSelector;