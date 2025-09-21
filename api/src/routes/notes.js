const {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  archiveNote,
  unarchiveNote,
  getNotesStats
} = require('../controllers/noteController');

async function noteRoutes(fastify, options) {
  // Get all notes with filtering and pagination
  fastify.get('/', getAllNotes);

  // Get note statistics
  fastify.get('/stats', getNotesStats);

  // Get specific note by ID
  fastify.get('/:id', getNoteById);

  // Create new note
  fastify.post('/', createNote);

  // Update note
  fastify.put('/:id', updateNote);

  // Delete note
  fastify.delete('/:id', deleteNote);

  // Archive note
  fastify.patch('/:id/archive', archiveNote);

  // Unarchive note
  fastify.patch('/:id/unarchive', unarchiveNote);
}

module.exports = noteRoutes;