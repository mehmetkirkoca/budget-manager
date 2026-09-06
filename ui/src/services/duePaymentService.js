const API_URL = import.meta.env.VITE_API_URL || '/api';

export const getPendingDuePayments = async () => {
  const response = await fetch(`${API_URL}/recurring-payments/due-pending`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

export const confirmDuePayment = async ({ id, type, assetId, amount }) => {
  const response = await fetch(`${API_URL}/recurring-payments/due-confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id, type, assetId, amount })
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};
