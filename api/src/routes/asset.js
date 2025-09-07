const assetController = require('../controllers/assetController');

const postAssetSchema = {
  body: {
    type: 'object',
    required: ['name', 'type', 'targetAmount'],
    properties: {
      name: { type: 'string' },
      type: { type: 'string' },
      description: { type: 'string' },
      currentAmount: { type: 'number' },
      targetAmount: { type: 'number' },
    },
  },
};

async function assetRoutes(fastify, options) {
  fastify.get('/assets', assetController.getAllAssets);
  fastify.post('/assets', { schema: postAssetSchema }, assetController.createAsset);
  fastify.put('/assets/:id', assetController.updateAsset);
  fastify.delete('/assets/:id', assetController.deleteAsset);
  fastify.get('/assets/progress', assetController.getAssetsProgress);
}

module.exports = assetRoutes;
