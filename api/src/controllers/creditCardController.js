const CreditCard = require('../models/CreditCard');
const CreditCardInstallment = require('../models/CreditCardInstallment');
const {
  CC_MIN_PAYMENT_RATE_LOW,
  CC_MIN_PAYMENT_RATE_HIGH,
  CC_MIN_PAYMENT_LIMIT_THRESHOLD,
  CC_MIN_PAYMENT_FLOOR,
  CC_AKDI_RATE_TIER1, CC_AKDI_RATE_TIER2, CC_AKDI_RATE_TIER3,
  CC_AKDI_TIER1_THRESHOLD, CC_AKDI_TIER2_THRESHOLD,
  CC_GECIKME_RATE_TIER1, CC_GECIKME_RATE_TIER2, CC_GECIKME_RATE_TIER3,
} = require('../config/constants');

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

    // Only auto-calculate available limit if currentBalance is updated but availableLimit is not provided
    // This allows users to manually update availableLimit if needed
    if (updateData.currentBalance !== undefined && updateData.availableLimit === undefined) {
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

    const installments = await CreditCardInstallment.find({ creditCard: id, paymentStatus: 'active' });
    const monthlyInstallments = installments.reduce((sum, i) => sum + i.installmentAmount, 0);
    const totalRemainingInstallmentAmount = installments.reduce((sum, i) => sum + i.installmentAmount * i.remainingInstallments, 0);
    creditCard.minimumPaymentAmount = creditCard.calculateMinimumPayment(monthlyInstallments, totalRemainingInstallmentAmount);

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
        title: `${card.bankName} ${card.name}`,
        amount: card.minimumPaymentAmount,
        totalAmount: card.currentBalance,
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

// Calculate credit card interest scenarios
const calculateCreditCardInterest = async (request, reply) => {
  try {
    const { id } = request.params;
    const { payment_amount, akdi_faiz_rate, gecikme_faiz_rate } = request.body;

    const creditCard = await CreditCard.findById(id);
    if (!creditCard) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Credit card not found'
      });
    }

    const balance = creditCard.currentBalance || 0;

    // Taksit verilerini çek
    const installments = await CreditCardInstallment.find({ creditCard: id, paymentStatus: 'active' });
    const monthlyInstallmentTotal = installments.reduce((sum, i) => sum + i.installmentAmount, 0);
    const totalRemainingInstallmentAmount = installments.reduce((sum, i) => sum + i.installmentAmount * i.remainingInstallments, 0);

    // Peşin bakiye: taksit borçları çıkarılır
    const pesinBalance = Math.max(0, balance - totalRemainingInstallmentAmount);

    // Asgari ödeme oranı: kart limitine göre iki kademe (BDDK)
    const defaultMinRate = (creditCard.totalLimit > CC_MIN_PAYMENT_LIMIT_THRESHOLD)
      ? CC_MIN_PAYMENT_RATE_HIGH
      : CC_MIN_PAYMENT_RATE_LOW;
    const minRate = creditCard.minimumPaymentRate ?? defaultMinRate;
    const minPayment = creditCard.minimumPaymentAmount
      ? creditCard.minimumPaymentAmount
      : Math.max(pesinBalance * minRate, CC_MIN_PAYMENT_FLOOR) + monthlyInstallmentTotal;

    // Akdi faiz: peşin bakiyeye göre üç kademe (TCMB)
    const defaultAkdiRate = pesinBalance < CC_AKDI_TIER1_THRESHOLD ? CC_AKDI_RATE_TIER1
      : pesinBalance < CC_AKDI_TIER2_THRESHOLD                     ? CC_AKDI_RATE_TIER2
      :                                                               CC_AKDI_RATE_TIER3;
    const akdiRate = akdi_faiz_rate ?? creditCard.interestRate?.monthly ?? defaultAkdiRate;

    // Gecikme faizi: peşin bakiyeye göre üç kademe (TCMB)
    const defaultGecikmeRate = pesinBalance < CC_AKDI_TIER1_THRESHOLD ? CC_GECIKME_RATE_TIER1
      : pesinBalance < CC_AKDI_TIER2_THRESHOLD                        ? CC_GECIKME_RATE_TIER2
      :                                                                  CC_GECIKME_RATE_TIER3;
    const gecikmeRate = gecikme_faiz_rate ?? defaultGecikmeRate;
    const lateFee = creditCard.fees?.latePaymentFee || 0;
    const userPayment = payment_amount;

    // Faiz yalnızca peşin bakiyeye uygulanır; taksitler kendi faizini taşır
    // Senaryo 1: Tam ödeme
    const fullPayment = { payment: balance, interest: 0, nextMonthBalance: 0 };

    // Senaryo 2: Asgari ödeme
    // Asgari ödeme = max(pesinBalance * oran, taban) + zorunlu taksitler
    // Ödeme sonrası kalan peşin: pesinBalance - (minPayment - monthlyInstallmentTotal)
    const minPesinPaid = minPayment - monthlyInstallmentTotal;
    const minPesinRemaining = Math.max(0, pesinBalance - minPesinPaid);
    const minInterest = minPesinRemaining * akdiRate;
    const minPaymentScenario = {
      payment: minPayment,
      interest: minInterest,
      nextMonthBalance: minPesinRemaining + minInterest + (totalRemainingInstallmentAmount - monthlyInstallmentTotal)
    };

    // Senaryo 3: Hiç ödeme yapılmaz (gecikme faizi)
    const noPaymentInterest = pesinBalance * gecikmeRate;
    const noPayment = {
      payment: 0,
      interest: noPaymentInterest,
      nextMonthBalance: balance + noPaymentInterest + lateFee,
      lateFee
    };

    // Senaryo 4: Özel ödeme tutarı
    let customPayment;
    if (userPayment >= balance) {
      customPayment = { payment: userPayment, interest: 0, nextMonthBalance: 0, type: 'full_payment' };
    } else if (userPayment >= minPayment) {
      const pesinPaid = userPayment - monthlyInstallmentTotal;
      const remainingPesin = Math.max(0, pesinBalance - pesinPaid);
      const interest = remainingPesin * akdiRate;
      customPayment = {
        payment: userPayment,
        interest,
        nextMonthBalance: remainingPesin + interest + (totalRemainingInstallmentAmount - monthlyInstallmentTotal),
        type: 'akdi_faiz'
      };
    } else if (userPayment > 0) {
      const interest = pesinBalance * gecikmeRate;
      customPayment = {
        payment: userPayment,
        interest,
        nextMonthBalance: balance - userPayment + interest + lateFee,
        lateFee,
        type: 'gecikme_faizi'
      };
    } else {
      customPayment = { ...noPayment, type: 'gecikme_faizi_no_payment' };
    }

    reply.send({
      card: {
        id: creditCard._id,
        bankName: creditCard.bankName,
        name: creditCard.name,
        balance,
        pesinBalance,
        monthlyInstallmentTotal,
        minPayment,
        akdiRate,
        gecikmeRate
      },
      scenarios: {
        fullPayment,
        minPayment: minPaymentScenario,
        noPayment,
        customPayment
      }
    });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Failed to calculate credit card interest'
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
  getPaymentCalendar,
  calculateCreditCardInterest
};