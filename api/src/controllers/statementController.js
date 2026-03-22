const path = require('path');
const fs   = require('fs');

const CreditCard            = require('../models/CreditCard');
const CreditCardInstallment = require('../models/CreditCardInstallment');
const { parseStatement }    = require('../services/statement');

const UPLOADS_DIR = path.join(__dirname, '../../uploads/statements');

const parseStatementUpload = async (request, reply) => {
  const { id } = request.params;
  const card = await CreditCard.findById(id);
  if (!card) return reply.status(404).send({ error: 'Credit card not found' });

  const file = await request.file();
  if (!file) return reply.status(400).send({ error: 'No file uploaded' });

  const buffer = await file.toBuffer();
  const parsed = await parseStatement(buffer);

  // Persist PDF — non-critical, parse result is returned regardless
  try {
    const refDate  = parsed.paymentDueDate || parsed.statementDate;
    const period   = refDate
      ? refDate.slice(0, 7).replace('-', '_')
      : new Date().toISOString().slice(0, 7).replace('-', '_');
    const bankSlug = card.bankName.toLowerCase().replace(/\s+/g, '_');
    const dir      = path.join(UPLOADS_DIR, period);
    fs.mkdirSync(dir, { recursive: true });
    const hash     = require('crypto').createHash('sha256').update(buffer).digest('hex').slice(0, 16);
    const filename = `${bankSlug}_${hash}.pdf`;
    const dest     = path.join(dir, filename);
    if (!fs.existsSync(dest)) {
      fs.writeFileSync(dest, buffer);
    }
  } catch (err) {
    request.log.warn('Statement PDF could not be saved: ' + err.message);
  }

  reply.send(parsed);
};

const importStatement = async (request, reply) => {
  const { id } = request.params;
  const {
    statementDate,
    paymentDueDate,
    totalDebt,
    minPayment,
    totalLimit,
    availableLimit,
    installmentTransactions = [],
  } = request.body;

  const card = await CreditCard.findById(id);
  if (!card) return reply.status(404).send({ error: 'Credit card not found' });

  // Update card fields from statement
  if (totalDebt != null) {
    card.currentBalance = totalDebt;
    // Prefer availableLimit directly from the statement; fall back to totalLimit - totalDebt
    if (availableLimit != null) {
      card.availableLimit = availableLimit;
    } else if (totalLimit != null) {
      card.availableLimit = totalLimit - totalDebt;
    } else {
      card.availableLimit = card.totalLimit - totalDebt;
    }
  }
  if (totalLimit != null) card.totalLimit = totalLimit;
  if (minPayment     != null) card.minimumPaymentAmount = minPayment;
  if (statementDate)          card.lastStatementDate    = new Date(statementDate);
  if (paymentDueDate)         card.nextPaymentDue       = new Date(paymentDueDate);
  await card.save();

  // Auto-create installment records for taksit transactions
  let installmentsCreated = 0;
  const dueDate = card.nextPaymentDue ? new Date(card.nextPaymentDue) : new Date();

  for (const txn of installmentTransactions) {
    if (!txn.isInstallment || !txn.installmentInfo) continue;
    const { current, total } = txn.installmentInfo;
    if (!current || !total || total < 2 || current > total) continue;

    // Skip if same installment plan already tracked
    const exists = await CreditCardInstallment.findOne({
      creditCard: id,
      purchaseDescription: txn.description,
      totalInstallments: total,
      paymentStatus: { $in: ['active', 'completed'] },
    });
    if (exists) continue;

    // Estimate dates:
    // nextPaymentDate  = card's current due date
    // firstPaymentDate = dueDate - (current - 1) months
    // purchaseDate     = firstPaymentDate - 1 month
    // lastPaymentDate  = firstPaymentDate + (total - 1) months
    const firstPaymentDate = new Date(dueDate);
    firstPaymentDate.setMonth(firstPaymentDate.getMonth() - (current - 1));

    const purchaseDate = new Date(firstPaymentDate);
    purchaseDate.setMonth(purchaseDate.getMonth() - 1);

    const lastPaymentDate = new Date(firstPaymentDate);
    lastPaymentDate.setMonth(lastPaymentDate.getMonth() + total - 1);

    const originalAmount      = Math.round(txn.amount * total * 100) / 100;
    const completedInstallments = current - 1; // current one is in this statement, not yet paid

    await CreditCardInstallment.create({
      creditCard:           id,
      purchaseDescription:  txn.description,
      originalAmount,
      totalInstallments:    total,
      installmentAmount:    txn.amount,
      completedInstallments,
      remainingInstallments: total - completedInstallments,
      totalAmountWithInterest: originalAmount,
      interestRate:         0,
      interestAmount:       0,
      purchaseDate,
      firstPaymentDate,
      nextPaymentDate:      dueDate,
      lastPaymentDate,
      paymentStatus:        completedInstallments >= total ? 'completed' : 'active',
    });
    installmentsCreated++;
  }

  reply.send({ success: true, cardUpdated: true, installmentsCreated });
};

module.exports = { parseStatementUpload, importStatement };
