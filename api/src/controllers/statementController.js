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
    transactions = [],
    installmentTransactions = [],
  } = request.body;

  const card = await CreditCard.findById(id);
  if (!card) return reply.status(404).send({ error: 'Credit card not found' });

  if (totalLimit != null) card.totalLimit = totalLimit;
  // Update card fields from statement. Prefer the statement's available limit;
  // some banks include pending transactions that are not part of statement debt.
  if (totalDebt != null) card.currentBalance = totalDebt;
  if (availableLimit != null) {
    card.availableLimit = availableLimit;
  } else if (totalDebt != null) {
    card.availableLimit = card.totalLimit - totalDebt;
  }
  if (minPayment     != null) card.minimumPaymentAmount = minPayment;
  if (statementDate)          card.lastStatementDate    = new Date(statementDate);
  if (paymentDueDate)         card.nextPaymentDue       = new Date(paymentDueDate);
  if (transactions.length > 0) card.lastStatementTransactions = transactions;
  await card.save();

  // Auto-create or update installment records for taksit transactions
  let installmentsCreated = 0;
  let installmentsUpdated = 0;
  const dueDate = card.nextPaymentDue ? new Date(card.nextPaymentDue) : new Date();

  // Determine current statement period (e.g. "2026-08")
  const refDate = statementDate || paymentDueDate;
  const currentStatementPeriod = refDate
    ? new Date(refDate).toISOString().slice(0, 7)
    : new Date().toISOString().slice(0, 7);

  for (const txn of installmentTransactions) {
    if (!txn.isInstallment || !txn.installmentInfo) continue;
    const { current, total } = txn.installmentInfo;
    if (!current || !total || total < 2 || current > total) continue;

    // Check if an installment plan with this description and total installments exists
    const existing = await CreditCardInstallment.findOne({
      creditCard: id,
      purchaseDescription: txn.description,
      totalInstallments: total,
    });

    const completedInstallments = current - 1; // current one is billed in this statement
    const remainingInstallments = Math.max(0, total - completedInstallments);
    const originalAmount = Math.round(txn.amount * total * 100) / 100;

    const firstPaymentDate = new Date(dueDate);
    firstPaymentDate.setMonth(firstPaymentDate.getMonth() - (current - 1));

    const purchaseDate = new Date(firstPaymentDate);
    purchaseDate.setMonth(purchaseDate.getMonth() - 1);

    const lastPaymentDate = new Date(firstPaymentDate);
    lastPaymentDate.setMonth(lastPaymentDate.getMonth() + total - 1);

    if (existing) {
      // Re-upload prevention: if this exact statement period was ALREADY processed for this installment, skip duplicate
      if (existing.lastProcessedPeriod === currentStatementPeriod) {
        continue;
      }

      // Update existing installment record to reflect latest statement status
      existing.completedInstallments = completedInstallments;
      existing.remainingInstallments = remainingInstallments;
      existing.installmentAmount = txn.amount;
      existing.nextPaymentDate = dueDate;
      existing.paymentStatus = completedInstallments >= total ? 'completed' : 'active';
      existing.lastProcessedPeriod = currentStatementPeriod;
      await existing.save();
      installmentsUpdated++;
    } else {
      // Create new installment record
      await CreditCardInstallment.create({
        creditCard: id,
        purchaseDescription: txn.description,
        originalAmount,
        totalInstallments: total,
        installmentAmount: txn.amount,
        completedInstallments,
        remainingInstallments,
        totalAmountWithInterest: originalAmount,
        interestRate: 0,
        interestAmount: 0,
        purchaseDate,
        firstPaymentDate,
        nextPaymentDate: dueDate,
        lastPaymentDate,
        paymentStatus: completedInstallments >= total ? 'completed' : 'active',
        lastProcessedPeriod: currentStatementPeriod,
      });
      installmentsCreated++;
    }
  }

  reply.send({ success: true, cardUpdated: true, installmentsCreated, installmentsUpdated });
};

module.exports = { parseStatementUpload, importStatement };
