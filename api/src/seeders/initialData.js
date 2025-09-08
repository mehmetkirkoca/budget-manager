require('dotenv').config();
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Asset = require('../models/Asset');

// Mock data to seed into MongoDB
const mockExpenses = [
  { 
    amount: 345.50, 
    category: 'food', 
    description: 'Weekly groceries',
    date: new Date('2025-09-06'),
    status: 'completed'
  },
  { 
    amount: 280.75, 
    category: 'utilities', 
    description: 'Electricity Bill',
    date: new Date('2025-09-05'),
    status: 'completed'
  },
  { 
    amount: 2500.00, 
    category: 'rent', 
    description: 'September Rent',
    date: new Date('2025-09-01'),
    status: 'completed'
  },
  { 
    amount: 450.00, 
    category: 'transportation', 
    description: 'Monthly Public Transport Card',
    date: new Date('2025-09-01'),
    status: 'completed'
  },
  { 
    amount: 750.00, 
    category: 'healthcare', 
    description: 'Dentist',
    date: new Date('2025-09-10'),
    status: 'pending'
  }
];

const mockAssets = [
  {
    name: 'Emergency Fund',
    type: 'savings',
    currentAmount: 15000,
    targetAmount: 20000,
    description: 'Savings for emergencies'
  },
  {
    name: 'New Car',
    type: 'savings',
    currentAmount: 25000,
    targetAmount: 80000,
    description: 'Savings for a new car'
  },
  {
    name: 'Vacation',
    type: 'savings',
    currentAmount: 5000,
    targetAmount: 12000,
    description: 'Money set aside for annual vacation'
  }
];

async function seedDatabase() {
  try {
    // Use existing connection or connect if not available
    let shouldClose = false;
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/budget-manager?authSource=admin';
      await mongoose.connect(mongoUri);
      console.log('🔗 Connected to MongoDB for seeding...');
      shouldClose = true;
    }

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Expense.deleteMany({});
    await Asset.deleteMany({});

    // Seed expenses
    console.log('📝 Seeding expenses...');
    const seededExpenses = await Expense.insertMany(mockExpenses);
    console.log(`✅ Created ${seededExpenses.length} expenses`);

    // Seed assets
    console.log('💰 Seeding assets...');
    const seededAssets = await Asset.insertMany(mockAssets);
    console.log(`✅ Created ${seededAssets.length} assets`);

    console.log('🎉 Database seeding completed successfully!');
    
    if (shouldClose) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, mockExpenses, mockAssets };