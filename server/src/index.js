require('dotenv').config();
const express = require('express');
const { pool } = require('./config/db');

// Routes
const userRoutes = require('./routes/users');
const masterDataRoutes = require('./routes/masterData');
const dailyReturnRoutes = require('./routes/dailyReturns');
const reportRoutes = require('./routes/reports');
const tripRoutes = require('./routes/trips');
const outboundRoutes = require('./routes/outbound');

const app = express();
app.use(express.json());

// Health Check
app.get('/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Mount Routes
app.use('/users', userRoutes);
app.use('/', masterDataRoutes); // Consumables, Factories, ClientSites are at root / in original
app.use('/daily-returns', dailyReturnRoutes);
app.use('/reports', reportRoutes);
app.use('/trips', tripRoutes);
app.use('/outbound', outboundRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'server_error' });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
