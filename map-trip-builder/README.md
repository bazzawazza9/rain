# Map Trip Builder

A trip builder that works **on the map itself**: pan and zoom the map, click anywhere to drop a pin, and the pins automatically connect in the order you place them.

## Features

- **Full map control** — smooth drag panning, scroll-wheel / pinch / button zoom (Leaflet + OpenStreetMap tiles, world wraps when panning east/west).
- **Pins by clicking** — every map click drops a numbered pin at that exact location.
- **Automatic route** — pins are connected in placement order with a polyline; a dashed preview line follows your cursor from the last pin.
- **Draggable pins** — drag any pin to adjust the route; the list and totals update live.
- **Sidebar itinerary** — ordered stop list with per-leg distances, total trip distance, and per-stop removal.
- **Fit to trip** — zooms the map to frame the whole route.
- **Persistence** — the trip is saved to `localStorage` and survives reloads.
- **Shareable links** — "Copy share link" puts the route (`#lat,lng;lat,lng;...`) into the URL hash; opening such a link restores the trip.
- **Place names** — stops are reverse-geocoded via Nominatim (best effort; falls back to "Stop N").

## Run

Serve the folder over HTTP (any static server works):

```bash
python3 -m http.server 8000
# then open http://localhost:8000/map-trip-builder/
```

Opening `index.html` directly from disk also works, except that `localStorage` persistence and clipboard sharing may be limited by the browser.

## Files

- `index.html` — page shell, loads Leaflet 1.9.4 from unpkg.
- `style.css` — layout, pins, route line, sidebar.
- `app.js` — map setup, pin/route logic, persistence, sharing.

Requires internet access for map tiles (OpenStreetMap), the Leaflet CDN, and optional reverse geocoding.
