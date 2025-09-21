const Note = require('../models/Note');

const getAllNotes = async (request, reply) => {
  try {
    const {
      category,
      archived = false,
      search,
      priority,
      tags,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = request.query;

    const query = { isArchived: archived === 'true' };

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by priority
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    // Search in title and content
    if (search) {
      query.$text = { $search: search };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const notes = await Note.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Note.countDocuments(query);

    reply.send({
      notes,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const getNoteById = async (request, reply) => {
  try {
    const note = await Note.findById(request.params.id);
    if (!note) {
      return reply.status(404).send({ error: 'Note not found' });
    }
    reply.send(note);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const createNote = async (request, reply) => {
  try {
    const noteData = {
      title: request.body.title,
      content: request.body.content,
      category: request.body.category || 'personal',
      tags: request.body.tags || [],
      priority: request.body.priority || 'medium',
      reminderDate: request.body.reminderDate || null,
      color: request.body.color || 'blue'
    };

    const note = new Note(noteData);
    const savedNote = await note.save();

    reply.status(201).send(savedNote);
  } catch (err) {
    reply.status(400).send({ error: err.message });
  }
};

const updateNote = async (request, reply) => {
  try {
    const updateData = {
      title: request.body.title,
      content: request.body.content,
      category: request.body.category,
      tags: request.body.tags,
      priority: request.body.priority,
      reminderDate: request.body.reminderDate,
      color: request.body.color
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key =>
      updateData[key] === undefined && delete updateData[key]
    );

    const note = await Note.findByIdAndUpdate(
      request.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!note) {
      return reply.status(404).send({ error: 'Note not found' });
    }

    reply.send(note);
  } catch (err) {
    reply.status(400).send({ error: err.message });
  }
};

const deleteNote = async (request, reply) => {
  try {
    const note = await Note.findByIdAndDelete(request.params.id);
    if (!note) {
      return reply.status(404).send({ error: 'Note not found' });
    }
    reply.send({ message: 'Note deleted successfully' });
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const archiveNote = async (request, reply) => {
  try {
    const note = await Note.findByIdAndUpdate(
      request.params.id,
      { isArchived: true },
      { new: true }
    );

    if (!note) {
      return reply.status(404).send({ error: 'Note not found' });
    }

    reply.send(note);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const unarchiveNote = async (request, reply) => {
  try {
    const note = await Note.findByIdAndUpdate(
      request.params.id,
      { isArchived: false },
      { new: true }
    );

    if (!note) {
      return reply.status(404).send({ error: 'Note not found' });
    }

    reply.send(note);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const getNotesStats = async (request, reply) => {
  try {
    const [totalNotes, archivedNotes, priorityStats, categoryStats] = await Promise.all([
      Note.countDocuments({ isArchived: false }),
      Note.countDocuments({ isArchived: true }),
      Note.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Note.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ])
    ]);

    const upcomingReminders = await Note.find({
      isArchived: false,
      reminderDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
      }
    }).sort({ reminderDate: 1 }).limit(5);

    reply.send({
      totalNotes,
      archivedNotes,
      priorityStats,
      categoryStats,
      upcomingReminders
    });
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

module.exports = {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  archiveNote,
  unarchiveNote,
  getNotesStats
};