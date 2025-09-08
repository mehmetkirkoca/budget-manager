const categoryController = require('../controllers/categoryController');

const postCategorySchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 50 },
      description: { type: 'string', maxLength: 200 },
      color: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' }
    }
  }
};

const putCategorySchema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 50 },
      description: { type: 'string', maxLength: 200 },
      color: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' },
      isActive: { type: 'boolean' }
    }
  }
};

async function categoryRoutes(fastify, options) {
  fastify.get('/categories', categoryController.getAllCategories);
  fastify.post('/categories', { schema: postCategorySchema }, categoryController.createCategory);
  fastify.put('/categories/:id', { schema: putCategorySchema }, categoryController.updateCategory);
  fastify.delete('/categories/:id', categoryController.deleteCategory);
}

module.exports = categoryRoutes;