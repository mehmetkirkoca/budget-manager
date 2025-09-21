import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiFileText, FiPlus, FiClock, FiArchive, FiEdit } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { getAllNotes, getNotesStats } from '../services/noteService';

const NotesWidget = () => {
  const { t } = useTranslation();
  const [recentNotes, setRecentNotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotesData();
  }, []);

  const fetchNotesData = async () => {
    try {
      setLoading(true);
      const [notesResponse, statsData] = await Promise.all([
        getAllNotes({
          archived: false,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          limit: 5
        }),
        getNotesStats()
      ]);

      setRecentNotes(notesResponse.notes || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching notes data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'low': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
    }
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800',
      green: 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800',
      yellow: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800',
      red: 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800',
      purple: 'border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800',
      gray: 'border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600'
    };
    return colorMap[color] || colorMap.blue;
  };

  const truncateText = (text, maxLength = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FiFileText className="text-blue-500" size={20} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('notes')}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to="/notes"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
          >
            <FiEdit size={14} className="mr-1" />
            {t('seeAll')}
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500 dark:text-gray-400">{t('loading')}</div>
        </div>
      ) : (
        <>
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.totalNotes}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t('activeNotes')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {stats.archivedNotes}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t('archivedNotes')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.upcomingReminders?.length || 0}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Hatırlatıcılar
                </div>
              </div>
            </div>
          )}

          {/* Recent Notes */}
          <div className="space-y-3">
            {recentNotes.length === 0 ? (
              <div className="text-center py-6">
                <FiFileText className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                  {t('noNotes')}
                </p>
                <Link
                  to="/notes"
                  className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <FiPlus size={14} className="mr-1" />
                  {t('createFirstNote')}
                </Link>
              </div>
            ) : (
              <>
                {recentNotes.map((note) => (
                  <div
                    key={note._id}
                    className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${getColorClasses(note.color)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {truncateText(note.title, 40)}
                      </h4>
                      <div className="flex items-center space-x-1">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getPriorityColor(note.priority)}`}>
                          {t(`priority.${note.priority}`)}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-2 leading-relaxed">
                      {truncateText(note.content, 80)}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(note.updatedAt)}
                      </span>
                      {note.reminderDate && (
                        <div className="flex items-center text-xs text-orange-600 dark:text-orange-400">
                          <FiClock size={10} className="mr-1" />
                          {formatDate(note.reminderDate)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {stats && stats.totalNotes > 5 && (
                  <div className="text-center pt-2">
                    <Link
                      to="/notes"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      +{stats.totalNotes - 5} {t('more')} {t('notes').toLowerCase()}
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t dark:border-gray-700">
            <div className="flex items-center justify-between">
              <Link
                to="/notes"
                className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <FiPlus size={14} className="mr-1" />
                {t('createNote')}
              </Link>
              {stats && stats.archivedNotes > 0 && (
                <Link
                  to="/notes?archived=true"
                  className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:underline"
                >
                  <FiArchive size={14} className="mr-1" />
                  {t('showArchived')}
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotesWidget;