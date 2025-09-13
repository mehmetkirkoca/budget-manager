const CreditCardInstallment = require('../models/CreditCardInstallment');
const CreditCard = require('../models/CreditCard');

// Get all installments
const getAllInstallments = async (request, reply) => {
  try {
    const { creditCard, status, limit = 50, page = 1 } = request.query;
    
    const filter = {};
    if (creditCard) filter.creditCard = creditCard;
    if (status) filter.paymentStatus = status;
    
    const skip = (page - 1) * limit;
    
    const installments = await CreditCardInstallment.find(filter)
      .populate('creditCard', 'name bankName cardNumber')
      .populate('category', 'name color')
      .sort({ nextPaymentDate: 1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await CreditCardInstallment.countDocuments(filter);
    
    reply.send({
      installments,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to fetch installments' 
    });
  }
};

// Get installment by ID
const getInstallmentById = async (request, reply) => {
  try {
    const { id } = request.params;
    
    const installment = await CreditCardInstallment.findById(id)
      .populate('creditCard', 'name bankName cardNumber interestRate')
      .populate('category', 'name color description');
    
    if (!installment) {
      return reply.status(404).send({ 
        error: 'Not Found', 
        message: 'Installment not found' 
      });
    }
    
    reply.send(installment);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to fetch installment' 
    });
  }
};

// Create new installment
const createInstallment = async (request, reply) => {
  try {
    const installmentData = request.body;
    
    // Validate credit card exists
    const creditCard = await CreditCard.findById(installmentData.creditCard);
    if (!creditCard) {
      return reply.status(404).send({ 
        error: 'Not Found', 
        message: 'Credit card not found' 
      });
    }
    
    // Check if there's enough available limit
    if (installmentData.originalAmount > creditCard.availableLimit) {
      return reply.status(400).send({ 
        error: 'Bad Request', 
        message: 'Purchase amount exceeds available limit' 
      });
    }
    
    // Set default interest rate from credit card if not provided
    if (!installmentData.interestRate) {
      installmentData.interestRate = creditCard.interestRate.monthly;
    }
    
    // Calculate payment dates
    const purchaseDate = new Date(installmentData.purchaseDate);
    const firstPaymentDate = new Date(purchaseDate);
    firstPaymentDate.setDate(creditCard.paymentDueDay);
    
    if (firstPaymentDate <= purchaseDate) {
      firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);
    }
    
    installmentData.firstPaymentDate = firstPaymentDate;
    installmentData.nextPaymentDate = firstPaymentDate;
    
    // Calculate last payment date
    const lastPaymentDate = new Date(firstPaymentDate);
    lastPaymentDate.setMonth(lastPaymentDate.getMonth() + installmentData.totalInstallments - 1);
    installmentData.lastPaymentDate = lastPaymentDate;
    
    const installment = new CreditCardInstallment(installmentData);
    await installment.save();
    
    // Update credit card available limit
    creditCard.availableLimit -= installmentData.originalAmount;
    creditCard.currentBalance += installmentData.originalAmount;
    await creditCard.save();
    
    await installment.populate('creditCard', 'name bankName cardNumber');
    await installment.populate('category', 'name color');
    
    reply.status(201).send(installment);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to create installment' 
    });
  }
};

// Process installment payment
const processPayment = async (request, reply) => {
  try {
    const { id } = request.params;
    const { paymentAmount, paymentMethod = 'manual' } = request.body;
    
    const installment = await CreditCardInstallment.findById(id);
    if (!installment) {
      return reply.status(404).send({ 
        error: 'Not Found', 
        message: 'Installment not found' 
      });
    }
    
    // Validate payment amount
    if (paymentAmount <= 0) {
      return reply.status(400).send({ 
        error: 'Bad Request', 
        message: 'Payment amount must be greater than 0' 
      });
    }
    
    // Process the payment
    await installment.processPayment(paymentAmount, paymentMethod);
    
    // Update credit card balance if payment completed
    if (installment.paymentStatus === 'completed') {
      const creditCard = await CreditCard.findById(installment.creditCard);
      if (creditCard) {
        creditCard.availableLimit += installment.remainingAmount;
        creditCard.currentBalance = Math.max(0, creditCard.currentBalance - installment.originalAmount);
        await creditCard.save();
      }
    }
    
    await installment.populate('creditCard', 'name bankName cardNumber');
    await installment.populate('category', 'name color');
    
    reply.send(installment);
  } catch (error) {
    if (error.message.includes('Cannot process payment') || error.message.includes('All installments')) {
      return reply.status(400).send({ 
        error: 'Bad Request', 
        message: error.message 
      });
    }
    
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to process payment' 
    });
  }
};

// Calculate early payment
const calculateEarlyPayment = async (request, reply) => {
  try {
    const { id } = request.params;
    
    const installment = await CreditCardInstallment.findById(id);
    if (!installment) {
      return reply.status(404).send({ 
        error: 'Not Found', 
        message: 'Installment not found' 
      });
    }
    
    const earlyPaymentInfo = installment.calculateEarlyPaymentAmount();
    
    if (!earlyPaymentInfo) {
      return reply.status(400).send({ 
        error: 'Bad Request', 
        message: 'Early payment not available for this installment' 
      });
    }
    
    reply.send(earlyPaymentInfo);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to calculate early payment' 
    });
  }
};

// Get payment schedule
const getPaymentSchedule = async (request, reply) => {
  try {
    const { id } = request.params;
    
    const installment = await CreditCardInstallment.findById(id)
      .populate('creditCard', 'name bankName cardNumber');
    
    if (!installment) {
      return reply.status(404).send({ 
        error: 'Not Found', 
        message: 'Installment not found' 
      });
    }
    
    const schedule = installment.getPaymentSchedule();
    
    reply.send({
      installment: {
        id: installment._id,
        purchaseDescription: installment.purchaseDescription,
        originalAmount: installment.originalAmount,
        totalInstallments: installment.totalInstallments,
        creditCard: installment.creditCard
      },
      schedule
    });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to fetch payment schedule' 
    });
  }
};

// Get upcoming payments
const getUpcomingPayments = async (request, reply) => {
  try {
    const { days = 7 } = request.query;
    
    const upcomingPayments = await CreditCardInstallment.getUpcomingPayments(parseInt(days));
    
    reply.send(upcomingPayments);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to fetch upcoming payments' 
    });
  }
};

// Get installment summary by card
const getInstallmentSummary = async (request, reply) => {
  try {
    const summary = await CreditCardInstallment.getSummaryByCard();
    
    reply.send(summary);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to fetch installment summary' 
    });
  }
};

// Update installment
const updateInstallment = async (request, reply) => {
  try {
    const { id } = request.params;
    const updateData = request.body;
    
    // Remove fields that shouldn't be updated directly
    delete updateData.completedInstallments;
    delete updateData.remainingInstallments;
    delete updateData.paymentHistory;
    
    const installment = await CreditCardInstallment.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    )
    .populate('creditCard', 'name bankName cardNumber')
    .populate('category', 'name color');
    
    if (!installment) {
      return reply.status(404).send({ 
        error: 'Not Found', 
        message: 'Installment not found' 
      });
    }
    
    reply.send(installment);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to update installment' 
    });
  }
};

// Delete installment
const deleteInstallment = async (request, reply) => {
  try {
    const { id } = request.params;
    
    const installment = await CreditCardInstallment.findById(id);
    if (!installment) {
      return reply.status(404).send({ 
        error: 'Not Found', 
        message: 'Installment not found' 
      });
    }
    
    // Can only delete if no payments have been made
    if (installment.completedInstallments > 0) {
      return reply.status(400).send({ 
        error: 'Bad Request', 
        message: 'Cannot delete installment with completed payments' 
      });
    }
    
    // Restore credit card available limit
    const creditCard = await CreditCard.findById(installment.creditCard);
    if (creditCard) {
      creditCard.availableLimit += installment.originalAmount;
      creditCard.currentBalance = Math.max(0, creditCard.currentBalance - installment.originalAmount);
      await creditCard.save();
    }
    
    await CreditCardInstallment.findByIdAndDelete(id);
    
    reply.send({ message: 'Installment deleted successfully' });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to delete installment' 
    });
  }
};

// Get monthly installment report
const getMonthlyReport = async (request, reply) => {
  try {
    const { year, month } = request.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
    
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0);
    
    // Get installments with payments in the target month
    const monthlyInstallments = await CreditCardInstallment.find({
      nextPaymentDate: { $gte: startDate, $lte: endDate },
      paymentStatus: 'active'
    })
    .populate('creditCard', 'name bankName cardNumber')
    .populate('category', 'name color')
    .sort({ nextPaymentDate: 1 });
    
    // Calculate totals
    const totalAmount = monthlyInstallments.reduce((sum, inst) => sum + inst.installmentAmount, 0);
    const totalInterest = monthlyInstallments.reduce((sum, inst) => {
      const monthlyInterest = inst.remainingAmount * (inst.interestRate / 12);
      return sum + monthlyInterest;
    }, 0);
    
    // Group by credit card
    const byCard = {};
    monthlyInstallments.forEach(inst => {
      const cardId = inst.creditCard._id.toString();
      if (!byCard[cardId]) {
        byCard[cardId] = {
          creditCard: inst.creditCard,
          installments: [],
          totalAmount: 0,
          totalInterest: 0
        };
      }
      byCard[cardId].installments.push(inst);
      byCard[cardId].totalAmount += inst.installmentAmount;
      byCard[cardId].totalInterest += inst.remainingAmount * (inst.interestRate / 12);
    });
    
    reply.send({
      period: { year: targetYear, month: targetMonth + 1 },
      summary: {
        totalInstallments: monthlyInstallments.length,
        totalAmount,
        totalInterest,
        totalPrincipal: totalAmount - totalInterest
      },
      installments: monthlyInstallments,
      byCard: Object.values(byCard)
    });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to fetch monthly report' 
    });
  }
};

module.exports = {
  getAllInstallments,
  getInstallmentById,
  createInstallment,
  processPayment,
  calculateEarlyPayment,
  getPaymentSchedule,
  getUpcomingPayments,
  getInstallmentSummary,
  updateInstallment,
  deleteInstallment,
  getMonthlyReport
};