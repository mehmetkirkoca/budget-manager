const API_BASE_URL = 'http://localhost:3000/api';

// GET all installments
export const getAllInstallments = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/credit-card-installments?${queryParams}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching installments:', error);
    throw error;
  }
};

// GET installment by ID
export const getInstallmentById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/credit-card-installments/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching installment:', error);
    throw error;
  }
};

// POST new installment
export const createInstallment = async (installmentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/credit-card-installments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(installmentData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating installment:', error);
    throw error;
  }
};

// PUT update installment
export const updateInstallment = async (id, installmentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/credit-card-installments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(installmentData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating installment:', error);
    throw error;
  }
};

// DELETE installment
export const deleteInstallment = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/credit-card-installments/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting installment:', error);
    throw error;
  }
};

// POST process payment
export const processPayment = async (id, paymentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/credit-card-installments/${id}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

// GET early payment calculation
export const calculateEarlyPayment = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/credit-card-installments/${id}/early-payment`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error calculating early payment:', error);
    throw error;
  }
};

// GET payment schedule
export const getPaymentSchedule = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/credit-card-installments/${id}/schedule`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching payment schedule:', error);
    throw error;
  }
};

// GET upcoming payments
export const getUpcomingPayments = async (days = 7) => {
  try {
    const response = await fetch(`${API_BASE_URL}/credit-card-installments/upcoming?days=${days}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching upcoming payments:', error);
    throw error;
  }
};

// GET installment summary
export const getInstallmentSummary = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/credit-card-installments/summary`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching installment summary:', error);
    throw error;
  }
};

// GET monthly report
export const getMonthlyReport = async (year, month) => {
  try {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);

    const response = await fetch(`${API_BASE_URL}/credit-card-installments/monthly-report?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching monthly report:', error);
    throw error;
  }
};