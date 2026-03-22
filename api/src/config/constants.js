module.exports = {
  // --- Asgari Ödeme (BDDK, Eyl 2024) ---
  // Kart limitine göre iki kademe
  CC_MIN_PAYMENT_RATE_LOW:        parseFloat(process.env.CC_MIN_PAYMENT_RATE_LOW),        // 0.20  — limit ≤ 50.000 TL
  CC_MIN_PAYMENT_RATE_HIGH:       parseFloat(process.env.CC_MIN_PAYMENT_RATE_HIGH),       // 0.40  — limit > 50.000 TL
  CC_MIN_PAYMENT_LIMIT_THRESHOLD: parseInt(process.env.CC_MIN_PAYMENT_LIMIT_THRESHOLD),   // 50000 — eşik (TL)
  CC_MIN_PAYMENT_FLOOR:           parseFloat(process.env.CC_MIN_PAYMENT_FLOOR),           // 50    — alt taban (TL)

  // --- Akdi Faiz Oranları — Kademeli (TCMB, 1 Oca 2026) ---
  // Dönem borcu tutarına göre üç kademe
  CC_AKDI_RATE_TIER1:             parseFloat(process.env.CC_AKDI_RATE_TIER1),             // 0.0325 — borç < 30.000 TL
  CC_AKDI_RATE_TIER2:             parseFloat(process.env.CC_AKDI_RATE_TIER2),             // 0.0375 — borç 30.000–150.000 TL
  CC_AKDI_RATE_TIER3:             parseFloat(process.env.CC_AKDI_RATE_TIER3),             // 0.0425 — borç > 150.000 TL
  CC_AKDI_TIER1_THRESHOLD:        parseInt(process.env.CC_AKDI_TIER1_THRESHOLD),          // 30000
  CC_AKDI_TIER2_THRESHOLD:        parseInt(process.env.CC_AKDI_TIER2_THRESHOLD),          // 150000

  // Akdi faizin yıllık karşılıkları
  CC_AKDI_ANNUAL_RATE_TIER1:      parseFloat(process.env.CC_AKDI_ANNUAL_RATE_TIER1),      // 0.39
  CC_AKDI_ANNUAL_RATE_TIER2:      parseFloat(process.env.CC_AKDI_ANNUAL_RATE_TIER2),      // 0.45
  CC_AKDI_ANNUAL_RATE_TIER3:      parseFloat(process.env.CC_AKDI_ANNUAL_RATE_TIER3),      // 0.51

  // --- Gecikme Faiz Oranları — Kademeli (TCMB, 1 Oca 2026) ---
  // Dönem borcu tutarına göre üç kademe (akdi ile aynı eşikler)
  CC_GECIKME_RATE_TIER1:          parseFloat(process.env.CC_GECIKME_RATE_TIER1),          // 0.0355 — borç < 30.000 TL
  CC_GECIKME_RATE_TIER2:          parseFloat(process.env.CC_GECIKME_RATE_TIER2),          // 0.0405 — borç 30.000–150.000 TL
  CC_GECIKME_RATE_TIER3:          parseFloat(process.env.CC_GECIKME_RATE_TIER3),          // 0.0455 — borç > 150.000 TL

  // --- Nakit Avans (TCMB, 1 Oca 2026) ---
  CC_DEFAULT_CASH_ADV_RATE:       parseFloat(process.env.CC_DEFAULT_CASH_ADV_RATE),       // 0.0425

  // --- Vergi (BSMV + KKDF) ---
  CC_BSMV_RATE:  parseFloat(process.env.CC_BSMV_RATE),   // 0.15
  CC_KKDF_RATE:  parseFloat(process.env.CC_KKDF_RATE),   // 0.15

  // --- Diğer ---
  CC_DEFAULT_GRACE_DAYS:          parseInt(process.env.CC_DEFAULT_GRACE_DAYS),            // 45    — faizsiz dönem (gün)
  CC_DEFAULT_LATE_FEE:            parseFloat(process.env.CC_DEFAULT_LATE_FEE),            // 50    — gecikme ücreti (TL, bankaya göre değişir)
  CC_DEFAULT_OVERLIMIT_FEE:       parseFloat(process.env.CC_DEFAULT_OVERLIMIT_FEE),       // 100   — limit aşım ücreti (TL, bankaya göre değişir)
};
