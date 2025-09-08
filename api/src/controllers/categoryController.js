const Category = require('../models/Category');

const getAllCategories = async (request, reply) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    reply.send(categories);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const createCategory = async (request, reply) => {
  try {
    const { name, description, color } = request.body;
    const newCategory = new Category({
      name,
      description,
      color
    });
    
    await newCategory.save();
    reply.status(201).send(newCategory);
  } catch (err) {
    if (err.code === 11000) {
      reply.status(400).send({ error: 'Category name already exists' });
    } else {
      reply.status(500).send({ error: err.message });
    }
  }
};

const updateCategory = async (request, reply) => {
  try {
    const { id } = request.params;
    const { name, description, color, isActive } = request.body;
    
    const category = await Category.findByIdAndUpdate(
      id,
      { name, description, color, isActive },
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return reply.status(404).send({ error: 'Category not found' });
    }
    
    reply.send(category);
  } catch (err) {
    if (err.code === 11000) {
      reply.status(400).send({ error: 'Category name already exists' });
    } else {
      reply.status(500).send({ error: err.message });
    }
  }
};

const deleteCategory = async (request, reply) => {
  try {
    const { id } = request.params;
    
    // Soft delete - just mark as inactive
    const category = await Category.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!category) {
      return reply.status(404).send({ error: 'Category not found' });
    }
    
    reply.send({ message: 'Category deleted successfully' });
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};