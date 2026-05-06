const express = require('express');
const cors    = require('cors');
const http    = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app    = express();
const server = http.createServer(app);

// Socket.IO — allows frontend to receive real-time watcher notifications
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`[WS] Client disconnected: ${socket.id}`));
});

app.use(cors());
app.use(express.json());

// Attach io to requests so routes can emit events if needed
app.use((req, res, next) => { req.io = io; next(); });

// Health check
app.get('/api/health', async (req, res) => {
  const pool = require('./db');
  try {
    const r = await pool.query('SELECT NOW() AS time');
    res.json({ success: true, db: 'connected', time: r.rows[0].time });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',              require('./routes/auth'));

// ─── Master Table Routes ──────────────────────────────────────────────────────
app.use('/api/departments',       require('./routes/departments'));
app.use('/api/employees',         require('./routes/employees'));
app.use('/api/salary-structures', require('./routes/salaryStructures'));
app.use('/api/overtime-rates',    require('./routes/overtimeRates'));
app.use('/api/rig-bonus-rates',   require('./routes/rigBonusRates'));
app.use('/api/travelling-rates',  require('./routes/travellingRates'));
app.use('/api/tax-slabs',         require('./routes/taxSlabs'));
app.use('/api/account-codes',     require('./routes/accountCodes'));
app.use('/api/banks',             require('./routes/banks'));
app.use('/api/pf-schemes',        require('./routes/pfSchemes'));

// ─── Derived Table Routes ─────────────────────────────────────────────────────
app.use('/api/attendance',        require('./routes/attendance'));
app.use('/api/deductions',        require('./routes/deductions'));
app.use('/api/payroll',           require('./routes/payroll'));
app.use('/api/payslips',          require('./routes/payslips'));
app.use('/api/bank-transfers',    require('./routes/bankTransfers'));
app.use('/api/pf-eobi',           require('./routes/pfEobi'));
app.use('/api/jv-entries',        require('./routes/jvEntries'));

// ─── System Routes ────────────────────────────────────────────────────────────
app.use('/api/users',             require('./routes/users'));
app.use('/api/audit-log',         require('./routes/auditLog'));
app.use('/api/approvals',         require('./routes/approvals'));
app.use('/api/reports',           require('./routes/reports'));
app.use('/api/excel',             require('./routes/excel'));

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(require('./middleware/errorHandler'));

// ─── Start server + watcher ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`WellServe Payroll Backend running on http://localhost:${PORT}`);
  // Start folder watcher after server is ready
  require('./watcher').startWatching(io);
});
