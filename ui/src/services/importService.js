const API_BASE_URL = 'http://localhost:3000/api';

// Import all data from JSON file
export const importAllData = async (jsonData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/import/all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error importing all data:', error);
    throw error;
  }
};

// Import specific collection
export const importCollection = async (collection, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/import/collection/${collection}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error importing ${collection}:`, error);
    throw error;
  }
};

// Import data with options (merge/replace)
export const importDataWithOptions = async (jsonData, options = {}) => {
  const defaultOptions = {
    mode: 'merge', // 'merge' or 'replace'
    skipDuplicates: true,
    validateData: true,
    collections: ['all'] // or specific collections to import
  };

  const importOptions = { ...defaultOptions, ...options };

  try {
    const response = await fetch(`${API_BASE_URL}/import/with-options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: jsonData,
        options: importOptions,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error importing data with options:', error);
    throw error;
  }
};

// Validate import data before importing
export const validateImportData = async (jsonData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/import/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error validating import data:', error);
    throw error;
  }
};

// Get import summary/preview
export const getImportPreview = async (jsonData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/import/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting import preview:', error);
    throw error;
  }
};

// Import from file upload
export const importFromFile = async (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);

        // Validate the JSON structure
        if (!jsonData.data || !jsonData.version) {
          throw new Error('Invalid budget export file format');
        }

        const result = await importDataWithOptions(jsonData, options);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsText(file);
  });
};

// Helper function to read JSON file from file path (for Node.js environments)
export const importFromFilePath = async (filePath, options = {}) => {
  try {
    // This would typically be used in a Node.js environment
    // For browser, we'll use fetch to read local files if they're accessible
    const response = await fetch(`file://${filePath}`);
    const jsonData = await response.json();

    // Validate the JSON structure
    if (!jsonData.data || !jsonData.version) {
      throw new Error('Invalid budget export file format');
    }

    return await importDataWithOptions(jsonData, options);
  } catch (error) {
    console.error('Error importing from file path:', error);
    throw error;
  }
};

// Available import modes
export const IMPORT_MODES = [
  { id: 'merge', name: 'Merge', description: 'Add new data and update existing records' },
  { id: 'replace', name: 'Replace', description: 'Replace all existing data (destructive)' },
  { id: 'append', name: 'Append', description: 'Only add new records, skip existing ones' }
];

// Available collections for import
export const IMPORT_COLLECTIONS = [
  { id: 'categories', name: 'Categories', description: 'Income and expense categories' },
  { id: 'expenses', name: 'Expenses', description: 'All expense records' },
  { id: 'incomes', name: 'Incomes', description: 'All income records' },
  { id: 'assets', name: 'Assets', description: 'Assets and investments' },
  { id: 'recurringPayments', name: 'Recurring Payments', description: 'Scheduled recurring payments' },
  { id: 'creditCards', name: 'Credit Cards', description: 'Credit card information' },
  { id: 'creditCardInstallments', name: 'Installments', description: 'Credit card installment payments' }
];