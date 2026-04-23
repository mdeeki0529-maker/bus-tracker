const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const JWT_SECRET = 'bustrack_secret_2024';

// In-memory storage (replace with DB in production)
const users = new Map();
const drivers = new Map();
const buses = new Map();
const activeSessions = new Map(); // driverPhone -> { location, busId, socketId, status }
const connectedSockets = new Map(); // socketId -> { role, id }

// Seed demo data
function seedData() {
  // Demo driver
  const driverPass = bcrypt.hashSync('driver123', 10);
  drivers.set('driver001', {
    id: 'driver001',
    name: 'Ravi Kumar',
    phone: '9876543210',
    email: 'ravi@bustrack.com',
    password: driverPass,
    busId: 'BUS-101',
    route: 'Route A - City Center to Airport',
    avatar: 'RK'
  });
  drivers.set('driver002', {
    id: 'driver002',
    name: 'Suresh Patel',
    phone: '9876543211',
    email: 'suresh@bustrack.com',
    password: driverPass,
    busId: 'BUS-202',
    route: 'Route B - University to Railway Station',
    avatar: 'SP'
  });

  // Demo user
  const userPass = bcrypt.hashSync('user123', 10);
  users.set('user001', {
    id: 'user001',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '9123456789',
    password: userPass,
    avatar: 'PS'
  });

  // Bus data
  buses.set('BUS-101', {
    id: 'BUS-101',
    number: 'KA-01-AB-1234',
    route: 'Route A - City Center to Airport',
    stops: ['City Center', 'MG Road', 'Hebbal', 'Yelahanka', 'Airport'],
    capacity: 50,
    driverId: 'driver001'
  });
  buses.set('BUS-202', {
    id: 'BUS-202',
    number: 'KA-01-CD-5678',
    route: 'Route B - University to Railway Station',
    stops: ['University', 'Vijaynagar', 'Majestic', 'Railway Station'],
    capacity: 45,
    driverId: 'driver002'
  });
}

seedData();

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ─── Auth Routes ─────────────────────────────────────────────────────────────
// User Register
app.post('/api/user/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password)
    return res.status(400).json({ error: 'All fields required' });

  const existingUser = [...users.values()].find(u => u.email === email);
  if (existingUser) return res.status(400).json({ error: 'Email already registered' });

  const id = 'user_' + uuidv4().slice(0, 8);
  const hashed = await bcrypt.hash(password, 10);
  const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  users.set(id, { id, name, email, phone, password: hashed, avatar });
  
  const token = jwt.sign({ id, role: 'user', name, email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token, user: { id, name, email, phone, avatar } });
});

// User Login
app.post('/api/user/login', async (req, res) => {
  const { email, password } = req.body;
  const user = [...users.values()].find(u => u.email === email);
  if (!user || !await bcrypt.compare(password, user.password))
    return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, role: 'user', name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar } });
});

// Driver Login (by phone)
app.post('/api/driver/login', async (req, res) => {
  const { phone, password } = req.body;
  const driver = [...drivers.values()].find(d => d.phone === phone);
  if (!driver || !await bcrypt.compare(password, driver.password))
    return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: driver.id, role: 'driver', name: driver.name, phone: driver.phone }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token, driver: { id: driver.id, name: driver.name, phone: driver.phone, busId: driver.busId, route: driver.route, avatar: driver.avatar } });
});

// Driver Register
app.post('/api/driver/register', async (req, res) => {
  const { name, phone, email, password, busNumber, route } = req.body;
  if (!name || !phone || !password)
    return res.status(400).json({ error: 'Name, phone, and password required' });

  const existing = [...drivers.values()].find(d => d.phone === phone);
  if (existing) return res.status(400).json({ error: 'Phone already registered' });

  const id = 'drv_' + uuidv4().slice(0, 8);
  const hashed = await bcrypt.hash(password, 10);
  const busId = busNumber || 'BUS-' + Math.floor(100 + Math.random() * 900);
  const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  drivers.set(id, { id, name, phone, email: email || '', password: hashed, busId, route: route || 'Unassigned Route', avatar });
  buses.set(busId, { id: busId, number: busNumber || busId, route: route || 'Unassigned', stops: [], capacity: 50, driverId: id });
  
  const token = jwt.sign({ id, role: 'driver', name, phone }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token, driver: { id, name, phone, busId, route: route || 'Unassigned', avatar } });
});

// ─── Bus / Tracking Routes ────────────────────────────────────────────────────
app.get('/api/buses', (req, res) => {
  const busData = [...buses.values()].map(bus => {
    const session = activeSessions.get(bus.driverId);
    const driver = [...drivers.values()].find(d => d.id === bus.driverId);
    return {
      ...bus,
      isActive: !!session,
      location: session?.location || null,
      driverName: driver?.name || 'Unknown',
      driverPhone: driver?.phone || '',
      lastUpdated: session?.lastUpdated || null,
      status: session?.status || 'offline'
    };
  });
  res.json(busData);
});

app.get('/api/bus/:busId', (req, res) => {
  const bus = buses.get(req.params.busId);
  if (!bus) return res.status(404).json({ error: 'Bus not found' });
  const driver = [...drivers.values()].find(d => d.id === bus.driverId);
  const session = activeSessions.get(bus.driverId);
  res.json({
    ...bus,
    isActive: !!session,
    location: session?.location || null,
    driverName: driver?.name || 'Unknown',
    driverPhone: driver?.phone || '',
    status: session?.status || 'offline',
    lastUpdated: session?.lastUpdated || null
  });
});

// Track bus by driver phone
app.get('/api/track/:phone', (req, res) => {
  const driver = [...drivers.values()].find(d => d.phone === req.params.phone);
  if (!driver) return res.status(404).json({ error: 'Driver not found' });
  const session = activeSessions.get(driver.id);
  const bus = buses.get(driver.busId);
  res.json({
    driverName: driver.name,
    driverPhone: driver.phone,
    busId: driver.busId,
    busNumber: bus?.number || driver.busId,
    route: driver.route,
    isActive: !!session,
    location: session?.location || null,
    status: session?.status || 'offline',
    lastUpdated: session?.lastUpdated || null
  });
});

app.get('/api/active-buses', (req, res) => {
  const active = [];
  activeSessions.forEach((session, driverId) => {
    const driver = drivers.get(driverId);
    if (driver) {
      const bus = buses.get(driver.busId);
      active.push({
        driverId,
        driverName: driver.name,
        busId: driver.busId,
        busNumber: bus?.number || driver.busId,
        route: driver.route,
        location: session.location,
        status: session.status,
        lastUpdated: session.lastUpdated
      });
    }
  });
  res.json(active);
});

// ─── Socket.IO ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Driver starts / resumes sharing location
  socket.on('driver:start', ({ driverId, token }) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.id !== driverId || decoded.role !== 'driver') {
        socket.emit('error', { message: 'Unauthorized' }); return;
      }
      const driver = drivers.get(driverId);
      if (!driver) return;

      // Reconnect scenario: cancel grace-period offline timer if still pending
      const existing = activeSessions.get(driverId);
      if (existing && existing.reconnectTimeout) {
        clearTimeout(existing.reconnectTimeout);
        console.log(`Driver ${driver.name} reconnected within grace window — session preserved`);
      }

      const isResume = !!(existing && existing.location);
      activeSessions.set(driverId, {
        socketId: socket.id,
        location: existing ? existing.location : null,
        status: 'active',
        lastUpdated: new Date().toISOString(),
        busId: driver.busId,
        startedAt: (existing && existing.startedAt) ? existing.startedAt : new Date().toISOString()
      });
      connectedSockets.set(socket.id, { role: 'driver', id: driverId });
      socket.join(`bus:${driver.busId}`);
      socket.emit('driver:started', { busId: driver.busId, resumed: isResume });
      io.emit('bus:status', { busId: driver.busId, driverId, status: 'active', driverName: driver.name });
      console.log(`Driver ${driver.name} ${isResume ? 'RESUMED' : 'started'} tracking`);
    } catch (e) {
      socket.emit('error', { message: 'Auth failed' });
    }
  });

  // Driver updates location
  socket.on('driver:location', ({ driverId, location, token }) => {
    try {
      jwt.verify(token, JWT_SECRET);
      const session = activeSessions.get(driverId);
      const driver = drivers.get(driverId);
      if (!session || !driver) return;

      const updatedSession = {
        ...session,
        location,
        lastUpdated: new Date().toISOString(),
        status: 'active'
      };
      activeSessions.set(driverId, updatedSession);

      // Broadcast to all users watching this bus
      io.emit('bus:location', {
        busId: driver.busId,
        driverId,
        driverName: driver.name,
        location,
        lastUpdated: updatedSession.lastUpdated
      });
    } catch {}
  });

  // Driver stops sharing
  socket.on('driver:stop', ({ driverId }) => {
    const driver = drivers.get(driverId);
    if (driver) {
      activeSessions.delete(driverId);
      io.emit('bus:status', { busId: driver.busId, driverId, status: 'offline', driverName: driver.name });
    }
  });

  // User subscribes to a bus
  socket.on('user:subscribe', ({ busId }) => {
    socket.join(`bus:${busId}`);
    connectedSockets.set(socket.id, { role: 'user', busId });
    
    // Send current location if bus is active
    const bus = buses.get(busId);
    if (bus) {
      const session = activeSessions.get(bus.driverId);
      if (session?.location) {
        socket.emit('bus:location', {
          busId,
          location: session.location,
          lastUpdated: session.lastUpdated
        });
      }
    }
  });

  socket.on('disconnect', () => {
    const info = connectedSockets.get(socket.id);
    if (info?.role === 'driver') {
      const driver = drivers.get(info.id);
      if (driver) {
        // ── CRITICAL: Do NOT delete the active session on disconnect ──
        // The driver may have lost signal temporarily. We keep the session
        // alive for RECONNECT_GRACE_MS before declaring the bus offline.
        // Only stopTracking() (driver:stop event) actually ends the session.
        const RECONNECT_GRACE_MS = 30000; // 30 seconds grace window
        const session = activeSessions.get(info.id);
        if (session) {
          session.status = 'reconnecting';
          session.disconnectedAt = Date.now();
          session.reconnectTimeout = setTimeout(() => {
            // Only mark offline if driver has not reconnected within grace window
            const current = activeSessions.get(info.id);
            if (current && current.status === 'reconnecting') {
              activeSessions.delete(info.id);
              io.emit('bus:status', { busId: driver.busId, driverId: info.id, status: 'offline', driverName: driver.name });
              console.log(`Driver ${driver.name} grace period expired — marked offline`);
            }
          }, RECONNECT_GRACE_MS);
        }
        // Broadcast temporary "reconnecting" status (not fully offline)
        io.emit('bus:status', { busId: driver.busId, driverId: info.id, status: 'reconnecting', driverName: driver.name });
        console.log(`Driver ${driver.name} disconnected — keeping session for ${RECONNECT_GRACE_MS/1000}s`);
      }
    }
    connectedSockets.delete(socket.id);
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`BusTrack Server running on port ${PORT}`));
