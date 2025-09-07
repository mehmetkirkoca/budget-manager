const getAllAssets = async (request, reply) => {
  try {
    const assets = await request.server.prisma.asset.findMany();
    reply.send(assets);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const createAsset = async (request, reply) => {
  try {
    const { type, description, amount, target } = request.body;
    const newAsset = await request.server.prisma.asset.create({
      data: {
        type,
        description,
        amount,
        target,
      },
    });
    reply.status(201).send(newAsset);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const getAssetsProgress = async (request, reply) => {
  try {
    const assets = await request.server.prisma.asset.findMany();

    const assetsWithProgress = assets.map((asset) => {
      const progress = asset.target > 0 ? (asset.amount / asset.target) * 100 : 0;
      return { ...asset, progress: parseFloat(progress.toFixed(2)) };
    });

    const totalAmount = assets.reduce((sum, asset) => sum + asset.amount, 0);
    const totalTarget = assets.reduce((sum, asset) => sum + asset.target, 0);
    const overallProgress = totalTarget > 0 ? (totalAmount / totalTarget) * 100 : 0;

    reply.send({
      assets: assetsWithProgress,
      overallProgress: parseFloat(overallProgress.toFixed(2)),
    });
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

module.exports = {
  getAllAssets,
  createAsset,
  getAssetsProgress,
};
