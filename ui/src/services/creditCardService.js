const API_BASE_URL = 'http://localhost:3000/api';

// Credit Card API calls
export const creditCardService = {
  // Get all credit cards
  async getAllCreditCards() {
    const response = await fetch(`${API_BASE_URL}/credit-cards`);
    if (!response.ok) throw new Error('Failed to fetch credit cards');
    return response.json();
  },

  // Get credit card by ID
  async getCreditCardById(id) {
    const response = await fetch(`${API_BASE_URL}/credit-cards/${id}`);
    if (!response.ok) throw new Error('Failed to fetch credit card');
    return response.json();
  },

  // Get credit card details with installments
  async getCreditCardDetails(id) {
    const response = await fetch(`${API_BASE_URL}/credit-cards/${id}/details`);
    if (!response.ok) throw new Error('Failed to fetch credit card details');
    return response.json();
  },

  // Create new credit card
  async createCreditCard(creditCardData) {
    const response = await fetch(`${API_BASE_URL}/credit-cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(creditCardData),
    });
    if (!response.ok) throw new Error('Failed to create credit card');
    return response.json();
  },

  // Update credit card
  async updateCreditCard(id, updateData) {
    const response = await fetch(`${API_BASE_URL}/credit-cards/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) throw new Error('Failed to update credit card');
    return response.json();
  },

  // Update credit card balance
  async updateCreditCardBalance(id, balanceData) {
    const response = await fetch(`${API_BASE_URL}/credit-cards/${id}/balance`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(balanceData),
    });
    if (!response.ok) throw new Error('Failed to update credit card balance');
    return response.json();
  },

  // Delete credit card
  async deleteCreditCard(id) {
    const response = await fetch(`${API_BASE_URL}/credit-cards/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete credit card');
    return response.json();
  },

  // Get credit card summary
  async getCreditCardSummary() {
    const response = await fetch(`${API_BASE_URL}/credit-cards/summary`);
    if (!response.ok) throw new Error('Failed to fetch credit card summary');
    return response.json();
  },

  // Get payment calendar
  async getPaymentCalendar(month, year) {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    
    const response = await fetch(`${API_BASE_URL}/credit-cards/payment-calendar?${params}`);
    if (!response.ok) throw new Error('Failed to fetch payment calendar');
    return response.json();
  }
};

// Credit Card Installment API calls
export const creditCardInstallmentService = {
  // Get all installments
  async getAllInstallments(options = {}) {
    const params = new URLSearchParams();
    if (options.creditCard) params.append('creditCard', options.creditCard);
    if (options.status) params.append('status', options.status);
    if (options.limit) params.append('limit', options.limit);
    if (options.page) params.append('page', options.page);
    
    const response = await fetch(`${API_BASE_URL}/credit-card-installments?${params}`);
    if (!response.ok) throw new Error('Failed to fetch installments');
    return response.json();
  },

  // Get installment by ID
  async getInstallmentById(id) {
    const response = await fetch(`${API_BASE_URL}/credit-card-installments/${id}`);
    if (!response.ok) throw new Error('Failed to fetch installment');
    return response.json();
  },

  // Create new installment
  async createInstallment(installmentData) {
    const response = await fetch(`${API_BASE_URL}/credit-card-installments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(installmentData),
    });
    if (!response.ok) throw new Error('Failed to create installment');
    return response.json();
  },

  // Process installment payment
  async processPayment(id, paymentData) {
    const response = await fetch(`${API_BASE_URL}/credit-card-installments/${id}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    if (!response.ok) throw new Error('Failed to process payment');
    return response.json();
  },

  // Get payment schedule
  async getPaymentSchedule(id) {
    const response = await fetch(`${API_BASE_URL}/credit-card-installments/${id}/schedule`);
    if (!response.ok) throw new Error('Failed to fetch payment schedule');
    return response.json();
  },

  // Calculate early payment
  async calculateEarlyPayment(id) {
    const response = await fetch(`${API_BASE_URL}/credit-card-installments/${id}/early-payment`);
    if (!response.ok) throw new Error('Failed to calculate early payment');
    return response.json();
  },

  // Get upcoming payments
  async getUpcomingPayments(days = 7) {
    const response = await fetch(`${API_BASE_URL}/credit-card-installments/upcoming?days=${days}`);
    if (!response.ok) throw new Error('Failed to fetch upcoming payments');
    return response.json();
  },

  // Get installment summary
  async getInstallmentSummary() {
    const response = await fetch(`${API_BASE_URL}/credit-card-installments/summary`);
    if (!response.ok) throw new Error('Failed to fetch installment summary');
    return response.json();
  },

  // Get monthly report
  async getMonthlyReport(month, year) {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    
    const response = await fetch(`${API_BASE_URL}/credit-card-installments/monthly-report?${params}`);
    if (!response.ok) throw new Error('Failed to fetch monthly report');
    return response.json();
  },

  // Update installment
  async updateInstallment(id, updateData) {
    const response = await fetch(`${API_BASE_URL}/credit-card-installments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) throw new Error('Failed to update installment');
    return response.json();
  },

  // Delete installment
  async deleteInstallment(id) {
    const response = await fetch(`${API_BASE_URL}/credit-card-installments/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete installment');
    return response.json();
  }
};

// Utility functions
export const creditCardUtils = {
  // Format card number for display (show only last 4 digits)
  formatCardNumber(cardNumber) {
    return `****-****-****-${cardNumber}`;
  },

  // Get card type icon
  getCardTypeIcon(cardType) {
    const icons = {
      visa: '💳',
      mastercard: '💳',
      americanexpress: '💳',
      troy: '🇹🇷'
    };
    return icons[cardType] || '💳';
  },

  // Calculate utilization color
  getUtilizationColor(utilizationRate) {
    if (utilizationRate >= 80) return 'text-red-500';
    if (utilizationRate >= 60) return 'text-yellow-500';
    return 'text-green-500';
  },

  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  },

  // Format percentage
  formatPercentage(rate) {
    return `${(rate * 100).toFixed(2)}%`;
  },

  // Calculate days until payment
  getDaysUntilPayment(paymentDate) {
    const today = new Date();
    const payment = new Date(paymentDate);
    const diffTime = payment.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  // Get payment urgency color
  getPaymentUrgencyColor(daysUntil) {
    if (daysUntil <= 3) return 'text-red-500';
    if (daysUntil <= 7) return 'text-yellow-500';
    return 'text-gray-500';
  }
};