// Google Calendar and iCal (.ics) Bulk Sync Service

const pad = (n) => String(n).padStart(2, '0');

export const formatDueDateDisplay = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
};

export const formatDateToICS = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
};

export const getNextDayICS = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
};

export const getGoogleCalendarUrl = (payment) => {
  const amountStr = (payment.effectiveAmount || payment.amount || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
  const title = encodeURIComponent(`${payment.category?.name === 'Kredi Kartı Ödemesi' || payment._ccType ? '💳 ' : '📋 '}${payment.name} - ${amountStr}`);
  const startDay = formatDateToICS(payment.nextDue);
  const endDay = getNextDayICS(payment.nextDue);
  const formattedDate = formatDueDateDisplay(payment.nextDue);

  const details = encodeURIComponent(
    `Bütçe Ödeme Hatırlatıcısı\n` +
    `Ödeme: ${payment.name}\n` +
    `Tutar: ${amountStr}\n` +
    `Kategori: ${payment.category?.name || '-'}\n` +
    `Son Ödeme Tarihi: ${formattedDate}`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDay}/${endDay}&details=${details}&trp=false`;
};

export const generateICSContent = (payments = [], monthLabel = 'Ay') => {
  const now = new Date();
  const dtStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const events = (payments || []).map((p, idx) => {
    const start = formatDateToICS(p.nextDue);
    const end = getNextDayICS(p.nextDue);
    if (!start) return '';

    const amountStr = (p.effectiveAmount || p.amount || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
    const summary = `${p.category?.name === 'Kredi Kartı Ödemesi' || p._ccType ? '💳 ' : '📋 '}${p.name} - ${amountStr}`;
    const formattedDate = formatDueDateDisplay(p.nextDue);
    const description = `Bütçe Ödemesi\\nÖdeme: ${p.name}\\nTutar: ${amountStr}\\nKategori: ${p.category?.name || '-'}\\nSon Ödeme Tarihi: ${formattedDate}`;
    const uid = `budget-payment-${p._id || idx}-${start}@budget-manager`;

    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Yarın Ödeme Vadesi: ${summary}`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT0H',
      'ACTION:DISPLAY',
      `DESCRIPTION:Bugün Son Ödeme Günü: ${summary}`,
      'END:VALARM',
      'END:VEVENT'
    ].join('\r\n');
  }).filter(Boolean);

  const calName = `Bütçe Ödemeleri - ${monthLabel}`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Budget Manager//TR//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calName}`,
    'X-WR-TIMEZONE:Europe/Istanbul',
    ...events,
    'END:VCALENDAR'
  ].join('\r\n');
};

export const downloadICSFile = (payments = [], monthLabel = 'Ay') => {
  const content = generateICSContent(payments, monthLabel);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const sanitizedLabel = monthLabel.replace(/[^a-zA-Z0-9_\u00C0-\u017F]/g, '_');
  a.href = url;
  a.download = `Butce_Odemeleri_${sanitizedLabel}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
