// Akbank/Axess PDF'leri custom Type1 font ile garbled text üretir.
// Digit mapping: ð=0 ñ=1 ò=2 ó=3 ô=4 õ=5 ö=6 ÷=7 ø=8 ù=9
// Separators:    k=. (binlik)  K=, (ondalık)  tarihte = ayracı

const DIGIT_MAP = { ð:'0', ñ:'1', ò:'2', ó:'3', ô:'4', õ:'5', ö:'6', '÷':'7', ø:'8', ù:'9' };
const DIGIT_RE  = /[ðñòóôõö÷øù]/g;

function decodeDigits(s) {
  return s.replace(DIGIT_RE, c => DIGIT_MAP[c]).replace(/k/g, '.').replace(/K/g, ',');
}

function parseTR(encoded) {
  const decoded = decodeDigits(encoded);
  return parseFloat(decoded.replace(/\./g, '').replace(',', '.'));
}

function decodeDate(encoded) {
  const raw = encoded.replace(DIGIT_RE, c => DIGIT_MAP[c]);
  // supports both '=' and 'a' as separator depending on PDF version
  const parts = raw.split(/[a=]/);
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
}

const D    = '[ðñòóôõö÷øù]';
const DATE = `(${D}{2}=[${D.slice(1,-1)}]{2}=[${D.slice(1,-1)}]{4})`.replace(/\[ðñòóôõö÷øù\]/g, '[ðñòóôõö÷øù]');
const AMT  = '([ðñòóôõö÷øùk]+K[ðñòóôõö÷øù]+)';

module.exports.name = 'akbank';

module.exports.detect = (text) => text.includes('Á§') || text.includes('ÁÒÂÁÕò');

module.exports.parse = (text) => {
  // Each label is on its own line; value follows on next line.
  //
  // ÄÌ_U^(Â`cS¤          = Dönem Borcu
  // â`_(ìTU^U(ãQcYXY      = Son Ödeme Tarihi  (first occurrence = card-level)
  // Å_(Á©(ìTU^U(ã¤£Qc§   = En Az Ödeme Tutarı
  // ÈU¢Qa(ÒU¢Y^(ãQcYXY   = Hesap Kesim Tarihi
  // ÂYc(...ìTU^U...)       = Bireysel Son Ödeme Tarihi  (individual, use this)

  const debtMatch     = text.match(/ÄÌ_U\^[^\n]*\n([ðñòóôõö÷øùk]+K[ðñòóôõö÷øù]+)/);
  const minPayMatch   = text.match(/Å_[^\n]*Á©[^\n]*\n([ðñòóôõö÷øùk]+K[ðñòóôõö÷øù]+)/);
  const stmtDateMatch = text.match(/ÈU¢Qa[^\n]*ÒU¢Y\^[^\n]*\n([ðñòóôõö÷øù]{2}=[ðñòóôõö÷øù]{2}=[ðñòóôõö÷øù]{4})/);
  // Bireysel (individual) due date preferred; fall back to first card-level one
  const dueDateMatch  =
    text.match(/ÂYc[^\n]*ìTU\^U[^\n]*\n([ðñòóôõö÷øù]{2}=[ðñòóôõö÷øù]{2}=[ðñòóôõö÷øù]{4})/) ||
    text.match(/â`_\(ìTU\^U\(ãQcYXY\n([ðñòóôõö÷øù]{2}=[ðñòóôõö÷øù]{2}=[ðñòóôõö÷øù]{4})/);

  const totalDebt      = debtMatch     ? parseTR(debtMatch[1])        : null;
  const minPayment     = minPayMatch   ? parseTR(minPayMatch[1])      : null;
  const statementDate  = stmtDateMatch ? decodeDate(stmtDateMatch[1]) : null;
  const paymentDueDate = dueDateMatch  ? decodeDate(dueDateMatch[1])  : null;

  // Transactions: date pattern (DD=MM=YYYY) followed by description and amount
  const txnRe = /([ðñòóôõö÷øù]{2}=[ðñòóôõö÷øù]{2}=[ðñòóôõö÷øù]{4})\s+(.+?)\s+([ðñòóôõö÷øùk.K]+(?:M`\])?)\s*$/gm;
  // Taksit pattern: "N/M" encoded as digit-seq [a=] digit-seq in description
  const installmentRe = /([ðñòóôõö÷øù]+)[a=]([ðñòóôõö÷øù]+)/;
  const transactions = [];
  let m;
  while ((m = txnRe.exec(text)) !== null) {
    const date      = decodeDate(m[1]);
    const rawDesc   = m[2].trim();
    const rawAmt    = m[3];
    const isCredit  = rawAmt.includes('M`]') || rawAmt.includes('(`]');
    const amountStr = rawAmt.replace(/M`\]/, '').replace(/\(`\]/, '').replace(/-$/, '');
    const amount    = parseTR(amountStr);
    if (isNaN(amount) || amount <= 0) continue;
    const instMatch = rawDesc.match(installmentRe);
    const current   = instMatch ? parseInt(decodeDigits(instMatch[1])) : null;
    const total     = instMatch ? parseInt(decodeDigits(instMatch[2])) : null;
    const isInstallment = !!(instMatch && current > 0 && total > 1 && current <= total);
    transactions.push({
      date,
      description: rawDesc,
      amount,
      isCredit,
      isInstallment,
      installmentInfo: isInstallment ? { current, total } : null,
    });
  }

  return { statementDate, paymentDueDate, totalDebt, minPayment, transactions };
};
