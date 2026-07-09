# S4S Live Call Dashboard

Real-time call monitoring dashboard for Service4Service, powered by the Tollring/iCall Suite API.

## Live site

After GitHub Pages is enabled, the dashboard is available at:

`https://malchy1999.github.io/s4s-live-call-dashboard/`

## Local development

```bash
npm run dev
```

Opens a static server at `http://localhost:3000`.

## Configuration

Before going live with real call data, edit the config block at the top of `index.html`:

1. Set `TOLLRING_USERNAME`, `TOLLRING_TOKEN`, and `TOLLRING_BASE`
2. Replace placeholder numbers in `DDI_LIST`
3. Set `DEMO_MODE = false`

## GitHub Pages

This repo is a static site. GitHub Pages serves `index.html` from the root of the `main` branch.

To redeploy after changes:

```bash
git add .
git commit -m "Update dashboard"
git push
```

Pages updates automatically within a few minutes.
