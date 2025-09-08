const API_BASE_URL = 'http://localhost:3000/api';

// GET all incomes
export const getAllIncomes = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/incomes`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching incomes:', error);
    throw error;
  }
};

// POST new income
export const createIncome = async (incomeData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/incomes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(incomeData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating income:', error);
    throw error;
  }
};

// PUT update income
export const updateIncome = async (id, incomeData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/incomes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(incomeData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating income:', error);
    throw error;
  }
};

// DELETE income
export const deleteIncome = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/incomes/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting income:', error);
    throw error;
  }
};

// GET monthly income total
export const getMonthlyIncomeTotal = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/incomes/monthly-total`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching monthly income total:', error);
    throw error;
  }
};