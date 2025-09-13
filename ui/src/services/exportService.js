const API_BASE_URL = 'http://localhost/api';

// Get export summary
export const getExportSummary = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/export/summary`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching export summary:', error);
    throw error;
  }
};

// Export all data
export const exportAllData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/export/all`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : `budget-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const blob = await response.blob();
    downloadBlob(blob, filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting all data:', error);
    throw error;
  }
};

// Export specific collection
export const exportCollection = async (collection, format = 'json') => {
  try {
    const response = await fetch(`${API_BASE_URL}/export/collection/${collection}?format=${format}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : `${collection}-${new Date().toISOString().split('T')[0]}.${format}`;
    
    const blob = await response.blob();
    downloadBlob(blob, filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error(`Error exporting ${collection}:`, error);
    throw error;
  }
};

// Export data by date range
export const exportByDateRange = async (startDate, endDate) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/export/date-range?startDate=${startDate}&endDate=${endDate}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : `budget-export-${startDate}-to-${endDate}.json`;
    
    const blob = await response.blob();
    downloadBlob(blob, filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting by date range:', error);
    throw error;
  }
};

// Helper function to download blob as file
const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Available collections for export
export const EXPORT_COLLECTIONS = [
  { id: 'categories', name: 'Categories', description: 'Income and expense categories' },
  { id: 'expenses', name: 'Expenses', description: 'All expense records' },
  { id: 'incomes', name: 'Incomes', description: 'All income records' },
  { id: 'assets', name: 'Assets', description: 'Assets and investments' },
  { id: 'recurring-payments', name: 'Recurring Payments', description: 'Scheduled recurring payments' },
  { id: 'credit-cards', name: 'Credit Cards', description: 'Credit card information' },
  { id: 'installments', name: 'Installments', description: 'Credit card installment payments' }
];

// Export formats
export const EXPORT_FORMATS = [
  { id: 'json', name: 'JSON', description: 'JavaScript Object Notation' },
  { id: 'csv', name: 'CSV', description: 'Comma Separated Values' }
];