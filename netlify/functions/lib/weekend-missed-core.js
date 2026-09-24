// Keep DDI/group mappings in sync with index.html DDI_LIST
const DDI_LIST = [
  { name: 'A1', number: '01767669575', ddi: '+441767669575', groups: ['A.1leads.service4@4com.im'] },
  { name: 'Beds', number: '01582320570', ddi: '+441582320570', groups: [] },
  { name: 'Manchester', number: '01616740142', ddi: '+441616740142', groups: [] },
  { name: 'Bristol', number: '01174567065', ddi: '+441174567065', groups: ['bristolincoming.service4@4com.im'] },
  { name: 'Gearbox', number: '01932503647', ddi: '+441932503647-gearbox', groups: ['gearboxenquiries.service4@4com.im'] },
  { name: 'Existing customer', number: '01932503647', ddi: '+441932503647-existing', groups: ['existingcustomer.service4@4com.im'] },
  { name: 'Garages24', number: '01932503647', ddi: '+441932503647-garages24', groups: ['garages24.service4@4com.im'] },
  { name: 'Customer 24', number: '01932503647', ddi: '+441932503647-customer24', groups: ['customer24.service4@4com.im'] },
  { name: 'Night service', number: '01932503647', ddi: '+441932503647-night', groups: ['nightservice.service4@4com.im'] },
  { name: 'Leeds', number: '01133231775', ddi: '+441133231775', groups: ['leedsincoming.service4@4com.im'] },
  { name: 'South-east', number: '01580239610', ddi: '+441580239610', groups: ['weybridgeincoming1.service4@4com.im', 'cranbrookincoming.service4@4com.im'] },
  { name: 'Midlands', number: '01922666376', ddi: '+441922666376', groups: ['walsallincoming.service4@4com.im'] },
  { name: 'London', number: '02039056741', ddi: '+442039056741', groups: ['londonincoming.service4@4com.im'] }
];

const RECORDER_LINE_NAMES = {
  '+441932503647-gearbox': 'Main',
  '+441932503647-existing': 'Main',
  '+441932503647-garages24': 'Main',
  '+441932503647-customer24': 'Main',
  '+441932503647-night': 'Main',
  '+441767669575': 'A1',
  '+441582320570': 'Beds',
  '+441616740142': 'Manchester',
  '+441174567065': 'Bristol',
  '+441133231775': 'Leeds',
  '+441580239610': 'South East',
  '+441922666376': 'Midlands',
  '+442039056741': 'London'
};

const BANK_HOLIDAY_CACHE_MS = 24 * 60 * 60 * 1000;
let bankHolidayCache = { at: 0, dates: new Set() };

function getLondonParts(date) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
  const parts = {};
  fmt.formatToParts(date).forEach(p => { if (p.type !== 'literal') parts[p.type] = p.value; });
  return parts;
}

function londonDateStringFromParts(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getLondonDateString(offsetDays, fromDate) {
  const base = fromDate || new Date();
  const p = getLondonParts(base);
  const utcNoon = Date.UTC(+p.year, +p.month - 1, +p.day, 12, 0, 0);
  const shifted = new Date(utcNoon + (offsetDays || 0) * 86400000);
  const sp = getLondonParts(shifted);
  return londonDateStringFromParts(sp.year, sp.month, sp.day);
}

function londonWeekday(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function offsetFromDate(dateStr, dayOffset) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + dayOffset, 12, 0, 0));
  const sp = getLondonParts(shifted);
  return londonDateStringFromParts(sp.year, sp.month, sp.day);
}

async function loadBankHolidayDates() {
  if (Date.now() - bankHolidayCache.at < BANK_HOLIDAY_CACHE_MS && bankHolidayCache.dates.size) {
    return bankHolidayCache.dates;
  }
  const dates = new Set();
  try {
    const res = await fetch('https://www.gov.uk/bank-holidays.json');
    if (res.ok) {
      const data = await res.json();
      ['england-and-wales', 'scotland', 'northern-ireland'].forEach(region => {
        const events = data[region] && data[region].events;
        if (!events) return;
        events.forEach(ev => {
          if (ev && ev.date) dates.add(ev.date);
        });
      });
    }
  } catch (e) {
    // Fallback: common static dates if gov API unavailable
    ['2025-12-25', '2025-12-26', '2026-01-01', '2026-04-03', '2026-04-06', '2026-05-04', '2026-05-25', '2026-08-31', '2026-12-25', '2026-12-28'].forEach(d => dates.add(d));
  }
  bankHolidayCache = { at: Date.now(), dates };
  return dates;
}

function isBankHoliday(dateStr, bankHolidays) {
  return bankHolidays.has(dateStr);
}

async function getWeekendDateRange(preset, customStart, customEnd) {
  const bankHolidays = await loadBankHolidayDates();
  const today = getLondonDateString(0);
  const dow = londonWeekday(today);

  if (preset === 'custom' && customStart && customEnd) {
    return buildRange(customStart, customEnd, 'Custom range');
  }

  if (preset === 'this-weekend') {
    const satOffset = dow === 6 ? 0 : dow === 0 ? -1 : (6 - dow);
    const sunOffset = satOffset + 1;
    const dates = [];
    const sat = getLondonDateString(satOffset);
    const sun = getLondonDateString(sunOffset);
    if (sat <= today) dates.push(sat);
    if (sun <= today) dates.push(sun);
    if (!dates.length) dates.push(sat, sun);
    return {
      dates: uniqueSortedDates(dates),
      label: 'This weekend so far'
    };
  }

  const sunOffset = dow === 0 ? -7 : -dow;
  const satOffset = sunOffset - 1;
  let dates = [getLondonDateString(satOffset), getLondonDateString(sunOffset)];

  if (preset === 'extended-last') {
    const fri = offsetFromDate(dates[0], -1);
    const mon = offsetFromDate(dates[1], 1);
    if (isBankHoliday(mon, bankHolidays) || isBankHoliday(fri, bankHolidays) || isBankHoliday(dates[0], bankHolidays) || isBankHoliday(dates[1], bankHolidays)) {
      dates = [fri, ...dates, mon];
    }
  }

  return {
    dates: uniqueSortedDates(dates),
    label: preset === 'extended-last' ? 'Last extended weekend' : 'Last weekend'
  };
}

function uniqueSortedDates(dates) {
  return [...new Set(dates.filter(Boolean))].sort();
}

function buildRange(start, end, label) {
  const dates = [];
  let cur = start;
  while (cur <= end) {
    dates.push(cur);
    cur = offsetFromDate(cur, 1);
  }
  return { dates, label: label || `${start} to ${end}` };
}

function normaliseDirection(call) {
  const dir = (call.Direction || '').toUpperCase();
  if (dir === 'INC' || dir === 'IU' || dir === 'OUT') return dir;
  if (dir === 'I' || dir === 'IN') {
    return (call.Unanswer === '1' || call.Unanswer === 1) ? 'IU' : 'INC';
  }
  if (dir === 'O') return 'OUT';
  return dir;
}

function matchDdiByNumber(val) {
  if (!val) return null;
  const n = String(val).replace(/\s/g, '');
  return DDI_LIST.find(d =>
    n.includes(d.number) ||
    n.includes(d.ddi.replace('+', '')) ||
    d.ddi.includes(n)
  ) || null;
}

function matchDdiByGroup(group) {
  if (!group) return null;
  const g = String(group).toLowerCase();
  return DDI_LIST.find(d => (d.groups || []).some(x => g.includes(x.toLowerCase()))) || null;
}

function findDdiForCall(call) {
  if (!call) return null;
  return matchDdiByGroup(call.Group_no || call.DDIOrGroup) ||
    matchDdiByNumber(call.Port || call.DDIOrGroup) ||
    null;
}

function getRecorderLineName(ddi) {
  if (!ddi) return 'Unknown';
  return RECORDER_LINE_NAMES[ddi.ddi] || ddi.name;
}

function getCallDateField(call) {
  return call.Call_date || call.CallDate || call.call_date || '';
}

function getCallDate(callDate) {
  if (!callDate) return null;
  const str = String(callDate).trim();
  let m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    const p = getLondonParts(parsed);
    return londonDateStringFromParts(p.year, p.month, p.day);
  }
  return null;
}

function callRecordKey(c) {
  return `${c.RecordId || c.CallId || ''}:${c.Call_date}:${c.Direction}:${c.Unanswer}:${c.Duration}:${c.Ring_time}:${c.Port || ''}`;
}

function mergeCallRecords(...sources) {
  const seen = new Set();
  const out = [];
  sources.flat().filter(Boolean).forEach(c => {
    const key = callRecordKey(c);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(c);
  });
  return out;
}

function formatPhone(num) {
  if (!num) return '';
  const raw = String(num).replace(/\s/g, '');
  if (raw.startsWith('+44')) {
    const n = '0' + raw.slice(3);
    if (n.length === 11) return `${n.slice(0, 5)} ${n.slice(5, 8)} ${n.slice(8)}`;
  }
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) {
    return `${digits.slice(0, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return num;
}

function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function formatRecorderDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/London' });
}

function buildMissedRows(calls, statusByKey) {
  return calls
    .filter(c => normaliseDirection(c) === 'IU')
    .map(c => {
      const ddi = findDdiForCall(c);
      const dateStr = getCallDate(getCallDateField(c)) || '';
      const timeMatch = String(c.Call_date || '').match(/(\d{2}:\d{2}:\d{2}|\d{2}:\d{2})/);
      const caller = c.Number || c.Caller_ID || '';
      const key = callRecordKey(c);
      return {
        key,
        date: dateStr,
        dateLabel: dateStr ? formatRecorderDate(dateStr) : '',
        time: timeMatch ? timeMatch[1] : '',
        line: getRecorderLineName(ddi),
        garage: ddi ? ddi.name : 'Unknown',
        caller: formatPhone(caller),
        callerRaw: caller,
        ringTime: c.Ring_time > 0 ? formatDuration(c.Ring_time) : '0:00',
        queue: c.DDIOrGroup || c.Group_no || '',
        status: (statusByKey && statusByKey[key]) || ''
      };
    })
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
}

function buildMissedCsv(rows) {
  const header = ['Date', 'Time', 'Line', 'Garage', 'Caller', 'Ring time', 'Queue', 'Callback status'];
  const csvRows = [header.join(',')];
  rows.forEach(r => {
    const vals = [r.date, r.time, r.line, r.garage, r.caller, r.ringTime, r.queue, r.status]
      .map(v => `"${String(v || '').replace(/"/g, '""')}"`);
    csvRows.push(vals.join(','));
  });
  return csvRows.join('\n');
}

function summariseByLine(rows) {
  const counts = {};
  rows.forEach(r => {
    counts[r.line] = (counts[r.line] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

async function fetchMissedCallsForDates(getCallsForDateRangeFn, dates) {
  let all = [];
  for (const date of dates) {
    const dayCalls = await getCallsForDateRangeFn(date, date);
    all = mergeCallRecords(all, dayCalls);
  }
  return all;
}

module.exports = {
  DDI_LIST,
  getLondonDateString,
  getWeekendDateRange,
  loadBankHolidayDates,
  buildMissedRows,
  buildMissedCsv,
  summariseByLine,
  fetchMissedCallsForDates,
  mergeCallRecords,
  normaliseDirection,
  getCallDate,
  callRecordKey
};
