// BusTrack Shared Configuration
const BUSTRACK_CONFIG = {
  API_BASE: 'https://bus-tracker-eptg.onrender.com/api',
  SOCKET_URL: 'https://bus-tracker-eptg.onrender.com',
  MAP_TILE: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  MAP_ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  DEFAULT_CENTER: [12.9716, 77.5946], // Bengaluru
  DEFAULT_ZOOM: 13,
  APP_NAME: 'BusTrack',
  APP_TAGLINE: 'Real-Time Bus Tracking'
};

// Storage helpers
const BT_Storage = {
  set: (key, val) => localStorage.setItem('bt_' + key, JSON.stringify(val)),
  get: (key) => { try { return JSON.parse(localStorage.getItem('bt_' + key)); } catch { return null; } },
  remove: (key) => localStorage.removeItem('bt_' + key),
  clear: () => { ['token','user','driver','role'].forEach(k => localStorage.removeItem('bt_' + k)); }
};

// API helper
async function btFetch(path, options = {}) {
  const token = BT_Storage.get('token');
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...options.headers };
  const res = await fetch(BUSTRACK_CONFIG.API_BASE + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
