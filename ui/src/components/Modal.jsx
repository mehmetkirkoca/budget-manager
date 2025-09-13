import { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl', 
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 px-4">
      {/* Background overlay with subtle blur and dark tint */}
      <div 
        className="absolute inset-0 transition-all duration-300"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)'
        }}
        onClick={onClose}
      ></div>

      {/* Modal panel */}
      <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full ${sizeClasses[size]} max-h-[85vh] flex flex-col transform transition-all duration-300 ease-out`}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-lg">
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto custom-scrollbar" 
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f9fafb'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;