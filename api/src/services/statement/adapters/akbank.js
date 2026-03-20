// Akbank/Axess PDF'leri custom Type1 font ile garbled text üretir.
// Digit mapping: ð=0 ñ=1 ò=2 ó=3 ô=4 õ=5 ö=6 ÷=7 ø=8 ù=9
// Separators:    k=. (binlik)  K=, (ondalık)  tarihte = ayracı
//
// Tam karakter haritası PDF+screenshot karşılaştırmasıyla türetildi:
//   BURULAŞ→ÂäÙäÓÁÂ, BURSA→ÂäÙâÁ, TR→ãÙ
//   EKSTRE BÖLDÜR (39,596.32 TL +Vade Farkı) 3/2.taksit → doğrulama
//   Toplam Dönem Faizi, İNDİR kampanyası kazanılan indirim, vb.

const DIGIT_MAP = { ð:'0', ñ:'1', ò:'2', ó:'3', ô:'4', õ:'5', ö:'6', '÷':'7', ø:'8', ù:'9' };
const DIGIT_RE  = /[ðñòóôõö÷øù]/g;

// Metin karakterleri için tam decode haritası
const DECODE_MAP = {
  // Rakamlar
  ð:'0', ñ:'1', ò:'2', ó:'3', ô:'4', õ:'5', ö:'6', '÷':'7', ø:'8', ù:'9',
  // Sayı ayraçları (k=binlik nokta, K=ondalık virgül)
  k:'.', K:',',
  // Noktalama / özel
  '(':' ', '<':'-', '=':'/', M:'(', ']':'l', N:'+',
  // Küçük harf harfler
  R:'b', T:'d', U:'e', Y:'i', Q:'a', '^':'m', _:'n', '`':'o', a:'p',
  c:'r', '\\':'k', '¢':'s', '£':'t', '¨':'y', '©':'z',
  '0':'ç', '®':'ş', '¯':'ı', å:'v',
  // Büyük harf harfler
  Á:'A', Â:'B', Ã:'C', Ä:'D', Å:'E', Æ:'F', È:'H', É:'İ',
  Ò:'K', Ó:'L', Ô:'M', Õ:'N', Ö:'O', '×':'P', Ù:'R',
  â:'S', ã:'T', ä:'U', è:'Y', é:'Z',
  // Türkçe özel karakterler
  Ì:'ö', ì:'Ö', Ü:'ü', ü:'Ü',
  // Ek karakterler (PDF karşılaştırmasıyla tespit edildi)
  Ç:'G', '§':'X', '¤':'u',
};

function decodeText(s) {
  let out = '';
  for (const ch of s) {
    out += ch in DECODE_MAP ? DECODE_MAP[ch] : ch;
  }
  return out;
}

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

module.exports.name = 'akbank';

module.exports.detect = (text) =>
  text.includes('Á§')        ||  // Axess branding
  text.includes('ÁÒÂÁÕÒ')    ||  // AKBANK (uppercase K at end)
  text.includes('ÁÒÂÁÕò')    ||  // AKBANK (legacy variant)
  text.includes('ÄÌ_U^')     ||  // Dönem (Dönem Borcu header)
  text.includes('ÈU¢Qa');        // Hesap (Hesap Kesim Tarihi header)

module.exports.parse = (text) => {
  // Each label is on its own line; value follows on next line.
  //
  // ÄÌ_U^(Â`cS¤          = Dönem Borcu
  // â`_(ìTU^U(ãQcYXY      = Son Ödeme Tarihi  (first occurrence = current period due date)
  // Å_(Á©(ìTU^U(ã¤£Qc§   = En Az Ödeme Tutarı
  // ÈU¢Qa(ÒU¢Y^(ãQcYXY   = Hesap Kesim Tarihi
  // ÂYc(...ìTU^U...)       = Bireysel Son Ödeme Tarihi  (next period, skip)

  const debtMatch     = text.match(/ÄÌ_U\^[^\n]*\n([ðñòóôõö÷øùk]+K[ðñòóôõö÷øù]+)/);
  const minPayMatch   = text.match(/Å_[^\n]*Á©[^\n]*\n([ðñòóôõö÷øùk]+K[ðñòóôõö÷øù]+)/);
  const stmtDateMatch = text.match(/ÈU¢Qa[^\n]*ÒU¢Y\^[^\n]*\n([ðñòóôõö÷øù]{2}=[ðñòóôõö÷øù]{2}=[ðñòóôõö÷øù]{4})/);
  // First "Son Ödeme Tarihi" = current period due date (not the Bireysel/next-period one)
  const dueDateMatch  = text.match(/â`_[^\n]*ìTU\^U[^\n]*\n([ðñòóôõö÷øù]{2}=[ðñòóôõö÷øù]{2}=[ðñòóôõö÷øù]{4})/);

  const totalDebt      = debtMatch     ? parseTR(debtMatch[1])        : null;
  const minPayment     = minPayMatch   ? parseTR(minPayMatch[1])      : null;
  const statementDate  = stmtDateMatch ? decodeDate(stmtDateMatch[1]) : null;
  const paymentDueDate = dueDateMatch  ? decodeDate(dueDateMatch[1])  : null;

  // Transactions: two-line format
  //   Line 1: DATE (DD=MM=YYYY) immediately followed by description
  //   Line 2: '(' + AMOUNT + optional suffix (credit marker or remaining installment amount)
  const txnRe = /^([ðñòóôõö÷øù]{2}[a=][ðñòóôõö÷øù]{2}[a=][ðñòóôõö÷øù]{4})(.+)\n\(([ðñòóôõö÷øùk]+K[ðñòóôõö÷øù]+)([^\n]*)/gm;
  // Taksit pattern: "N/M" encoded as digit-seq [a=] digit-seq in description
  const installmentRe = /([ðñòóôõö÷øù]+)[a=]([ðñòóôõö÷øù]+)/;
  const transactions = [];
  let m;
  while ((m = txnRe.exec(text)) !== null) {
    const date     = decodeDate(m[1]);
    const rawDesc  = m[2].trim();
    const rawAmt   = m[3];
    const suffix   = (m[4] || '').trim();
    // suffix starting with an encoded digit/k is a remaining installment amount → not a credit
    const isCredit = suffix.length > 0 && !/^[ðñòóôõö÷øùk]/.test(suffix);
    const amount   = parseTR(rawAmt);
    if (isNaN(amount) || amount <= 0) continue;
    const instMatch = rawDesc.match(installmentRe);  // encoded text üzerinde eşle
    const current   = instMatch ? parseInt(decodeDigits(instMatch[1])) : null;
    const total     = instMatch ? parseInt(decodeDigits(instMatch[2])) : null;
    const isInstallment = !!(instMatch && current > 0 && total > 1 && current <= total);
    transactions.push({
      date,
      description: decodeText(rawDesc),
      amount,
      isCredit,
      isInstallment,
      installmentInfo: isInstallment ? { current, total } : null,
    });
  }

  return { statementDate, paymentDueDate, totalDebt, minPayment, transactions };
};
