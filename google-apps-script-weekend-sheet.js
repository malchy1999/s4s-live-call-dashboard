/**
 * Optional Google Apps Script for weekend missed-call logging.
 *
 * 1. Create a Google Sheet with headers:
 *    Date | Time | Line | Garage | Caller | Ring time | Queue | Callback status | Report range | Generated at
 * 2. Extensions → Apps Script → paste this file
 * 3. Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone
 * 4. Copy the web app URL into Netlify env: GOOGLE_SHEET_WEBHOOK_URL
 */
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const payload = JSON.parse(e.postData.contents || '{}');
  const rows = payload.rows || [];
  const generatedAt = payload.generatedAt || new Date().toISOString();
  const rangeLabel = payload.rangeLabel || '';

  rows.forEach(function (r) {
    sheet.appendRow([
      r.date || '',
      r.time || '',
      r.line || '',
      r.garage || '',
      r.caller || '',
      r.ringTime || '',
      r.queue || '',
      r.status || '',
      rangeLabel,
      generatedAt
    ]);
  });

  return ContentService.createTextOutput(JSON.stringify({ ok: true, appended: rows.length }))
    .setMimeType(ContentService.MimeType.JSON);
}
