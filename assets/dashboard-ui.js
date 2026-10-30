(function () {
  'use strict';

  function G() { return window.S4SGlobals; }

  const LINE_COLOURS = {
    'A1': '#1f78c9',
    'Beds': '#f07b1d',
    'Manchester': '#8a54d6',
    'Bristol': '#e0457b',
    'Gearbox': '#2e9e3e',
    'Existing customer': '#9aa31a',
    'Garages24': '#3646c8',
    'Customer 24': '#6f8294',
    'Night service': '#24324a',
    'Leeds': '#cf3b2e',
    'South-east': '#12a4bd',
    'Midlands': '#6aa61c',
    'London': '#a94cb8',
    'Midlands PPC': '#8d6e63',
    'Central PPC': '#2f7f9e',
    'London PPC': '#00897b',
    'West PPC': '#e6a117',
    'Southeast PPC': '#ff6f61',
    'North PPC': '#5d4037',
    'East Anglia PPC': '#ad1457'
  };
  const FALLBACK_COLOURS = Object.values(LINE_COLOURS);

  const state = {
    volumePeriod: 'today',
    selectedLineDdi: 'total',
    recentFilter: 'all',
    recentShow: 12,
    breakdownDays: 14,
    breakdownSelectedDay: null,
    errorDetail: '',
    lastSavedTime: '',
    renderKeys: {}
  };

  const MISSED_CALLBACK_CYCLE = ['To call back', 'Called back', 'No answer'];

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function lineColour(name) {
    return LINE_COLOURS[name] || FALLBACK_COLOURS[Math.abs(hashStr(name)) % FALLBACK_COLOURS.length];
  }

  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return h;
  }

  function avatarTextColour(bg) {
    if (bg === '#e6a117' || bg === '#9aa31a') return '#122e47';
    return '#fff';
  }

  function londonHeaderDate() {
    const p = G().getLondonParts(new Date());
    const d = new Date(Number(p.year), Number(p.month) - 1, Number(p.day));
    const weekday = d.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'Europe/London' });
    const rest = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London' });
    return `${weekday} ${rest} · today so far`;
  }

  function isLoading() {
    const g = G();
    if (!g) return true;
    if (g.isDemoMode || g.dashboardDataReady) return false;
    if (typeof g.hasCachedNumbers === 'function' && g.hasCachedNumbers()) return false;
    const snap = g.lastSnapshot;
    return !(snap && snap.savedDate === g.getLondonDateString(0));
  }

  function todayStats() {
    const g = G();
    const t = g.processCallsData(g.todayCalls);
    const y = g.processYesterdayCounts(g.yesterdayCalls);
    const snap = g.lastSnapshot;
    const sameDay = snap && snap.savedDate === g.getLondonDateString(0);
    if ((!g.todayCalls || !g.todayCalls.length) && sameDay) {
      return {
        t: {
          inbound: snap.inbound || 0,
          outbound: snap.outbound || 0,
          answered: snap.answered || 0,
          missed: snap.missed || 0,
          avgRing: snap.avgRing || 0,
          answerRate: snap.answerRate || 0,
          missedRate: snap.missedRate || 0,
          ddiCounts: snap.ddiCounts || {}
        },
        y: {
          inbound: snap.yInbound || 0,
          outbound: snap.yOutbound || 0,
          answered: snap.yAnswered || 0,
          missed: snap.yMissed || 0,
          avgRing: snap.yAvgRing || 0,
          ddiCounts: snap.yDdiCounts || {}
        },
        fromSnapshot: true
      };
    }
    return { t, y, fromSnapshot: false };
  }

  function inboundCountForDdi(calls, ddiKey) {
    return calls.filter(c => {
      if (G().normaliseDirection(c) !== 'INC' && G().normaliseDirection(c) !== 'IU') return false;
      const d = G().findDdiForCall(c);
      return d && d.ddi === ddiKey;
    }).length;
  }

  function callsForSelectedLine(calls) {
    if (state.selectedLineDdi === 'total') {
      return calls.filter(c => {
        const d = G().normaliseDirection(c);
        return d === 'INC' || d === 'IU';
      });
    }
    return calls.filter(c => {
      const d = G().findDdiForCall(c);
      return d && d.ddi === state.selectedLineDdi && (G().normaliseDirection(c) === 'INC' || G().normaliseDirection(c) === 'IU');
    });
  }

  function sparklineValues(metricFn) {
    const labels = G().buildDayLabels(0, 7).reverse();
    const all = G().getAllKnownCalls();
    return labels.map(d => metricFn(G().filterCallsInLabels(all, [d])));
  }

  function renderSparkline(container, values, colour) {
    container.innerHTML = '';
    const max = Math.max(...values, 1);
    values.forEach(v => {
      const bar = document.createElement('span');
      bar.style.background = colour;
      bar.style.height = `${Math.max(4, Math.round((v / max) * 26))}px`;
      container.appendChild(bar);
    });
  }

  function renderKpis(force) {
    const g = G();
    const live = g.liveCalls || [];
    const { t, y } = todayStats();
    const key = JSON.stringify({ t, y, live: live.length, loading: isLoading() });
    if (!force && state.renderKeys.kpi === key) return;
    state.renderKeys.kpi = key;

    const grid = document.getElementById('kpiGrid');
    if (!grid) return;
    const loading = isLoading();
    const ringing = live.filter(c => String(c.Call_Status || '').toLowerCase().includes('ring')).length;
    const onCall = live.filter(c => {
      const s = String(c.Call_Status || '').toLowerCase();
      return s.includes('on call') || s.includes('connect');
    }).length;

    const cards = [
      { label: 'Inbound today', val: t.inbound, colour: '#122e47', accent: '#1f78c9', spark: '#9ec6ea',
        chip: loading || !y.inbound ? '--' : formatDelta(t.inbound, y.inbound), chipCls: deltaCls(t.inbound, y.inbound, true),
        note: 'vs yesterday', sparkFn: calls => g.processCallsData(calls).inbound },
      { label: 'Outbound today', val: t.outbound, colour: '#122e47', accent: '#8fa3b4', spark: '#b9c6d2',
        chip: loading || !y.outbound ? '--' : formatDelta(t.outbound, y.outbound), chipCls: deltaCls(t.outbound, y.outbound, true),
        note: 'vs yesterday', sparkFn: calls => g.processCallsData(calls).outbound },
      { label: 'Live calls now', val: live.length, colour: '#1f78c9', accent: '#fed53f', spark: '#9ec6ea',
        chip: `${ringing} ringing`, chipCls: 'warn', note: `${onCall} on a call`, sparkFn: () => live.length },
      { label: 'Answered today', val: t.answered, colour: '#0b6b3a', accent: '#2fa26a', spark: '#9bd3b0',
        chip: loading ? '--' : `${t.answerRate}%`, chipCls: 'ok', note: 'answer rate', sparkFn: calls => g.processCallsData(calls).answered },
      { label: 'Missed today', val: t.missed, colour: '#a3261f', accent: '#d9534f', spark: '#f0a9a3',
        chip: loading ? '--' : formatDelta(t.missed, y.missed, true), chipCls: t.missed <= y.missed ? 'ok' : 'miss',
        note: `${t.missedRate}% of inbound`, sparkFn: calls => g.processCallsData(calls).missed },
      { label: 'Avg answer time', val: loading ? '--' : g.formatTime(Math.round(t.avgRing)), colour: '#122e47', accent: '#122e47', spark: '#b9c6d2',
        chip: loading ? '--' : formatDelta(Math.round(t.avgRing), Math.round(y.avgRing), false, 's'), chipCls: t.avgRing <= y.avgRing ? 'ok' : 'miss',
        note: t.avgRing <= y.avgRing ? 'faster than yesterday' : 'slower than yesterday', sparkFn: calls => Math.round(g.processCallsData(calls).avgRing) }
    ];

    grid.innerHTML = '';
    cards.forEach(c => {
      const card = document.createElement('article');
      card.className = 'card kpi-card';
      card.style.borderTopColor = c.accent;
      const valCls = loading && c.label !== 'Live calls now' ? 'kpi-value placeholder tabular' : 'kpi-value tabular';
      const displayVal = loading && c.label !== 'Live calls now' ? '--' : (typeof c.val === 'number' ? c.val : c.val);
      card.innerHTML = `
        <div class="kpi-label">${escapeHtml(c.label)}</div>
        <div class="kpi-main">
          <div class="${valCls}" style="color:${c.colour}">${escapeHtml(String(displayVal))}</div>
          <div class="kpi-spark" aria-hidden="true"></div>
        </div>
        <div class="kpi-foot">
          <span class="chip ${escapeHtml(c.chipCls)}">${escapeHtml(String(c.chip))}</span>
          <span>${escapeHtml(c.note)}</span>
        </div>`;
      if (!loading || c.label === 'Live calls now') {
        const sparks = c.label === 'Live calls now' ? [live.length] : sparklineValues(c.sparkFn);
        if (c.label !== 'Live calls now') renderSparkline(card.querySelector('.kpi-spark'), sparks, c.spark);
      }
      grid.appendChild(card);
    });
  }

  function formatDelta(today, yest, higherIsGood, suffix) {
    if (!yest && !today) return '0%';
    const pct = G().pctChange(today, yest);
    const arrow = pct > 0 ? '▲' : pct < 0 ? '▼' : '';
    if (suffix) return `${arrow} ${Math.abs(today - yest)}${suffix}`;
    return `${arrow} ${G().formatPct(pct)}`;
  }

  function deltaCls(today, yest, higherIsGood) {
    if (today === yest) return 'mute';
    const up = today > yest;
    if (higherIsGood) return up ? 'in' : 'out';
    return up ? 'miss' : 'ok';
  }

  function renderVolumeChart(force) {
    const g = G();
    if (!g) return;
    const svg = document.getElementById('chartSvg');
    const loadingMsg = document.getElementById('volumeLoadingMsg');
    const tooltip = document.getElementById('chartTooltip');
    const note = document.getElementById('chartPeriodNote');
    const sub = document.getElementById('volumeSub');
    const foot = document.getElementById('volumeFootnote');
    if (!svg) return;

    const period = state.volumePeriod === 'week' ? 'week' : 'today';
    g.chartPeriod = period;
    if (sub) {
      sub.textContent = state.volumePeriod === 'month'
        ? 'Monthly view is not available yet — showing today'
        : (period === 'week'
          ? 'Inbound calls per day, this week against last week'
          : 'Inbound calls per hour, today against yesterday');
    }

    if (isLoading()) {
      if (loadingMsg) loadingMsg.hidden = false;
      svg.innerHTML = '';
      if (tooltip) tooltip.classList.remove('visible');
      return;
    }
    if (loadingMsg) loadingMsg.hidden = true;

    g.refreshChartCache(g.todayCalls, g.yesterdayCalls, g.fortnightCalls);
    const cache = g.chartDataCache;
    if (!cache) return;

    let todayTotal = cache.todayTotal.slice();
    let yesterdayTotal = cache.yesterdayTotal.slice();
    const selected = state.selectedLineDdi;
    let colour = '#1f78c9';
    if (selected && selected !== 'total') {
      const ddi = g.DDI_LIST.find(d => d.ddi === selected);
      colour = lineColour(ddi ? ddi.name : '');
      todayTotal = (cache.todayByDdi[selected] || todayTotal).slice();
      yesterdayTotal = (cache.yesterdayByDdi[selected] || yesterdayTotal).slice();
    }

    const { mode, pointCount, dayLabels, prevWeekLabels } = cache;
    const peak = Math.max(...todayTotal, ...yesterdayTotal, 0);
    const maxVal = Math.max(peak, 1);
    const W = 600, H = 220, padL = 44, padR = 16, padT = 28, padB = 32;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const xDivisor = Math.max(pointCount - 1, 1);

    function toPoints(data) {
      return data.map((v, i) => ({
        x: padL + (i / xDivisor) * chartW,
        y: padT + chartH - (v / maxVal) * chartH,
        v,
        index: i
      }));
    }
    function linePath(pts) {
      return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    }
    function areaPath(pts) {
      const bottom = padT + chartH;
      return linePath(pts) + ` L${pts[pts.length - 1].x.toFixed(1)},${bottom} L${pts[0].x.toFixed(1)},${bottom} Z`;
    }

    const yTicks = peak > 0 ? [0, Math.ceil(peak / 2), peak] : [0];
    const uniqueYTicks = [...new Set(yTicks)];
    let html = `<defs>
      <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${colour}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${colour}" stop-opacity="0.02"/>
      </linearGradient>
    </defs>`;
    uniqueYTicks.forEach(val => {
      const y = padT + chartH - (val / maxVal) * chartH;
      html += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#e2e8f0" stroke-width="0.5"/>`;
      html += `<text x="${padL - 6}" y="${y + 3}" fill="#4d6274" font-size="9" text-anchor="end" font-family="Lato,system-ui,sans-serif">${val}</text>`;
    });
    if (mode === 'week') {
      (dayLabels || []).forEach((label, i) => {
        const x = padL + (i / xDivisor) * chartW;
        html += `<text x="${x}" y="${H - 8}" fill="#4d6274" font-size="8" text-anchor="middle" font-family="Lato,system-ui,sans-serif">${escapeHtml(g.formatDayLabel(label))}</text>`;
      });
    } else {
      [0, 4, 8, 12, 16, 20].forEach(h => {
        const x = padL + (h / xDivisor) * chartW;
        html += `<text x="${x}" y="${H - 8}" fill="#4d6274" font-size="9" text-anchor="middle" font-family="Lato,system-ui,sans-serif">${String(h).padStart(2, '0')}:00</text>`;
      });
      html += `<text x="${padL + chartW}" y="${H - 8}" fill="#4d6274" font-size="9" text-anchor="middle" font-family="Lato,system-ui,sans-serif">24:00</text>`;
    }

    const totalPts = toPoints(todayTotal);
    const yestPts = toPoints(yesterdayTotal);
    html += `<path d="${areaPath(totalPts)}" fill="url(#totalGrad)"/>`;
    html += `<path d="${linePath(yestPts)}" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 3" pointer-events="none"/>`;
    html += `<path d="${linePath(totalPts)}" fill="none" stroke="${colour}" stroke-width="2.5" stroke-linejoin="round"/>`;
    totalPts.forEach(p => {
      if (p.v > 0) html += `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${colour}" stroke="#fff" stroke-width="1.5"/>`;
      html += `<circle cx="${p.x}" cy="${p.y}" r="14" fill="transparent" class="chart-hit" data-index="${p.index}" data-today="${p.v}" data-yest="${yesterdayTotal[p.index]}" style="cursor:pointer"/>`;
    });
    svg.innerHTML = html;

    svg.querySelectorAll('.chart-hit').forEach(circle => {
      circle.addEventListener('mouseenter', e => {
        const idx = parseInt(circle.dataset.index, 10);
        let title;
        if (mode === 'week') {
          const label = dayLabels[idx];
          const prevLabel = prevWeekLabels && prevWeekLabels[idx];
          title = prevLabel ? `${g.formatDayLabel(label)} vs ${g.formatDayLabel(prevLabel)}` : g.formatDayLabel(label);
          if (label === g.getLondonDateString(0)) title += ' (today)';
        } else {
          title = `${String(idx).padStart(2, '0')}:00 – ${String(idx).padStart(2, '0')}:59`;
        }
        const periodLabel = mode === 'week' ? 'This week' : 'Today';
        const compareLabel = mode === 'week' ? 'Last week' : 'Yesterday';
        tooltip.innerHTML = `<strong>${escapeHtml(title)}</strong><br>${periodLabel}: ${circle.dataset.today} calls<br>${compareLabel}: ${circle.dataset.yest} calls`;
        tooltip.classList.add('visible');
        const rect = document.getElementById('chartContainer').getBoundingClientRect();
        tooltip.style.left = (e.clientX - rect.left - 40) + 'px';
        tooltip.style.top = (e.clientY - rect.top - 50) + 'px';
      });
      circle.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
    });

    if (note) {
      if (mode === 'week') {
        const total = todayTotal.reduce((a, b) => a + b, 0);
        const prev = yesterdayTotal.reduce((a, b) => a + b, 0);
        const pct = prev ? Math.round(((total - prev) / prev) * 100) : 0;
        const sign = pct > 0 ? '+' : '';
        note.textContent = `Daily volume · this week vs last week · ${total} calls (${sign}${pct}% vs ${prev})`;
      } else {
        const total = todayTotal.reduce((a, b) => a + b, 0);
        const prev = yesterdayTotal.reduce((a, b) => a + b, 0);
        note.textContent = `Hourly volume · today vs yesterday · ${total} inbound today · ${prev} yesterday`;
      }
    }
    const selName = selected === 'total' ? 'All lines' : ((g.DDI_LIST.find(d => d.ddi === selected) || {}).name || '');
    if (foot) {
      const todayN = todayTotal.reduce((a, b) => a + b, 0);
      const yN = yesterdayTotal.reduce((a, b) => a + b, 0);
      foot.textContent = `${selName}: ${todayN} inbound in this view · ${yN} in the comparison period.`;
    }
    const table = document.getElementById('volumeDataTable');
    if (table) {
      const headA = mode === 'week' ? 'This week' : 'Today';
      const headB = mode === 'week' ? 'Last week' : 'Yesterday';
      const rows = todayTotal.map((v, i) => {
        const lab = mode === 'week' ? g.formatDayLabel(dayLabels[i]) : `${String(i).padStart(2, '0')}:00`;
        return `<tr><td>${escapeHtml(lab)}</td><td class="r">${v}</td><td class="r">${yesterdayTotal[i]}</td></tr>`;
      }).join('');
      table.innerHTML = `<thead><tr><th>Period</th><th class="r">${headA}</th><th class="r">${headB}</th></tr></thead><tbody>${rows}</tbody>`;
    }
  }

  function renderLinePicker(force) {
    const g = G();
    const today = g.todayCalls;
    const { t } = todayStats();
    const total = today.length ? g.processCallsData(today).inbound : t.inbound;
    const row = document.getElementById('linePicker');
    if (!row) return;
    row.innerHTML = '';
    const addBtn = (ddi, name, count) => {
      const col = lineColour(name);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tab sm' + ((ddi === state.selectedLineDdi) ? ' on' : '');
      if (ddi === state.selectedLineDdi) {
        btn.style.background = ddi === 'total' ? '#122e47' : col;
        btn.style.borderColor = btn.style.background;
        btn.style.color = '#fff';
      }
      if (count === 0 && ddi !== 'total') btn.style.color = '#8a9aa8';
      btn.dataset.ddi = ddi;
      const dot = document.createElement('span');
      dot.className = 'line-dot';
      dot.style.background = ddi === 'total' ? '#122e47' : col;
      btn.appendChild(dot);
      btn.appendChild(document.createTextNode(`${name} (${count})`));
      btn.addEventListener('click', () => selectLine(ddi));
      row.appendChild(btn);
    };
    addBtn('total', 'Total', total);
    g.DDI_LIST.forEach(d => {
      const count = today.length ? inboundCountForDdi(today, d.ddi) : (t.ddiCounts[d.ddi] || 0);
      addBtn(d.ddi, d.name, count);
    });
  }

  function selectLine(ddi) {
    state.selectedLineDdi = ddi;
    try { sessionStorage.setItem('s4s-selected-line', ddi); } catch (e) {}
    renderLinePicker(true);
    renderLineTiles(true);
    renderVolumeChart(true);
  }

  function lineStatusChip(ddi) {
    const st = G().ddiStatuses[ddi] || 'idle';
    if (st === 'incall') return { text: 'On call', cls: 'in' };
    if (st === 'ringing') return { text: 'Ringing', cls: 'warn' };
    return { text: 'Idle', cls: 'mute' };
  }

  function renderLineTiles(force) {
    const g = G();
    const today = g.todayCalls;
    const yesterday = g.yesterdayCalls;
    const { t, y } = todayStats();
    const tCounts = today.length
      ? Object.fromEntries(g.DDI_LIST.map(d => [d.ddi, inboundCountForDdi(today, d.ddi)]))
      : t.ddiCounts;
    const yCounts = yesterday.length
      ? Object.fromEntries(g.DDI_LIST.map(d => [d.ddi, inboundCountForDdi(yesterday, d.ddi)]))
      : y.ddiCounts;
    const max = Math.max(...g.DDI_LIST.map(d => tCounts[d.ddi] || 0), 1);
    const wrap = document.getElementById('lineTiles');
    if (!wrap) return;
    wrap.innerHTML = '';
    g.DDI_LIST.forEach(d => {
      const count = tCounts[d.ddi] || 0;
      const yCount = yCounts[d.ddi] || 0;
      const pct = g.pctChange(count, yCount);
      const col = lineColour(d.name);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'line-tile' + (count === 0 ? ' zero' : '') + (state.selectedLineDdi === d.ddi ? ' selected' : '');
      btn.style.borderLeftColor = col;
      if (state.selectedLineDdi === d.ddi) btn.style.borderColor = col;
      btn.setAttribute('aria-pressed', state.selectedLineDdi === d.ddi ? 'true' : 'false');
      const chip = lineStatusChip(d.ddi);
      const pctText = `${pct > 0 ? '+' : ''}${pct}% vs yday`;
      const pctColour = pct > 0 ? '#0b6b3a' : pct < 0 ? '#a3261f' : 'var(--muted)';
      btn.innerHTML = `
        <div class="line-tile-head">
          <div class="line-avatar" style="background:${col};color:${avatarTextColour(col)}">${escapeHtml(d.name.charAt(0))}</div>
          <div class="line-tile-name">${escapeHtml(d.name)}</div>
          <span class="chip ${chip.cls}">${escapeHtml(chip.text)}</span>
        </div>
        <div style="font-size:13px;color:var(--muted)">${escapeHtml(d.number)}</div>
        <div class="line-tile-count-row">
          <div><span class="line-tile-count tabular" style="color:${col}">${isLoading() ? '--' : count}</span><span style="font-size:13px;font-weight:700;color:var(--muted);margin-left:6px">calls</span></div>
          <span style="font-size:12.5px;font-weight:700;color:${pctColour}">${isLoading() ? '--' : pctText}</span>
        </div>
        <div class="share-bar"><div style="width:${Math.round((count / max) * 100)}%;height:100%;background:${col}"></div></div>`;
      btn.addEventListener('click', () => selectLine(d.ddi));
      wrap.appendChild(btn);
    });
  }

  function waitingSince(call) {
    const g = G();
    const dateStr = g.getCallDate(g.getCallDateField(call));
    const m = String(call.Call_date || '').match(/(\d{2}):(\d{2}):(\d{2}|\d{2})/);
    if (!dateStr || !m) return { label: '--', cls: 'mute', mins: 0 };
    const now = g.getLondonParts(new Date());
    const then = new Date(`${dateStr}T${m[1]}:${m[2]}:${m[3] || '00'}+00:00`);
    const mins = Math.max(0, Math.floor((Date.now() - then.getTime()) / 60000));
    if (mins >= 60) return { label: `${Math.floor(mins / 60)}h ${mins % 60}m`, cls: 'miss', mins };
    return { label: `${mins}m`, cls: 'warn', mins };
  }

  function missedCallbackLabel(stored) {
    if (stored === 'Called back') return { text: 'Called back', cls: 'ok' };
    if (stored === 'No answer') return { text: 'No answer', cls: 'mute' };
    return { text: 'New', cls: 'warn' };
  }

  function renderMissed(force) {
    const g = G();
    const today = g.todayCalls;
    const yesterday = g.yesterdayCalls;
    const allMissed = g.getMissedCallsList(today);
    const statuses = g.loadWeekendCallbackStatuses();
    const key = allMissed.length + g.fingerprintCalls(today);
    if (!force && state.renderKeys.missed === key) return;
    state.renderKeys.missed = key;

    const loading = isLoading();
    const { t, y } = todayStats();
    const pending = allMissed.filter(c => statuses[g.callRecordKey(c)] !== 'Called back');

    const statsEl = document.getElementById('missedStats');
    const chip = document.getElementById('missedHeaderChip');
    if (chip) {
      chip.className = pending.length ? 'chip miss' : 'chip ok';
      chip.textContent = pending.length ? `${pending.length} still to call back` : 'All called back';
    }

    const ringTimes = allMissed.filter(c => c.Ring_time > 0).map(c => c.Ring_time);
    const avgRing = ringTimes.length ? ringTimes.reduce((a, b) => a + b, 0) / ringTimes.length : 0;
    const byGarage = g.getMissedByGarage(today);
    let busiestLine = '--';
    let busiestInbound = 0;
    g.DDI_LIST.forEach(d => {
      const c = inboundCountForDdi(today, d.ddi);
      if (c > busiestInbound) { busiestInbound = c; busiestLine = d.name; }
    });

    let oldest = null;
    pending.forEach(c => {
      const w = waitingSince(c);
      const mins = typeof w.mins === 'number' ? w.mins : 0;
      if (!oldest || mins > oldest.mins) oldest = { w, mins, time: (String(c.Call_date || '').match(/(\d{2}:\d{2})/) || [])[1] };
    });

    if (statsEl) {
      const missedDelta = allMissed.length - (y.missed || 0);
      const missedDeltaLabel = `${missedDelta >= 0 ? '+' : ''}${missedDelta} vs yesterday`;
      statsEl.innerHTML = `
        <div class="stat-box"><label>Missed today</label><div class="val tabular" style="color:#a3261f">${loading ? '--' : allMissed.length}</div><div class="note">${loading ? '' : missedDeltaLabel}</div></div>
        <div class="stat-box"><label>Missed rate</label><div class="val tabular">${loading ? '--' : t.missedRate + '%'}</div><div class="note">of ${t.inbound} inbound calls</div></div>
        <div class="stat-box"><label>Avg rang for</label><div class="val tabular">${loading ? '--' : (avgRing ? g.formatTime(Math.round(avgRing)) : '--')}</div><div class="note">before caller hung up</div></div>
        <div class="stat-box"><label>Busiest line</label><div class="val">${loading ? '--' : escapeHtml(busiestLine)}</div><div class="note">${busiestInbound} calls so far</div></div>
        <div class="stat-box"><label>Oldest waiting</label><div class="val" style="color:${pending.length ? '#a3261f' : '#0b6b3a'}">${loading ? '--' : (pending.length ? oldest?.w.label || '--' : 'None')}</div><div class="note">${pending.length ? `since ${oldest?.time || '--'}` : 'everyone called back'}</div></div>`;
    }

    const tbody = document.getElementById('missedBody');
    if (!tbody) return;
    if (loading) {
      tbody.innerHTML = '<tr class="skeleton-row"><td colspan="6"><div class="skeleton-bar"></div></td></tr>'.repeat(3);
      return;
    }
    if (!allMissed.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-msg"><span class="chip ok">All clear</span><div style="margin-top:8px">No missed calls today</div></td></tr>`;
      return;
    }
    tbody.innerHTML = '';
    allMissed.slice().reverse().forEach(c => {
      const ddi = g.findDdiForCall(c);
      const key = g.callRecordKey(c);
      const st = statuses[key] || 'To call back';
      const cb = missedCallbackLabel(st);
      const wait = st === 'Called back' ? { label: 'Done', cls: 'ok' } : waitingSince(c);
      const timeMatch = (c.Call_date || '').match(/(\d{2}:\d{2})/);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(timeMatch ? timeMatch[1] : '--:--')}</strong></td>
        <td>${escapeHtml(ddi ? ddi.name : 'Unknown')}</td>
        <td>${escapeHtml(g.formatPhoneDisplay(g.formatCallerId(c)))}</td>
        <td class="r tabular">${escapeHtml(c.Ring_time > 0 ? `${Math.round(c.Ring_time)}s` : '0s')}</td>
        <td><span class="chip ${wait.cls}">${escapeHtml(wait.label)}</span></td>
        <td></td>`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `callback-btn chip ${cb.cls}`;
      btn.textContent = cb.text;
      btn.setAttribute('aria-label', `Call-back status for ${timeMatch ? timeMatch[1] : 'call'}: ${cb.text}. Click to change.`);
      btn.addEventListener('click', () => {
        const idx = MISSED_CALLBACK_CYCLE.indexOf(st);
        const next = MISSED_CALLBACK_CYCLE[(idx + 1) % MISSED_CALLBACK_CYCLE.length];
        g.saveWeekendCallbackStatus(key, next);
        renderMissed(true);
      });
      tr.lastElementChild.appendChild(btn);
      tbody.appendChild(tr);
    });
  }

  function renderRecent(force) {
    const g = G();
    const calls = g.getAllKnownCalls().filter(c => {
      const dir = g.normaliseDirection(c);
      if (state.recentFilter === 'all') return true;
      return dir === state.recentFilter;
    }).sort((a, b) => (b.Call_date || '').localeCompare(a.Call_date || ''));
    const visible = calls.slice(0, state.recentShow);
    const key = state.recentFilter + state.recentShow + calls.length;
    if (!force && state.renderKeys.recent === key) return;
    state.renderKeys.recent = key;

    const tbody = document.getElementById('recentBody');
    const showing = document.getElementById('recentShowing');
    if (showing) showing.textContent = `Showing ${visible.length} of ${calls.length} calls`;
    if (!tbody) return;
    if (isLoading()) {
      tbody.innerHTML = '<tr class="skeleton-row"><td colspan="6"><div class="skeleton-bar"></div></td></tr>'.repeat(3);
      return;
    }
    if (!visible.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No calls yet today</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    visible.forEach(c => {
      const ddi = g.findDdiForCall(c);
      const dateStr = g.getCallDate(g.getCallDateField(c));
      const timeMatch = (c.Call_date || '').match(/(\d{2}:\d{2})/);
      const dir = g.normaliseDirection(c);
      let chip = { cls: 'in', text: 'Inbound' };
      if (dir === 'OUT') chip = { cls: 'out', text: 'Outbound' };
      if (dir === 'IU') chip = { cls: 'miss', text: 'Missed' };
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(dateStr ? g.formatRecorderDate(dateStr) : '--')}</td>
        <td><strong>${escapeHtml(timeMatch ? timeMatch[1] : '--:--')}</strong></td>
        <td>${escapeHtml(ddi ? ddi.name : 'Unknown')}</td>
        <td style="color:var(--muted)">${escapeHtml(g.formatPhoneDisplay(g.formatCallerId(c)))}</td>
        <td class="r tabular">${escapeHtml(dir === 'IU' ? '–' : g.formatDuration(c.Talk_time || c.Duration || 0))}</td>
        <td><span class="chip ${chip.cls}">${chip.text}</span></td>`;
      tbody.appendChild(tr);
    });
  }

  function renderWeekend() {
    const g = G();
    const rows = g.weekendMissedRows;
    const statsEl = document.getElementById('weekendStats');
    const tbody = document.getElementById('weekendMissedBody');
    const foot = document.getElementById('weekendFootnote');
    if (g.weekendLoading && statsEl) statsEl.innerHTML = '<div class="stat-box"><label>Loading</label><div class="val">…</div></div>';

    const unanswered = rows.filter(r => r.callTypeCls === 'type-missed').length;
    const auto = rows.filter(r => r.callTypeCls === 'type-auto').length;
    const byLine = {};
    rows.forEach(r => { byLine[r.line] = (byLine[r.line] || 0) + 1; });
    const topLine = Object.entries(byLine).sort((a, b) => b[1] - a[1])[0];

    if (statsEl && !g.weekendLoading) {
      if (!g.weekendRangeLabel && !rows.length) {
        statsEl.innerHTML = '';
      } else {
        statsEl.innerHTML = `
        <div class="stat-box"><label>Total inbound</label><div class="val tabular">${rows.length}</div></div>
        <div class="stat-box"><label>Unanswered</label><div class="val tabular" style="color:#a3261f">${unanswered}</div></div>
        <div class="stat-box"><label>Auto / voicemail</label><div class="val tabular" style="color:#7a4f00">${auto}</div></div>
        <div class="stat-box"><label>Busiest line</label><div class="val">${topLine ? escapeHtml(topLine[0]) : 'None'}</div></div>`;
      }
    }
    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-msg">Load a weekend range to see inbound calls</td></tr>';
      if (foot) foot.textContent = '';
      return;
    }
    tbody.innerHTML = '';
    rows.forEach(r => {
      const chipMap = { 'type-missed': 'miss', 'type-auto': 'warn' };
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(r.dateLabel)}</td>
        <td>${escapeHtml(r.time)}</td>
        <td>${escapeHtml(r.line)}</td>
        <td>${escapeHtml(r.garage)}</td>
        <td>${escapeHtml(r.caller)}</td>
        <td class="r">${escapeHtml(r.ringTime)}</td>
        <td><span class="chip ${chipMap[r.callTypeCls] || 'mute'}">${escapeHtml(r.callType)}</span></td>
        <td><span class="chip ${r.status === 'Called back' ? 'ok' : r.status === 'No answer' ? 'mute' : 'warn'}">${escapeHtml(r.status || 'To call back')}</span></td>`;
      tbody.appendChild(tr);
    });
    if (foot) foot.textContent = rows.length
      ? `Showing all ${rows.length} inbound calls in this range.`
      : '';
  }

  function renderCompare(force) {
    const g = G();
    const { t, y } = todayStats();
    const wrap = document.getElementById('compareMetrics');
    if (!wrap) return;
    const rows = [
      { label: 'Inbound calls', t: t.inbound, y: y.inbound, colour: '#1f78c9' },
      { label: 'Answered', t: t.answered, y: y.answered, colour: '#0b6b3a' },
      { label: 'Missed', t: t.missed, y: y.missed, colour: '#a3261f' },
      { label: 'Outbound calls', t: t.outbound, y: y.outbound, colour: '#5d7385' },
      { label: 'Avg answer time (s)', t: Math.round(t.avgRing), y: Math.round(y.avgRing), colour: '#1f78c9', time: true }
    ];
    wrap.innerHTML = '';
    rows.forEach(r => {
      const max = Math.max(r.t, r.y, 1);
      const div = document.createElement('div');
      div.className = 'compare-metric';
      div.innerHTML = `
        <div class="compare-metric-head">
          <span>${escapeHtml(r.label)}</span>
          <span class="tabular" style="color:var(--muted)"><strong>${isLoading() ? '--' : r.t}</strong> today · ${isLoading() ? '--' : r.y} yesterday</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${(r.t / max) * 100}%;background:${r.colour}"></div></div>
        <div class="bar-track sm"><div class="bar-fill" style="width:${(r.y / max) * 100}%;background:#b9c6d2"></div></div>`;
      wrap.appendChild(div);
    });
  }

  function renderTopPerformer(force) {
    const g = G();
    const { t } = todayStats();
    let best = null;
    let bestCount = 0;
    g.DDI_LIST.forEach(d => {
      const c = g.todayCalls.length ? inboundCountForDdi(g.todayCalls, d.ddi) : (t.ddiCounts[d.ddi] || 0);
      if (c > bestCount) { bestCount = c; best = d; }
    });
    const el = document.getElementById('topPerformer');
    if (!el) return;
    if (isLoading() || !best || bestCount === 0) {
      el.innerHTML = '<p class="empty-msg">Not enough calls yet</p>';
      return;
    }
    const lineCalls = g.todayCalls.filter(c => {
      const d = g.findDdiForCall(c);
      return d && d.ddi === best.ddi && (g.normaliseDirection(c) === 'INC' || g.normaliseDirection(c) === 'IU');
    });
    const ans = lineCalls.filter(c => g.normaliseDirection(c) === 'INC').length;
    const ringTimes = lineCalls.filter(c => g.normaliseDirection(c) === 'INC' && c.Ring_time > 0).map(c => c.Ring_time);
    const avgRing = ringTimes.length ? ringTimes.reduce((a, b) => a + b, 0) / ringTimes.length : 0;
    const rate = bestCount ? Math.round((ans / bestCount) * 100) : 0;
    el.innerHTML = `
      <div class="trophy-box"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1f78c9" stroke-width="1.75" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></div>
      <div style="font-size:20px;font-weight:900">${escapeHtml(best.name)}</div>
      <div style="font-size:13.5px;color:var(--muted)">${escapeHtml(best.number)}</div>
      <div class="top-chips">
        <span class="chip ok">${rate}% answered</span>
        <span class="chip in">${bestCount} calls</span>
        <span class="chip out">Avg answer ${g.formatTime(Math.round(avgRing))}</span>
      </div>`;
  }

  function recorderColour(name) {
    if (name === 'Main') return '#122e47';
    if (name === 'South East') return lineColour('South-east');
    return lineColour(name);
  }

  function renderRecorderCalendar(data) {
    const g = G();
    const grid = document.getElementById('recorderCalendar');
    const titleEl = document.getElementById('recorderCalTitle');
    const nextBtn = document.getElementById('recorderCalNext');
    const prevBtn = document.getElementById('recorderCalPrev');
    if (!grid || !titleEl) return;
    const view = g.getRecorderCalendarView();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    titleEl.textContent = `${monthNames[view.month - 1]} ${view.year}`;
    const todayStr = data.todayStr;
    const viewDate = data.viewDate;
    const oldestBound = data.oldestDate || data.loadedDayLabels[0] || todayStr;
    const peak = Math.max(...Object.values(data.calendarTotals), 1);
    const nowParts = g.getLondonParts(new Date());
    const isCurrentMonth = view.year === +nowParts.year && view.month === +nowParts.month;
    const oldestParts = oldestBound.split('-');
    const isOldestMonth = view.year === +oldestParts[0] && view.month === +oldestParts[1];
    if (nextBtn) nextBtn.disabled = isCurrentMonth;
    if (prevBtn) prevBtn.disabled = isOldestMonth;
    const daysInMonth = new Date(Date.UTC(view.year, view.month, 0)).getUTCDate();
    let startDow = new Date(Date.UTC(view.year, view.month - 1, 1)).getUTCDay();
    startDow = (startDow + 6) % 7;
    let html = '';
    for (let i = 0; i < startDow; i++) html += '<div class="recorder-cal-day empty"></div>';
    for (let day = 1; day <= daysInMonth; day++) {
      const m = String(view.month).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      const dateStr = `${view.year}-${m}-${d}`;
      const isFuture = dateStr > todayStr;
      const inRange = !isFuture && dateStr >= oldestBound;
      const total = inRange ? (data.calendarTotals[dateStr] || 0) : null;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === viewDate;
      let cls = 'recorder-cal-day';
      if (isToday) cls += ' is-today';
      if (isSelected) cls += ' selected';
      if (!inRange || isFuture) cls += ' outside-range';
      else if (total > 0) cls += ' has-calls';
      else cls += ' quiet';
      const disabled = isFuture || !inRange;
      const heat = total > 0 ? g.getCalendarHeat(total, peak) : 'transparent';
      const countHtml = inRange && !isFuture
        ? `<span class="recorder-cal-day-count${total > 0 ? '' : ' zero'}">${total}</span>`
        : '';
      html += `<button type="button" class="${cls}" data-date="${dateStr}" ${disabled ? 'disabled' : ''}${isSelected || disabled ? '' : ` style="background:${heat}"`}>` +
        `<span class="recorder-cal-day-num">${day}</span>${countHtml}</button>`;
    }
    grid.innerHTML = html;
  }

  function renderRecorderPie(viewCounts, viewTotal, centerLabel) {
    const g = G();
    const svg = document.getElementById('recorderPieSvg');
    const legend = document.getElementById('recorderPieLegend');
    if (!svg || !legend) return;
    const cx = 90, cy = 90, r = 72;
    const slices = g.RECORDER_LINES.map(line => ({
      name: line.name,
      value: viewCounts[line.name] || 0,
      colour: recorderColour(line.name)
    })).filter(s => s.value > 0);
    const assigned = slices.reduce((sum, s) => sum + s.value, 0);
    const other = viewTotal - assigned;
    if (other > 0) slices.push({ name: 'Other numbers', value: other, colour: '#8a9aa8' });
    if (!viewTotal || !slices.length) {
      svg.innerHTML = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#eef2f6"/><text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="#4d6274" font-size="12" font-family="Lato,system-ui,sans-serif">No calls</text>`;
      legend.innerHTML = '<span class="recorder-legend-item" style="color:var(--muted)">No inbound calls on this day</span>';
      return;
    }
    let html = '';
    let startPct = 0;
    slices.forEach(slice => {
      const pct = slice.value / viewTotal;
      const endPct = startPct + pct;
      if (pct >= 0.999) {
        html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${slice.colour}"/>`;
      } else {
        const start = -Math.PI / 2 + startPct * 2 * Math.PI;
        const end = -Math.PI / 2 + endPct * 2 * Math.PI;
        const x1 = cx + r * Math.cos(start);
        const y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(end);
        const y2 = cy + r * Math.sin(end);
        const large = pct > 0.5 ? 1 : 0;
        html += `<path d="M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${slice.colour}"/>`;
      }
      startPct = endPct;
    });
    html += `<circle cx="${cx}" cy="${cy}" r="38" fill="#ffffff"/><text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="#122e47" font-size="20" font-weight="800" font-family="Lato,system-ui,sans-serif">${viewTotal}</text><text x="${cx}" y="${cy + 14}" text-anchor="middle" fill="#4d6274" font-size="10" font-family="Lato,system-ui,sans-serif">${centerLabel || 'calls'}</text>`;
    svg.innerHTML = html;
    legend.innerHTML = slices.map(slice => {
      const pct = Math.round((slice.value / viewTotal) * 100);
      return `<div class="recorder-legend-item"><span class="recorder-legend-dot" style="background:${slice.colour}"></span><span>${escapeHtml(slice.name)}</span><span class="recorder-legend-pct">${pct}%</span></div>`;
    }).join('');
  }

  function renderRecorderBars(viewCounts, viewTotal) {
    const g = G();
    const el = document.getElementById('recorderBars');
    if (!el) return;
    const rows = g.RECORDER_LINES.map(line => ({
      name: line.name,
      value: viewCounts[line.name] || 0,
      colour: recorderColour(line.name)
    }));
    const assigned = rows.reduce((sum, r) => sum + r.value, 0);
    const other = viewTotal - assigned;
    if (other > 0) rows.push({ name: 'Other numbers', value: other, colour: '#8a9aa8' });
    rows.sort((a, b) => b.value - a.value);
    const peak = Math.max(...rows.map(r => r.value), 1);
    el.innerHTML = rows.map(row => {
      const width = row.value > 0 ? Math.max((row.value / peak) * 100, 4) : 0;
      const pct = viewTotal > 0 ? Math.round((row.value / viewTotal) * 100) : 0;
      return `<div class="recorder-bar-row"><span class="recorder-bar-label" title="${escapeHtml(row.name)}">${escapeHtml(row.name)}</span><div class="recorder-bar-track"><div class="recorder-bar-fill" style="width:${width}%;background:${row.colour}"></div></div><span class="recorder-bar-value tabular">${row.value}</span><span class="recorder-bar-pct">${pct}%</span></div>`;
    }).join('');
  }

  function renderRecorderTrend(dailyRows, viewDate) {
    const g = G();
    const svg = document.getElementById('recorderTrendSvg');
    if (!svg) return;
    const W = 600, H = 140, padL = 36, padR = 12, padT = 16, padB = 28;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const totals = dailyRows.map(r => r.total);
    const peak = Math.max(...totals, 1);
    const xDiv = Math.max(dailyRows.length - 1, 1);
    const points = dailyRows.map((r, i) => ({
      x: padL + (i / xDiv) * chartW,
      y: padT + chartH - (r.total / peak) * chartH,
      v: r.total
    }));
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area = line + ` L${points[points.length - 1].x.toFixed(1)},${padT + chartH} L${points[0].x.toFixed(1)},${padT + chartH} Z`;
    let html = `<defs><linearGradient id="recorderTrendGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1f78c9" stop-opacity="0.2"/><stop offset="100%" stop-color="#1f78c9" stop-opacity="0.02"/></linearGradient></defs>`;
    [0, Math.ceil(peak / 2), peak].filter((v, i, a) => a.indexOf(v) === i).forEach(val => {
      const y = padT + chartH - (val / peak) * chartH;
      html += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#eef2f6" stroke-width="0.5"/>`;
      html += `<text x="${padL - 4}" y="${y + 3}" fill="#4d6274" font-size="9" text-anchor="end" font-family="Lato,system-ui,sans-serif">${val}</text>`;
    });
    dailyRows.forEach((row, i) => {
      if (dailyRows.length > 14 && i % 2 !== 0 && i !== dailyRows.length - 1) return;
      const x = padL + (i / xDiv) * chartW;
      const label = row.isSelected ? 'Selected' : (row.isToday ? 'Today' : g.formatDayLabel(row.date));
      html += `<text x="${x}" y="${H - 6}" fill="#4d6274" font-size="9" text-anchor="middle" font-family="Lato,system-ui,sans-serif">${escapeHtml(label)}</text>`;
    });
    html += `<path d="${area}" fill="url(#recorderTrendGrad)"/>`;
    html += `<path d="${line}" fill="none" stroke="#1f78c9" stroke-width="2.5" stroke-linejoin="round"/>`;
    points.forEach((p, i) => {
      const row = dailyRows[i];
      const isHighlight = row.date === viewDate;
      const fill = isHighlight ? '#1f78c9' : '#fff';
      const r = isHighlight ? 5 : 3.5;
      html += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r + 8}" fill="transparent" class="recorder-trend-hit" data-date="${row.date}" style="cursor:pointer"/>`;
      html += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r}" fill="${fill}" stroke="#1f78c9" stroke-width="1.5" pointer-events="none"/>`;
    });
    svg.innerHTML = html;
    svg.onclick = e => {
      const hit = e.target.closest('[data-date]');
      if (hit && hit.dataset.date) window.S4SSelectRecorderDate(hit.dataset.date);
    };
  }

  function renderBreakdown(force) {
    const g = G();
    if (!g) return;
    const data = g.buildRecorderData(g.fortnightCalls);
    const calView = g.getRecorderCalendarView();
    const key = data.dailyRows.map(r => `${r.date}:${g.RECORDER_LINES.map(l => r.counts[l.name]).join(',')}:${r.total}`).join('|')
      + '::' + data.overallTotal + '::' + data.viewTotal + '::' + data.viewDate
      + '::' + g.recorderPeriodDays + '::' + calView.year + '-' + calView.month;
    if (!force && state.renderKeys.recorder === key) return;
    state.renderKeys.recorder = key;

    const isToday = data.viewDate === data.todayStr;
    const dateLabel = isToday ? 'today' : g.formatRecorderDate(data.viewDate);
    const shortDate = isToday ? 'Today' : g.formatRecorderDate(data.viewDate);
    const viewEl = document.getElementById('recorderViewTotal');
    const periodEl = document.getElementById('recorderPeriodTotal');
    const topEl = document.getElementById('recorderTopLine');
    const viewLabelEl = document.getElementById('recorderViewLabel');
    const topLabelEl = document.getElementById('recorderTopLabel');
    const selectedNoteEl = document.getElementById('recorderSelectedNote');
    const summaryDayCol = document.getElementById('recorderSummaryDayCol');
    const pieTitle = document.getElementById('recorderPieTitle');
    const barsTitle = document.getElementById('recorderBarsTitle');
    if (viewEl) viewEl.textContent = isLoading() ? '--' : data.viewTotal;
    if (periodEl) periodEl.textContent = isLoading() ? '--' : data.overallTotal;
    if (viewLabelEl) viewLabelEl.textContent = isToday ? 'Inbound calls today' : `Inbound on ${dateLabel}`;
    if (selectedNoteEl) {
      selectedNoteEl.textContent = isToday
        ? 'Showing today — pick another day on the calendar'
        : `Showing ${g.formatRecorderDate(data.viewDate)}`;
    }
    if (summaryDayCol) summaryDayCol.textContent = shortDate;
    if (pieTitle) pieTitle.textContent = isToday ? "Today's share by line" : `Share on ${dateLabel}`;
    if (barsTitle) barsTitle.textContent = isToday ? 'Calls today by line' : `Calls on ${dateLabel}`;

    const days = g.recorderPeriodDays || 14;
    const periodLabel = document.getElementById('recorderPeriodLabel');
    const trendTitle = document.getElementById('recorderTrendTitle');
    const summaryPeriodCol = document.getElementById('recorderSummaryPeriodCol');
    if (periodLabel) periodLabel.textContent = `Last ${days} days total`;
    if (trendTitle) trendTitle.textContent = `Daily total — last ${days} days`;
    if (summaryPeriodCol) summaryPeriodCol.textContent = `Total (${days} days)`;
    document.querySelectorAll('#recorderPeriodBtns .recorder-period-btn').forEach(btn => {
      const on = +btn.dataset.days === days;
      btn.classList.toggle('on', on);
      btn.classList.toggle('active', on);
    });

    const metaEl = document.getElementById('recorderDataMeta');
    if (metaEl) {
      const kept = (g.archivedCalls && g.archivedCalls.length) || data.archiveCount || 0;
      const daysWithCalls = data.loadedDayLabels.filter(d => (data.calendarTotals[d] || 0) > 0).length;
      const mins = g.lastFortnightFetchAt ? Math.round((Date.now() - g.lastFortnightFetchAt) / 60000) : null;
      if (g.recorderHistoryLoading) {
        metaEl.textContent = kept
          ? 'Updating history in background…'
          : 'Loading and storing call history…';
      } else if (mins === null) {
        metaEl.textContent = `Keeping ${kept.toLocaleString('en-GB')} calls · auto-updating`;
      } else {
        metaEl.textContent = `Keeping ${kept.toLocaleString('en-GB')} calls · ${daysWithCalls} active days in last ${days} · updated ${mins < 1 ? 'just now' : mins + ' min ago'}`;
      }
    }

    let topLine = '--';
    let topCount = 0;
    g.RECORDER_LINES.forEach(line => {
      const c = data.viewCounts[line.name] || 0;
      if (c > topCount) { topCount = c; topLine = line.name; }
    });
    if (topEl) topEl.textContent = topCount > 0 ? topLine : 'None';
    if (topLabelEl) topLabelEl.textContent = isToday ? 'Busiest line today' : 'Busiest line that day';

    renderRecorderPie(data.viewCounts, data.viewTotal, isToday ? 'today' : 'calls');
    renderRecorderBars(data.viewCounts, data.viewTotal);
    renderRecorderTrend(data.dailyRows, data.viewDate);
    renderRecorderCalendar(data);
    const todayBtn = document.getElementById('recorderTodayBtn');
    if (todayBtn) todayBtn.classList.toggle('on', g.recorderSelectedDate === null);

    const summaryBody = document.getElementById('recorderSummaryBody');
    if (summaryBody) {
      summaryBody.innerHTML = g.RECORDER_LINES.map(line => {
        const dayCount = data.viewCounts[line.name] || 0;
        const total = data.lineTotals[line.name] || 0;
        const col = recorderColour(line.name);
        return `<tr><td><span class="line-dot" style="background:${col};display:inline-block;vertical-align:middle;margin-right:8px"></span><strong>${escapeHtml(line.name)}</strong></td><td style="color:var(--muted)">${escapeHtml(g.formatPhoneDisplay(line.number))}</td><td class="r tabular recorder-today">${dayCount}</td><td class="r tabular">${total}</td></tr>`;
      }).join('');
    }
    const dailyHead = document.getElementById('recorderDailyHead');
    const dailyBody = document.getElementById('recorderDailyBody');
    if (dailyHead && dailyBody) {
      dailyHead.innerHTML = `<tr><th>Date</th>${g.RECORDER_LINES.map(l => `<th class="r">${escapeHtml(l.name)}</th>`).join('')}<th class="r">Daily total</th></tr>`;
      const rows = [...data.dailyRows].reverse();
      dailyBody.innerHTML = rows.map(row => {
        const rowClass = row.isSelected ? ' class="recorder-row-today recorder-daily-row-clickable"' : ' class="recorder-daily-row-clickable"';
        const cells = g.RECORDER_LINES.map(l => `<td class="r tabular${(row.counts[l.name] || 0) === 0 ? ' recorder-zero' : ''}">${row.counts[l.name] || 0}</td>`).join('');
        let dateLabelRow = g.formatRecorderDate(row.date);
        if (row.isToday) dateLabelRow += ' (today)';
        if (row.isSelected && !row.isToday) dateLabelRow += ' (selected)';
        return `<tr${rowClass} data-date="${row.date}"><td>${escapeHtml(dateLabelRow)}</td>${cells}<td class="r tabular"><strong>${row.total}</strong></td></tr>`;
      }).join('');
    }
  }

  function renderCallHistory(force) {
    const g = G();
    if (!g.historyModalOpen) return;
    const filtered = g.getFilteredHistoryCalls();
    const tbody = document.getElementById('historyCallsBody');
    const sub = document.getElementById('historyOverlaySub');
    const total = g.getHistorySourceCalls().length;
    if (sub) sub.textContent = `Keeping ${total.toLocaleString('en-GB')} calls · showing ${Math.min(filtered.length, g.historyShowCount)} of ${filtered.length} matching`;
    if (!tbody) return;
    const visible = filtered.slice(0, g.historyShowCount);
    tbody.innerHTML = '';
    visible.forEach(c => {
      const ddi = g.findDdiForCall(c);
      const dateStr = g.getCallDate(g.getCallDateField(c));
      const timeMatch = String(c.Call_date || '').match(/(\d{2}:\d{2})/);
      const dir = g.normaliseDirection(c);
      const type = g.historyTypeLabel(dir);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(dateStr ? g.formatRecorderDate(dateStr) : '--')}</td>
        <td>${escapeHtml(timeMatch ? timeMatch[1] : '--:--')}</td>
        <td>${escapeHtml(ddi ? ddi.name : 'Unknown')}</td>
        <td>${escapeHtml(g.formatPhoneDisplay(g.formatCallerId(c)))}</td>
        <td class="r">${escapeHtml(g.formatDuration(c.Talk_time || c.Duration || 0))}</td>
        <td><span class="chip ${dir === 'IU' ? 'miss' : dir === 'OUT' ? 'out' : 'in'}">${escapeHtml(type.text)}</span></td>`;
      tbody.appendChild(tr);
    });
  }

  function updateConnectionStatus(mode, detail) {
    const pill = document.getElementById('connectionStatus');
    const text = document.getElementById('connectionStatusText');
    if (!pill || !text) return;
    pill.className = 'status-pill' + (mode === 'live' ? ' status-pill--live' : mode === 'error' ? ' status-pill--error' : mode === 'demo' ? ' status-pill--demo' : '');
    if (mode === 'loading') text.textContent = detail || 'Connecting to 4com…';
    else if (mode === 'live') text.textContent = detail ? `Live · updated ${detail}` : 'Live';
    else if (mode === 'demo') text.textContent = 'Demo data';
    else if (mode === 'error') {
      text.textContent = "Can't reach 4com. Retrying.";
      pill.title = detail || state.errorDetail || '';
    } else text.textContent = detail || '';
    if (G().DEMO_MODE) {
      const b = document.getElementById('demoBanner');
      if (b) b.hidden = false;
    }
  }

  function setErrorDetail(msg) { state.errorDetail = msg || ''; }
  function setStaleNotice(on) {
    const el = document.getElementById('staleNotice');
    if (!el) return;
    if (!on) { el.hidden = true; return; }
    el.hidden = false;
    const secs = Math.round((G().POLL_INTERVAL_MS || 30000) / 1000);
    el.textContent = state.lastSavedTime
      ? `Showing the last saved data from ${state.lastSavedTime}. Retrying every ${secs} seconds.`
      : `Showing the last saved data. Retrying every ${secs} seconds.`;
  }

  function renderEmpty() {
    state.renderKeys = {};
    renderKpis(true);
    renderVolumeChart(true);
    renderLinePicker(true);
    renderLineTiles(true);
    renderMissed(true);
    renderRecent(true);
    renderCompare(true);
    renderTopPerformer(true);
    renderBreakdown(true);
  }

  function renderDashboard(force) {
    document.getElementById('headerDateLine').textContent = londonHeaderDate();
    const pollNote = document.getElementById('pollIntervalNote');
    if (pollNote) {
      const secs = Math.round((G().POLL_INTERVAL_MS || 30000) / 1000);
      pollNote.textContent = `Data from the 4com phone system, refreshed every ${secs} seconds.`;
    }
    renderKpis(force);
    renderVolumeChart(force);
    renderLinePicker(force);
    renderLineTiles(force);
    renderMissed(force);
    renderRecent(force);
    renderWeekend();
    renderCompare(force);
    renderTopPerformer(force);
    renderBreakdown(force);
    renderCallHistory(force);
    updateHistoryButton();
  }

  function renderAll(force) {
    renderDashboard(force);
  }

  function updateHistoryButton() {
    const g = G();
    if (!g) return;
    const btn = document.getElementById('viewFullHistoryBtn');
    if (!btn) return;
    const n = g.getHistorySourceCalls().length;
    btn.textContent = n ? `View full history (${n.toLocaleString('en-GB')} calls)` : 'View full history';
  }

  function wireEvents() {
    document.getElementById('volumeTabs')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-period]');
      if (!btn) return;
      if (btn.dataset.period === 'month') {
        if (window.S4SEnableDemoPreview && typeof showToast !== 'function') {
          /* toast lives in data layer */
        }
        if (typeof window.S4SGlobals !== 'undefined') {
          const el = document.getElementById('volumeFootnote');
          if (el) el.textContent = 'Monthly view coming soon — showing today.';
        }
        state.volumePeriod = 'today';
        document.querySelectorAll('#volumeTabs .tab').forEach(t => t.classList.toggle('on', t.dataset.period === 'today'));
        renderVolumeChart(true);
        return;
      }
      state.volumePeriod = btn.dataset.period;
      document.querySelectorAll('#volumeTabs .tab').forEach(t => t.classList.toggle('on', t === btn));
      G().chartPeriod = state.volumePeriod;
      if (state.volumePeriod === 'week' && window.S4SGetFortnightCalls) {
        window.S4SGetFortnightCalls(true).then(() => renderVolumeChart(true));
        return;
      }
      renderVolumeChart(true);
    });

    document.getElementById('recentFilterTabs')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      state.recentFilter = btn.dataset.filter;
      document.querySelectorAll('#recentFilterTabs .tab').forEach(t => t.classList.toggle('on', t === btn));
      state.recentShow = 12;
      renderRecent(true);
    });

    document.getElementById('recentMoreBtn')?.addEventListener('click', () => {
      state.recentShow += 25;
      renderRecent(true);
    });

    document.getElementById('downloadCsvBtn')?.addEventListener('click', () => {
      const g = G();
      if (g) g.historyFilter = state.recentFilter;
      window.S4SDownloadHistoryCsv();
    });
    document.getElementById('viewFullHistoryBtn')?.addEventListener('click', () => window.S4SOpenCallHistory());
    document.getElementById('historyOverlayClose')?.addEventListener('click', () => window.S4SCloseCallHistory());
    document.getElementById('historyMoreBtn')?.addEventListener('click', () => {
      G().historyShowCount += G().HISTORY_PAGE_SIZE;
      renderCallHistory(true);
    });
    document.getElementById('historyExportBtn')?.addEventListener('click', () => window.S4SDownloadHistoryCsv());

    document.getElementById('historyFilterBtns')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      G().historyFilter = btn.dataset.filter || 'all';
      document.querySelectorAll('#historyFilterBtns .tab').forEach(b => b.classList.toggle('on', b === btn));
      G().historyShowCount = G().HISTORY_PAGE_SIZE;
      renderCallHistory(true);
    });
    document.getElementById('historySearch')?.addEventListener('input', e => {
      G().historySearch = e.target.value || '';
      G().historyShowCount = G().HISTORY_PAGE_SIZE;
      renderCallHistory(true);
    });
    document.getElementById('historyOverlay')?.addEventListener('click', e => {
      if (e.target.id === 'historyOverlay') window.S4SCloseCallHistory();
    });

    document.getElementById('weekendLoadBtn')?.addEventListener('click', () => window.S4SLoadWeekendMissedReport());
    document.getElementById('weekendPrintBtn')?.addEventListener('click', () => window.S4SPrintWeekendReport());

    document.getElementById('weekendPresetBtns')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-preset]');
      if (!btn) return;
      G().weekendPreset = btn.dataset.preset;
      document.querySelectorAll('#weekendPresetBtns .tab').forEach(b => b.classList.toggle('on', b === btn));
      document.getElementById('weekendCustomDates').hidden = G().weekendPreset !== 'custom';
    });

    document.getElementById('recorderPeriodBtns')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-days]');
      if (!btn) return;
      window.S4SSelectRecorderPeriod(+btn.dataset.days);
      document.querySelectorAll('#recorderPeriodBtns .tab').forEach(b => b.classList.toggle('on', b === btn));
    });
    document.getElementById('recorderTodayBtn')?.addEventListener('click', () => {
      const g = G();
      g.recorderSelectedDate = null;
      const p = g.getLondonParts(new Date());
      g.recorderCalendarView = { year: +p.year, month: +p.month };
      g.uiSnapshots.recorderKey = '';
      renderBreakdown(true);
    });
    document.getElementById('recorderCalPrev')?.addEventListener('click', () => {
      const g = G();
      const view = g.getRecorderCalendarView();
      let month = view.month - 1;
      let year = view.year;
      if (month < 1) { month = 12; year--; }
      g.recorderCalendarView = { year, month };
      g.uiSnapshots.recorderKey = '';
      renderBreakdown(true);
    });
    document.getElementById('recorderCalNext')?.addEventListener('click', () => {
      const g = G();
      const view = g.getRecorderCalendarView();
      const nowParts = g.getLondonParts(new Date());
      if (view.year === +nowParts.year && view.month === +nowParts.month) return;
      let month = view.month + 1;
      let year = view.year;
      if (month > 12) { month = 1; year++; }
      g.recorderCalendarView = { year, month };
      g.uiSnapshots.recorderKey = '';
      renderBreakdown(true);
    });
    document.getElementById('recorderCalendar')?.addEventListener('click', e => {
      const btn = e.target.closest('.recorder-cal-day[data-date]');
      if (!btn || btn.disabled) return;
      window.S4SSelectRecorderDate(btn.dataset.date);
    });
    document.getElementById('recorderDailyBody')?.addEventListener('click', e => {
      const tr = e.target.closest('tr[data-date]');
      if (tr) window.S4SSelectRecorderDate(tr.dataset.date);
    });

    document.getElementById('retryConnectionBtn')?.addEventListener('click', () => window.S4SRetryConnection());
    document.getElementById('demoPreviewBtn')?.addEventListener('click', () => window.S4SEnableDemoPreview());

    document.getElementById('viewSpreadsheetBtn')?.addEventListener('click', () => {
      const details = document.getElementById('recorderSpreadsheetDetails');
      if (details) {
        details.open = true;
        details.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    try {
      const saved = sessionStorage.getItem('s4s-selected-line');
      if (saved) state.selectedLineDdi = saved;
    } catch (e) {}
  }

  window.S4S = {
    renderAll,
    renderEmpty,
    renderDashboard,
    renderKpis,
    renderVolumeChart,
    renderLineTiles,
    renderMissed,
    renderRecent,
    renderWeekend,
    renderCompare,
    renderBreakdown,
    renderCallHistory,
    updateConnectionStatus,
    setErrorDetail,
    setStaleNotice,
    updateHistoryButton,
    LINE_COLOURS
  };

  document.addEventListener('DOMContentLoaded', () => {
    wireEvents();
    document.getElementById('headerDateLine').textContent = londonHeaderDate();
    if (window.S4SGlobals && window.S4SGlobals.DEMO_MODE) {
      document.getElementById('demoBanner').hidden = false;
    }
  });
})();
