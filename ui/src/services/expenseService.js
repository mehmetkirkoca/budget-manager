const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// GET all expenses (paginated)
export const getAllExpenses = async (page = 1, limit = 25, status = 'pending') => {
  try {
    const params = new URLSearchParams({ page, limit });
    if (status !== 'all') params.append('status', status);
    const response = await fetch(`${API_BASE_URL}/expenses?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

// POST new expense
export const createExpense = async (expenseData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expenseData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
};

// PUT update expense
export const updateExpense = async (id, expenseData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expenseData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

// GET expenses grouped by category (for charts)
export const getExpensesByCategory = async (month) => {
  try {
    const params = month ? `?month=${month}` : '';
    const response = await fetch(`${API_BASE_URL}/expenses/by-category${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching expenses by category:', error);
    throw error;
  }
};

// GET expenses by date range (for calendar)
export const getExpensesByDateRange = async (startDate, endDate) => {
  try {
    const params = new URLSearchParams({ limit: 100 });
    if (startDate) params.append('startDate', startDate);
    if (endDate)   params.append('endDate', endDate);
    const response = await fetch(`${API_BASE_URL}/expenses?${params}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.expenses;
  } catch (error) {
    console.error('Error fetching expenses by date range:', error);
    throw error;
  }
};

// DELETE expense
export const deleteExpense = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};