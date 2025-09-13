// MongoDB initialization script
db = db.getSiblingDB('budget-manager');

// Create user for the budget-manager database
db.createUser({
  user: 'admin',
  pwd: 'password123',
  roles: [
    { role: 'readWrite', db: 'budget-manager' }
  ]
});

// Create collections
db.createCollection('expenses');
db.createCollection('assets');

// Create indexes for better performance
db.expenses.createIndex({ "category": 1 });
db.expenses.createIndex({ "date": -1 });
db.assets.createIndex({ "type": 1 });

print('Database initialized with sample data');