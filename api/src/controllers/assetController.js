const Asset = require('../models/Asset');
const assetConversionService = require('../services/assetConversionService');

const getAllAssets = async (request, reply) => {
  try {
    const assets = await Asset.find().sort({ createdAt: -1 });

    // Add TRY conversion values
    const assetsWithConversion = await Promise.all(
      assets.map(async (asset) => {
        try {
          const conversion = await assetConversionService.convertToTRY(asset);
          return {
            ...asset.toJSON(),
            currentValueTRY: conversion.currentValueTRY,
            targetValueTRY: conversion.targetValueTRY,
            conversionRate: conversion.conversionRate
          };
        } catch (error) {
          console.error(`Conversion failed for asset ${asset._id}:`, error);
          return {
            ...asset.toJSON(),
            currentValueTRY: asset.unit === 'TRY' ? asset.currentAmount : 0,
            targetValueTRY: asset.unit === 'TRY' ? asset.targetAmount : 0,
            conversionRate: asset.unit === 'TRY' ? 1 : 0
          };
        }
      })
    );

    reply.send(assetsWithConversion);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const createAsset = async (request, reply) => {
  try {
    const { name, type, description, currentAmount, targetAmount, unit, assetType, goldKarat } = request.body;
    const newAsset = new Asset({
      name,
      type,
      description,
      currentAmount: currentAmount || 0,
      targetAmount,
      unit: unit || 'TRY',
      assetType: assetType || 'currency',
      goldKarat
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
    const { name, type, description, currentAmount, targetAmount, unit, assetType, goldKarat } = request.body;

    const updateData = { name, type, description, currentAmount, targetAmount, unit, assetType };
    if (goldKarat !== undefined) {
      updateData.goldKarat = goldKarat;
    }

    const asset = await Asset.findByIdAndUpdate(
      id,
      updateData,
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
