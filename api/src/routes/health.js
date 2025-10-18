async function healthRoutes(fastify, options) {
  fastify.get('/health', async (request, reply) => {
    return { message: 'Budget Manager API is healthy!', status: 'ok' };
  });
}

module.exports = healthRoutes;