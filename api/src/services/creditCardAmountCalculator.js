const CreditCard = require('../models/CreditCard');
const CreditCardInstallment = require('../models/CreditCardInstallment');

class CreditCardAmountCalculator {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  // Get cached calculation or perform new calculation
  async getCalculation(key, calculateFunction) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.calculation;
    }

    try {
      const calculation = await calculateFunction();
      this.cache.set(key, { calculation, timestamp: Date.now() });
      return calculation;
    } catch (error) {
      console.error(`Error calculating amount for ${key}:`, error);
      // Return cached value if available, otherwise return default
      return cached ? cached.calculation : this.getDefaultCalculation();
    }
  }

  // Default calculation when errors occur
  getDefaultCalculation() {
    return {
      currentBalance: 0,
      monthlyInstallments: 0,
      totalMonthlyPayment: 0,
      estimatedAmount: 0,
      calculatedAt: new Date(),
      isEstimated: true,
      error: 'Calculation failed'
    };
  }

  // Calculate payment amount for a specific credit card
  async calculateCreditCardPaymentAmount(cardId) {
    const key = `card_payment_${cardId}`;

    return this.getCalculation(key, async () => {
      // Get credit card data
      const card = await CreditCard.findById(cardId);
      if (!card) {
        throw new Error('Credit card not found');
      }

      // Get active installments for this card
      const activeInstallments = await CreditCardInstallment.find({
        creditCard: cardId,
        paymentStatus: 'active'
      });

      // Calculate monthly installment total
      const monthlyInstallments = activeInstallments.reduce((total, installment) => {
        return total + installment.installmentAmount;
      }, 0);

      // Calculate current balance (what needs to be paid)
      const currentBalance = card.currentBalance || 0;

      // For credit cards, the payment amount is typically:
      // Option 1: Minimum payment (usually currentBalance * minimumPaymentRate)
      // Option 2: Full balance + installments
      // We'll use minimum payment + installments as the estimated amount

      const minimumPaymentRate = card.minimumPaymentRate || 0.03; // Default 3%
      const minimumPayment = currentBalance * minimumPaymentRate;
      const totalMonthlyPayment = minimumPayment + monthlyInstallments;

      return {
        cardId: cardId,
        cardName: card.name,
        bankName: card.bankName,
        currentBalance: Math.round(currentBalance * 100) / 100,
        monthlyInstallments: Math.round(monthlyInstallments * 100) / 100,
        minimumPayment: Math.round(minimumPayment * 100) / 100,
        totalMonthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
        estimatedAmount: Math.round(totalMonthlyPayment * 100) / 100,
        calculatedAt: new Date(),
        isEstimated: true,
        installmentCount: activeInstallments.length,
        utilization: card.totalLimit > 0 ? ((card.totalLimit - card.availableLimit) / card.totalLimit * 100) : 0
      };
    });
  }

  // Calculate payment amounts for multiple credit cards
  async calculateMultipleCardPayments(cardIds) {
    const calculations = await Promise.all(
      cardIds.map(cardId => this.calculateCreditCardPaymentAmount(cardId))
    );

    const summary = {
      totalCards: cardIds.length,
      totalEstimatedAmount: 0,
      totalCurrentBalance: 0,
      totalMonthlyInstallments: 0,
      calculations: calculations.filter(calc => !calc.error)
    };

    summary.calculations.forEach(calc => {
      summary.totalEstimatedAmount += calc.estimatedAmount;
      summary.totalCurrentBalance += calc.currentBalance;
      summary.totalMonthlyInstallments += calc.monthlyInstallments;
    });

    // Round totals
    summary.totalEstimatedAmount = Math.round(summary.totalEstimatedAmount * 100) / 100;
    summary.totalCurrentBalance = Math.round(summary.totalCurrentBalance * 100) / 100;
    summary.totalMonthlyInstallments = Math.round(summary.totalMonthlyInstallments * 100) / 100;

    return summary;
  }

  // Get credit card payment summary for dashboard
  async getCreditCardPaymentSummary() {
    const key = 'all_cards_summary';

    return this.getCalculation(key, async () => {
      // Get all active credit cards
      const activeCards = await CreditCard.find({ isActive: true });
      const cardIds = activeCards.map(card => card._id.toString());

      if (cardIds.length === 0) {
        return {
          hasCards: false,
          totalEstimatedAmount: 0,
          cardCount: 0,
          calculations: []
        };
      }

      const summary = await this.calculateMultipleCardPayments(cardIds);

      return {
        hasCards: true,
        ...summary,
        cardCount: activeCards.length,
        calculatedAt: new Date()
      };
    });
  }

  // Find credit card by name pattern (for recurring payments)
  async findCreditCardByName(cardNamePattern) {
    try {
      // Try exact match first
      let card = await CreditCard.findOne({
        name: new RegExp(cardNamePattern, 'i'),
        isActive: true
      });

      // If not found, try partial match in bankName or name
      if (!card) {
        card = await CreditCard.findOne({
          $or: [
            { name: new RegExp(cardNamePattern, 'i') },
            { bankName: new RegExp(cardNamePattern, 'i') }
          ],
          isActive: true
        });
      }

      return card;
    } catch (error) {
      console.error('Error finding credit card by name:', error);
      return null;
    }
  }

  // Calculate amount for recurring payment linked to credit card
  async calculateRecurringPaymentAmount(recurringPaymentName) {
    try {
      // Extract credit card identifier from recurring payment name
      // Examples: "Enpara Kredi Kartı Ödemesi" -> "Enpara"
      //          "Garanti Kredi Kartı Ödemesi" -> "Garanti"
      const cardIdentifiers = [
        { pattern: /enpara/i, cardName: 'Enpara' },
        { pattern: /garanti/i, cardName: 'Garanti' },
        { pattern: /akbank/i, cardName: 'Akbank' },
        { pattern: /yapı.*kredi/i, cardName: 'Yapı Kredi' },
        { pattern: /iş.*bank/i, cardName: 'İş Bankası' },
        { pattern: /ziraat/i, cardName: 'Ziraat' },
        { pattern: /vakıf/i, cardName: 'Vakıfbank' }
      ];

      let matchedCard = null;
      for (const identifier of cardIdentifiers) {
        if (identifier.pattern.test(recurringPaymentName)) {
          matchedCard = await this.findCreditCardByName(identifier.cardName);
          if (matchedCard) break;
        }
      }

      if (!matchedCard) {
        return {
          found: false,
          estimatedAmount: 0,
          error: `No matching credit card found for: ${recurringPaymentName}`
        };
      }

      const calculation = await this.calculateCreditCardPaymentAmount(matchedCard._id);

      return {
        found: true,
        creditCard: {
          id: matchedCard._id,
          name: matchedCard.name,
          bankName: matchedCard.bankName
        },
        ...calculation,
        matchedBy: recurringPaymentName
      };
    } catch (error) {
      console.error('Error calculating recurring payment amount:', error);
      return {
        found: false,
        estimatedAmount: 0,
        error: error.message
      };
    }
  }

  // Clear cache for specific card or all
  clearCache(cardId = null) {
    if (cardId) {
      this.cache.delete(`card_payment_${cardId}`);
    } else {
      this.cache.clear();
    }
  }

  // Get cache statistics
  getCacheStats() {
    const now = Date.now();
    let validCount = 0;
    let expiredCount = 0;

    this.cache.forEach(entry => {
      if (now - entry.timestamp < this.cacheTimeout) {
        validCount++;
      } else {
        expiredCount++;
      }
    });

    return {
      totalEntries: this.cache.size,
      validEntries: validCount,
      expiredEntries: expiredCount,
      cacheTimeout: this.cacheTimeout
    };
  }
}

// Export singleton instance
module.exports = new CreditCardAmountCalculator();