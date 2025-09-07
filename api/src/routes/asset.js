const assetController = require('../controllers/assetController');

const postAssetSchema = {
  body: {
    type: 'object',
    required: ['type', 'amount', 'target'],
    properties: {
      type: { type: 'string' },
      description: { type: 'string' },
      amount: { type: 'number' },
      target: { type: 'number' },
    },
  },
};

async function assetRoutes(fastify, options) {
  fastify.get('/assets', assetController.getAllAssets);
  fastify.post('/assets', { schema: postAssetSchema }, assetController.createAsset);
  fastify.get('/assets/progress', assetController.getAssetsProgress);
}

module.exports = assetRoutes;
