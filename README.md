# Rain

Minimalistic rain sounds PWA. Layered mixing (rain with landing surfaces, wind, thunder, fan, air con), presets, sleep timer. Fully offline-capable once installed.

## Run locally
Open `index.html` in a browser, or serve the folder over HTTP for PWA features (service worker requires HTTPS or localhost):

```bash
python3 -m http.server 8000
```

## Regenerate icons
```bash
python3 make_icons.py
```

## Deploy
GitHub Pages workflow included (`.github/workflows/pages.yml`). Enable Pages in repo Settings → Pages → Source: GitHub Actions.
