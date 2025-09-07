const getSummary = async (request, reply) => {
  try {
    const totalExpenses = await request.server.prisma.expense.aggregate({
      _sum: { amount: true },
    });

    const totalAssets = await request.server.prisma.asset.aggregate({
      _sum: { amount: true },
    });

    const totalTarget = await request.server.prisma.asset.aggregate({
      _sum: { target: true },
    });

    const summary = {
      totalExpenses: totalExpenses._sum.amount || 0,
      totalAssets: totalAssets._sum.amount || 0,
      netWorth: (totalAssets._sum.amount || 0) - (totalExpenses._sum.amount || 0),
      totalTarget: totalTarget._sum.target || 0,
      remainingToTarget: (totalTarget._sum.target || 0) - (totalAssets._sum.amount || 0),
    };

    reply.send(summary);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

module.exports = {
  getSummary,
};
