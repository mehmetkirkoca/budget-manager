// MongoDB initialization script
db = db.getSiblingDB('budget-manager');

// Create collections
db.createCollection('expenses');
db.createCollection('assets');

// Create indexes for better performance
db.expenses.createIndex({ "category": 1 });
db.expenses.createIndex({ "date": -1 });
db.assets.createIndex({ "type": 1 });

// Insert sample data
db.expenses.insertMany([
  {
    amount: 150,
    category: 'food',
    description: 'Grocery shopping',
    date: new Date('2025-01-05'),
    status: 'Gerçekleşti',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    amount: 50,
    category: 'transport',
    description: 'Bus fare',
    date: new Date('2025-01-06'),
    status: 'Gerçekleşti',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    amount: 100,
    category: 'entertainment',
    description: 'Movie tickets',
    date: new Date('2025-01-07'),
    status: 'Gerçekleşti',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

db.assets.insertMany([
  {
    name: 'Emergency Fund',
    type: 'savings',
    currentAmount: 2500,
    targetAmount: 10000,
    description: 'Emergency savings account',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Stock Investment',
    type: 'investment',
    currentAmount: 5000,
    targetAmount: 20000,
    description: 'Long-term stock portfolio',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Bitcoin',
    type: 'crypto',
    currentAmount: 1000,
    targetAmount: 5000,
    description: 'Cryptocurrency investment',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('Database initialized with sample data');