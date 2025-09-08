#!/bin/bash

echo "🔄 Starting API development server..."

# Wait for MongoDB to be ready and run seed
echo "⏳ Waiting for MongoDB to be ready and seeding if needed..."
node -e "
const mongoose = require('mongoose');
const Expense = require('./src/models/Expense');

async function checkAndSeed() {
  try {
    const mongoUri = 'mongodb://admin:password123@mongodb:27017/budget-manager?authSource=admin';
    
    // Wait for MongoDB to be ready
    while (true) {
      try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
        console.log('✅ MongoDB is ready!');
        break;
      } catch (err) {
        console.log('⏳ Waiting for MongoDB...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Check if database needs seeding
    const count = await Expense.countDocuments();
    
    if (count === 0) {
      console.log('📊 Database is empty, seeding with initial data...');
      const { seedDatabase } = require('./src/seeders/initialData');
      await seedDatabase();
    } else {
      console.log('📊 Database already has ' + count + ' expense records, skipping seed...');
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during initialization:', error.message);
    process.exit(1);
  }
}

checkAndSeed();
"

echo "🚀 Starting development server..."
exec npm run dev