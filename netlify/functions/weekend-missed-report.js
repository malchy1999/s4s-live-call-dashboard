const { getConfig, getCallsForDateRange } = require('./lib/tollring-client');
const {
  getWeekendDateRange,
  fetchMissedCallsForDates,
  buildMissedRows,
  buildMissedCsv,
  summariseByLine
} = require('./lib/weekend-missed-core');

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    body: JSON.stringify(body)
  };
}

function isAuthorised(event) {
  const secret = (process.env.WEEKEND_REPORT_SECRET || '').trim();
  if (!secret) return true;
  const header = event.headers.authorization || event.headers.Authorization || '';
  const query = (event.queryStringParameters && event.queryStringParameters.secret) || '';
  return header === `Bearer ${secret}` || query === secret;
}

async function sendEmailReport(rangeLabel, summaryText, csv, filename) {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const from = (process.env.REPORT_EMAIL_FROM || '').trim();
  const toRaw = (process.env.REPORT_EMAIL_TO || '').trim();
  if (!apiKey || !from || !toRaw) return { skipped: true, reason: 'email not configured' };

  const to = toRaw.split(',').map(s => s.trim()).filter(Boolean);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to,
      subject: `S4S Weekend Missed Calls — ${rangeLabel}`,
      text: summaryText,
      attachments: [{
        filename,
        content: Buffer.from(csv, 'utf8').toString('base64')
      }]
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error('Email failed: ' + err);
  }
  return { sent: true, to };
}

async function notifySlack(rangeLabel, count, byLine) {
  const url = (process.env.SLACK_WEBHOOK_URL || process.env.TEAMS_WEBHOOK_URL || '').trim();
  if (!url) return { skipped: true };

  const lineSummary = byLine.slice(0, 6).map(([line, n]) => `${line}: ${n}`).join(' · ');
  const text = `*S4S weekend missed calls* (${rangeLabel})\n${count} missed inbound call${count === 1 ? '' : 's'}${lineSummary ? `\n${lineSummary}` : ''}\nCSV attached to email or available in the dashboard.`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (!res.ok) throw new Error('Webhook notification failed: ' + res.status);
  return { sent: true };
}

async function appendGoogleSheet(rangeLabel, rows, csv) {
  const url = (process.env.GOOGLE_SHEET_WEBHOOK_URL || '').trim();
  if (!url) return { skipped: true };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 's4s-weekend-missed-report',
      rangeLabel,
      generatedAt: new Date().toISOString(),
      rows,
      csv
    })
  });
  if (!res.ok) throw new Error('Google Sheet webhook failed: ' + res.status);
  return { sent: true };
}

async function runReport(options) {
  if (!getConfig()) {
    throw new Error('NOT_CONFIGURED');
  }

  const preset = options.preset || 'last-weekend';
  const range = await getWeekendDateRange(preset, options.customStart, options.customEnd);
  const calls = await fetchMissedCallsForDates(getCallsForDateRange, range.dates);
  const rows = buildMissedRows(calls, options.statusByKey || {});
  const csv = buildMissedCsv(rows);
  const byLine = summariseByLine(rows);
  const rangeLabel = `${range.label} (${range.dates.join(', ')})`;
  const filename = `s4s-missed-weekend-${range.dates[0]}_${range.dates[range.dates.length - 1]}.csv`;

  const summaryLines = [
    `S4S Weekend Missed Calls Report`,
    `Range: ${rangeLabel}`,
    `Total missed: ${rows.length}`,
    '',
    'By line:',
    ...byLine.map(([line, count]) => `- ${line}: ${count}`),
    '',
    'Open the dashboard for callback tracking, or use the attached CSV.'
  ];
  const summaryText = summaryLines.join('\n');

  const results = {
    rangeLabel,
    dates: range.dates,
    total: rows.length,
    byLine,
    rows,
    csv,
    filename,
    summaryText
  };

  if (options.deliver !== false) {
    results.email = await sendEmailReport(rangeLabel, summaryText, csv, filename);
    results.slack = await notifySlack(rangeLabel, rows.length, byLine);
    results.sheet = await appendGoogleSheet(rangeLabel, rows, csv);
  }

  return results;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  const isSchedule = event.headers['x-netlify-event'] === 'schedule' || event.source === 'netlify-scheduled-function';
  const isHttp = event.httpMethod === 'GET' || event.httpMethod === 'POST';

  if (!isSchedule && isHttp && !isAuthorised(event)) {
    return json(401, { error: 'Unauthorized' });
  }

  try {
    let options = { preset: 'last-weekend', deliver: isSchedule };

    if (isHttp && event.body) {
      try {
        const body = JSON.parse(event.body);
        options = {
          preset: body.preset || options.preset,
          customStart: body.customStart,
          customEnd: body.customEnd,
          deliver: body.deliver !== false,
          statusByKey: body.statusByKey || {}
        };
      } catch (e) {
        return json(400, { error: 'Invalid JSON body' });
      }
    } else if (isHttp && event.queryStringParameters) {
      const q = event.queryStringParameters;
      options.preset = q.preset || options.preset;
      options.customStart = q.customStart;
      options.customEnd = q.customEnd;
      options.deliver = q.deliver !== 'false';
    }

    const report = await runReport(options);

    if (isHttp && event.queryStringParameters && event.queryStringParameters.format === 'csv') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${report.filename}"`,
          'Access-Control-Allow-Origin': '*'
        },
        body: report.csv
      };
    }

    return json(200, {
      ok: true,
      scheduled: isSchedule,
      rangeLabel: report.rangeLabel,
      dates: report.dates,
      total: report.total,
      byLine: report.byLine,
      filename: report.filename,
      email: report.email,
      slack: report.slack,
      sheet: report.sheet,
      rows: report.rows
    });
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    return json(message === 'NOT_CONFIGURED' ? 503 : 500, { error: message });
  }
};
