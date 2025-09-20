// Script to directly import the budget file
// Usage: node src/scripts/importBudget.js

import { readFileSync } from 'fs';
import { importBudgetFile, previewBudgetFile } from '../utils/directImport.js';

const BUDGET_FILE_PATH = '/home/mehmet/Documents/budget/api/data/budget-export-2025-09-13.json';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'import';

  try {
    switch (command) {
      case 'preview':
        console.log('Previewing budget file...');
        const preview = await previewBudgetFile(BUDGET_FILE_PATH);
        console.log('Preview:', JSON.stringify(preview, null, 2));
        break;

      case 'import':
        console.log('Importing budget file...');
        const result = await importBudgetFile(BUDGET_FILE_PATH);
        console.log('Import result:', JSON.stringify(result, null, 2));
        break;

      case 'help':
        console.log(`
Budget Import Script

Usage: node src/scripts/importBudget.js [command]

Commands:
  preview    Show what would be imported
  import     Import the budget data (default)
  help       Show this help message

File: ${BUDGET_FILE_PATH}
        `);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.log('Use "help" for available commands');
        process.exit(1);
    }
  } catch (error) {
    console.error('Script failed:', error.message);
    process.exit(1);
  }
}

// Direct file reading version (for when fetch is not available)
async function importFromFileSystem() {
  try {
    console.log('Reading budget file from filesystem...');
    const fileContent = readFileSync(BUDGET_FILE_PATH, 'utf8');
    const jsonData = JSON.parse(fileContent);

    console.log('File loaded successfully. Summary:');
    console.log('- Export Date:', jsonData.exportDate);
    console.log('- Version:', jsonData.version);
    console.log('- Categories:', jsonData.data.categories?.length || 0);
    console.log('- Expenses:', jsonData.data.expenses?.length || 0);
    console.log('- Incomes:', jsonData.data.incomes?.length || 0);
    console.log('- Assets:', jsonData.data.assets?.length || 0);
    console.log('- Recurring Payments:', jsonData.data.recurringPayments?.length || 0);
    console.log('- Credit Cards:', jsonData.data.creditCards?.length || 0);
    console.log('- Installments:', jsonData.data.creditCardInstallments?.length || 0);

    // For browser environments, you would need to manually call the import service
    console.log('\nTo import this data:');
    console.log('1. Go to http://localhost:5173/import');
    console.log('2. Select the budget file');
    console.log('3. Configure import options');
    console.log('4. Click Import Data');

    return jsonData;
  } catch (error) {
    console.error('Failed to read/parse budget file:', error.message);
    throw error;
  }
}

// Run the appropriate function
if (typeof window === 'undefined') {
  // Node.js environment
  main().catch(console.error);
} else {
  // Browser environment
  importFromFileSystem().catch(console.error);
}