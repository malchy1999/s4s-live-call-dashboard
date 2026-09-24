# S4S Live Call Dashboard

## Setup

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Copy `.env.example` to `.env` and fill in your credentials
3. Run locally: `netlify dev`
4. Open `http://localhost:8888`

## Deploying to Netlify

1. Push to GitHub
2. Connect repo in Netlify dashboard
3. Add environment variables in Netlify dashboard under Site Settings > Environment Variables:
   - `TOLLRING_USERNAME`
   - `TOLLRING_TOKEN`
4. Deploy

## Credentials

- `TOLLRING_USERNAME`: Your iCall Suite login email
- `TOLLRING_TOKEN`: Created in iCall Suite under Configuration > System Settings > API
- Never commit credentials to git

## API proxy

The dashboard calls `/api/tollring?path=GetLiveCalls` (and other paths). The Netlify function forwards requests to the 4com iCall Suite API with credentials from environment variables.

## Weekend missed-call reports

The dashboard includes a **Weekend Missed Calls** panel:

- **Last weekend** — previous Sat–Sun
- **This weekend** — Sat–Sun so far
- **Extended (bank hol.)** — adds Fri/Mon when UK bank holidays touch the weekend
- **Custom dates** — pick any range
- **Callback status** — tracked in your browser (Not contacted, Called back, etc.)
- **Download CSV** — export for Monday follow-up

### Automatic Monday email

A scheduled Netlify function runs **every Monday at 07:00 UTC** (`weekend-missed-report`).

Configure in Netlify environment variables:

| Variable | Purpose |
|---|---|
| `REPORT_EMAIL_FROM` | Sender address (must be verified in Resend) |
| `REPORT_EMAIL_TO` | Comma-separated recipients |
| `RESEND_API_KEY` | [Resend](https://resend.com) API key |

Optional:

| Variable | Purpose |
|---|---|
| `SLACK_WEBHOOK_URL` or `TEAMS_WEBHOOK_URL` | Post summary notification |
| `GOOGLE_SHEET_WEBHOOK_URL` | Append rows via Google Apps Script (see `google-apps-script-weekend-sheet.js`) |
| `WEEKEND_REPORT_SECRET` | Bearer token to protect manual `/api/weekend-missed` calls |

### Manual API

```bash
curl -X POST https://your-site.netlify.app/api/weekend-missed \
  -H "Content-Type: application/json" \
  -d '{"preset":"last-weekend","deliver":true}'
```

CSV download:

```bash
curl "https://your-site.netlify.app/api/weekend-missed?preset=last-weekend&format=csv" -o weekend-missed.csv
```

### Google Sheet logging

1. Create a sheet with headers: Date, Time, Line, Garage, Caller, Ring time, Queue, Callback status, Report range, Generated at
2. Deploy `google-apps-script-weekend-sheet.js` as a web app
3. Set `GOOGLE_SHEET_WEBHOOK_URL` to the deployment URL
