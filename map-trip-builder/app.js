const map = L.map('map', {
  center: [20, 0],
  zoom: 2,
  minZoom: 2,
  worldCopyJump: true,
  zoomControl: true,
});

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const routeLayer = L.layerGroup().addTo(map);
const previewLine = L.polyline([], { className: 'route-line-preview' }).addTo(map);

const stops = [];
let placingEnabled = true;

const stopListEl = document.getElementById('stop-list');
const stopCountEl = document.getElementById('stop-count');
const totalDistEl = document.getElementById('total-dist');
const fitBtn = document.getElementById('fit-btn');
const shareBtn = document.getElementById('share-btn');
const clearBtn = document.getElementById('clear-btn');
const toast = document.getElementById('empty-toast');
const panel = document.getElementById('panel');

document.getElementById('panel-toggle').addEventListener('click', () => {
  panel.classList.toggle('collapsed');
});

function pinIcon(n) {
  return L.divIcon({
    className: 'pin',
    html: `<span>${n}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
}

function formatDistance(meters) {
  if (meters >= 1000) return (meters / 1000).toFixed(1) + ' km';
  return Math.round(meters) + ' m';
}

function totalDistance() {
  let d = 0;
  for (let i = 1; i < stops.length; i++) d += stops[i - 1].latlng.distanceTo(stops[i].latlng);
  return d;
}

function redrawRoute() {
  routeLayer.clearLayers();
  if (stops.length < 2) return;
  const latlngs = stops.map(s => s.latlng);
  L.polyline(latlngs, { className: 'route-line', interactive: false }).addTo(routeLayer);
  stops.forEach((s, i) => {
    s.marker.setLatLng(s.latlng);
    s.marker.setIcon(pinIcon(i + 1));
    s.marker.setZIndexOffset(1000 - i);
  });
}

function renderList() {
  stopListEl.innerHTML = '';
  stops.forEach((s, i) => {
    const li = document.createElement('li');
    const num = document.createElement('span');
    num.className = 'stop-num';
    num.textContent = i + 1;
    const name = document.createElement('span');
    name.className = 'stop-name';
    name.textContent = s.name;
    name.title = s.name;
    li.append(num, name);
    if (i > 0) {
      const d = formatDistance(s.latlng.distanceTo(stops[i - 1].latlng));
      const dist = document.createElement('span');
      dist.className = 'stop-dist';
      dist.textContent = d;
      li.appendChild(dist);
    }
    const del = document.createElement('button');
    del.className = 'stop-del';
    del.textContent = '×';
    del.title = 'Remove stop';
    del.addEventListener('click', () => removeStop(i));
    li.appendChild(del);
    stopListEl.appendChild(li);
  });
  const n = stops.length;
  stopCountEl.textContent = n + (n === 1 ? ' stop' : ' stops');
  totalDistEl.textContent = formatDistance(totalDistance());
  const has = n > 0;
  fitBtn.disabled = n < 2;
  shareBtn.disabled = !has;
  clearBtn.disabled = !has;
  toast.classList.toggle('hidden', has);
}

function save() {
  try {
    localStorage.setItem('map-trip-builder', JSON.stringify(stops.map(s => ({
      lat: s.latlng.lat, lng: s.latlng.lng, name: s.name,
    }))));
  } catch (e) { /* storage unavailable */ }
}

function updateHash() {
  if (stops.length === 0) {
    history.replaceState(null, '', location.pathname + location.search);
    return;
  }
  const p = stops.map(s => s.latlng.lat.toFixed(5) + ',' + s.latlng.lng.toFixed(5)).join(';');
  history.replaceState(null, '', '#' + p);
}

function addStop(latlng) {
  const marker = L.marker(latlng, {
    icon: pinIcon(stops.length + 1),
    draggable: true,
  }).addTo(routeLayer);
  const stop = { latlng, marker, name: 'Stop ' + (stops.length + 1) };
  marker.on('dragstart', () => marker.getElement()?.classList.add('dragging'));
  marker.on('drag', () => {
    stop.latlng = marker.getLatLng();
    redrawRoute();
  });
  marker.on('dragend', () => {
    marker.getElement()?.classList.remove('dragging');
    stop.latlng = marker.getLatLng();
    redrawRoute();
    renderList();
    save();
    updateHash();
  });
  stops.push(stop);
  redrawRoute();
  renderList();
  save();
  updateHash();
  reverseGeocode(stop);
}

function removeStop(i) {
  routeLayer.removeLayer(stops[i].marker);
  stops.splice(i, 1);
  redrawRoute();
  renderList();
  save();
  updateHash();
}

function reverseGeocode(stop) {
  fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${stop.latlng.lat}&lon=${stop.latlng.lng}&zoom=14`)
    .then(r => r.json())
    .then(data => {
      if (data && data.display_name) {
        stop.name = data.display_name.split(',').slice(0, 2).join(',').trim() || stop.name;
      }
    })
    .catch(() => {})
    .finally(() => { renderList(); save(); });
}

map.on('click', e => {
  if (placingEnabled) addStop(e.latlng);
});

map.on('mousemove', e => {
  if (stops.length === 0) {
    previewLine.setLatLngs([]);
  } else {
    previewLine.setLatLngs([stops[stops.length - 1].latlng, e.latlng]);
  }
});
map.on('mouseout', () => previewLine.setLatLngs([]));

fitBtn.addEventListener('click', () => {
  if (stops.length >= 2) {
    map.fitBounds(L.latLngBounds(stops.map(s => s.latlng)).pad(0.15));
  } else if (stops.length === 1) {
    map.setView(stops[0].latlng, Math.max(map.getZoom(), 12));
  }
});

clearBtn.addEventListener('click', () => {
  if (!confirm('Remove all pins and clear the trip?')) return;
  [...stops].forEach((_, i) => removeStop(0));
});

shareBtn.addEventListener('click', async () => {
  updateHash();
  const url = location.href;
  try {
    await navigator.clipboard.writeText(url);
    shareBtn.textContent = 'Copied!';
  } catch (e) {
    prompt('Copy this link to share your trip:', url);
  }
  setTimeout(() => { shareBtn.textContent = 'Copy share link'; }, 1500);
});

function loadFromHash() {
  const h = location.hash.slice(1);
  if (!h) return false;
  const pts = h.split(';');
  let ok = false;
  for (const p of pts) {
    const [lat, lng] = p.split(',').map(Number);
    if (isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      addStop(L.latLng(lat, lng));
      ok = true;
    }
  }
  return ok;
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('map-trip-builder');
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return;
    for (const p of arr) {
      if (p && isFinite(p.lat) && isFinite(p.lng)) {
        addStop(L.latLng(p.lat, p.lng));
        if (typeof p.name === 'string' && p.name) stops[stops.length - 1].name = p.name;
      }
    }
    renderList();
  } catch (e) { /* ignore corrupt storage */ }
}

if (!loadFromHash()) loadFromStorage();
renderList();
