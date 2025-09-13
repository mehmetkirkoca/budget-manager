const API_BASE_URL = 'http://localhost:3000/api';

// GET summary data
export const getSummary = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/summary`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching summary:', error);
    throw error;
  }
};