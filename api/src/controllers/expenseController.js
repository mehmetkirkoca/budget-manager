const getAllExpenses = async (request, reply) => {
  try {
    const expenses = await request.server.prisma.expense.findMany();
    reply.send(expenses);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const createExpense = async (request, reply) => {
  try {
    const { category, description, amount, date, status } = request.body;
    const newExpense = await request.server.prisma.expense.create({
      data: {
        category,
        description,
        amount,
        date: new Date(date),
        status,
      },
    });
    reply.status(201).send(newExpense);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const getExpensesByCategory = async (request, reply) => {
  try {
    const expensesByCategory = await request.server.prisma.expense.groupBy({
      by: ['category'],
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
    });
    reply.send(expensesByCategory);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

module.exports = {
  getAllExpenses,
  createExpense,
  getExpensesByCategory,
};
