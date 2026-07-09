# S4S Live Call Dashboard

Real-time call monitoring dashboard for Service4Service, powered by the Tollring/iCall Suite API.

Hosted on **Netlify** from a **GitHub** repo. Tollring credentials are kept server-side in Netlify environment variables, not in the browser.

## Deploy to Netlify from GitHub

1. Push this repo to GitHub (already at `malchy1999/s4s-live-call-dashboard` if you used the earlier setup)
2. Log in to [Netlify](https://app.netlify.com)
3. Click **Add new site** > **Import an existing project**
4. Choose **GitHub** and select your repo
5. Netlify reads `netlify.toml` automatically:
   - **Publish directory:** `.` (root)
   - **Functions:** `netlify/functions`
6. Before deploying, go to **Site configuration** > **Environment variables** and add:

| Variable | Value |
|---|---|
| `TOLLRING_USERNAME` | Your iCall Suite login email |
| `TOLLRING_TOKEN` | Your Tollring token ID |
| `TOLLRING_BASE` | e.g. `https://your-host.icallsuite.com/api/v4` |

7. Click **Deploy site**

Every push to `main` redeploys automatically.

## Local development

```bash
cp .env.example .env
# Edit .env with your Tollring credentials

npm install
npm run dev
```

Opens at `http://localhost:8888` with Netlify Functions running locally.

Use `npm run dev:static` if you only want the HTML without API functions (demo mode only).

## Configuration

### Secrets (Netlify / .env)

Set in Netlify dashboard or local `.env` file. **Never commit `.env`.**

```
TOLLRING_USERNAME=
TOLLRING_TOKEN=
TOLLRING_BASE=
```

Optional: `DEMO_MODE=true` on the server forces the API to return demo responses.

### DDI numbers (index.html)

Edit the `DDI_LIST` array in `index.html` with your real garage numbers. This is not secret and can stay in the repo.

Set `DEMO_MODE = true` at the top of the script to force client-side demo data without calling the API.

## How it works

```
Browser  -->  /api/live-calls          -->  Netlify Function  -->  Tollring API
Browser  -->  /api/calls-by-date       -->  Netlify Function  -->  Tollring API
```

Credentials live in Netlify env vars. The dashboard JavaScript never sees the token.

## Security notes

- Staff-only access: enable [Netlify password protection](https://docs.netlify.com/visitor-access/password-protection/) or protect with Cloudflare Access / SSO on your domain
- Rotate the Tollring token if it was ever committed to git or exposed in frontend code
- `.env` is gitignored; use `.env.example` as a template only

## Updating

```bash
git add .
git commit -m "Update dashboard"
git push
```

Netlify rebuilds on push to the connected branch.
