// Garanti/Bonus PDF adapter — stub, henüz implemente edilmedi

module.exports.name = 'garanti';

module.exports.detect = (text) => false;

module.exports.parse = (text) => ({
  statementDate: null,
  paymentDueDate: null,
  totalDebt: null,
  minPayment: null,
  transactions: []
});
