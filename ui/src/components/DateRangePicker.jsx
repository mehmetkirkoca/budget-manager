import { useState, useRef, useEffect } from 'react';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function parseISO(s) {
  if (!s) return null;
  const [y,m,d] = s.split('-').map(Number);
  return new Date(y, m-1, d);
}

function MonthCalendar({ year, month, rangeStart, rangeEnd, hoverDate, onClickDay, onHoverDay, days, months }) {
  const totalDays  = new Date(year, month + 1, 0).getDate();
  const startWday  = new Date(year, month, 1).getDay(); // 0=Sun
  const offset     = startWday === 0 ? 6 : startWday - 1; // Mon=0

  const cells = Array(offset).fill(null).concat(
    Array.from({ length: totalDays }, (_, i) => i + 1)
  );
  while (cells.length % 7 !== 0) cells.push(null);

  const rA = rangeStart && rangeEnd
    ? (rangeStart <= rangeEnd ? rangeStart : rangeEnd)
    : rangeStart;
  const rB = rangeStart && rangeEnd
    ? (rangeStart <= rangeEnd ? rangeEnd : rangeStart)
    : (hoverDate || rangeStart);

  return (
    <div className="w-52">
      <p className="text-center text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
        {months[month]} {year}
      </p>
      <div className="grid grid-cols-7 mb-1">
        {days.map(d => (
          <div key={d} className="text-center text-[11px] text-gray-400 dark:text-gray-500 py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="h-8" />;

          const iso  = toISO(new Date(year, month, day));
          const isA  = iso === rA;
          const isB  = rB && iso === rB;
          const inBetween = rA && rB && iso > rA && iso < rB;
          const isToday   = iso === toISO(new Date());

          let cellBg = '';
          if (inBetween) cellBg = 'bg-blue-100 dark:bg-blue-900/40';
          if (isA && rB && rA !== rB) cellBg = 'bg-blue-100 dark:bg-blue-900/40 rounded-l-full';
          if (isB && rA && rA !== rB) cellBg = 'bg-blue-100 dark:bg-blue-900/40 rounded-r-full';

          let dotBg = 'hover:bg-gray-100 dark:hover:bg-gray-700';
          let dotText = isToday
            ? 'font-bold text-blue-500 dark:text-blue-400'
            : 'text-gray-700 dark:text-gray-200';

          if (isA || isB) {
            dotBg  = 'bg-blue-600 hover:bg-blue-700';
            dotText = 'text-white font-semibold';
          }

          return (
            <div
              key={i}
              className={`h-8 flex items-center justify-center ${cellBg}`}
              onClick={() => onClickDay(iso)}
              onMouseEnter={() => onHoverDay(iso)}
            >
              <span className={`w-7 h-7 flex items-center justify-center text-xs rounded-full cursor-pointer transition-colors ${dotBg} ${dotText}`}>
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getMonthOffset(year, month, delta) {
  let m = month + delta;
  let y = year;
  while (m > 11) { m -= 12; y++; }
  while (m < 0)  { m += 12; y--; }
  return { year: y, month: m };
}

export default function DateRangePicker({ startDate, endDate, onChange }) {
  const { t, i18n } = useTranslation();
  const now   = new Date();
  const [open, setOpen]       = useState(false);
  const [viewYear,  setViewYear]  = useState(startDate ? parseISO(startDate).getFullYear()  : now.getFullYear());
  const [viewMonth, setViewMonth] = useState(startDate ? parseISO(startDate).getMonth()     : now.getMonth());
  const [tempStart, setTempStart] = useState(null);
  const [hover, setHover]         = useState(null);
  const ref = useRef(null);

  const days   = t('drpDays').split('_');
  const months = t('drpMonths').split('_');

  const fmtLabel = (s) => {
    if (!s) return '';
    return parseISO(s).toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const openPicker = () => {
    if (startDate) {
      const d = parseISO(startDate);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
    setTempStart(null);
    setHover(null);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setTempStart(null);
        setHover(null);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const navigate = (delta) => {
    const { year, month } = getMonthOffset(viewYear, viewMonth, delta);
    setViewYear(year);
    setViewMonth(month);
  };

  const handleDay = (iso) => {
    if (!tempStart) {
      setTempStart(iso);
      setHover(null);
    } else {
      const a = tempStart <= iso ? tempStart : iso;
      const b = tempStart <= iso ? iso : tempStart;
      onChange({ startDate: a, endDate: b });
      setTempStart(null);
      setHover(null);
      setOpen(false);
    }
  };

  const applyShortcut = (s, e) => {
    onChange({ startDate: s, endDate: e });
    setOpen(false);
  };

  const m2 = getMonthOffset(viewYear, viewMonth, 1);

  const displayStart = tempStart || startDate;
  const displayEnd   = tempStart ? null : endDate;

  const label = startDate && endDate
    ? `${fmtLabel(startDate)} — ${fmtLabel(endDate)}`
    : startDate ? fmtLabel(startDate)
    : '—';

  const shortcuts = [
    { key: 'drpThisMonth',   s: () => { const n=new Date(); return [toISO(new Date(n.getFullYear(),n.getMonth(),1)), toISO(new Date(n.getFullYear(),n.getMonth()+1,0))]; }},
    { key: 'drpLastMonth',   s: () => { const n=new Date(); return [toISO(new Date(n.getFullYear(),n.getMonth()-1,1)), toISO(new Date(n.getFullYear(),n.getMonth(),0))]; }},
    { key: 'drpLast3Months', s: () => { const n=new Date(); return [toISO(new Date(n.getFullYear(),n.getMonth()-2,1)), toISO(new Date(n.getFullYear(),n.getMonth()+1,0))]; }},
    { key: 'drpThisYear',    s: () => { const n=new Date(); return [`${n.getFullYear()}-01-01`, `${n.getFullYear()}-12-31`]; }},
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => open ? setOpen(false) : openPicker()}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors min-w-[240px]
          ${open
            ? 'border-blue-500 ring-1 ring-blue-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
          }`}
      >
        <FiCalendar size={14} className="text-gray-400 flex-shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        {tempStart && <span className="text-[11px] text-blue-500">{t('drpSelectEnd')}</span>}
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-4"
          onMouseLeave={() => { if (tempStart) setHover(null); }}
        >
          {/* nav row */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button onClick={() => navigate(-1)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
              <FiChevronLeft size={16} />
            </button>
            <div className="flex gap-16 text-sm font-medium text-gray-600 dark:text-gray-400 pointer-events-none">
              <span>{months[viewMonth]} {viewYear}</span>
              <span>{months[m2.month]} {m2.year}</span>
            </div>
            <button onClick={() => navigate(1)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
              <FiChevronRight size={16} />
            </button>
          </div>

          {/* two months */}
          <div className="flex gap-4">
            <MonthCalendar
              year={viewYear} month={viewMonth}
              rangeStart={displayStart} rangeEnd={displayEnd}
              hoverDate={tempStart ? hover : null}
              onClickDay={handleDay}
              onHoverDay={(iso) => tempStart && setHover(iso)}
              days={days} months={months}
            />
            <div className="w-px bg-gray-200 dark:bg-gray-700 self-stretch" />
            <MonthCalendar
              year={m2.year} month={m2.month}
              rangeStart={displayStart} rangeEnd={displayEnd}
              hoverDate={tempStart ? hover : null}
              onClickDay={handleDay}
              onHoverDay={(iso) => tempStart && setHover(iso)}
              days={days} months={months}
            />
          </div>

          {/* shortcuts */}
          <div className="flex gap-2 pt-3 mt-1 border-t border-gray-100 dark:border-gray-700">
            {shortcuts.map(({ key, s }) => (
              <button
                key={key}
                onClick={() => { const [a,b] = s(); applyShortcut(a, b); }}
                className="px-2.5 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {t(key)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
