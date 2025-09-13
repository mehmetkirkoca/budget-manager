const API_URL = 'http://localhost/api';

// Get all recurring payments
export const getAllRecurringPayments = async () => {
  const response = await fetch(`${API_URL}/recurring-payments`);
  if (!response.ok) throw new Error('Failed to fetch recurring payments');
  return response.json();
};

// Create a new recurring payment
export const createRecurringPayment = async (paymentData) => {
  const response = await fetch(`${API_URL}/recurring-payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentData),
  });
  if (!response.ok) throw new Error('Failed to create recurring payment');
  return response.json();
};

// Update an existing recurring payment
export const updateRecurringPayment = async (id, paymentData) => {
  const response = await fetch(`${API_URL}/recurring-payments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentData),
  });
  if (!response.ok) throw new Error('Failed to update recurring payment');
  return response.json();
};

// Delete a recurring payment
export const deleteRecurringPayment = async (id) => {
  const response = await fetch(`${API_URL}/recurring-payments/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete recurring payment');
  return response.json();
};

// Get upcoming payments
export const getUpcomingPayments = async (startDate, endDate, days = 30) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (days) params.append('days', days.toString());
  
  const response = await fetch(`${API_URL}/recurring-payments/upcoming?${params}`);
  if (!response.ok) throw new Error('Failed to fetch upcoming payments');
  return response.json();
};

// Get calendar events for a specific month/year
export const getCalendarEvents = async (year, month) => {
  const params = new URLSearchParams();
  if (year) params.append('year', year.toString());
  if (month) params.append('month', month.toString());
  
  const response = await fetch(`${API_URL}/recurring-payments/calendar?${params}`);
  if (!response.ok) throw new Error('Failed to fetch calendar events');
  return response.json();
};

// Mark a payment as paid
export const markPaymentAsPaid = async (id, createExpense = false) => {
  const response = await fetch(`${API_URL}/recurring-payments/${id}/mark-paid`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ createExpense }),
  });
  if (!response.ok) throw new Error('Failed to mark payment as paid');
  return response.json();
};