const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'classic.html'), 'utf8');
const idx = html.indexOf('// CONFIGURATION');
if (idx < 0) throw new Error('CONFIGURATION marker not found');
const scriptStart = html.lastIndexOf('<script>', idx);
const scriptEnd = html.indexOf('</script>', idx);
if (scriptStart < 0 || scriptEnd < 0) throw new Error('Main script block not found');
let script = html.slice(scriptStart + '<script>'.length, scriptEnd);

const removeFunctions = [
  'setKpiValue',
  'updateLiveKpi',
  'updateStatsKpis',
  'renderKpis',
  'renderDdiTableFull',
  'updateDdiStatusDots',
  'updateDdiTableCounts',
  'renderDdiTable',
  'renderLiveCalls',
  'renderRecentCalls',
  'renderCallHistory',
  'renderMissedCalls',
  'renderTicker',
  'renderTopPerformer',
  'renderChart',
  'renderChartLegend',
  'updateChartPeriodNote',
  'renderDonut',
  'renderDonutCompare',
  'renderRecorderCalendar',
  'renderRecorderPie',
  'renderRecorderBars',
  'renderRecorderTrend',
  'renderCallRecorder',
  'renderWeekendMissedPanel',
];

function removeFunction(source, name) {
  const re = new RegExp(
    `\\n    (async )?function ${name}\\([^)]*\\)\\s*\\{`,
    'g'
  );
  const match = re.exec(source);
  if (!match) return source;
  const start = match.index;
  let i = match.index + match[0].length;
  let depth = 1;
  while (i < source.length && depth > 0) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  return source.slice(0, start) + source.slice(i);
}

for (const fn of removeFunctions) {
  script = removeFunction(script, fn);
}

const replacements = [
  {
    from: /function updateConnectionStatus\(mode, detail\) \{[\s\S]*?\n    \}/,
    to: `function updateConnectionStatus(mode, detail) {
      if (window.S4S && typeof window.S4S.updateConnectionStatus === 'function') {
        window.S4S.updateConnectionStatus(mode, detail);
      }
    }`,
  },
  {
    from: /function updateLastUpdated\(fromCache, savedAt\) \{[\s\S]*?\n    \}/,
    to: `function updateLastUpdated(fromCache, savedAt) {
      if (isDemoMode) {
        updateConnectionStatus('demo');
        return;
      }
      const now = fromCache && savedAt ? new Date(savedAt) : new Date();
      const p = getLondonParts(now);
      const timeStr = \`\${p.hour}:\${p.minute}:\${p.second}\`;
      if (fromCache && !dashboardDataReady) {
        updateConnectionStatus('loading', 'Refreshing…');
        return;
      }
      updateConnectionStatus('live', timeStr);
      if (!fromCache) saveDashboardSnapshot();
      if (window.S4S && typeof window.S4S.setStaleNotice === 'function') {
        window.S4S.setStaleNotice(false);
      }
    }`,
  },
  {
    from: /function renderEmptyDashboard\(\) \{[\s\S]*?\n    \}/,
    to: `function renderEmptyDashboard() {
      resetUiSnapshots();
      if (window.S4S && typeof window.S4S.renderEmpty === 'function') {
        window.S4S.renderEmpty();
      }
    }`,
  },
  {
    from: /function enableDemoBadge\(\) \{[\s\S]*?\n    \}/,
    to: `function enableDemoBadge() {
      dashboardDataReady = true;
      updateConnectionStatus('demo');
      const banner = document.getElementById('demoBanner');
      if (banner) banner.hidden = false;
    }`,
  },
  {
    from: /function refreshHistoricalUi\(force\) \{[\s\S]*?\n    \}/,
    to: `function refreshHistoricalUi(force) {
      refreshChartCache(
        isDemoMode ? demoTodayCalls : todayCalls,
        isDemoMode ? demoYesterdayCalls : yesterdayCalls,
        isDemoMode ? demoFortnightCalls : fortnightCalls
      );
      if (window.S4S && typeof window.S4S.renderAll === 'function') {
        window.S4S.renderAll(force);
      }
    }`,
  },
  {
    from: /renderCallRecorder\(true\);/g,
    to: `if (window.S4S && window.S4S.renderBreakdown) window.S4S.renderBreakdown(true);`,
  },
  {
    from: /renderWeekendMissedPanel\(\);/g,
    to: `if (window.S4S && window.S4S.renderWeekend) window.S4S.renderWeekend();`,
  },
];

for (const { from, to } of replacements) {
  if (!from.test(script)) {
    throw new Error('Replacement pattern not found: ' + from);
  }
  script = script.replace(from, to);
}

script = script.replace(
  /if \(sameDay\) \{[\s\S]*?if \(liveSub\) liveSub\.textContent = 'Last known · refreshing';\n      \}/,
  `if (sameDay) {
        showingCachedNumbers = true;
        dashboardDataReady = true;
      }`
);

script = script.replace(
  /function showError\(msg\) \{[\s\S]*?\n    \}\n\n    function hideError\(\) \{[\s\S]*?\n    \}/,
  `function showError(msg) {
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
    }`
);

script = script.replace(
  /refreshHistoricalUi\(true\);\n      liveCalls = tollringRecords\(demoGetLiveCalls\(\)\);[\s\S]*?updateLiveKpi\(liveCalls\.length\);\n    \}/,
  `liveCalls = tollringRecords(demoGetLiveCalls());
      updateDdiStatuses(liveCalls);
      refreshHistoricalUi(true);
    }`
);

script = script.replace(
  /if \(renderLiveCalls\(liveCalls, force\)\) startLiveTimers\(\);\n          updateDdiStatusDots\(\);\n          updateLiveKpi\(liveCalls\.length, force\);\n          refreshHistoricalUi\(force\);/,
  `updateDdiStatuses(liveCalls);
          refreshHistoricalUi(force);`
);

script = script.replace(
  /updateDdiStatuses\(liveCalls\);\n        if \(renderLiveCalls\(liveCalls, force\)\) startLiveTimers\(\);\n        updateDdiStatusDots\(\);\n        updateLiveKpi\(liveCalls\.length, force\);\n\n        const nextToday/,
  `updateDdiStatuses(liveCalls);

        const nextToday`
);

script = script.replace(/\n    init\(\);\s*$/, '');

script = script.replace(
  /renderTicker\(\);\n      \}\n      updateHistoryButton\(\);/,
  `if (window.S4S && window.S4S.renderAll) window.S4S.renderAll(true);
      }
      if (window.S4S && window.S4S.updateHistoryButton) window.S4S.updateHistoryButton();`
);

// Remove DOM event listener block at end (UI registers in dashboard-ui.js)
script = script.replace(
  /\n    \/\/ ============================================================\n    \/\/ CHART SELECT\n    \/\/ ============================================================[\s\S]*?async function init\(\)/,
  '\n    async function init()'
);

// Wrap for file export
const header = `/* S4S dashboard data layer — extracted from classic.html; do not change API/data logic */\n'use strict';\n`;
const footer = `
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
      archivedCalls,
      getCalendarHeat,
      getRecorderCalendarView,
      setRecorderCalendarFromDate,
      showingCachedNumbers,
      hasCachedNumbers
    };
`;

const outDir = path.join(root, 'assets');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'dashboard-data.js'), header + script + footer);
console.log('Wrote assets/dashboard-data.js', (header + script + footer).length, 'bytes');
