const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Category = require('../models/Category');

// MongoDB connection string - update this to match your database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/budget-manager';

async function migrateExpenseCategories() {
  try {
    console.log('🔄 Starting expense category migration...');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all categories for mapping
    const categories = await Category.find({});
    console.log(`📋 Found ${categories.length} categories`);

    // Create category name to ID mapping
    const categoryNameToId = {};
    categories.forEach(category => {
      categoryNameToId[category.name] = category._id;
    });

    console.log('📝 Category mapping:', categoryNameToId);

    // Get all expenses
    const expenses = await mongoose.connection.db.collection('expenses').find({}).toArray();
    console.log(`💰 Found ${expenses.length} expenses to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const expense of expenses) {
      const originalCategory = expense.category;
      let newCategoryId = null;

      // Skip if already an ObjectId
      if (mongoose.Types.ObjectId.isValid(originalCategory) && originalCategory.length === 24) {
        // Check if this ID exists in categories
        const existingCategory = categories.find(cat => cat._id.toString() === originalCategory);
        if (existingCategory) {
          console.log(`⏭️  Expense "${expense.description}" already has valid ObjectId: ${originalCategory}`);
          skippedCount++;
          continue;
        }
      }

      // Map common string names to category IDs
      if (typeof originalCategory === 'string') {
        // Direct name match
        if (categoryNameToId[originalCategory]) {
          newCategoryId = categoryNameToId[originalCategory];
        }
        // Pattern matching for common cases
        else if (originalCategory.toLowerCase().includes('kredi kartı') ||
                 originalCategory.toLowerCase().includes('credit card')) {
          newCategoryId = categoryNameToId['Kredi Kartı'];
        }
        else if (originalCategory.toLowerCase().includes('nakit') ||
                 originalCategory.toLowerCase().includes('cash')) {
          newCategoryId = categoryNameToId['Nakit'];
        }
        else if (originalCategory.toLowerCase().includes('konut') ||
                 originalCategory.toLowerCase().includes('mortgage')) {
          newCategoryId = categoryNameToId['Konut Kredisi'];
        }
      }

      // Handle specific descriptions that indicate category
      if (!newCategoryId && expense.description) {
        const desc = expense.description.toLowerCase();
        if (desc.includes('kredi kartı') || desc.includes('credit card')) {
          newCategoryId = categoryNameToId['Kredi Kartı'];
        }
        else if (desc.includes('aidat') || desc.includes('apartment fee')) {
          newCategoryId = categoryNameToId['Nakit'];
        }
        else if (desc.includes('konut kredisi') || desc.includes('mortgage')) {
          newCategoryId = categoryNameToId['Konut Kredisi'];
        }
      }

      // Default to 'Nakit' if no specific category found
      if (!newCategoryId) {
        newCategoryId = categoryNameToId['Nakit'];
        console.log(`⚠️  No specific category found for "${expense.description}", defaulting to Nakit`);
      }

      if (newCategoryId) {
        // Update the expense
        await mongoose.connection.db.collection('expenses').updateOne(
          { _id: expense._id },
          { $set: { category: newCategoryId } }
        );

        console.log(`✅ Updated expense "${expense.description}": "${originalCategory}" → ${newCategoryId}`);
        migratedCount++;
      } else {
        console.log(`❌ Could not migrate expense "${expense.description}" with category: ${originalCategory}`);
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Migrated: ${migratedCount} expenses`);
    console.log(`⏭️  Skipped: ${skippedCount} expenses`);
    console.log(`❌ Failed: ${expenses.length - migratedCount - skippedCount} expenses`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
    process.exit(0);
  }
}

// Run the migration
if (require.main === module) {
  migrateExpenseCategories();
}

module.exports = { migrateExpenseCategories };