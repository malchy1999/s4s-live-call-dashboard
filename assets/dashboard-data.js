/* S4S dashboard data layer — extracted from classic.html; do not change API/data logic */
'use strict';

    // ============================================================
    // CONFIGURATION
    // Tollring credentials are stored in Netlify environment variables.
    // See .env.example for local development.
    // ============================================================
    const API_PROXY = '/api/tollring';
    const DEMO_MODE = false; // Set true to force demo data without calling the API
    const DEBUG = false;

    // Replace placeholder numbers with your real garage DDIs before going live
    const DDI_LIST = [
      { name: 'A1',         number: '01767669575', ddi: '+441767669575', groups: ['A.1leads.service4@4com.im'] },
      { name: 'Beds',       number: '01582320570', ddi: '+441582320570', groups: [] },
      { name: 'Manchester', number: '01616740142', ddi: '+441616740142', groups: [] },
      { name: 'Bristol',    number: '01174567065', ddi: '+441174567065', groups: ['bristolincoming.service4@4com.im'] },
      { name: 'Gearbox',    number: '01932503647', ddi: '+441932503647-gearbox', groups: ['gearboxenquiries.service4@4com.im'] },
      { name: 'Existing customer', number: '01932503647', ddi: '+441932503647-existing', groups: ['existingcustomer.service4@4com.im'] },
      { name: 'Garages24',  number: '01932503647', ddi: '+441932503647-garages24', groups: ['garages24.service4@4com.im'] },
      { name: 'Customer 24', number: '01932503647', ddi: '+441932503647-customer24', groups: ['customer24.service4@4com.im'] },
      { name: 'Night service', number: '01932503647', ddi: '+441932503647-night', groups: ['nightservice.service4@4com.im'] },
      { name: '0808 National', number: '08081640418', ddi: '+448081640418', groups: [] },
      { name: 'A1 0808', number: '08085034208', ddi: '+448085034208', groups: [] },
      { name: 'AI ads', number: '01483397592', ddi: '+441483397592', groups: [] },
      { name: 'Leeds',      number: '01133231775', ddi: '+441133231775', groups: ['leedsincoming.service4@4com.im'] },
      { name: 'South-east', number: '01580239610', ddi: '+441580239610', groups: ['weybridgeincoming1.service4@4com.im', 'cranbrookincoming.service4@4com.im'] },
      { name: 'Midlands',   number: '01922666376', ddi: '+441922666376', groups: ['walsallincoming.service4@4com.im'] },
      { name: 'London',     number: '02039056741', ddi: '+442039056741', groups: ['londonincoming.service4@4com.im'] },
      { name: 'Midlands PPC', number: '01212312310', ddi: '+441212312310', groups: [] },
      { name: 'Central PPC', number: '01582242802', ddi: '+441582242802', groups: [] },
      { name: 'London PPC', number: '02045114333', ddi: '+442045114333', groups: [] },
      { name: 'West PPC', number: '01172353841', ddi: '+441172353841', groups: [] },
      { name: 'Southeast PPC', number: '01580234522', ddi: '+441580234522', groups: [] },
      { name: 'North PPC', number: '01133570843', ddi: '+441133570843', groups: [] },
      { name: 'East Anglia PPC', number: '01473354566', ddi: '+441473354566', groups: [] },
    ];

    const AVATAR_COLOURS = ['#0d77fe','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316','#6366f1','#14b8a6','#eab308','#a855f7','#64748b'];

    // Matches Simple_Call_Number_Recorder spreadsheet lines (Main rolls up all 01932 queues)
    const RECORDER_MAX_DAYS = 30;
    const RECORDER_LINES = [
      { name: 'Main', number: '01932503647', ddiKeys: ['+441932503647-gearbox', '+441932503647-existing', '+441932503647-garages24', '+441932503647-customer24', '+441932503647-night'] },
      { name: '0808 National', number: '08081640418', ddiKeys: ['+448081640418'] },
      { name: 'A1 0808', number: '08085034208', ddiKeys: ['+448085034208'] },
      { name: 'AI ads', number: '01483397592', ddiKeys: ['+441483397592'] },
      { name: 'A1', number: '01767669575', ddiKeys: ['+441767669575'] },
      { name: 'Beds', number: '01582320570', ddiKeys: ['+441582320570'] },
      { name: 'Manchester', number: '01616740142', ddiKeys: ['+441616740142'] },
      { name: 'Bristol', number: '01174567065', ddiKeys: ['+441174567065'] },
      { name: 'Leeds', number: '01133231775', ddiKeys: ['+441133231775'] },
      { name: 'South East', number: '01580239610', ddiKeys: ['+441580239610'] },
      { name: 'Midlands', number: '01922666376', ddiKeys: ['+441922666376'] },
      { name: 'London', number: '02039056741', ddiKeys: ['+442039056741'] },
      { name: 'Midlands PPC', number: '01212312310', ddiKeys: ['+441212312310'] },
      { name: 'Central PPC', number: '01582242802', ddiKeys: ['+441582242802'] },
      { name: 'London PPC', number: '02045114333', ddiKeys: ['+442045114333'] },
      { name: 'West PPC', number: '01172353841', ddiKeys: ['+441172353841'] },
      { name: 'Southeast PPC', number: '01580234522', ddiKeys: ['+441580234522'] },
      { name: 'North PPC', number: '01133570843', ddiKeys: ['+441133570843'] },
      { name: 'East Anglia PPC', number: '01473354566', ddiKeys: ['+441473354566'] },
    ];
    const RECORDER_LINE_COLOURS = [
      '#1f78c9', '#005fb4', '#3d93d4', '#122e47', '#0d9488',
      '#64748b', '#5c7386', '#0891b2', '#2563eb', '#0284c7'
    ];

    function getRecorderLineColour(index) {
      return RECORDER_LINE_COLOURS[index % RECORDER_LINE_COLOURS.length];
    }

    // ============================================================
    // STATE
    // ============================================================
    let isDemoMode = DEMO_MODE;
    let todayCalls = [];
    let yesterdayCalls = [];
    let fortnightCalls = [];
    let archivedCalls = [];
    let liveCalls = [];
    let historyModalOpen = false;
    let historyFilter = 'all';
    let historySearch = '';
    let historyShowCount = 250;
    const HISTORY_PAGE_SIZE = 250;
    const CALL_ARCHIVE_DB = 's4s-call-archive';
    const CALL_ARCHIVE_STORE = 'calls';
    const SNAPSHOT_KEY = 's4s-dashboard-snapshot-v1';
    let showingCachedNumbers = false;
    let lastSnapshot = null;
    let ddiStatuses = {};
    let tickerEvents = [];
    let prevKpiValues = {};
    let lastKnownData = { today: [], yesterday: [], live: [], fortnight: [] };
    let demoInterval = null;
    let liveTimerInterval = null;
    let isPolling = false;
    let pollIntervalId = null;
    let hasConnectedOnce = false;
    let dashboardDataReady = false;
    const POLL_INTERVAL_MS = 30000;
    const FORTNIGHT_TTL_MS = 5 * 60 * 1000;
    let lastFortnightFetchAt = 0;
    let fortnightFetchDays = 0;
    let recorderPeriodDays = 14;
    let recorderSelectedDate = null;
    let recorderCalendarView = null;
    let recorderHistoryLoading = false;
    let weekendPreset = 'last-weekend';
    let weekendMissedRows = [];
    let weekendRangeLabel = '';
    let weekendLoading = false;
    let bankHolidayDates = new Set();
    let bankHolidayLoadedAt = 0;
    const WEEKEND_CALLBACK_KEY = 's4s-weekend-callback-status-v1';
    const WEEKEND_CALLBACK_OPTIONS = ['To call back', 'Called back', 'Voicemail left', 'Booked', 'No answer'];
    const RECORDER_LINE_NAMES = {
      '+441932503647-gearbox': 'Main',
      '+441932503647-existing': 'Main',
      '+441932503647-garages24': 'Main',
      '+441932503647-customer24': 'Main',
      '+441932503647-night': 'Main',
      '+448081640418': '0808 National',
      '+448085034208': 'A1 0808',
      '+441483397592': 'AI ads',
      '+441767669575': 'A1',
      '+441582320570': 'Beds',
      '+441616740142': 'Manchester',
      '+441174567065': 'Bristol',
      '+441133231775': 'Leeds',
      '+441580239610': 'South East',
      '+441922666376': 'Midlands',
      '+442039056741': 'London',
      '+441212312310': 'Midlands PPC',
      '+441582242802': 'Central PPC',
      '+442045114333': 'London PPC',
      '+441172353841': 'West PPC',
      '+441580234522': 'Southeast PPC',
      '+441133570843': 'North PPC',
      '+441473354566': 'East Anglia PPC'
    };
    let chartDataCache = null;
    let chartPeriod = 'today';
    const chartSelectedDdis = new Set();

    const uiSnapshots = {
      liveKey: '',
      todayKey: '',
      yesterdayKey: '',
      liveKpiKey: '',
      kpiStatsKey: '',
      ddiCountsKey: '',
      ddiStatusKey: '',
      chartKey: '',
      recentKey: '',
      tickerKey: '',
      missedKey: '',
      recorderKey: '',
      historyKey: ''
    };

    DDI_LIST.forEach(d => { ddiStatuses[d.ddi] = 'idle'; });

    function resetUiSnapshots() {
      Object.keys(uiSnapshots).forEach(k => { uiSnapshots[k] = ''; });
    }

    function callRecordKey(c) {
      return `${c.RecordId || c.CallId || ''}:${c.Call_date}:${c.Direction}:${c.Unanswer}:${c.Duration}:${c.Ring_time}:${c.Port || ''}`;
    }

    function fingerprintCalls(calls) {
      if (!calls.length) return '0';
      let hash = calls.length;
      for (let i = 0; i < calls.length; i++) {
        hash = (hash + (calls[i].RecordId || 0)) | 0;
      }
      return `${calls.length}:${hash}:${callRecordKey(calls[calls.length - 1])}`;
    }

    function fingerprintLive(calls) {
      if (!calls.length) return '0';
      return calls.map(c =>
        `${c.Caller_ID}|${c.Extension}|${c.Call_Status}|${c.DDIOrGroup}|${c.Direction}`
      ).join(';');
    }

    function findNewCalls(prev, next) {
      if (!prev.length) return [];
      const ids = new Set(prev.map(c => c.RecordId || c.CallId || callRecordKey(c)));
      return next.filter(c => !ids.has(c.RecordId || c.CallId || callRecordKey(c)));
    }

    function mergeCallRecords(...sources) {
      const byId = new Map();
      sources.flat().filter(Boolean).forEach(c => {
        if (!c) return;
        const key = archiveCallId(c);
        byId.set(key, preferCallRecord(byId.get(key), c));
      });
      return Array.from(byId.values());
    }

    function archiveCallId(c) {
      if (!c) return '';
      if (c._archiveId) return c._archiveId;
      if (c.RecordId) return 'rid:' + c.RecordId;
      if (c.CallId) return 'cid:' + c.CallId;
      return 'fp:' + callRecordKey(c);
    }

    function sanitiseCallForArchive(c) {
      const copy = Object.assign({}, c);
      delete copy._ddi;
      delete copy._startTime;
      copy._archiveId = archiveCallId(c);
      return copy;
    }

    function callCompleteness(c) {
      return Number(c.Duration || 0) + Number(c.Talk_time || 0) + Number(c.Ring_time || 0) +
        (c.Unanswer != null && c.Unanswer !== '' ? 1 : 0);
    }

    function preferCallRecord(existing, incoming) {
      if (!existing) return incoming;
      return callCompleteness(incoming) >= callCompleteness(existing) ? incoming : existing;
    }

    function getAllKnownCalls() {
      if (isDemoMode) return mergeCallRecords(demoFortnightCalls, demoTodayCalls, demoYesterdayCalls);
      return mergeCallRecords(archivedCalls, fortnightCalls, todayCalls, yesterdayCalls);
    }

    function openCallArchiveDb() {
      return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
          reject(new Error('IndexedDB not available'));
          return;
        }
        const req = indexedDB.open(CALL_ARCHIVE_DB, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(CALL_ARCHIVE_STORE)) {
            db.createObjectStore(CALL_ARCHIVE_STORE, { keyPath: '_archiveId' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
      });
    }

    async function loadCallArchive() {
      if (isDemoMode || DEMO_MODE) return;
      try {
        const db = await openCallArchiveDb();
        archivedCalls = await new Promise((resolve, reject) => {
          const tx = db.transaction(CALL_ARCHIVE_STORE, 'readonly');
          const req = tx.objectStore(CALL_ARCHIVE_STORE).getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
        debug('Call archive loaded: ' + archivedCalls.length);
      } catch (e) {
        debug('Call archive load failed: ' + (e && e.message ? e.message : e));
        archivedCalls = archivedCalls || [];
      }
    }

    async function persistArchive(changedCalls) {
      if (isDemoMode || !changedCalls || !changedCalls.length) return;
      try {
        const db = await openCallArchiveDb();
        await new Promise((resolve, reject) => {
          const tx = db.transaction(CALL_ARCHIVE_STORE, 'readwrite');
          const store = tx.objectStore(CALL_ARCHIVE_STORE);
          changedCalls.forEach(c => store.put(c));
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch (e) {
        debug('Call archive save failed: ' + (e && e.message ? e.message : e));
      }
    }

    function ingestCallsIntoArchive(calls) {
      if (isDemoMode || !calls || !calls.length) return 0;
      const byId = new Map(archivedCalls.map(c => [archiveCallId(c), c]));
      const changed = [];
      let added = 0;
      calls.forEach(raw => {
        if (!raw) return;
        const incoming = sanitiseCallForArchive(raw);
        const existing = byId.get(incoming._archiveId);
        if (!existing) {
          byId.set(incoming._archiveId, incoming);
          changed.push(incoming);
          added++;
          return;
        }
        const better = callCompleteness(incoming) > callCompleteness(existing) ||
          callRecordKey(incoming) !== callRecordKey(existing);
        if (!better) return;
        incoming._archiveId = existing._archiveId;
        byId.set(existing._archiveId, incoming);
        changed.push(incoming);
      });
      if (changed.length) {
        archivedCalls = Array.from(byId.values());
        persistArchive(changed);
        uiSnapshots.recorderKey = '';
        uiSnapshots.recentKey = '';
        uiSnapshots.historyKey = '';
        if (window.S4S && window.S4S.updateHistoryButton) window.S4S.updateHistoryButton();
        if (historyModalOpen && window.S4S && window.S4S.renderCallHistory) window.S4S.renderCallHistory(true);
      }
      return added;
    }

    function callsForLondonDate(calls, dateStr) {
      return (calls || []).filter(c => getCallDate(getCallDateField(c)) === dateStr);
    }

    function hasCachedNumbers() {
      return showingCachedNumbers || todayCalls.length > 0 || yesterdayCalls.length > 0 || archivedCalls.length > 0;
    }

    function hydrateCallsFromArchive() {
      const all = archivedCalls.length ? archivedCalls : fortnightCalls;
      if (!all.length) return false;
      const todayStr = getLondonDateString(0);
      const yestStr = getLondonDateString(-1);
      if (!todayCalls.length) todayCalls = callsForLondonDate(all, todayStr);
      if (!yesterdayCalls.length) yesterdayCalls = callsForLondonDate(all, yestStr);
      if (!fortnightCalls.length) fortnightCalls = all.slice();
      showingCachedNumbers = true;
      dashboardDataReady = true;
      return true;
    }

    function saveDashboardSnapshot() {
      if (isDemoMode) return;
      try {
        const t = processCallsData(todayCalls);
        const y = processYesterdayCounts(yesterdayCalls);
        lastSnapshot = {
          savedAt: Date.now(),
          savedDate: getLondonDateString(0),
          liveCount: Array.isArray(liveCalls) ? liveCalls.length : 0,
          inbound: t.inbound,
          outbound: t.outbound,
          answered: t.answered,
          missed: t.missed,
          avgRing: t.avgRing,
          answerRate: t.answerRate,
          missedRate: t.missedRate,
          yInbound: y.inbound,
          yOutbound: y.outbound,
          yAnswered: y.answered,
          yMissed: y.missed,
          yAvgRing: y.avgRing,
          ddiCounts: t.ddiCounts,
          yDdiCounts: y.ddiCounts,
          lastFortnightFetchAt,
          fortnightFetchDays
        };
        localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(lastSnapshot));
      } catch (e) {
        debug('Snapshot save failed: ' + (e && e.message ? e.message : e));
      }
    }

    function applyDashboardSnapshot() {
      if (isDemoMode || DEMO_MODE) return null;
      let s;
      try {
        s = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || 'null');
      } catch (e) {
        return null;
      }
      if (!s || typeof s !== 'object') return null;
      lastSnapshot = s;

      if (typeof s.lastFortnightFetchAt === 'number') lastFortnightFetchAt = s.lastFortnightFetchAt;
      if (s.fortnightFetchDays) fortnightFetchDays = s.fortnightFetchDays;

      const sameDay = s.savedDate === getLondonDateString(0);
      if (sameDay) {
        showingCachedNumbers = true;
        dashboardDataReady = true;
      }

      if (s.savedAt) {
        const p = getLondonParts(new Date(s.savedAt));
        updateConnectionStatus('live', `${p.hour}:${p.minute}:${p.second} · refreshing`);
      }
      return s;
    }

    // ============================================================
    // UTILITIES
    // ============================================================
    function debug(msg) {
      if (DEBUG) console.log('[S4S]', msg);
    }

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

    function getLondonDateString(offsetDays) {
      const now = new Date();
      const p = getLondonParts(now);
      const utcNoon = Date.UTC(+p.year, +p.month - 1, +p.day, 12, 0, 0);
      const shifted = new Date(utcNoon + (offsetDays || 0) * 86400000);
      const sp = getLondonParts(shifted);
      return `${sp.year}-${sp.month}-${sp.day}`;
    }

    function getDateRange(offsetDays) {
      const ds = getLondonDateString(offsetDays || 0);
      return { StartDate: `${ds} 00:00:00`, EndDate: `${ds} 23:59:59` };
    }

    function getSpanDateRange(startOffset, endOffset) {
      const start = getLondonDateString(startOffset);
      const end = getLondonDateString(endOffset);
      return { StartDate: `${start} 00:00:00`, EndDate: `${end} 23:59:59` };
    }

    function buildDayLabels(endOffset, count) {
      const labels = [];
      const startOffset = endOffset - (count - 1);
      for (let i = 0; i < count; i++) {
        labels.push(getLondonDateString(startOffset + i));
      }
      return labels;
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
      if (m) {
        return `${m[3]}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
      }
      m = str.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
      if (m) return `${m[1]}-${m[2]}-${m[3]}`;
      const parsed = new Date(str);
      if (!Number.isNaN(parsed.getTime())) {
        const p = getLondonParts(parsed);
        return `${p.year}-${p.month}-${p.day}`;
      }
      return null;
    }

    function formatDayLabel(dateStr) {
      if (!dateStr) return '--';
      const parts = dateStr.split('-');
      const dt = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2], 12, 0, 0));
      const weekday = dt.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'Europe/London' });
      return `${weekday}\u00a0${parts[2]}/${parts[1]}`;
    }

    function filterCallsInLabels(calls, labels) {
      const allowed = new Set(labels);
      return calls.filter(c => allowed.has(getCallDate(getCallDateField(c))));
    }

    function bucketByDay(calls, dayLabels) {
      const buckets = new Array(dayLabels.length).fill(0);
      calls.forEach(c => {
        const d = getCallDate(getCallDateField(c));
        const idx = dayLabels.indexOf(d);
        if (idx >= 0) buckets[idx]++;
      });
      return buckets;
    }

    function bucketByDayPerDdi(calls, dayLabels) {
      const buckets = {};
      DDI_LIST.forEach(d => { buckets[d.ddi] = new Array(dayLabels.length).fill(0); });
      calls.forEach(c => {
        const ddi = findDdiForCall(c);
        if (!ddi) return;
        const d = getCallDate(getCallDateField(c));
        const idx = dayLabels.indexOf(d);
        if (idx >= 0) buckets[ddi.ddi][idx]++;
      });
      return buckets;
    }

    function formatTime(seconds) {
      const s = Math.max(0, Math.floor(seconds));
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    }

    function formatDuration(seconds) {
      if (!seconds || seconds <= 0) return '0:00';
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${String(s).padStart(2,'0')}`;
    }

    function pctChange(today, yesterday) {
      if (yesterday === 0) return today > 0 ? 100 : 0;
      return Math.round(((today - yesterday) / yesterday) * 100);
    }

    function formatPct(val) {
      if (val > 0) return `\u2191 ${val}% vs yesterday`;
      if (val < 0) return `\u2193 ${Math.abs(val)}% vs yesterday`;
      return 'No change vs yesterday';
    }

    function matchDdiByNumber(val) {
      if (!val) return null;
      const n = String(val).replace(/\s/g, '');
      const digits = n.replace(/\D/g, '');
      const national = digits.startsWith('44') ? '0' + digits.slice(2) : digits;
      return DDI_LIST.find(d => {
        const ddiDigits = String(d.ddi).replace(/\D/g, '');
        return n.includes(d.number) ||
          n.includes(d.ddi.replace('+', '')) ||
          d.ddi.includes(n) ||
          national === d.number ||
          digits === ddiDigits;
      }) || null;
    }

    function matchDdiByGroup(group) {
      if (!group) return null;
      const g = group.toLowerCase();
      return DDI_LIST.find(d => (d.groups || []).some(x => g.includes(x.toLowerCase()))) || null;
    }

    function findDdiForCall(call) {
      if (!call) return null;
      return matchDdiByGroup(call.Group_no || call.DDIOrGroup) ||
        matchDdiByNumber(call.Port || call.DDIOrGroup) ||
        null;
    }

    function findDdiByDdiOrGroup(val) {
      if (!val) return null;
      return matchDdiByGroup(val) || matchDdiByNumber(val);
    }

    function parseStatusSeconds(val) {
      if (val == null || val === '') return 0;
      if (typeof val === 'number') return Math.max(0, Math.floor(val));
      const str = String(val);
      const parts = str.split(':').map(p => parseInt(p, 10));
      if (parts.length === 3 && parts.every(p => !Number.isNaN(p))) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      const n = parseInt(str, 10);
      return Number.isNaN(n) ? 0 : Math.max(0, n);
    }

    function flashElement(el) {
      if (!el) return;
      el.classList.remove('flash');
      void el.offsetWidth;
      el.classList.add('flash');
    }

    function showToast(msg) {
      const container = document.getElementById('toastContainer');
      const t = document.createElement('div');
      t.className = 'toast';
      t.textContent = msg;
      container.appendChild(t);
      setTimeout(() => t.remove(), 3000);
    }

    function showError(msg) {
      if (window.S4S && typeof window.S4S.setErrorDetail === 'function') {
        window.S4S.setErrorDetail(msg);
      }
      updateConnectionStatus('error', msg);
      if (window.S4S && typeof window.S4S.setStaleNotice === 'function') {
        window.S4S.setStaleNotice(true);
      }
    }

    function hideError() {
      if (window.S4S && typeof window.S4S.setErrorDetail === 'function') {
        window.S4S.setErrorDetail('');
      }
    }

    function updateConnectionStatus(mode, detail) {
      if (window.S4S && typeof window.S4S.updateConnectionStatus === 'function') {
        window.S4S.updateConnectionStatus(mode, detail);
      }
    }

    function showSetupPanel(message) {
      const msgEl = document.getElementById('setupPanelMsg');
      if (msgEl) msgEl.textContent = message;
      updateConnectionStatus('error', "Can't reach 4com");
    }

    function hideSetupPanel() {
      const help = document.getElementById('connectionHelp');
      if (help && !isDemoMode) help.open = false;
    }

    function enableDemoPreview() {
      hideSetupPanel();
      hideError();
      activateDemoMode('Showing demo data. Connect the API for live calls.');
    }


    function enableDemoBadge() {
      dashboardDataReady = true;
      updateConnectionStatus('demo');
      const banner = document.getElementById('demoBanner');
      if (banner) banner.hidden = false;
    }

    // ============================================================
    // REQUEST QUEUE
    // ============================================================
    class TollringQueue {
      constructor() {
        this.queue = [];
        this.running = false;
        this.gap = 2000;
      }
      add(fn) {
        return new Promise((resolve, reject) => {
          this.queue.push({ fn, resolve, reject });
          this.run();
        });
      }
      async run() {
        if (this.running) return;
        this.running = true;
        while (this.queue.length > 0) {
          const { fn, resolve, reject } = this.queue.shift();
          try {
            const result = await fn();
            resolve(result);
          } catch (e) {
            reject(e);
          }
          if (this.queue.length > 0) {
            await new Promise(r => setTimeout(r, this.gap));
          }
        }
        this.running = false;
      }
    }

    const apiQueue = new TollringQueue();

    // ============================================================
    // API FUNCTIONS
    // ============================================================
    function isRateLimitError(data, status) {
      const code = data.Result?.ErrorCode;
      if (code === '0x1009') return true;
      if ((status === 401 || status === 403) && code !== '0x1006') return true;
      return false;
    }

    function isAuthError(data) {
      return data.Result?.ErrorCode === '0x1006';
    }

    async function fetchTollring(endpoint, method, body, isRetry) {
      const path = endpoint.replace(/^\//, '');
      const opts = {
        method: method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      if (body) opts.body = JSON.stringify(body);

      const res = await fetch(`${API_PROXY}?path=${encodeURIComponent(path)}`, opts);
      let data = {};
      try {
        data = await res.json();
      } catch (_) {
        data = {};
      }

      if (isRateLimitError(data, res.status)) {
        if (!isRetry) {
          debug('Rate limited, retrying in 8s: ' + path);
          await new Promise(r => setTimeout(r, 8000));
          return fetchTollring(endpoint, method, body, true);
        }
        throw new Error('RATE_LIMIT:' + (data.Result?.Description || 'Too many API requests. Will retry on next poll.'));
      }

      if (isAuthError(data) || ((res.status === 401 || res.status === 403) && !data.Result)) {
        const detail = data.Result ? JSON.stringify(data.Result) : '';
        throw new Error('AUTH_FAILED:' + (data.Result?.Description || 'API Authentication Failed.') + (detail ? ' ' + detail : ''));
      }
      if (res.status === 503 && data.error === 'DEMO_MODE') {
        throw new Error('DEMO_MODE');
      }
      if (res.status === 503 && data.error === 'NOT_CONFIGURED') {
        throw new Error('CONFIG:' + (data.message || 'Tollring is not configured.'));
      }
      if (!res.ok) {
        const detail = data.message || data.error || data.Result?.Description || res.status;
        throw new Error('API_ERROR:' + detail);
      }
      if (data.Result && data.Result.ErrorCode && data.Result.ErrorCode !== '0x0000') {
        throw new Error('API_ERROR:' + (data.Result.Description || data.Result.ErrorCode));
      }
      hasConnectedOnce = true;
      return data;
    }

    function tollringRecords(data) {
      if (Array.isArray(data)) return data;
      if (!data || typeof data !== 'object') return [];
      const direct = data.Data ?? data.Calls ?? data.calls;
      if (Array.isArray(direct)) return direct;
      if (direct && typeof direct === 'object') {
        if (Array.isArray(direct.Calls)) return direct.Calls;
        if (Array.isArray(direct.calls)) return direct.calls;
      }
      return [];
    }

    function queuedFetch(endpoint, method, body) {
      return apiQueue.add(() => fetchTollring(endpoint, method, body, false));
    }

    function startPolling() {
      pollAllData(true);
      if (pollIntervalId) clearInterval(pollIntervalId);
      pollIntervalId = setInterval(() => pollAllData(false), POLL_INTERVAL_MS);
    }

    function handleApiFailure(context, err) {
      debug(context + ' failed: ' + err.message);
      if (err.message === 'DEMO_MODE') {
        activateDemoMode('Server demo mode is enabled.');
        return true;
      }
      if (err.message.startsWith('CONFIG:')) {
        const msg = err.message.slice(7);
        showError(msg);
        showSetupPanel(msg);
        if (!hasCachedNumbers()) renderEmptyDashboard();
        return true;
      }
      if (err.message.startsWith('RATE_LIMIT:')) {
        const msg = err.message.slice(11);
        showError('4com API busy: ' + msg);
        return true;
      }
      if (err.message === 'AUTH_FAILED' || err.message.startsWith('AUTH_FAILED:')) {
        const msg = err.message.startsWith('AUTH_FAILED:')
          ? err.message.slice('AUTH_FAILED:'.length)
          : 'Tollring rejected the credentials. Check TOLLRING_USERNAME and TOLLRING_TOKEN in your environment variables.';
        if (hasConnectedOnce || hasCachedNumbers()) {
          showError('Temporary API auth issue — keeping last data. Will retry automatically.');
          debug('Auth error after successful connection (likely rate limit): ' + msg);
          return true;
        }
        showError(msg);
        showSetupPanel(msg);
        renderEmptyDashboard();
        return true;
      }
      if (err.message.startsWith('API_ERROR:')) {
        showError('Tollring API error: ' + err.message.slice(10));
        return true;
      }
      if (hasConnectedOnce || hasCachedNumbers()) {
        showError('Could not refresh call data. Will retry on next poll.');
        return true;
      }
      showError('Could not reach the call data API. Check your Netlify environment variables and try again.');
      return true;
    }

    async function getLiveCalls() {
      if (isDemoMode) return demoGetLiveCalls();
      try {
        const data = await queuedFetch('GetLiveCalls', 'GET');
        lastKnownData.live = data;
        hideError();
        hideSetupPanel();
        return tollringRecords(data);
      } catch (e) {
        handleApiFailure('GetLiveCalls', e);
        const cached = tollringRecords(lastKnownData.live);
        return cached.length ? cached : (liveCalls || []);
      }
    }

    async function getCallsByDate(offsetDays) {
      if (isDemoMode) return offsetDays === -1 ? demoYesterdayCalls : demoTodayCalls;
      const range = getDateRange(offsetDays || 0);
      const body = { ...range, Directions: 'INC,IU,OUT' };
      try {
        const data = await queuedFetch('GetCallsByDate', 'POST', body);
        if (offsetDays === -1) {
          lastKnownData.yesterday = data;
        } else {
          lastKnownData.today = data;
        }
        hideError();
        hideSetupPanel();
        return tollringRecords(data);
      } catch (e) {
        handleApiFailure('GetCallsByDate', e);
        const cached = offsetDays === -1 ? lastKnownData.yesterday : lastKnownData.today;
        const records = tollringRecords(cached);
        if (records.length) return records;
        return offsetDays === -1 ? yesterdayCalls : todayCalls;
      }
    }

    async function getCallsForSpan(startOffset, endOffset) {
      if (isDemoMode) {
        const labels = buildDayLabels(endOffset, endOffset - startOffset + 1);
        return filterCallsInLabels(demoFortnightCalls, labels);
      }
      const range = getSpanDateRange(startOffset, endOffset);
      const body = { ...range, Directions: 'INC,IU,OUT' };
      try {
        const data = await queuedFetch('GetCallsByDate', 'POST', body);
        lastKnownData.fortnight = data;
        hideError();
        hideSetupPanel();
        return tollringRecords(data);
      } catch (e) {
        handleApiFailure('GetCallsByDate span', e);
        const cached = tollringRecords(lastKnownData.fortnight);
        return cached.length ? cached : [];
      }
    }

    function setRecorderLoading(loading) {
      recorderHistoryLoading = loading;
      const panel = document.getElementById('call-recorder-panel');
      const hasExisting = (fortnightCalls && fortnightCalls.length) || (archivedCalls && archivedCalls.length);
      if (panel) panel.classList.toggle('recorder-loading', loading && !hasExisting);
      const meta = document.getElementById('recorderDataMeta');
      if (meta && loading) {
        meta.textContent = hasExisting
          ? 'Updating history in background…'
          : 'Loading and storing call history…';
      }
    }

    async function getFortnightCalls(force) {
      if (isDemoMode) return demoFortnightCalls;

      const mergeFresh = () => {
        const merged = mergeCallRecords(fortnightCalls, todayCalls, yesterdayCalls, archivedCalls);
        ingestCallsIntoArchive(merged);
        return merged;
      };

      if (!force && Date.now() - lastFortnightFetchAt < FORTNIGHT_TTL_MS && fortnightCalls.length && fortnightFetchDays >= RECORDER_MAX_DAYS) {
        return mergeFresh();
      }

      const hasExisting = (fortnightCalls && fortnightCalls.length) || (archivedCalls && archivedCalls.length);
      setRecorderLoading(true);
      if (!hasExisting) uiSnapshots.recorderKey = '';

      const startOffset = -(RECORDER_MAX_DAYS - 1);
      const historyEnd = -2;
      let spanCalls = [];

      // Tollring caps responses at ~1000 records — fetch week-by-week so every day is covered
      for (let s = startOffset; s <= historyEnd; s += 7) {
        const e = Math.min(s + 6, historyEnd);
        spanCalls = mergeCallRecords(spanCalls, await getCallsForSpan(s, e));
      }

      fortnightCalls = mergeCallRecords(spanCalls, todayCalls, yesterdayCalls, archivedCalls);
      lastFortnightFetchAt = Date.now();
      fortnightFetchDays = RECORDER_MAX_DAYS;
      ingestCallsIntoArchive(fortnightCalls);
      setRecorderLoading(false);
      debug('Recorder history loaded: ' + fortnightCalls.length + ' calls');
      if (window.S4S && window.S4S.renderBreakdown) window.S4S.renderBreakdown(true);
      return fortnightCalls;
    }

    function activateDemoMode(reason) {
      if (isDemoMode) return;
      isDemoMode = true;
      enableDemoBadge();
      hideError();
      hideSetupPanel();
      showToast(reason || 'Running in demo mode');
      initDemoData();
      pollAllData(true);
    }

    function renderEmptyDashboard() {
      resetUiSnapshots();
      if (window.S4S && typeof window.S4S.renderEmpty === 'function') {
        window.S4S.renderEmpty();
      }
    }

    function retryConnection() {
      hideError();
      hideSetupPanel();
      isDemoMode = false;
      dashboardDataReady = false;
      updateConnectionStatus('loading', 'Reconnecting…');
      pollAllData(true);
    }

    // ============================================================
    // DEMO DATA GENERATOR
    // ============================================================
    let demoTodayCalls = [];
    let demoYesterdayCalls = [];
    let demoFortnightCalls = [];
    let demoLiveCalls = [];
    function bellCurveHourly(baseMax) {
      const hours = [];
      for (let h = 0; h < 24; h++) {
        let factor = 0.05;
        if (h >= 9 && h <= 12) factor = 0.6 + Math.random() * 0.4;
        else if (h >= 14 && h <= 17) factor = 0.5 + Math.random() * 0.4;
        else if (h >= 8 && h <= 18) factor = 0.2 + Math.random() * 0.3;
        hours.push(Math.round(baseMax * factor * (0.7 + Math.random() * 0.6)));
      }
      return hours;
    }

    function pickWeightedHour(weights, total) {
      let roll = Math.random() * total;
      for (let h = 0; h < weights.length; h++) {
        roll -= weights[h];
        if (roll <= 0) return h;
      }
      return 12;
    }

    function initDemoData() {
      enableDemoBadge();
      demoTodayCalls = [];
      demoYesterdayCalls = [];
      const todayStr = getLondonDateString(0);
      const yestStr = getLondonDateString(-1);

      DDI_LIST.forEach((ddi, idx) => {
        const todayCount = 15 + Math.floor(Math.random() * 40) + idx * 3;
        const yestCount = 12 + Math.floor(Math.random() * 35) + idx * 2;
        const todayWeights = bellCurveHourly(12);
        const yestWeights = bellCurveHourly(10);
        const todayWeightSum = todayWeights.reduce((a, b) => a + b, 0) || 1;
        const yestWeightSum = yestWeights.reduce((a, b) => a + b, 0) || 1;

        for (let i = 0; i < todayCount; i++) {
          const hour = pickWeightedHour(todayWeights, todayWeightSum);
          const dir = Math.random() < 0.15 ? 'IU' : (Math.random() < 0.1 ? 'OUT' : 'INC');
          demoTodayCalls.push({
            Direction: dir,
            Port: ddi.number,
            DDIOrGroup: ddi.ddi,
            Caller_ID: '07' + String(Math.floor(Math.random() * 900000000 + 100000000)),
            Call_date: `${todayStr} ${String(hour).padStart(2,'0')}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}:00`,
            Ring_time: Math.floor(Math.random() * 35) + 5,
            Talk_time: dir === 'IU' ? 0 : Math.floor(Math.random() * 300) + 30,
            Duration: Math.floor(Math.random() * 360) + 20
          });
        }
        for (let i = 0; i < yestCount; i++) {
          const hour = pickWeightedHour(yestWeights, yestWeightSum);
          const dir = Math.random() < 0.12 ? 'IU' : (Math.random() < 0.1 ? 'OUT' : 'INC');
          demoYesterdayCalls.push({
            Direction: dir,
            Port: ddi.number,
            DDIOrGroup: ddi.ddi,
            Caller_ID: '07' + String(Math.floor(Math.random() * 900000000 + 100000000)),
            Call_date: `${yestStr} ${String(hour).padStart(2,'0')}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}:00`,
            Ring_time: Math.floor(Math.random() * 40) + 5,
            Talk_time: dir === 'IU' ? 0 : Math.floor(Math.random() * 280) + 20,
            Duration: Math.floor(Math.random() * 340) + 15
          });
        }
      });

      demoLiveCalls = generateDemoLiveCalls();
      demoFortnightCalls = [...demoTodayCalls, ...demoYesterdayCalls];
      for (let dayOffset = -(RECORDER_MAX_DAYS - 1); dayOffset <= -2; dayOffset++) {
        const dateStr = getLondonDateString(dayOffset);
        const dayCount = 70 + Math.floor(Math.random() * 50);
        const weights = bellCurveHourly(10);
        const weightSum = weights.reduce((a, b) => a + b, 0) || 1;
        for (let i = 0; i < dayCount; i++) {
          const ddi = DDI_LIST[Math.floor(Math.random() * DDI_LIST.length)];
          const hour = pickWeightedHour(weights, weightSum);
          const dir = Math.random() < 0.14 ? 'IU' : (Math.random() < 0.1 ? 'OUT' : 'INC');
          demoFortnightCalls.push({
            Direction: dir,
            Port: ddi.number,
            DDIOrGroup: ddi.ddi,
            Caller_ID: '07' + String(Math.floor(Math.random() * 900000000 + 100000000)),
            Call_date: `${dateStr} ${String(hour).padStart(2,'0')}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}:00`,
            Ring_time: Math.floor(Math.random() * 35) + 5,
            Talk_time: dir === 'IU' ? 0 : Math.floor(Math.random() * 280) + 20,
            Duration: Math.floor(Math.random() * 340) + 15
          });
        }
      }
      if (demoInterval) clearInterval(demoInterval);
      demoInterval = setInterval(simulateDemoTick, 20000 + Math.random() * 10000);
    }

    function generateDemoLiveCalls() {
      const count = 2 + Math.floor(Math.random() * 3);
      const calls = [];
      const used = new Set();
      for (let i = 0; i < count; i++) {
        let ddi;
        do { ddi = DDI_LIST[Math.floor(Math.random() * DDI_LIST.length)]; } while (used.has(ddi.ddi) && used.size < DDI_LIST.length);
        used.add(ddi.ddi);
        const statuses = ['Ringing', 'Connected', 'Connected'];
        calls.push({
          Direction: Math.random() < 0.2 ? 'OUT' : 'INC',
          Extension: '101',
          DDIOrGroup: ddi.ddi,
          Caller_ID: '07' + String(Math.floor(Math.random() * 900000000 + 100000000)),
          Call_Status: statuses[Math.floor(Math.random() * statuses.length)],
          TimeInCurrentStatus: Math.floor(Math.random() * 120) + 5,
          _ddi: ddi,
          _startTime: Date.now()
        });
      }
      return calls;
    }

    function demoGetLiveCalls() {
      return demoLiveCalls.map(c => ({
        ...c,
        TimeInCurrentStatus: c.TimeInCurrentStatus + Math.floor((Date.now() - c._startTime) / 1000)
      }));
    }

    function simulateDemoTick() {
      if (Math.random() < 0.4) {
        const ddi = DDI_LIST[Math.floor(Math.random() * DDI_LIST.length)];
        const dir = Math.random() < 0.15 ? 'IU' : (Math.random() < 0.1 ? 'OUT' : 'INC');
        const p = getLondonParts(new Date());
        const newCall = {
          Direction: dir,
          Port: ddi.number,
          DDIOrGroup: ddi.ddi,
          Caller_ID: '07' + String(Math.floor(Math.random() * 900000000 + 100000000)),
          Call_date: `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`,
          Ring_time: Math.floor(Math.random() * 25) + 5,
          Talk_time: dir === 'IU' ? 0 : Math.floor(Math.random() * 200) + 20,
          Duration: Math.floor(Math.random() * 250) + 15
        };
        demoTodayCalls.push(newCall);
        addTickerEvent(newCall, dir === 'IU' ? 'Missed call' : 'Incoming call');
        if (dir === 'INC') showToast(`Incoming call on ${ddi.name}`);
      }

      if (Math.random() < 0.3) {
        demoLiveCalls = generateDemoLiveCalls();
      } else {
        demoLiveCalls.forEach(c => {
          if (Math.random() < 0.2) {
            c.Call_Status = c.Call_Status === 'Ringing' ? 'Connected' : 'Ringing';
            c._startTime = Date.now();
            c.TimeInCurrentStatus = 0;
          }
        });
      }

      liveCalls = tollringRecords(demoGetLiveCalls());
      updateDdiStatuses(liveCalls);
      refreshHistoricalUi(true);
    }

    // ============================================================
    // DATA PROCESSING
    // ============================================================
    function getCallHour(callDate) {
      if (!callDate) return null;
      const str = String(callDate);
      let timePart = '';
      if (str.includes('T')) {
        timePart = str.split('T')[1];
      } else if (str.includes(' ')) {
        timePart = str.split(' ')[1];
      } else {
        const match = str.match(/(\d{2}):(\d{2})/);
        return match ? parseInt(match[1], 10) : null;
      }
      if (!timePart) return null;
      const hour = parseInt(timePart.split(':')[0], 10);
      return Number.isNaN(hour) ? null : hour;
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

    function processCallsData(calls) {
      const total = calls.length;
      const answered = calls.filter(c => normaliseDirection(c) === 'INC').length;
      const missed = calls.filter(c => normaliseDirection(c) === 'IU').length;
      const outbound = calls.filter(c => normaliseDirection(c) === 'OUT').length;
      const inbound = answered + missed;
      const ringTimes = calls
        .filter(c => normaliseDirection(c) === 'INC' && c.Ring_time > 0)
        .map(c => c.Ring_time);
      const avgRing = ringTimes.length ? ringTimes.reduce((a, b) => a + b, 0) / ringTimes.length : 0;
      const answerRate = inbound > 0 ? Math.round((answered / inbound) * 100) : 0;
      const missedRate = inbound > 0 ? Math.round((missed / inbound) * 100) : 0;

      const ddiCounts = {};
      DDI_LIST.forEach(d => { ddiCounts[d.ddi] = 0; });
      calls.forEach(c => {
        const ddi = findDdiForCall(c);
        if (ddi) ddiCounts[ddi.ddi]++;
      });

      const hourlyToday = bucketByHour(calls);
      const hourlyByDdi = bucketByHourPerDdi(calls);
      return { total, inbound, outbound, answered, missed, avgRing, answerRate, missedRate, ddiCounts, hourlyToday, hourlyByDdi };
    }

    function processYesterdayCounts(calls) {
      const ddiCounts = {};
      DDI_LIST.forEach(d => { ddiCounts[d.ddi] = 0; });
      calls.forEach(c => {
        const ddi = findDdiForCall(c);
        if (ddi) ddiCounts[ddi.ddi]++;
      });
      const answered = calls.filter(c => normaliseDirection(c) === 'INC').length;
      const missed = calls.filter(c => normaliseDirection(c) === 'IU').length;
      const outbound = calls.filter(c => normaliseDirection(c) === 'OUT').length;
      const ringTimes = calls
        .filter(c => normaliseDirection(c) === 'INC' && c.Ring_time > 0)
        .map(c => c.Ring_time);
      const avgRing = ringTimes.length ? ringTimes.reduce((a, b) => a + b, 0) / ringTimes.length : 0;
      return {
        total: calls.length,
        inbound: answered + missed,
        outbound,
        answered,
        missed,
        avgRing,
        ddiCounts,
        hourly: bucketByHour(calls),
        hourlyByDdi: bucketByHourPerDdi(calls)
      };
    }

    function bucketByHour(calls) {
      const buckets = new Array(24).fill(0);
      calls.forEach(c => {
        const hour = getCallHour(c.Call_date);
        if (hour !== null && hour >= 0 && hour < 24) buckets[hour]++;
      });
      return buckets;
    }

    function bucketByHourPerDdi(calls) {
      const buckets = {};
      DDI_LIST.forEach(d => { buckets[d.ddi] = new Array(24).fill(0); });
      calls.forEach(c => {
        const ddi = findDdiForCall(c);
        if (!ddi) return;
        const hour = getCallHour(c.Call_date);
        if (hour !== null && hour >= 0 && hour < 24) buckets[ddi.ddi][hour]++;
      });
      return buckets;
    }

    function emptyHourlyByDdi() {
      const buckets = {};
      DDI_LIST.forEach(d => { buckets[d.ddi] = new Array(24).fill(0); });
      return buckets;
    }

    function updateDdiStatuses(live) {
      DDI_LIST.forEach(d => { ddiStatuses[d.ddi] = 'idle'; });
      live.forEach(call => {
        const ddi = findDdiByDdiOrGroup(call.DDIOrGroup || call.Extension);
        if (!ddi) return;
        const status = (call.Call_Status || '').toLowerCase();
        if (status.includes('ring')) ddiStatuses[ddi.ddi] = 'ringing';
        else if (status.includes('connect') || status.includes('call')) ddiStatuses[ddi.ddi] = 'incall';
        else ddiStatuses[ddi.ddi] = 'incall';
      });
    }

    function getRecentCalls(calls, limit) {
      return [...calls]
        .sort((a, b) => (b.Call_date || '').localeCompare(a.Call_date || ''))
        .slice(0, limit || 10);
    }

    function getMissedCalls(calls, limit) {
      return [...calls]
        .filter(c => normaliseDirection(c) === 'IU')
        .sort((a, b) => (b.Call_date || '').localeCompare(a.Call_date || ''))
        .slice(0, limit || 15);
    }

    function formatCallerId(call) {
      return call.Number || call.Caller_ID || '--';
    }

    function formatPhoneDisplay(num) {
      if (!num) return '--';
      const raw = String(num).replace(/\s/g, '');
      if (raw.startsWith('+44')) {
        const n = '0' + raw.slice(3);
        if (n.length === 11) return `${n.slice(0, 5)} ${n.slice(5, 8)} ${n.slice(8)}`;
      }
      const digits = raw.replace(/\D/g, '');
      if (digits.length === 11 && digits.startsWith('0')) {
        return `${digits.slice(0, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
      }
      if (digits.length === 10) {
        return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
      }
      return num;
    }

    function isInboundCall(call) {
      const dir = normaliseDirection(call);
      return dir === 'INC' || dir === 'IU';
    }

    function countRecorderLineCalls(calls, line) {
      const keys = new Set(line.ddiKeys);
      let count = 0;
      calls.forEach(c => {
        if (!isInboundCall(c)) return;
        const ddi = findDdiForCall(c);
        if (ddi && keys.has(ddi.ddi)) count++;
      });
      return count;
    }

    function formatRecorderDate(dateStr) {
      if (!dateStr) return '--';
      const parts = dateStr.split('-');
      const dt = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2], 12, 0, 0));
      return dt.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        timeZone: 'Europe/London'
      });
    }

    function recorderCell(value) {
      const cls = value > 0 ? 'recorder-num' : 'recorder-num recorder-zero';
      return `<td class="${cls}">${value}</td>`;
    }

    function buildRecorderData(fortnight) {
      const merged = isDemoMode
        ? mergeCallRecords(fortnight || [], demoTodayCalls || [], demoYesterdayCalls || [])
        : getAllKnownCalls();
      const todayPool = isDemoMode ? demoTodayCalls : todayCalls;
      const periodDays = recorderPeriodDays;
      const dayLabels = buildDayLabels(0, periodDays);
      const todayStr = getLondonDateString(0);
      const viewDate = recorderSelectedDate || todayStr;

      function callsForDate(dateStr) {
        if (dateStr === todayStr) return todayPool || [];
        return filterCallsInLabels(merged, [dateStr]);
      }

      function inboundTotalForDate(dateStr) {
        const dayCalls = callsForDate(dateStr);
        if (dateStr === todayStr) return processCallsData(dayCalls).inbound;
        return dayCalls.filter(isInboundCall).length;
      }

      const lineTotals = {};
      RECORDER_LINES.forEach(line => { lineTotals[line.name] = 0; });

      const dailyRows = dayLabels.map(dateStr => {
        const dayCalls = callsForDate(dateStr);
        const counts = {};
        RECORDER_LINES.forEach(line => {
          counts[line.name] = countRecorderLineCalls(dayCalls, line);
          lineTotals[line.name] += counts[line.name];
        });
        return {
          date: dateStr,
          counts,
          total: inboundTotalForDate(dateStr),
          isToday: dateStr === todayStr,
          isSelected: dateStr === viewDate
        };
      });

      const viewCalls = callsForDate(viewDate);
      const viewCounts = {};
      RECORDER_LINES.forEach(line => {
        viewCounts[line.name] = countRecorderLineCalls(viewCalls, line);
      });
      const viewTotal = inboundTotalForDate(viewDate);
      const overallTotal = dailyRows.reduce((sum, row) => sum + row.total, 0);

      const loadedDayLabels = buildDayLabels(0, RECORDER_MAX_DAYS);
      const calendarTotals = {};
      merged.forEach(c => {
        if (!isInboundCall(c)) return;
        const d = getCallDate(getCallDateField(c));
        if (d) calendarTotals[d] = (calendarTotals[d] || 0) + 1;
      });
      calendarTotals[todayStr] = inboundTotalForDate(todayStr);
      loadedDayLabels.forEach(dateStr => {
        if (calendarTotals[dateStr] == null) calendarTotals[dateStr] = 0;
      });

      let oldestDate = loadedDayLabels[0] || getLondonDateString(0);
      Object.keys(calendarTotals).forEach(d => {
        if (d < oldestDate) oldestDate = d;
      });

      return {
        lineTotals,
        viewCounts,
        viewTotal,
        viewDate,
        todayStr,
        dailyRows,
        overallTotal,
        calendarTotals,
        loadedDayLabels,
        oldestDate,
        archiveCount: merged.length
      };
    }

    function getRecorderCalendarView() {
      if (!recorderCalendarView) {
        const p = getLondonParts(new Date());
        recorderCalendarView = { year: +p.year, month: +p.month };
      }
      return recorderCalendarView;
    }

    function setRecorderCalendarFromDate(dateStr) {
      const [y, m] = dateStr.split('-').map(Number);
      recorderCalendarView = { year: y, month: m };
    }

    function updateRecorderTodayBtn() {
      const btn = document.getElementById('recorderTodayBtn');
      if (btn) btn.classList.toggle('active', recorderSelectedDate === null);
    }

    function selectRecorderDate(dateStr) {
      const todayStr = getLondonDateString(0);
      recorderSelectedDate = dateStr === todayStr ? null : dateStr;
      setRecorderCalendarFromDate(dateStr);
      uiSnapshots.recorderKey = '';
      updateRecorderTodayBtn();
      if (window.S4S && window.S4S.renderBreakdown) window.S4S.renderBreakdown(true);
    }

    function selectRecorderPeriod(days) {
      recorderPeriodDays = days;
      document.querySelectorAll('.recorder-period-btn').forEach(btn => {
        btn.classList.toggle('active', +btn.dataset.days === days);
      });
      const periodLabel = document.getElementById('recorderPeriodLabel');
      const trendTitle = document.getElementById('recorderTrendTitle');
      const summaryPeriodCol = document.getElementById('recorderSummaryPeriodCol');
      if (periodLabel) periodLabel.textContent = `Last ${days} days total`;
      if (trendTitle) trendTitle.textContent = `Daily total — last ${days} days`;
      if (summaryPeriodCol) summaryPeriodCol.textContent = `Total (${days} days)`;
      uiSnapshots.recorderKey = '';
      if (window.S4S && window.S4S.renderBreakdown) window.S4S.renderBreakdown(true);
    }

    function getCalendarHeat(total, peak) {
      if (!total || !peak) return 'transparent';
      const alpha = 0.06 + (total / peak) * 0.38;
      return `rgba(13, 119, 254, ${alpha.toFixed(2)})`;
    }






    function getMissedCallsList(calls) {
      return calls.filter(c => normaliseDirection(c) === 'IU');
    }

    function getMissedByGarage(calls) {
      const counts = {};
      getMissedCallsList(calls).forEach(c => {
        const ddi = findDdiForCall(c);
        const key = ddi ? ddi.name : 'Unknown';
        counts[key] = (counts[key] || 0) + 1;
      });
      return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }

    function getRecorderLineName(ddi) {
      if (!ddi) return 'Unknown';
      return RECORDER_LINE_NAMES[ddi.ddi] || ddi.name;
    }

    function loadWeekendCallbackStatuses() {
      try {
        return JSON.parse(localStorage.getItem(WEEKEND_CALLBACK_KEY) || '{}') || {};
      } catch (e) {
        return {};
      }
    }

    function saveWeekendCallbackStatus(key, status) {
      const map = loadWeekendCallbackStatuses();
      if (status) map[key] = status;
      else delete map[key];
      localStorage.setItem(WEEKEND_CALLBACK_KEY, JSON.stringify(map));
    }

    function londonWeekday(dateStr) {
      const parts = dateStr.split('-').map(Number);
      return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])).getUTCDay();
    }

    function offsetFromDateString(dateStr, dayOffset) {
      const parts = dateStr.split('-').map(Number);
      const shifted = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + dayOffset, 12, 0, 0));
      const sp = getLondonParts(shifted);
      return `${sp.year}-${sp.month}-${sp.day}`;
    }

    async function loadBankHolidayDatesClient() {
      if (Date.now() - bankHolidayLoadedAt < 86400000 && bankHolidayDates.size) {
        return bankHolidayDates;
      }
      try {
        const res = await fetch('https://www.gov.uk/bank-holidays.json');
        if (res.ok) {
          const data = await res.json();
          const dates = new Set();
          ['england-and-wales', 'scotland', 'northern-ireland'].forEach(region => {
            (data[region] && data[region].events || []).forEach(ev => {
              if (ev && ev.date) dates.add(ev.date);
            });
          });
          bankHolidayDates = dates;
          bankHolidayLoadedAt = Date.now();
          return dates;
        }
      } catch (e) { /* fall through */ }
      bankHolidayDates = new Set(['2025-12-25', '2025-12-26', '2026-01-01', '2026-04-03', '2026-04-06', '2026-05-04', '2026-05-25', '2026-08-31', '2026-12-25', '2026-12-28']);
      bankHolidayLoadedAt = Date.now();
      return bankHolidayDates;
    }

    async function getWeekendDateRangeClient(preset, customStart, customEnd) {
      const bankHolidays = await loadBankHolidayDatesClient();
      const today = getLondonDateString(0);
      const dow = londonWeekday(today);

      if (preset === 'custom' && customStart && customEnd) {
        const dates = [];
        let cur = customStart;
        while (cur <= customEnd) {
          dates.push(cur);
          cur = offsetFromDateString(cur, 1);
        }
        return { dates, label: `Custom (${customStart} to ${customEnd})` };
      }

      if (preset === 'this-weekend') {
        const satOffset = dow === 6 ? 0 : dow === 0 ? -1 : (6 - dow);
        const dates = [];
        const sat = getLondonDateString(satOffset);
        const sun = getLondonDateString(satOffset + 1);
        if (sat <= today) dates.push(sat);
        if (sun <= today) dates.push(sun);
        if (!dates.length) dates.push(sat, sun);
        return { dates: [...new Set(dates)].sort(), label: 'This weekend so far' };
      }

      const sunOffset = dow === 0 ? -7 : -dow;
      const satOffset = sunOffset - 1;
      let dates = [getLondonDateString(satOffset), getLondonDateString(sunOffset)];

      if (preset === 'extended-last') {
        const fri = offsetFromDateString(dates[0], -1);
        const mon = offsetFromDateString(dates[1], 1);
        if (bankHolidays.has(mon) || bankHolidays.has(fri) || bankHolidays.has(dates[0]) || bankHolidays.has(dates[1])) {
          dates = [fri, ...dates, mon];
        }
      }

      return { dates: [...new Set(dates)].sort(), label: preset === 'extended-last' ? 'Last extended weekend' : 'Last weekend' };
    }

    function dateStringToOffset(dateStr) {
      const today = getLondonDateString(0);
      const tp = today.split('-').map(Number);
      const dp = dateStr.split('-').map(Number);
      const tUtc = Date.UTC(tp[0], tp[1] - 1, tp[2]);
      const dUtc = Date.UTC(dp[0], dp[1] - 1, dp[2]);
      return Math.round((dUtc - tUtc) / 86400000);
    }

    function getWeekendInboundCalls(calls) {
      return calls.filter(c => isInboundCall(c));
    }

    function getWeekendCallType(call) {
      const dir = normaliseDirection(call);
      if (dir === 'IU') return { label: 'Unanswered', cls: 'type-missed' };
      if (dir === 'INC') {
        const talk = Number(call.Talk_time || 0);
        if (talk <= 0) return { label: 'Unanswered', cls: 'type-missed' };
        return { label: 'Auto / voicemail', cls: 'type-auto' };
      }
      return { label: '--', cls: '' };
    }

    function buildWeekendMissedRows(calls) {
      const statuses = loadWeekendCallbackStatuses();
      return getWeekendInboundCalls(calls).map(c => {
        const ddi = findDdiForCall(c);
        const dateStr = getCallDate(getCallDateField(c)) || '';
        const timeMatch = String(c.Call_date || '').match(/(\d{2}:\d{2}:\d{2}|\d{2}:\d{2})/);
        const key = callRecordKey(c);
        const callType = getWeekendCallType(c);
        return {
          key,
          date: dateStr,
          dateLabel: dateStr ? formatRecorderDate(dateStr) : '--',
          time: timeMatch ? timeMatch[1] : '--:--',
          line: getRecorderLineName(ddi),
          garage: ddi ? ddi.name : 'Unknown',
          caller: formatPhoneDisplay(formatCallerId(c)),
          ringTime: c.Ring_time > 0 ? formatTime(c.Ring_time) : '0:00',
          queue: c.DDIOrGroup || c.Group_no || '',
          callType: callType.label,
          callTypeCls: callType.cls,
          status: statuses[key] || 'To call back'
        };
      }).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
    }

    async function fetchWeekendMissedCallsForDates(dates) {
      let all = [];
      for (const dateStr of dates) {
        const offset = dateStringToOffset(dateStr);
        const dayCalls = await getCallsForSpan(offset, offset);
        all = mergeCallRecords(all, dayCalls);
      }
      return all;
    }

    function summariseWeekendByLine(rows) {
      const counts = {};
      rows.forEach(r => { counts[r.line] = (counts[r.line] || 0) + 1; });
      return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }

    function printWeekendReport() {
      if (!weekendMissedRows.length) {
        showToast('Load a weekend report first');
        return;
      }
      const sheet = document.getElementById('weekendPrintSheet');
      if (!sheet) return;

      const byLine = summariseWeekendByLine(weekendMissedRows);
      const now = getLondonParts(new Date());
      const lineSummary = byLine.map(([line, count]) => `${line}: ${count}`).join(' · ');
      const unanswered = weekendMissedRows.filter(r => r.callTypeCls === 'type-missed').length;
      const auto = weekendMissedRows.filter(r => r.callTypeCls === 'type-auto').length;
      const rowsHtml = weekendMissedRows.map(r =>
        `<tr>
          <td>${r.dateLabel}</td>
          <td>${r.time}</td>
          <td>${r.line}</td>
          <td>${r.garage}</td>
          <td>${r.caller}</td>
          <td>${r.ringTime}</td>
          <td>${r.callType}</td>
          <td>${r.status || 'To call back'}</td>
        </tr>`
      ).join('');

      sheet.innerHTML = `
        <div class="print-logo">s<span>4</span>s Service4Service</div>
        <p class="print-sub">Weekend call-back list</p>
        <p class="print-summary">
          <strong>${weekendRangeLabel}</strong><br>
          ${weekendMissedRows.length} inbound call${weekendMissedRows.length === 1 ? '' : 's'}
          (${unanswered} unanswered · ${auto} auto/voicemail)
          ${lineSummary ? `<br>${lineSummary}` : ''}<br>
          Printed ${now.day}/${now.month}/${now.year} at ${now.hour}:${now.minute}
        </p>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Line</th>
              <th>Garage</th>
              <th>Caller</th>
              <th>Rang for</th>
              <th>How it ended</th>
              <th>Callback</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <p class="print-footer">All inbound weekend calls · includes night service &amp; voicemail answers · Service4Service</p>
      `;

      document.body.classList.add('printing-weekend');
      window.print();
      setTimeout(() => document.body.classList.remove('printing-weekend'), 500);
    }


    async function loadWeekendMissedReport() {
      if (weekendLoading) return;
      weekendLoading = true;
      if (window.S4S && window.S4S.renderWeekend) window.S4S.renderWeekend();

      try {
        const customWrap = document.getElementById('weekendCustomDates');
        const customStart = document.getElementById('weekendDateStart')?.value || '';
        const customEnd = document.getElementById('weekendDateEnd')?.value || '';
        if (weekendPreset === 'custom' && (!customStart || !customEnd)) {
          showToast('Choose a start and end date');
          return;
        }

        const range = await getWeekendDateRangeClient(weekendPreset, customStart, customEnd);
        weekendRangeLabel = `${range.label} (${range.dates.join(', ')})`;
        const calls = await fetchWeekendMissedCallsForDates(range.dates);
        weekendMissedRows = buildWeekendMissedRows(calls);
        if (window.S4S && window.S4S.renderWeekend) window.S4S.renderWeekend();
        if (!weekendMissedRows.length) showToast('No inbound calls in that range');
      } catch (e) {
        showToast('Could not load weekend report');
        debug('Weekend report failed: ' + (e && e.message ? e.message : e));
      } finally {
        weekendLoading = false;
        if (window.S4S && window.S4S.renderWeekend) window.S4S.renderWeekend();
      }
    }

    function updateLastUpdated(fromCache, savedAt) {
      if (isDemoMode) {
        updateConnectionStatus('demo');
        return;
      }
      const now = fromCache && savedAt ? new Date(savedAt) : new Date();
      const p = getLondonParts(now);
      const timeStr = `${p.hour}:${p.minute}:${p.second}`;
      if (fromCache && !dashboardDataReady) {
        updateConnectionStatus('loading', 'Refreshing…');
        return;
      }
      updateConnectionStatus('live', timeStr);
      if (!fromCache) saveDashboardSnapshot();
      if (window.S4S && typeof window.S4S.setStaleNotice === 'function') {
        window.S4S.setStaleNotice(false);
      }
    }

    function addTickerEvent(call, label) {
      const ddi = findDdiForCall(call) || findDdiByDdiOrGroup(call.DDIOrGroup);
      const timeMatch = (call.Call_date || '').match(/(\d{2}:\d{2})/);
      const time = timeMatch ? timeMatch[1] : getLondonParts(new Date()).hour + ':' + getLondonParts(new Date()).minute;
      tickerEvents.unshift({ time, ddi: ddi ? ddi.name : 'Unknown', label });
      if (tickerEvents.length > 50) tickerEvents.length = 50;
    }

    // ============================================================
    // UI RENDER FUNCTIONS
    // ============================================================









    function getHistorySourceCalls() {
      return getAllKnownCalls();
    }

    function updateHistoryButton() {
      const btn = document.getElementById('viewFullHistoryBtn');
      if (!btn) return;
      const n = getHistorySourceCalls().length;
      btn.textContent = n
        ? `View full history (${n.toLocaleString('en-GB')} calls)`
        : 'View full history';
    }

    function getFilteredHistoryCalls() {
      const q = historySearch.trim().toLowerCase();
      return getHistorySourceCalls()
        .filter(c => {
          const dir = normaliseDirection(c);
          if (historyFilter !== 'all' && dir !== historyFilter) return false;
          if (!q) return true;
          const ddi = findDdiForCall(c);
          const hay = [
            ddi ? ddi.name : '',
            ddi ? ddi.number : '',
            c.Caller_ID || '',
            c.Number || '',
            c.Port || '',
            c.DDIOrGroup || ''
          ].join(' ').toLowerCase();
          return hay.includes(q);
        })
        .sort((a, b) => (b.Call_date || '').localeCompare(a.Call_date || ''));
    }

    function historyTypeLabel(dir) {
      if (dir === 'IU') return { icon: '\u2715', cls: 'dir-missed', text: 'Missed' };
      if (dir === 'OUT') return { icon: '\u2191', cls: 'dir-out', text: 'Outbound' };
      return { icon: '\u2193', cls: 'dir-inc', text: 'Inbound' };
    }


    function openCallHistory() {
      historyModalOpen = true;
      historyShowCount = HISTORY_PAGE_SIZE;
      const overlay = document.getElementById('historyOverlay');
      if (overlay) {
        overlay.hidden = false;
        overlay.classList.add('open');
      }
      if (window.S4S && window.S4S.renderCallHistory) window.S4S.renderCallHistory(true);
      const search = document.getElementById('historySearch');
      if (search) search.focus();
    }

    function closeCallHistory() {
      historyModalOpen = false;
      const overlay = document.getElementById('historyOverlay');
      if (overlay) {
        overlay.classList.remove('open');
        overlay.hidden = true;
      }
    }

    function downloadHistoryCsv() {
      const rows = getFilteredHistoryCalls();
      const header = ['Date', 'Time', 'Line', 'Caller', 'Duration', 'Type', 'Direction'];
      const csvRows = [header.join(',')];
      rows.forEach(c => {
        const ddi = findDdiForCall(c);
        const dateStr = getCallDate(getCallDateField(c)) || '';
        const timeMatch = String(c.Call_date || '').match(/(\d{2}:\d{2}:\d{2}|\d{2}:\d{2})/);
        const dir = normaliseDirection(c);
        const type = historyTypeLabel(dir);
        const vals = [
          dateStr,
          timeMatch ? timeMatch[1] : '',
          ddi ? ddi.name : 'Unknown',
          formatPhoneDisplay(formatCallerId(c)),
          formatDuration(c.Talk_time || c.Duration || 0),
          type.text,
          dir
        ].map(v => `"${String(v).replace(/"/g, '""')}"`);
        csvRows.push(vals.join(','));
      });
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `s4s-call-history-${getLondonDateString(0)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }




    // ============================================================
    // CHART
    // ============================================================


    function refreshChartCache(today, yesterday, fortnight) {
      if (chartPeriod === 'week') {
        const thisWeekLabels = buildDayLabels(0, 7);
        const prevWeekLabels = buildDayLabels(-7, 7);
        const allCalls = mergeCallRecords(fortnight || [], today || [], yesterday || []);
        const thisWeekCalls = filterCallsInLabels(allCalls, thisWeekLabels);
        const prevWeekCalls = filterCallsInLabels(allCalls, prevWeekLabels);
        const todayTotal = bucketByDay(thisWeekCalls, thisWeekLabels);
        const yesterdayTotal = bucketByDay(prevWeekCalls, prevWeekLabels);
        chartDataCache = {
          mode: 'week',
          pointCount: 7,
          todayTotal,
          yesterdayTotal,
          todayByDdi: bucketByDayPerDdi(thisWeekCalls, thisWeekLabels),
          yesterdayByDdi: bucketByDayPerDdi(prevWeekCalls, prevWeekLabels),
          dayLabels: thisWeekLabels,
          prevWeekLabels,
          weekTotal: todayTotal.reduce((a, b) => a + b, 0),
          prevWeekTotal: yesterdayTotal.reduce((a, b) => a + b, 0)
        };
        return;
      }

      const t = processCallsData(today);
      const y = processYesterdayCounts(yesterday);
      chartDataCache = {
        mode: 'today',
        pointCount: 24,
        todayTotal: t.hourlyToday,
        yesterdayTotal: y.hourly,
        todayByDdi: t.hourlyByDdi,
        yesterdayByDdi: y.hourlyByDdi,
        dayLabels: [],
        prevWeekLabels: [],
        weekTotal: 0,
        prevWeekTotal: 0
      };
    }


    // ============================================================
    // DONUT CHARTS
    // ============================================================


    // ============================================================
    // LIVE TIMERS
    // ============================================================
    function startLiveTimers() {
      if (liveTimerInterval) clearInterval(liveTimerInterval);
      liveTimerInterval = setInterval(() => {
        document.querySelectorAll('.call-item[data-elapsed]').forEach(item => {
          const idx = item.dataset.idx;
          const startElapsed = parseInt(item.dataset.elapsed, 10);
          const startTime = parseInt(item.dataset.start, 10);
          const elapsed = startElapsed + Math.floor((Date.now() - startTime) / 1000);
          const timer = document.getElementById('liveTimer' + idx);
          if (timer) timer.textContent = formatTime(elapsed);
        });
      }, 1000);
    }

    // ============================================================
    // PROCESS ALL & POLLING
    // ============================================================
    function refreshHistoricalUi(force) {
      refreshChartCache(
        isDemoMode ? demoTodayCalls : todayCalls,
        isDemoMode ? demoYesterdayCalls : yesterdayCalls,
        isDemoMode ? demoFortnightCalls : fortnightCalls
      );
      if (window.S4S && typeof window.S4S.renderAll === 'function') {
        window.S4S.renderAll(force);
      }
    }

    async function pollAllData(force) {
      if (isPolling && !force) return;
      isPolling = true;
      try {
        if (isDemoMode) {
          todayCalls = demoTodayCalls;
          yesterdayCalls = demoYesterdayCalls;
          fortnightCalls = demoFortnightCalls;
          liveCalls = tollringRecords(demoGetLiveCalls());
          updateDdiStatuses(liveCalls);
          refreshHistoricalUi(force);
          updateLastUpdated();
          return;
        }

        const prevToday = todayCalls;

        liveCalls = await getLiveCalls();
        if (!Array.isArray(liveCalls)) liveCalls = [];
        updateDdiStatuses(liveCalls);
        if (window.S4S && window.S4S.renderAll) window.S4S.renderAll(false);

        const nextToday = await getCallsByDate(0);
        if (Array.isArray(nextToday)) {
          const mergedToday = mergeCallRecords(todayCalls, nextToday);
          const todayKey = fingerprintCalls(mergedToday);
          if (prevToday.length > 0 && todayKey !== uiSnapshots.todayKey) {
            findNewCalls(prevToday, mergedToday).forEach(c => {
              const dir = normaliseDirection(c);
              const label = dir === 'IU' ? 'Missed call' : dir === 'OUT' ? 'Outgoing call' : 'Incoming call';
              addTickerEvent(c, label);
            });
          }
          todayCalls = mergedToday;
          uiSnapshots.todayKey = todayKey;
          ingestCallsIntoArchive(todayCalls);
          dashboardDataReady = true;
          refreshHistoricalUi(false);
        }

        const nextYesterday = await getCallsByDate(-1);
        if (Array.isArray(nextYesterday)) {
          yesterdayCalls = mergeCallRecords(yesterdayCalls, nextYesterday);
          uiSnapshots.yesterdayKey = fingerprintCalls(yesterdayCalls);
          ingestCallsIntoArchive(yesterdayCalls);
          refreshHistoricalUi(false);
        }

        fortnightCalls = await getFortnightCalls(false);
        ingestCallsIntoArchive(mergeCallRecords(todayCalls, yesterdayCalls, fortnightCalls));

        showingCachedNumbers = false;
        refreshHistoricalUi(force);
        updateLastUpdated();
      } finally {
        isPolling = false;
      }
    }

    async function init() {
      updateConnectionStatus('loading');
      getWeekendDateRangeClient('last-weekend').then(range => {
        const startInput = document.getElementById('weekendDateStart');
        const endInput = document.getElementById('weekendDateEnd');
        if (startInput && range.dates.length) startInput.value = range.dates[0];
        if (endInput && range.dates.length) endInput.value = range.dates[range.dates.length - 1];
      }).catch(() => {});

      if (DEMO_MODE) {
        activateDemoMode('Demo mode is enabled in the dashboard config.');
      } else {
        applyDashboardSnapshot();
        await loadCallArchive();
        if (hydrateCallsFromArchive()) {
          refreshHistoricalUi(true);
          const snap = (() => {
            try { return JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || 'null'); } catch (e) { return null; }
          })();
          updateLastUpdated(true, snap && snap.savedAt);
        }
        startPolling();
      }

      if (isDemoMode && tickerEvents.length === 0) {
        demoTodayCalls.slice(-8).reverse().forEach(c => {
          const label = c.Direction === 'IU' ? 'Missed call' : c.Direction === 'OUT' ? 'Outgoing call' : 'Incoming call';
          addTickerEvent(c, label);
        });
        if (window.S4S && window.S4S.renderAll) window.S4S.renderAll(true);
      }
      if (window.S4S && window.S4S.updateHistoryButton) window.S4S.updateHistoryButton();
    }

    window.S4SInit = init;
    window.S4SRetryConnection = retryConnection;
    window.S4SEnableDemoPreview = enableDemoPreview;
    window.S4SPollAllData = pollAllData;
    window.S4SLoadWeekendMissedReport = loadWeekendMissedReport;
    window.S4SPrintWeekendReport = printWeekendReport;
    window.S4SDownloadHistoryCsv = downloadHistoryCsv;
    window.S4SOpenCallHistory = openCallHistory;
    window.S4SCloseCallHistory = closeCallHistory;
    window.S4SSelectRecorderPeriod = selectRecorderPeriod;
    window.S4SSelectRecorderDate = selectRecorderDate;
    window.S4SSaveWeekendCallbackStatus = saveWeekendCallbackStatus;
    window.S4SGetFortnightCalls = getFortnightCalls;

    window.S4SGlobals = {
      get API_PROXY() { return API_PROXY; },
      get DEMO_MODE() { return DEMO_MODE; },
      get DDI_LIST() { return DDI_LIST; },
      get RECORDER_LINES() { return RECORDER_LINES; },
      get RECORDER_MAX_DAYS() { return RECORDER_MAX_DAYS; },
      get isDemoMode() { return isDemoMode; },
      get dashboardDataReady() { return dashboardDataReady; },
      get todayCalls() { return isDemoMode ? demoTodayCalls : todayCalls; },
      get yesterdayCalls() { return isDemoMode ? demoYesterdayCalls : yesterdayCalls; },
      get fortnightCalls() { return isDemoMode ? demoFortnightCalls : fortnightCalls; },
      get liveCalls() { return liveCalls; },
      get ddiStatuses() { return ddiStatuses; },
      get chartDataCache() { return chartDataCache; },
      set chartDataCache(v) { chartDataCache = v; },
      get chartPeriod() { return chartPeriod; },
      set chartPeriod(v) { chartPeriod = v; },
      get chartSelectedDdis() { return chartSelectedDdis; },
      get recorderPeriodDays() { return recorderPeriodDays; },
      set recorderPeriodDays(v) { recorderPeriodDays = v; },
      get recorderSelectedDate() { return recorderSelectedDate; },
      set recorderSelectedDate(v) { recorderSelectedDate = v; },
      get weekendMissedRows() { return weekendMissedRows; },
      get weekendLoading() { return weekendLoading; },
      get weekendRangeLabel() { return weekendRangeLabel; },
      get weekendPreset() { return weekendPreset; },
      set weekendPreset(v) { weekendPreset = v; },
      get historyFilter() { return historyFilter; },
      set historyFilter(v) { historyFilter = v; },
      get historySearch() { return historySearch; },
      set historySearch(v) { historySearch = v; },
      get historyShowCount() { return historyShowCount; },
      set historyShowCount(v) { historyShowCount = v; },
      get historyModalOpen() { return historyModalOpen; },
      get tickerEvents() { return tickerEvents; },
      get uiSnapshots() { return uiSnapshots; },
      get WEEKEND_CALLBACK_OPTIONS() { return WEEKEND_CALLBACK_OPTIONS; },
      get WEEKEND_CALLBACK_KEY() { return WEEKEND_CALLBACK_KEY; },
      get HISTORY_PAGE_SIZE() { return HISTORY_PAGE_SIZE; },
      get SNAPSHOT_KEY() { return SNAPSHOT_KEY; },
      processCallsData,
      processYesterdayCounts,
      findDdiForCall,
      findDdiByDdiOrGroup,
      normaliseDirection,
      formatTime,
      formatDuration,
      formatPhoneDisplay,
      formatCallerId,
      formatPct,
      pctChange,
      getAllKnownCalls,
      getRecentCalls,
      getMissedCallsList,
      getMissedCalls,
      getMissedByGarage,
      getCallDate,
      getCallDateField,
      formatDayLabel,
      formatRecorderDate,
      buildRecorderData,
      buildDayLabels,
      filterCallsInLabels,
      mergeCallRecords,
      isInboundCall,
      countRecorderLineCalls,
      getLondonParts,
      getLondonDateString,
      getCallHour,
      callRecordKey,
      fingerprintLive,
      fingerprintCalls,
      loadWeekendCallbackStatuses,
      saveWeekendCallbackStatus,
      refreshChartCache,
      getFilteredHistoryCalls,
      getHistorySourceCalls,
      historyTypeLabel,
      parseStatusSeconds,
      bucketByHour,
      bucketByDay,
      bucketByDayPerDdi,
      getRecorderLineName,
      updateDdiStatuses,
      ingestCallsIntoArchive,
      getCalendarHeat,
      getRecorderCalendarView,
      setRecorderCalendarFromDate,
      recorderCell,
      get showingCachedNumbers() { return showingCachedNumbers; },
      hasCachedNumbers,
      get lastSnapshot() { return lastSnapshot; },
      get POLL_INTERVAL_MS() { return POLL_INTERVAL_MS; },
      get recorderCalendarView() { return recorderCalendarView; },
      set recorderCalendarView(v) { recorderCalendarView = v; },
      get recorderHistoryLoading() { return recorderHistoryLoading; },
      get lastFortnightFetchAt() { return lastFortnightFetchAt; },
      get archivedCalls() { return archivedCalls; }
    };
