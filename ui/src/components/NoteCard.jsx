import { useState } from 'react';
import { FiEdit, FiTrash2, FiArchive, FiClock, FiTag } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const NoteCard = ({ note, onEdit, onDelete, onArchive, onUnarchive }) => {
  const { t } = useTranslation();
  const [showFullContent, setShowFullContent] = useState(false);

  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800',
    green: 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800',
    yellow: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800',
    red: 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800',
    purple: 'border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800',
    gray: 'border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600'
  };

  const priorityColors = {
    low: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    medium: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
    high: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isReminderUpcoming = () => {
    if (!note.reminderDate) return false;
    const reminderDate = new Date(note.reminderDate);
    const now = new Date();
    return reminderDate > now && reminderDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  };

  const truncateContent = (content, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className={`rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md ${colorClasses[note.color]}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-1">
            {note.title}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColors[note.priority]}`}>
              {t(`priority.${note.priority}`)}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300">
              {t(`noteCategory.${note.category}`)}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1 opacity-60 hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(note)}
            className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            title={t('edit')}
          >
            <FiEdit size={14} />
          </button>
          <button
            onClick={() => note.isArchived ? onUnarchive(note._id) : onArchive(note._id)}
            className="p-1 text-gray-500 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-400"
            title={note.isArchived ? t('unarchive') : t('archive')}
          >
            <FiArchive size={14} />
          </button>
          <button
            onClick={() => onDelete(note._id)}
            className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            title={t('delete')}
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          {showFullContent ? note.content : truncateContent(note.content)}
        </p>
        {note.content.length > 150 && (
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="text-blue-600 dark:text-blue-400 text-xs mt-1 hover:underline"
          >
            {showFullContent ? t('showLess') : t('showMore')}
          </button>
        )}
      </div>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex items-center flex-wrap gap-1 mb-3">
          <FiTag size={12} className="text-gray-400" />
          {note.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <span>{formatDate(note.updatedAt)}</span>
          {note.reminderDate && (
            <div className={`flex items-center space-x-1 ${isReminderUpcoming() ? 'text-orange-600 dark:text-orange-400' : ''}`}>
              <FiClock size={12} />
              <span>{formatDate(note.reminderDate)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteCard;