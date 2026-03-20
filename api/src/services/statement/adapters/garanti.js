// Garanti BBVA / Bonus kredi kartı ekstresi — düz UTF-8 metin (Türkçe)
//
// İşlem satırı formatı (tek satır):
//   DD Ay YYYYAÇIKLAMAOptionalBonus(X,XX)TUTAR(X.XXX,XX)[+]
// Bonus sütunu bazen tutar ile birleşik gelir (ör. "3,121.246,61" → bonus 3,12 + tutar 1.246,61)
// Ödemeler "+" ile biter → isCredit: true

const MONTHS = {
  'Ocak':'01','Şubat':'02','Mart':'03','Nisan':'04',
  'Mayıs':'05','Haziran':'06','Temmuz':'07','Ağustos':'08',
  'Eylül':'09','Ekim':'10','Kasım':'11','Aralık':'12',
};

const MONTH_ALT = Object.keys(MONTHS).join('|');

function parseDate(str) {
  const m = str.match(/^(\d{2}) (\S+) (\d{4})$/);
  if (!m || !MONTHS[m[2]]) return null;
  return `${m[3]}-${MONTHS[m[2]]}-${m[1]}`;
}

function parseTR(str) {
  return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

module.exports.name = 'garanti';

module.exports.detect = (text) =>
  text.includes('T. Garanti Bankası') ||
  (text.includes('Garanti BBVA') && text.includes('Dönem Borcunuz'));

module.exports.parse = (text) => {
  // --- Header fields ---
  // "Hesap Kesim Tarihi22 Şubat 2026" or "Hesap Kesim Tarihi 22 Şubat 2026"
  const stmtMatch  = text.match(new RegExp(`Hesap Kesim Tarihi\\s*(\\d{2} (?:${MONTH_ALT}) \\d{4})`));
  const dueMatch   = text.match(new RegExp(`Son Ödeme Tarihi:?\\s*(\\d{2} (?:${MONTH_ALT}) \\d{4})`));
  const debtMatch  = text.match(/Dönem Borcunuz([\d.]+,\d{2})/);
  const minMatch   = text.match(/Min\. Ödeme Tutarı([\d.]+,\d{2})/);

  const statementDate  = stmtMatch ? parseDate(stmtMatch[1])  : null;
  const paymentDueDate = dueMatch  ? parseDate(dueMatch[1])   : null;
  const totalDebt      = debtMatch ? parseTR(debtMatch[1])    : null;
  const minPayment     = minMatch  ? parseTR(minMatch[1])     : null;

  // --- Transactions ---
  // Her satır: DATE + açıklama + SPACE + [bonus (X,XX)] + tutar + [+]
  // Bonus ve tutar arasında boşluk yok (ör. "3,12" + "1.246,61" → "3,121.246,61")
  // Strateji: greedy (.+) açıklamayı son SPACE'e kadar alır, bonus (opsiyonel) tüketilir,
  // gerçek tutar elde edilir.
  const txnRe = new RegExp(
    `^(\\d{2} (?:${MONTH_ALT}) \\d{4})(.+) (?:\\d{1,3},\\d{2})?((?:\\d{1,3}\\.)*\\d{1,3},\\d{2})(\\+)?\\s*$`,
    'gm'
  );

  const transactions = [];
  let m;
  while ((m = txnRe.exec(text)) !== null) {
    const date     = parseDate(m[1]);
    const amount   = parseTR(m[3]);
    const isCredit = m[4] === '+';

    if (!date || isNaN(amount) || amount <= 0) continue;

    transactions.push({
      date,
      description: m[2].trim(),
      amount,
      isCredit,
      isInstallment: false,
      installmentInfo: null,
    });
  }

  return { statementDate, paymentDueDate, totalDebt, minPayment, transactions };
};
