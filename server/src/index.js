require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const generateRoutes = require('./routes/generate');
const paymentRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    demoMode: {
      anthropic: !process.env.ANTHROPIC_API_KEY,
      payments: !(process.env.YOOMONEY_SHOP_ID && process.env.YOOMONEY_SECRET_KEY),
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', generateRoutes);
app.use('/api/payments', paymentRoutes);

// Раздача собранного фронтенда в проде.
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
  console.log(`diptype API → http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) console.log('  ⚙  Anthropic: demo-режим (нет ANTHROPIC_API_KEY)');
  if (!(process.env.YOOMONEY_SHOP_ID && process.env.YOOMONEY_SECRET_KEY))
    console.log('  ⚙  Платежи: demo-режим (нет YooMoney credentials)');
});
