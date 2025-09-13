const CreditCard = require('../models/CreditCard');
const CreditCardInstallment = require('../models/CreditCardInstallment');

// Get all credit cards
const getAllCreditCards = async (request, reply) => {
  try {
    const creditCards = await CreditCard.find({ isActive: true })
      .sort({ bankName: 1, name: 1 });
    
    reply.send(creditCards);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to fetch credit cards' 
    });
  }
};

// Get credit card by ID
const getCreditCardById = async (request, reply) => {
  try {
    const { id } = request.params;
    const creditCard = await CreditCard.findById(id);
    
    if (!creditCard) {
      return reply.status(404).send({ 
        error: 'Not Found', 
        message: 'Credit card not found' 
      });
    }
    
    reply.send(creditCard);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to fetch credit card' 
    });
  }
};

// Create new credit card
const createCreditCard = async (request, reply) => {
  try {
    const creditCardData = request.body;
    
    // Validate that available limit doesn't exceed total limit
    if (creditCardData.availableLimit > creditCardData.totalLimit) {
      return reply.status(400).send({ 
        error: 'Bad Request', 
        message: 'Available limit cannot exceed total limit' 
      });
    }
    
    // Calculate next payment due date
    const nextPaymentDue = new Date();
    nextPaymentDue.setDate(creditCardData.paymentDueDay);
    if (nextPaymentDue <= new Date()) {
      nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);
    }
    creditCardData.nextPaymentDue = nextPaymentDue;
    
    const creditCard = new CreditCard(creditCardData);
    await creditCard.save();
    
    reply.status(201).send(creditCard);
  } catch (error) {
    if (error.code === 11000) {
      return reply.status(400).send({ 
        error: 'Bad Request', 
        message: 'Credit card with this card number already exists' 
      });
    }
    
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to create credit card' 
    });
  }
};

// Update credit card
const updateCreditCard = async (request, reply) => {
  try {
    const { id } = request.params;
    const updateData = request.body;
    
    // No manual validation - let model handle it
    
    const creditCard = await CreditCard.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!creditCard) {
      return reply.status(404).send({ 
        error: 'Not Found', 
        message: 'Credit card not found' 
      });
    }
    
    // Update available limit based on current balance
    if (updateData.currentBalance !== undefined || updateData.totalLimit !== undefined) {
      await creditCard.updateAvailableLimit();
    }
    
    reply.send(creditCard);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to update credit card' 
    });
  }
};

// Delete credit card (soft delete)
const deleteCreditCard = async (request, reply) => {
  try {
    const { id } = request.params;
    
    // Check if card has active installments
    const activeInstallments = await CreditCardInstallment.countDocuments({
      creditCard: id,
      paymentStatus: 'active'
    });
    
    if (activeInstallments > 0) {
      return reply.status(400).send({ 
        error: 'Bad Request', 
        message: 'Cannot delete credit card with active installments' 
      });
    }
    
    const creditCard = await CreditCard.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!creditCard) {
      return reply.status(404).send({ 
        error: 'Not Found', 
        message: 'Credit card not found' 
      });
    }
    
    reply.send({ message: 'Credit card deleted successfully' });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to delete credit card' 
    });
  }
};

// Get credit card summary with utilization
const getCreditCardSummary = async (request, reply) => {
  try {
    const summary = await CreditCard.getUtilizationSummary();
    const upcomingPayments = await CreditCard.getUpcomingPayments(7);
    
    reply.send({
      utilization: summary[0] || {
        totalLimit: 0,
        totalUsed: 0,
        totalDebt: 0,
        cardCount: 0,
        utilizationRate: 0
      },
      upcomingPayments
    });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to fetch credit card summary' 
    });
  }
};

// Get credit card details with installments
const getCreditCardDetails = async (request, reply) => {
  try {
    const { id } = request.params;
    
    const creditCard = await CreditCard.findById(id);
    if (!creditCard) {
      return reply.status(404).send({ 
        error: 'Not Found', 
        message: 'Credit card not found' 
      });
    }
    
    // Get active installments for this card
    const installments = await CreditCardInstallment.find({
      creditCard: id,
      paymentStatus: { $in: ['active', 'completed'] }
    })
    .populate('category', 'name color')
    .sort({ nextPaymentDate: 1 });
    
    // Calculate card statistics
    const stats = {
      totalInstallments: installments.length,
      activeInstallments: installments.filter(i => i.paymentStatus === 'active').length,
      totalOriginalAmount: installments.reduce((sum, i) => sum + i.originalAmount, 0),
      totalRemainingAmount: installments.reduce((sum, i) => sum + i.remainingAmount, 0),
      monthlyPaymentAmount: installments
        .filter(i => i.paymentStatus === 'active')
        .reduce((sum, i) => sum + i.installmentAmount, 0)
    };
    
    reply.send({
      creditCard,
      installments,
      stats
    });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to fetch credit card details' 
    });
  }
};

// Update credit card balance and available limit
const updateCreditCardBalance = async (request, reply) => {
  try {
    const { id } = request.params;
    const { currentBalance, availableLimit } = request.body;
    
    const creditCard = await CreditCard.findById(id);
    if (!creditCard) {
      return reply.status(404).send({ 
        error: 'Not Found', 
        message: 'Credit card not found' 
      });
    }
    
    creditCard.currentBalance = currentBalance || creditCard.currentBalance;
    creditCard.availableLimit = availableLimit || (creditCard.totalLimit - currentBalance);
    creditCard.minimumPaymentAmount = creditCard.calculateMinimumPayment();
    
    await creditCard.save();
    
    reply.send(creditCard);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to update credit card balance' 
    });
  }
};

// Get payment calendar for all cards
const getPaymentCalendar = async (request, reply) => {
  try {
    const { month, year } = request.query;
    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0);
    
    // Get credit card payments
    const cardPayments = await CreditCard.find({
      isActive: true,
      nextPaymentDue: { $gte: startDate, $lte: endDate },
      currentBalance: { $gt: 0 }
    }).select('name bankName nextPaymentDue minimumPaymentAmount currentBalance');
    
    // Get installment payments
    const installmentPayments = await CreditCardInstallment.find({
      paymentStatus: 'active',
      nextPaymentDate: { $gte: startDate, $lte: endDate }
    })
    .populate('creditCard', 'name bankName')
    .select('purchaseDescription installmentAmount nextPaymentDate creditCard');
    
    const calendar = [];
    
    // Add card payments
    cardPayments.forEach(card => {
      calendar.push({
        type: 'card_payment',
        date: card.nextPaymentDue,
        title: `${card.bankName} ${card.name} - Minimum Payment`,
        amount: card.minimumPaymentAmount,
        cardInfo: {
          id: card._id,
          name: card.name,
          bankName: card.bankName
        }
      });
    });
    
    // Add installment payments
    installmentPayments.forEach(installment => {
      calendar.push({
        type: 'installment_payment',
        date: installment.nextPaymentDate,
        title: `${installment.purchaseDescription} - Installment`,
        amount: installment.installmentAmount,
        cardInfo: {
          id: installment.creditCard._id,
          name: installment.creditCard.name,
          bankName: installment.creditCard.bankName
        }
      });
    });
    
    // Sort by date
    calendar.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    reply.send(calendar);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to fetch payment calendar' 
    });
  }
};

module.exports = {
  getAllCreditCards,
  getCreditCardById,
  createCreditCard,
  updateCreditCard,
  deleteCreditCard,
  getCreditCardSummary,
  getCreditCardDetails,
  updateCreditCardBalance,
  getPaymentCalendar
};