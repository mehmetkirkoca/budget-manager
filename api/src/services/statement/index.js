const pdfParse = require('pdf-parse');
const akbank   = require('./adapters/akbank');
const garanti  = require('./adapters/garanti');
const enpara   = require('./adapters/enpara');

const ADAPTERS = [akbank, garanti, enpara];

async function parseStatement(buffer) {
  const { text } = await pdfParse(buffer);
  // DEBUG: log first 500 chars as hex to identify encoded strings
  const sample = text.slice(0, 500);
  console.log('PDF_TEXT_SAMPLE:', JSON.stringify(sample));
  const adapter  = ADAPTERS.find(a => a.detect(text)) || null;
  if (!adapter) {
    return { bank: 'unknown', parseError: true, transactions: [] };
  }
  const result = adapter.parse(text);
  return { bank: adapter.name, ...result };
}

module.exports = { parseStatement };
