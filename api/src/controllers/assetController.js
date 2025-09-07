const Asset = require('../models/Asset');

const getAllAssets = async (request, reply) => {
  try {
    const assets = await Asset.find().sort({ createdAt: -1 });
    reply.send(assets);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const createAsset = async (request, reply) => {
  try {
    const { name, type, description, currentAmount, targetAmount } = request.body;
    const newAsset = new Asset({
      name,
      type,
      description,
      currentAmount: currentAmount || 0,
      targetAmount,
    });
    
    await newAsset.save();
    reply.status(201).send(newAsset);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const updateAsset = async (request, reply) => {
  try {
    const { id } = request.params;
    const { name, type, description, currentAmount, targetAmount } = request.body;
    
    const asset = await Asset.findByIdAndUpdate(
      id,
      { name, type, description, currentAmount, targetAmount },
      { new: true, runValidators: true }
    );
    
    if (!asset) {
      return reply.status(404).send({ error: 'Asset not found' });
    }
    
    reply.send(asset);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const deleteAsset = async (request, reply) => {
  try {
    const { id } = request.params;
    
    const asset = await Asset.findByIdAndDelete(id);
    
    if (!asset) {
      return reply.status(404).send({ error: 'Asset not found' });
    }
    
    reply.send({ message: 'Asset deleted successfully' });
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const getAssetsProgress = async (request, reply) => {
  try {
    const assets = await Asset.find();

    const totalCurrentAmount = assets.reduce((sum, asset) => sum + asset.currentAmount, 0);
    const totalTargetAmount = assets.reduce((sum, asset) => sum + asset.targetAmount, 0);
    const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

    reply.send({
      assets,
      overallProgress: parseFloat(overallProgress.toFixed(2)),
      totalCurrentAmount,
      totalTargetAmount
    });
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

module.exports = {
  getAllAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetsProgress,
};
