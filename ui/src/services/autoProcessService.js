const API_URL = 'http://localhost/api';

// Get auto-processing status
export const getAutoProcessStatus = async () => {
  const response = await fetch(`${API_URL}/auto-process/status`);
  if (!response.ok) throw new Error('Failed to fetch auto-process status');
  return response.json();
};

// Manual trigger for processing
export const triggerAutoProcess = async () => {
  const response = await fetch(`${API_URL}/auto-process/trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to trigger auto-process');
  return response.json();
};

// Reset processing status (for testing)
export const resetProcessingStatus = async () => {
  const response = await fetch(`${API_URL}/auto-process/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to reset processing status');
  return response.json();
};

// Get today's processed payments summary
export const getTodaysSummary = async () => {
  const response = await fetch(`${API_URL}/auto-process/today-summary`);
  if (!response.ok) throw new Error('Failed to fetch today\'s summary');
  return response.json();
};