import { importDataWithOptions } from '../services/importService';

// Direct import function for the specific budget export file
export const importBudgetFile = async (filePath = '/home/mehmet/Documents/budget/api/data/budget-export-2025-09-13.json') => {
  try {
    // Read the JSON file content
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to read file: ${response.statusText}`);
    }

    const jsonData = await response.json();

    // Validate the structure
    if (!jsonData.data || !jsonData.version) {
      throw new Error('Invalid budget export file format');
    }

    // Import with default options (merge mode)
    const importOptions = {
      mode: 'merge',
      skipDuplicates: true,
      validateData: true,
      collections: ['all']
    };

    const result = await importDataWithOptions(jsonData, importOptions);

    console.log('Import completed successfully:', result);
    return result;
  } catch (error) {
    console.error('Direct import failed:', error);
    throw error;
  }
};

// Function to import specific collections from the budget file
export const importSpecificCollections = async (collections, filePath = '/home/mehmet/Documents/budget/api/data/budget-export-2025-09-13.json') => {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to read file: ${response.statusText}`);
    }

    const jsonData = await response.json();

    if (!jsonData.data || !jsonData.version) {
      throw new Error('Invalid budget export file format');
    }

    const importOptions = {
      mode: 'merge',
      skipDuplicates: true,
      validateData: true,
      collections: collections
    };

    const result = await importDataWithOptions(jsonData, importOptions);

    console.log('Specific collections import completed:', result);
    return result;
  } catch (error) {
    console.error('Specific collections import failed:', error);
    throw error;
  }
};

// Helper function to preview what would be imported
export const previewBudgetFile = async (filePath = '/home/mehmet/Documents/budget/api/data/budget-export-2025-09-13.json') => {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to read file: ${response.statusText}`);
    }

    const jsonData = await response.json();

    if (!jsonData.data || !jsonData.version) {
      throw new Error('Invalid budget export file format');
    }

    // Return summary of what would be imported
    const summary = {
      exportDate: jsonData.exportDate,
      version: jsonData.version,
      data: {
        categories: jsonData.data.categories?.length || 0,
        expenses: jsonData.data.expenses?.length || 0,
        incomes: jsonData.data.incomes?.length || 0,
        assets: jsonData.data.assets?.length || 0,
        recurringPayments: jsonData.data.recurringPayments?.length || 0,
        creditCards: jsonData.data.creditCards?.length || 0,
        creditCardInstallments: jsonData.data.creditCardInstallments?.length || 0
      },
      summary: jsonData.summary || {}
    };

    console.log('Budget file preview:', summary);
    return summary;
  } catch (error) {
    console.error('Preview failed:', error);
    throw error;
  }
};