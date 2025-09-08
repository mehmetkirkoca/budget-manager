const assetController = require('../controllers/assetController');

const postAssetSchema = {
  body: {
    type: 'object',
    required: ['name', 'type', 'targetAmount'],
    properties: {
      name: { type: 'string' },
      type: { type: 'string', enum: ['savings', 'investment', 'realEstate', 'crypto'] },
      description: { type: 'string' },
      currentAmount: { type: 'number', minimum: 0 },
      targetAmount: { type: 'number', minimum: 0 },
    },
  },
};

const putAssetSchema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      type: { type: 'string', enum: ['savings', 'investment', 'realEstate', 'crypto'] },
      description: { type: 'string' },
      currentAmount: { type: 'number', minimum: 0 },
      targetAmount: { type: 'number', minimum: 0 },
    },
  },
};

async function assetRoutes(fastify, options) {
  fastify.get('/assets', assetController.getAllAssets);
  fastify.post('/assets', { schema: postAssetSchema }, assetController.createAsset);
  fastify.put('/assets/:id', { schema: putAssetSchema }, assetController.updateAsset);
  fastify.delete('/assets/:id', assetController.deleteAsset);
  fastify.get('/assets/progress', assetController.getAssetsProgress);
}

module.exports = assetRoutes;
