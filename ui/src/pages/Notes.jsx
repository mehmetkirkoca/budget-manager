import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiSearch, FiFilter, FiGrid, FiList, FiArchive } from 'react-icons/fi';
import NoteCard from '../components/NoteCard';
import NoteForm from '../components/NoteForm';
import {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
  archiveNote,
  unarchiveNote,
  getNotesStats
} from '../services/noteService';

const Notes = () => {
  const { t } = useTranslation();
  const [notes, setNotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showArchived, setShowArchived] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    priority: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    document.title = `${t('notes')} - ${t('appTitle')}`;
    fetchNotes();
    fetchStats();
  }, [filters, showArchived, t]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        archived: showArchived
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === 'all') {
          delete params[key];
        }
      });

      const response = await getAllNotes(params);
      setNotes(response.notes || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await getNotesStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateNote = () => {
    setEditingNote(null);
    setShowForm(true);
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setShowForm(true);
  };

  const handleSaveNote = async (noteData) => {
    try {
      if (editingNote) {
        await updateNote(editingNote._id, noteData);
      } else {
        await createNote(noteData);
      }
      setShowForm(false);
      setEditingNote(null);
      fetchNotes();
      fetchStats();
    } catch (error) {
      console.error('Error saving note:', error);
      alert(t('errorSavingNote'));
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm(t('confirmDeleteNote'))) {
      try {
        await deleteNote(noteId);
        fetchNotes();
        fetchStats();
      } catch (error) {
        console.error('Error deleting note:', error);
        alert(t('errorDeletingNote'));
      }
    }
  };

  const handleArchiveNote = async (noteId) => {
    try {
      await archiveNote(noteId);
      fetchNotes();
      fetchStats();
    } catch (error) {
      console.error('Error archiving note:', error);
    }
  };

  const handleUnarchiveNote = async (noteId) => {
    try {
      await unarchiveNote(noteId);
      fetchNotes();
      fetchStats();
    } catch (error) {
      console.error('Error unarchiving note:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const categories = [
    { value: 'all', label: t('all') },
    { value: 'personal', label: t('noteCategory.personal') },
    { value: 'finance', label: t('noteCategory.finance') },
    { value: 'business', label: t('noteCategory.business') },
    { value: 'todo', label: t('noteCategory.todo') },
    { value: 'important', label: t('noteCategory.important') }
  ];

  const priorities = [
    { value: 'all', label: t('all') },
    { value: 'low', label: t('priority.low') },
    { value: 'medium', label: t('priority.medium') },
    { value: 'high', label: t('priority.high') }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('notes')}
          </h1>
          {stats && (
            <p className="text-gray-600 dark:text-gray-400">
              {showArchived
                ? `${stats.archivedNotes} ${t('archivedNotes')}`
                : `${stats.totalNotes} ${t('activeNotes')}`
              }
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              showArchived
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            <FiArchive className="mr-2" size={16} />
            {showArchived ? t('showActive') : t('showArchived')}
          </button>
          <button
            onClick={handleCreateNote}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <FiPlus className="mr-2" size={16} />
            {t('createNote')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={t('searchNotes')}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}
            >
              <FiGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}
            >
              <FiList size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Notes Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">{t('loading')}</div>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {showArchived ? t('noArchivedNotes') : t('noNotes')}
          </p>
          {!showArchived && (
            <button
              onClick={handleCreateNote}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {t('createFirstNote')}
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'space-y-4'
        }>
          {notes.map(note => (
            <NoteCard
              key={note._id}
              note={note}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
              onArchive={handleArchiveNote}
              onUnarchive={handleUnarchiveNote}
            />
          ))}
        </div>
      )}

      {/* Note Form Modal */}
      {showForm && (
        <NoteForm
          note={editingNote}
          onSave={handleSaveNote}
          onClose={() => {
            setShowForm(false);
            setEditingNote(null);
          }}
        />
      )}
    </div>
  );
};

export default Notes;