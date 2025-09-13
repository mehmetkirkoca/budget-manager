import { useDrop } from 'react-dnd';
import { FiPlus } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const DropZone = ({ onDrop, isActive = true, className = '' }) => {
  const { t } = useTranslation();

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'widget',
    drop: (item) => {
      if (onDrop) {
        onDrop(item);
      }
      return { dropZoneId: 'dropzone' };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  const isDropActive = isOver && canDrop && isActive;

  return (
    <div
      ref={drop}
      className={`
        ${className}
        ${isDropActive 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' 
          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
        }
        border-2 border-dashed rounded-lg p-4 transition-all duration-200
        ${isActive ? 'opacity-100' : 'opacity-50'}
      `}
    >
      <div className="flex items-center justify-center text-gray-500 dark:text-gray-400">
        <FiPlus className="mr-2" size={16} />
        <span className="text-sm">
          {isDropActive ? t('dropHere') : t('dropZone')}
        </span>
      </div>
    </div>
  );
};

export default DropZone;