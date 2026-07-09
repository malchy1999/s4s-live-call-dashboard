const fs = require('fs');
const path = require('path');

const script = fs.readFileSync(path.join(__dirname, '_script.js.txt'), 'utf8');

const icon = (paths) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

const icons = {
  phoneIncoming: icon('<polyline points="16 2 16 8 22 8"/><line x1="23" y1="1" x2="16" y2="8"/><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'),
  phoneOutgoing: icon('<line x1="7" y1="7" x2="17" y2="17"/><polyline points="17 7 17 17 7 17"/><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'),
  phoneCall: icon('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'),
  checkCircle: icon('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'),
  xCircle: icon('<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'),
  clock: icon('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  activity: icon('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'),
  zap: icon('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
  trophy: icon('<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>'),
  alert: icon('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
};

const kpiTile = (cls, id, label, valId, subId, iconSvg, delay) => `
      <div class="kpi-tile ${cls} card-enter" id="${id}" style="animation-delay:${delay}ms">
        <div class="kpi-top">
          <div class="kpi-label">${label}</div>
          <div class="kpi-icon">${iconSvg}</div>
        </div>
        <div class="kpi-value" id="${valId}">--</div>
        <div class="kpi-sub" id="${subId}">Loading...</div>
      </div>`;

const shell = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>S4S Live Call Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --color-bg-base:       #080d14;
      --color-bg-surface:    #0e1520;
      --color-bg-elevated:   #141e2e;
      --color-bg-border:     #1a2540;
      --color-bg-subtle:     #0b1219;
      --color-bg-sidebar:    #060b11;

      --color-brand-primary: #0d77fe;
      --color-brand-accent:  #ffd426;

      --color-success:       #00c48c;
      --color-success-dim:   #00c48c18;
      --color-warning:       #f59e0b;
      --color-warning-dim:   #f59e0b18;
      --color-danger:        #ff4757;
      --color-danger-dim:    #ff475718;
      --color-info:          #0d77fe;
      --color-info-dim:      #0d77fe18;

      --color-text-primary:   #e8edf5;
      --color-text-secondary: #8896b0;
      --color-text-muted:     #4a5568;

      --font-sans: 'Inter', -apple-system, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;

      --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
      --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;

      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      --radius-xl: 20px;

      --transition-fast: 150ms ease;
      --transition-base: 250ms ease;
      --transition-slow: 400ms ease-out;

      --glow-blue:  0 0 20px #0d77fe30, 0 0 40px #0d77fe15;
      --glow-green: 0 0 20px #00c48c30, 0 0 40px #00c48c15;

      --bg-page: var(--color-bg-base);
      --bg-card: var(--color-bg-surface);
      --bg-subtle: var(--color-bg-subtle);
      --border-card: var(--color-bg-border);
      --accent-primary: var(--color-brand-primary);
      --accent-brand: var(--color-brand-accent);
      --success: var(--color-success);
      --warning: var(--color-warning);
      --danger: var(--color-danger);
      --text-primary: var(--color-text-primary);
      --text-secondary: var(--color-text-secondary);
      --text-muted: var(--color-text-muted);
      --font: var(--font-sans);
      --radius: var(--radius-lg);
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--font-sans);
      background: var(--color-bg-base);
      color: var(--color-text-primary);
      min-height: 100vh;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    body.has-error-banner .main-content { padding-top: 44px; }

    /* Error banner */
    .error-banner {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 2000;
      height: 44px;
      background: var(--color-bg-surface);
      border-bottom: 1px solid var(--color-danger);
      border-left: 4px solid var(--color-danger);
      color: var(--color-text-primary);
      padding: 0 var(--space-6);
      font-size: 13px;
      font-weight: 500;
      align-items: center;
      justify-content: center;
      gap: var(--space-4);
    }
    .error-banner.visible { display: flex; }
    .error-banner button {
      background: var(--color-danger-dim);
      border: 1px solid var(--color-danger);
      color: var(--color-danger);
      padding: 4px 14px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-family: var(--font-sans);
      font-size: 12px;
      font-weight: 600;
      transition: background var(--transition-fast);
    }
    .error-banner button:hover { background: var(--color-danger); color: var(--color-text-primary); }

    /* Toast */
    .toast-container {
      position: fixed;
      bottom: 60px;
      right: 24px;
      z-index: 2001;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .toast {
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-bg-border);
      color: var(--color-text-secondary);
      padding: 12px 18px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      animation: toastIn 0.3s ease, toastOut 0.3s ease 2.7s forwards;
      max-width: 320px;
    }
    @keyframes toastIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes toastOut { to { opacity: 0; transform: translateX(40px); } }

    /* Layout */
    .dashboard-layout {
      display: grid;
      grid-template-columns: 260px 1fr;
      min-height: 100vh;
    }

    .sidebar {
      background: var(--color-bg-sidebar);
      border-right: 1px solid var(--color-bg-border);
      display: flex;
      flex-direction: column;
      padding: var(--space-6) 0;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }

    .sidebar-logo {
      padding: 0 var(--space-6) var(--space-6);
      border-bottom: 1px solid var(--color-bg-border);
      margin-bottom: var(--space-4);
    }
    .logo-s4s {
      font-size: 28px;
      font-weight: 800;
      color: var(--color-brand-primary);
      letter-spacing: -1px;
      line-height: 1;
    }
    .logo-s4s span { color: var(--color-brand-accent); }
    .logo-sub {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--color-text-muted);
      margin-top: 4px;
    }

    .sidebar-nav {
      flex: 1;
      padding: var(--space-2) var(--space-3);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: 10px var(--space-4);
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-secondary);
      border-left: 3px solid transparent;
      transition: all var(--transition-fast);
    }
    .nav-item svg { width: 18px; height: 18px; flex-shrink: 0; opacity: 0.7; }
    .nav-item.active {
      color: var(--color-text-primary);
      background: var(--color-info-dim);
      border-left-color: var(--color-brand-primary);
    }
    .nav-item .nav-badge {
      margin-left: auto;
      background: var(--color-success-dim);
      color: var(--color-success);
      border: 1px solid #00c48c40;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 10px;
    }

    .sidebar-brand-panel {
      margin: var(--space-4) var(--space-4) var(--space-4);
      padding: var(--space-4);
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #0d77fe18 0%, #ffd42610 100%);
      border: 1px solid var(--color-bg-border);
    }
    .sidebar-brand-panel strong {
      display: block;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: var(--color-brand-primary);
      margin-bottom: 4px;
    }
    .sidebar-brand-panel p {
      font-size: 11px;
      color: var(--color-text-muted);
      line-height: 1.5;
    }

    .sidebar-footer {
      padding: var(--space-4) var(--space-6);
      border-top: 1px solid var(--color-bg-border);
      font-size: 11px;
      color: var(--color-text-muted);
    }
    .sidebar-live {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--color-success);
      text-transform: uppercase;
    }
    .sidebar-live-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--color-success);
      animation: pulse 1.5s ease infinite;
    }

    .main-content {
      display: grid;
      grid-template-rows: auto auto 1fr auto;
      min-height: 100vh;
      overflow: hidden;
    }

    .dashboard {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    /* Header */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--space-5);
      height: 72px;
      border-bottom: 1px solid var(--color-bg-border);
      flex-shrink: 0;
      gap: var(--space-4);
      flex-wrap: wrap;
    }
    .header-left { display: flex; align-items: center; gap: var(--space-5); }
    .header-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--color-text-primary);
      line-height: 1.2;
    }
    .header-subtitle {
      font-size: 13px;
      color: var(--color-text-muted);
      margin-top: 2px;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      flex-wrap: wrap;
    }

    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background: var(--color-success-dim);
      border: 1px solid #00c48c50;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      color: var(--color-success);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .live-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--color-success);
      animation: pulse 1.5s ease infinite;
    }

    .last-updated {
      font-size: 12px;
      color: var(--color-text-muted);
      font-family: var(--font-mono);
      transition: color var(--transition-base);
    }
    .last-updated.fresh { color: var(--color-success); }

    .demo-badge {
      display: none;
      padding: 4px 12px;
      background: #ffd42618;
      border: 1px solid #ffd42650;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      color: var(--color-brand-accent);
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    /* Setup panel */
    .setup-panel {
      display: none;
      margin: var(--space-4) var(--space-5) 0;
      background: #ffd42610;
      border: 1px solid #ffd42640;
      border-left: 4px solid var(--color-brand-accent);
      border-radius: var(--radius-md);
      padding: var(--space-5) var(--space-6);
    }
    .setup-panel.visible { display: block; animation: slide-up var(--transition-slow) both; }
    .setup-panel h3 {
      font-size: 16px;
      font-weight: 700;
      color: var(--color-brand-accent);
      margin-bottom: 8px;
    }
    .setup-panel p, .setup-panel ol {
      font-size: 13px;
      color: var(--color-text-secondary);
      line-height: 1.6;
    }
    .setup-panel ol { margin: 0 0 16px 20px; }
    .setup-panel code {
      background: var(--color-bg-elevated);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      font-family: var(--font-mono);
    }
    .setup-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
    .setup-btn {
      font-family: var(--font-sans);
      font-size: 12px;
      font-weight: 600;
      padding: 8px 14px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      border: 1px solid transparent;
      transition: all var(--transition-fast);
    }
    .setup-btn.primary {
      background: var(--color-brand-primary);
      color: var(--color-text-primary);
    }
    .setup-btn.secondary {
      background: transparent;
      border-color: var(--color-bg-border);
      color: var(--color-text-secondary);
    }

    /* KPI Row */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: var(--space-4);
      padding: var(--space-5);
      flex-shrink: 0;
    }

    .kpi-tile {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-bg-border);
      border-radius: var(--radius-lg);
      padding: 20px 24px;
      border-top-width: 3px;
      transition: border-color var(--transition-fast);
    }
    .kpi-tile.blue   { border-top-color: var(--color-brand-primary); }
    .kpi-tile.cyan   { border-top-color: #0891b2; }
    .kpi-tile.green  { border-top-color: var(--color-success); }
    .kpi-tile.purple { border-top-color: #7c3aed; }
    .kpi-tile.orange { border-top-color: var(--color-warning); }
    .kpi-tile.pink   { border-top-color: #db2777; }

    .kpi-tile.pulse-live {
      box-shadow: var(--glow-green);
      border-color: #00c48c40;
    }

    .kpi-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-3);
    }
    .kpi-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }
    .kpi-icon {
      opacity: 0.7;
      line-height: 0;
    }
    .kpi-tile.blue   .kpi-icon { color: var(--color-brand-primary); }
    .kpi-tile.cyan   .kpi-icon { color: #0891b2; }
    .kpi-tile.green  .kpi-icon { color: var(--color-success); }
    .kpi-tile.purple .kpi-icon { color: #7c3aed; }
    .kpi-tile.orange .kpi-icon { color: var(--color-warning); }
    .kpi-tile.pink   .kpi-icon { color: #db2777; }

    .kpi-value {
      font-size: 42px;
      font-weight: 800;
      font-family: var(--font-mono);
      color: var(--color-text-primary);
      line-height: 1;
      margin-bottom: var(--space-2);
      transition: color var(--transition-base), transform var(--transition-base);
    }
    .kpi-value.flash { animation: value-flash 0.4s ease; }

    .kpi-sub {
      font-size: 13px;
      color: var(--color-text-muted);
    }
    .kpi-sub.up   { color: var(--color-success); }
    .kpi-sub.down { color: var(--color-danger); }

    /* Panels grid */
    .panels-grid {
      display: grid;
      grid-template-columns: 1fr 1.4fr 280px;
      grid-template-rows: auto auto;
      gap: var(--space-5);
      padding: 0 var(--space-5) var(--space-5);
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }

    .panel-left  { grid-column: 1; grid-row: 1 / 3; }
    .panel-centre { grid-column: 2; display: flex; flex-direction: column; gap: var(--space-5); }
    .panel-right  { grid-column: 3; grid-row: 1 / 3; }

    .main-grid { display: contents; }
    .bottom-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-5);
    }
    .bottom-grid .card:last-child { grid-column: 1 / -1; }

    .right-col {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }

    /* Cards */
    .card {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-bg-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      transition: border-color var(--transition-fast);
    }
    .card:hover { border-color: #0d77fe40; }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-4);
      gap: var(--space-3);
    }
    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text-primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .card-title svg { width: 16px; height: 16px; color: var(--color-brand-primary); opacity: 0.8; }

    .card-badge {
      background: var(--color-danger-dim);
      color: var(--color-danger);
      border: 1px solid #ff475740;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 10px;
      border-radius: 12px;
      font-family: var(--font-mono);
    }

    .card-enter { animation: slide-up var(--transition-slow) both; }

    /* DDI Table */
    .ddi-table {
      width: 100%;
      border-collapse: collapse;
    }
    .ddi-table thead th {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-text-muted);
      text-align: left;
      padding: 0 8px 12px;
      border-bottom: 1px solid var(--color-bg-border);
    }
    .ddi-table thead th:nth-child(4),
    .ddi-table thead th:nth-child(5) { text-align: right; }
    .ddi-table tbody tr {
      border-bottom: 1px solid var(--color-bg-border);
      transition: background var(--transition-fast);
    }
    .ddi-table tbody tr:hover { background: var(--color-bg-elevated); }
    .ddi-table tbody td {
      padding: 14px 8px;
      vertical-align: middle;
    }
    .ddi-table tbody td:nth-child(4),
    .ddi-table tbody td:nth-child(5) { text-align: right; }

    .ddi-icon {
      width: 36px; height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
    }
    .ddi-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .ddi-number {
      font-size: 13px;
      font-family: var(--font-mono);
      color: var(--color-text-muted);
      margin-top: 2px;
    }
    .ddi-count {
      font-size: 24px;
      font-weight: 700;
      font-family: var(--font-mono);
      color: var(--color-text-primary);
    }
    .pct-change {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 12px;
    }
    .pct-change.up {
      color: var(--color-success);
      background: var(--color-success-dim);
      border: 1px solid #00c48c30;
    }
    .pct-change.down {
      color: var(--color-danger);
      background: var(--color-danger-dim);
      border: 1px solid #ff475730;
    }
    .pct-change.neutral {
      color: var(--color-text-muted);
      background: #ffffff08;
      border: 1px solid var(--color-bg-border);
    }

    /* Status dots as pills */
    .status-dot {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px 3px 8px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border: 1px solid transparent;
    }
    .status-dot::before {
      content: '';
      width: 6px; height: 6px;
      border-radius: 50%;
      background: currentColor;
      flex-shrink: 0;
    }
    .status-dot.idle {
      color: var(--color-text-muted);
      background: #ffffff08;
      border-color: var(--color-bg-border);
    }
    .status-dot.idle::after { content: 'Idle'; }
    .status-dot.ringing {
      color: var(--color-warning);
      background: var(--color-warning-dim);
      border-color: #f59e0b30;
    }
    .status-dot.ringing::before { animation: pulse 0.8s ease infinite; }
    .status-dot.ringing::after { content: 'Ringing'; }
    .status-dot.incall {
      color: var(--color-success);
      background: var(--color-success-dim);
      border-color: #00c48c30;
    }
    .status-dot.incall::before { animation: pulse 1.5s ease infinite; }
    .status-dot.incall::after { content: 'In Call'; }

    .view-all-btn {
      display: block;
      width: 100%;
      margin-top: var(--space-4);
      padding: 10px;
      background: transparent;
      border: 1px dashed var(--color-bg-border);
      border-radius: var(--radius-sm);
      color: var(--color-text-muted);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      font-family: var(--font-sans);
      transition: all var(--transition-fast);
    }
    .view-all-btn:hover {
      border-color: var(--color-brand-primary);
      color: var(--color-brand-primary);
    }

    /* Chart */
    .chart-select {
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-bg-border);
      color: var(--color-text-secondary);
      font-family: var(--font-sans);
      font-size: 12px;
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }
    .chart-container {
      position: relative;
      width: 100%;
      height: 220px;
    }
    .chart-svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .chart-svg text {
      fill: var(--color-text-muted) !important;
      font-family: var(--font-mono) !important;
    }
    .chart-svg line { stroke: var(--color-bg-border) !important; }
    .donut-svg text { fill: var(--color-text-primary) !important; font-family: var(--font-mono) !important; }
    .donut-svg circle:first-of-type { stroke: var(--color-bg-border) !important; }
    .chart-tooltip {
      position: absolute;
      display: none;
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-bg-border);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      font-size: 12px;
      color: var(--color-text-secondary);
      pointer-events: none;
      z-index: 10;
      box-shadow: 0 8px 24px #00000060;
      line-height: 1.6;
      min-width: 140px;
    }
    .chart-tooltip.visible { display: block; }
    .chart-tooltip strong { color: var(--color-text-primary); }

    .chart-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: var(--space-4);
    }
    .legend-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 20px;
      border: 1px solid var(--color-bg-border);
      background: var(--color-bg-subtle);
      color: var(--color-text-muted);
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      font-family: var(--font-sans);
      transition: all var(--transition-fast);
    }
    .legend-toggle:hover { border-color: var(--color-brand-primary); color: var(--color-text-secondary); }
    .legend-toggle.active {
      background: var(--color-info-dim);
      border-color: #0d77fe40;
      color: var(--color-text-primary);
    }
    .legend-toggle.locked { cursor: default; opacity: 0.9; }
    .legend-line {
      width: 16px; height: 3px;
      border-radius: 2px;
      display: inline-block;
    }
    .legend-line.total { background: var(--color-brand-primary); }

    /* Donuts & widgets */
    .widget { text-align: center; }
    .donut-wrap { display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .donut-svg { width: 120px; height: 120px; }
    .donut-label {
      font-size: 12px;
      color: var(--color-text-muted);
      text-align: center;
      line-height: 1.4;
    }
    .trophy {
      color: var(--color-brand-accent);
      margin: 8px 0 4px;
      line-height: 0;
    }
    .trophy svg { width: 28px; height: 28px; }
    .top-performer-name {
      font-size: 22px;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 4px 0;
    }
    .top-performer-count {
      font-size: 36px;
      font-weight: 800;
      font-family: var(--font-mono);
      color: var(--color-brand-primary);
    }
    .top-performer-sub {
      font-size: 13px;
      color: var(--color-text-muted);
      margin-top: 4px;
    }
    .top-performer-sub.up   { color: var(--color-success); }
    .top-performer-sub.down { color: var(--color-danger); }

    /* Live calls */
    .call-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .call-item {
      display: grid;
      grid-template-columns: auto 1fr auto auto;
      grid-template-rows: auto auto;
      gap: 4px 12px;
      align-items: center;
      padding: var(--space-4);
      background: var(--color-bg-subtle);
      border: 1px solid var(--color-bg-border);
      border-radius: var(--radius-md);
      position: relative;
      overflow: hidden;
      animation: slide-up var(--transition-slow) both;
    }
    .call-avatar {
      grid-row: 1 / 3;
      width: 40px; height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      color: #fff;
    }
    .call-info-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .call-info-num {
      font-size: 12px;
      font-family: var(--font-mono);
      color: var(--color-text-muted);
    }
    .call-timer {
      font-family: var(--font-mono);
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px 3px 8px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border: 1px solid transparent;
    }
    .status-badge::before {
      content: '';
      width: 6px; height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
    .status-badge.connecting {
      color: var(--color-text-muted);
      background: #ffffff08;
      border-color: var(--color-bg-border);
    }
    .status-badge.ringing {
      color: var(--color-warning);
      background: var(--color-warning-dim);
      border-color: #f59e0b30;
    }
    .status-badge.ringing::before { animation: pulse 0.8s ease infinite; }
    .status-badge.incall {
      color: var(--color-success);
      background: var(--color-success-dim);
      border-color: #00c48c30;
    }
    .status-badge.incall::before { animation: pulse 1.5s ease infinite; }

    .call-loading-bar {
      grid-column: 1 / -1;
      height: 3px;
      background: var(--color-bg-border);
      border-radius: 2px;
      overflow: hidden;
      margin-top: 4px;
    }
    .call-loading-bar::after {
      content: '';
      display: block;
      height: 100%;
      width: 40%;
      background: linear-gradient(90deg, transparent, var(--color-success), transparent);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease infinite;
    }
    .call-item:has(.status-badge.ringing) .call-loading-bar::after {
      background: linear-gradient(90deg, transparent, var(--color-warning), transparent);
      background-size: 200% 100%;
    }

    /* Recent / missed tables */
    .recent-table {
      width: 100%;
      border-collapse: collapse;
    }
    .recent-table thead th {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-text-muted);
      text-align: left;
      padding: 0 8px 10px;
      border-bottom: 1px solid var(--color-bg-border);
    }
    .recent-table tbody tr {
      border-bottom: 1px solid var(--color-bg-border);
      transition: background var(--transition-fast);
    }
    .recent-table tbody tr:hover { background: var(--color-bg-elevated); }
    .recent-table tbody td {
      padding: 12px 8px;
      font-size: 13px;
      color: var(--color-text-secondary);
      font-family: var(--font-mono);
    }
    .recent-table tbody td:last-child { font-family: var(--font-sans); }
    .dir-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px; height: 24px;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 700;
    }
    .dir-inc   { background: var(--color-info-dim);    color: var(--color-brand-primary); }
    .dir-out   { background: var(--color-success-dim); color: var(--color-success); }
    .dir-missed { background: var(--color-danger-dim); color: var(--color-danger); }

    /* Empty states */
    .empty-state {
      text-align: center;
      padding: var(--space-8) var(--space-4);
      color: var(--color-text-muted);
      font-size: 13px;
    }
    .empty-state-icon {
      font-size: 0;
      width: 48px; height: 48px;
      margin: 0 auto 12px;
      border-radius: 50%;
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-bg-border);
      position: relative;
    }
    .empty-state-icon::after {
      content: '';
      position: absolute;
      inset: 12px;
      background: var(--color-text-muted);
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2'%3E%3Cpath d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'/%3E%3C/svg%3E") center/contain no-repeat;
      -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2'%3E%3Cpath d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'/%3E%3C/svg%3E") center/contain no-repeat;
    }

    /* Footer ticker */
    .footer-ticker, .activity-ticker {
      display: flex;
      align-items: center;
      height: 44px;
      background: var(--color-bg-surface);
      border-top: 1px solid var(--color-bg-border);
      overflow: hidden;
      flex-shrink: 0;
    }
    .ticker-label {
      flex-shrink: 0;
      padding: 0 16px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: var(--color-brand-primary);
      border-right: 1px solid var(--color-bg-border);
      text-transform: uppercase;
    }
    .ticker-track {
      flex: 1;
      overflow: hidden;
      mask-image: linear-gradient(to right, transparent, black 40px, black calc(100% - 40px), transparent);
      -webkit-mask-image: linear-gradient(to right, transparent, black 40px, black calc(100% - 40px), transparent);
    }
    .ticker-content {
      display: flex;
      gap: 48px;
      white-space: nowrap;
      animation: ticker-scroll 40s linear infinite;
    }
    .ticker-content:hover { animation-play-state: paused; }
    .ticker-item {
      font-size: 12px;
      color: var(--color-text-secondary);
    }
    .t-time {
      font-family: var(--font-mono);
      color: var(--color-text-muted);
      margin-right: 6px;
    }
    .t-ddi {
      font-weight: 600;
      color: var(--color-brand-primary);
      margin-right: 6px;
    }

    /* Skeleton */
    .skeleton {
      background: linear-gradient(90deg, var(--color-bg-elevated) 25%, var(--color-bg-border) 50%, var(--color-bg-elevated) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease infinite;
      border-radius: 4px;
    }

    /* Animations */
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50%       { transform: scale(1.5); opacity: 0.5; }
    }
    @keyframes value-flash {
      0%   { color: var(--color-brand-accent); transform: scale(1.05); }
      100% { color: var(--color-text-primary); transform: scale(1); }
    }
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    @keyframes ticker-scroll {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }

    /* Responsive */
    @media (max-width: 1280px) {
      .panels-grid {
        grid-template-columns: 1fr 1fr;
        grid-template-rows: auto;
      }
      .panel-left  { grid-column: 1; grid-row: 1; }
      .panel-centre { grid-column: 2; grid-row: 1 / 3; }
      .panel-right  { grid-column: 1 / -1; grid-row: 2; }
      .right-col { flex-direction: row; flex-wrap: wrap; }
      .right-col .card { flex: 1; min-width: 200px; }
    }
    @media (max-width: 1024px) {
      .dashboard-layout { grid-template-columns: 60px 1fr; }
      .sidebar-logo .logo-sub, .nav-item span, .sidebar-brand-panel, .sidebar-footer { display: none; }
      .sidebar-logo { padding: 0 12px 16px; text-align: center; }
      .logo-s4s { font-size: 18px; }
      .nav-item { justify-content: center; padding: 10px; }
      .nav-item .nav-badge { display: none; }
      .kpi-row { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 768px) {
      .dashboard-layout { grid-template-columns: 1fr; }
      .sidebar { display: none; }
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
      .panels-grid { grid-template-columns: 1fr; }
      .panel-left, .panel-centre, .panel-right { grid-column: 1; grid-row: auto; }
      .bottom-grid { grid-template-columns: 1fr; }
      .header { height: auto; padding: 16px; }
    }
  </style>
</head>
<body>

  <div class="error-banner" id="errorBanner">
    ${icons.alert.replace('width="20"', 'width="16"').replace('height="20"', 'height="16"')}
    <span id="errorMessage">Unable to connect to Tollring API</span>
    <button onclick="retryConnection()">Retry</button>
  </div>

  <div class="toast-container" id="toastContainer"></div>

  <div class="dashboard-layout">

    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-s4s">s<span>4</span>s</div>
        <div class="logo-sub">Service4Service</div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-item active">${icons.activity.replace('width="20"', 'width="18"').replace('height="20"', 'height="18"')}<span>Overview</span></div>
        <div class="nav-item">${icons.phoneCall.replace('width="20"', 'width="18"').replace('height="20"', 'height="18"')}<span>Numbers</span></div>
        <div class="nav-item">${icons.zap.replace('width="20"', 'width="18"').replace('height="20"', 'height="18"')}<span>Live Calls</span><span class="nav-badge" id="sidebarLiveBadge">0</span></div>
      </nav>
      <div class="sidebar-brand-panel">
        <strong>EVERY CALL MATTERS</strong>
        <p>Delivering exceptional service across the garage network.</p>
      </div>
      <div class="sidebar-footer">
        <div>Service4Service Operations</div>
        <div class="sidebar-live"><span class="sidebar-live-dot"></span> Live monitoring</div>
      </div>
    </aside>

    <main class="main-content">
      <div class="dashboard">

        <header class="header">
          <div class="header-left">
            <div>
              <div class="header-title">Live Call Dashboard</div>
              <div class="header-subtitle">Real-time performance across the garage network</div>
            </div>
            <div class="live-badge">
              <div class="live-dot"></div>
              LIVE
            </div>
          </div>
          <div class="header-right">
            <div class="last-updated" id="lastUpdated">Last updated: waiting...</div>
            <div class="demo-badge" id="demoBadge">DEMO MODE</div>
          </div>
        </header>

        <div class="setup-panel" id="setupPanel">
          <h3>API not connected</h3>
          <p id="setupPanelMsg">Tollring credentials are missing or incorrect.</p>
          <ol>
            <li><strong>Username</strong> must be your iCall Suite <em>API user email</em>, not your portal password.</li>
            <li><strong>Token</strong> must be the API token ID from iCall Suite (Configuration &gt; System Settings &gt; API). Copy it exactly, with no spaces.</li>
            <li>Set both in Netlify under Site configuration &gt; Environment variables, then redeploy.</li>
            <li>Regenerate the API token in iCall Suite if unsure.</li>
          </ol>
          <div class="setup-actions">
            <button class="setup-btn primary" onclick="retryConnection()">Retry connection</button>
            <button class="setup-btn secondary" onclick="enableDemoPreview()">Preview with demo data</button>
          </div>
        </div>

        <div class="kpi-row" id="kpiRow">
${kpiTile('blue', 'kpiInbound', 'Inbound Today', 'kpiInboundVal', 'kpiInboundSub', icons.phoneIncoming, 0)}
${kpiTile('cyan', 'kpiOutbound', 'Outbound Today', 'kpiOutboundVal', 'kpiOutboundSub', icons.phoneOutgoing, 60)}
${kpiTile('green', 'kpiLive', 'Live Calls Now', 'kpiLiveVal', 'kpiLiveSub', icons.phoneCall, 120).replace('Loading...', 'Monitoring...')}
${kpiTile('purple', 'kpiAnswered', 'Answered Today', 'kpiAnsweredVal', 'kpiAnsweredSub', icons.checkCircle, 180)}
${kpiTile('orange', 'kpiMissed', 'Missed Calls', 'kpiMissedVal', 'kpiMissedSub', icons.xCircle, 240)}
${kpiTile('pink', 'kpiAvgRt', 'Avg Answer Time', 'kpiAvgRtVal', 'kpiAvgRtSub', icons.clock, 300).replace('id="kpiAvgRtVal">--', 'id="kpiAvgRtVal">--:--')}
        </div>

        <div class="panels-grid">
          <div class="panel-left">
            <div class="card card-enter" id="numbers-panel" style="animation-delay:360ms">
              <div class="card-header">
                <div class="card-title">${icons.phoneCall.replace('width="20"', 'width="16"').replace('height="20"', 'height="16"')} Calls Today by Number</div>
              </div>
              <table class="ddi-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Number</th>
                    <th>Count</th>
                    <th>vs Yest.</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="ddiTableBody"></tbody>
              </table>
              <button class="view-all-btn">View all numbers</button>
            </div>
          </div>

          <div class="panel-centre">
            <div class="card card-enter" id="chart-panel" style="animation-delay:420ms">
              <div class="card-header">
                <div class="card-title">${icons.activity.replace('width="20"', 'width="16"').replace('height="20"', 'height="16"')} Call Volume</div>
                <select class="chart-select" id="chartSelect">
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
              <div class="chart-container" id="chartContainer">
                <svg class="chart-svg" id="chartSvg" viewBox="0 0 600 220" preserveAspectRatio="xMidYMid meet"></svg>
                <div class="chart-tooltip" id="chartTooltip"></div>
              </div>
              <div class="chart-legend" id="chartLegend"></div>
            </div>

            <div class="bottom-grid">
              <div class="card card-enter" id="live-calls-panel" style="animation-delay:480ms">
                <div class="card-header">
                  <div class="card-title">${icons.zap.replace('width="20"', 'width="16"').replace('height="20"', 'height="16"')} Live Calls</div>
                </div>
                <ul class="call-list" id="liveCallsList"></ul>
                <button class="view-all-btn">View all live calls</button>
              </div>
              <div class="card card-enter" style="animation-delay:540ms">
                <div class="card-header">
                  <div class="card-title">${icons.xCircle.replace('width="20"', 'width="16"').replace('height="20"', 'height="16"')} Missed Calls Today</div>
                  <span class="card-badge" id="missedPanelCount">0</span>
                </div>
                <table class="recent-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Garage</th>
                      <th>Caller</th>
                      <th>Wait</th>
                    </tr>
                  </thead>
                  <tbody id="missedCallsBody"></tbody>
                </table>
              </div>
              <div class="card card-enter" id="recent-calls-panel" style="animation-delay:600ms">
                <div class="card-header">
                  <div class="card-title">${icons.clock.replace('width="20"', 'width="16"').replace('height="20"', 'height="16"')} Recent Calls</div>
                </div>
                <table class="recent-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Number</th>
                      <th>Duration</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody id="recentCallsBody"></tbody>
                </table>
                <button class="view-all-btn">View full history</button>
              </div>
            </div>
          </div>

          <div class="panel-right">
            <div class="right-col">
              <div class="card widget card-enter" id="vs-yesterday-panel" style="animation-delay:660ms">
                <div class="card-title" style="margin-bottom:12px;justify-content:center;">Today vs Yesterday</div>
                <div class="donut-wrap">
                  <svg class="donut-svg" id="donutCompare" viewBox="0 0 120 120"></svg>
                  <div class="donut-label" id="donutCompareLabel">-- today vs -- yesterday</div>
                </div>
              </div>
              <div class="card widget card-enter" id="top-performer-panel" style="animation-delay:720ms">
                <div class="card-title" style="margin-bottom:4px;justify-content:center;">Top Performer</div>
                <div class="trophy">${icons.trophy}</div>
                <div class="top-performer-name" id="topPerformerName">--</div>
                <div class="top-performer-count" id="topPerformerCount">--</div>
                <div class="top-performer-sub" id="topPerformerSub">--</div>
              </div>
              <div class="card widget card-enter" id="missed-donut-panel" style="animation-delay:780ms">
                <div class="card-title" style="margin-bottom:12px;justify-content:center;">Missed Calls</div>
                <div class="donut-wrap">
                  <svg class="donut-svg" id="donutMissed" viewBox="0 0 120 120"></svg>
                  <div class="donut-label" id="donutMissedLabel">Missed rate --</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer class="footer-ticker activity-ticker">
        <span class="ticker-label">Latest Activity</span>
        <div class="ticker-track">
          <div class="ticker-content" id="tickerContent"></div>
        </div>
      </footer>
    </main>
  </div>

`;

fs.writeFileSync(path.join(__dirname, 'index.html'), shell + script);
fs.writeFileSync(path.join(__dirname, 'S4S-Live-Call-Dashboard.html'), shell + script);
console.log('Built index.html and S4S-Live-Call-Dashboard.html');
