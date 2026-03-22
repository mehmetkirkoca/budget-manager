// Enpara.com kredi kartı ekstresi — düz UTF-8 metin, garbled karakter yok

function parseTR(str) {
  return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

function parseDate(ddmmyyyy) {
  const [d, m, y] = ddmmyyyy.split('/');
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
}

module.exports.name = 'enpara';

module.exports.detect = (text) =>
  text.includes('Ekstre borcu') && text.includes('Minimum ödeme tutarı');

module.exports.parse = (text) => {
  // --- Header fields ---
  const stmtDateMatch = text.match(/Ekstre tarihi\s*(\d{2}\/\d{2}\/\d{4})/);
  const debtMatch     = text.match(/Ekstre borcu\s*([\d.]+,\d+)\s*TL/);
  const minPayMatch   = text.match(/Minimum ödeme tutarı\s*([\d.]+,\d+)\s*TL/);
  // First "Son ödeme tarihi" with a date (not the "Bir sonraki" sentence)
  const dueDateMatch  = text.match(/Son ödeme tarihi\s*(\d{2}\/\d{2}\/\d{4})/);

  const totalLimitMatch     = text.match(/Kart limiti\s*([\d.]+,\d+)\s*TL/);
  const availLimitMatch     = text.match(/Kullan[ıi]labilir kart limiti\s*([\d.]+,\d+)\s*TL/i);

  const statementDate  = stmtDateMatch     ? parseDate(stmtDateMatch[1])  : null;
  const totalDebt      = debtMatch         ? parseTR(debtMatch[1])        : null;
  const minPayment     = minPayMatch       ? parseTR(minPayMatch[1])      : null;
  const paymentDueDate = dueDateMatch      ? parseDate(dueDateMatch[1])   : null;
  const totalLimit     = totalLimitMatch   ? parseTR(totalLimitMatch[1])  : null;
  const availableLimit = availLimitMatch   ? parseTR(availLimitMatch[1])  : null;

  // --- Transactions ---
  // Format: DD/MM/YYYYDescription [installment] [-] amount TL
  // Installment marker in description: (originalAmt TL)N/M
  const txnRe  = /^(\d{2}\/\d{2}\/\d{4})\s*(.+?)\s*(-\s*)?([\d.]+,\d{2})\s*TL$/gm;
  const instRe = /\([\d.,]+\s*TL\)(\d+)\/(\d+)/;

  const transactions = [];
  let m;
  while ((m = txnRe.exec(text)) !== null) {
    const date     = parseDate(m[1]);
    const rawDesc  = m[2].trim();
    const isCredit = !!m[3];
    const amount   = parseTR(m[4]);
    if (isNaN(amount) || amount <= 0) continue;

    const instMatch    = rawDesc.match(instRe);
    const isInstallment = !!(instMatch && parseInt(instMatch[2]) > 1);

    transactions.push({
      date,
      description: rawDesc.replace(/\s+/g, ' ').trim(),
      amount,
      isCredit,
      isInstallment,
      installmentInfo: isInstallment ? {
        current: parseInt(instMatch[1]),
        total:   parseInt(instMatch[2]),
      } : null,
    });
  }

  return { statementDate, paymentDueDate, totalDebt, minPayment, totalLimit, availableLimit, transactions };
};
