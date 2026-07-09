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

The dashboard calls `/api/tollring?path=GetLiveCalls` (and other paths). The Netlify function forwards requests to `https://4reports.4com.im/api/v4` with credentials from environment variables.
