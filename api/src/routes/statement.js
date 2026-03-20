const { parseStatementUpload, importStatement } = require('../controllers/statementController');

async function statementRoutes(fastify, options) {
  // Multipart upload — schema validation disabled for parse endpoint
  fastify.post('/credit-cards/:id/statement/parse', {
    config: { rawBody: true }
  }, parseStatementUpload);

  fastify.post('/credit-cards/:id/statement/import', {
    schema: { body: { type: 'object' } }
  }, importStatement);
}

module.exports = statementRoutes;
