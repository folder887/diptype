const express = require('express');
const { nanoid } = require('nanoid');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { publicUser } = require('../util/user');

const router = express.Router();

const PLANS = {
  monthly_usd: { amount: 49.0, currency: 'USD', days: 31, label: 'Месячная подписка ($)' },
  monthly_rub: { amount: 4990.0, currency: 'RUB', days: 31, label: 'Месячная подписка (₽)' },
  yearly_rub: { amount: 29990.0, currency: 'RUB', days: 366, label: 'Годовая подписка (₽)' },
};

const SHOP_ID = process.env.YOOMONEY_SHOP_ID;
const SECRET = process.env.YOOMONEY_SECRET_KEY;
const RETURN_URL = process.env.YOOMONEY_RETURN_URL || 'http://localhost:5173/dashboard';

function activatePro(user, days) {
  const base = user.plan === 'pro' && user.plan_expires && Number(user.plan_expires) > Date.now()
    ? Number(user.plan_expires)
    : Date.now();
  const expires = base + days * 24 * 60 * 60 * 1000;
  db.prepare('UPDATE users SET plan = ?, plan_expires = ? WHERE id = ?').run('pro', expires, user.id);
  return expires;
}

router.get('/plans', (_req, res) => {
  res.json({ plans: PLANS, demo: !(SHOP_ID && SECRET) });
});

router.post('/checkout', requireAuth, async (req, res) => {
  const planKey = (req.body.plan || '').toString();
  const plan = PLANS[planKey];
  if (!plan) return res.status(400).json({ error: 'Неизвестный тариф' });

  const paymentId = nanoid();
  db.prepare(
    `INSERT INTO payments (id, user_id, plan, amount, currency, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?)`
  ).run(paymentId, req.user.id, planKey, plan.amount, plan.currency, Date.now());

  // Demo-режим: нет ключей YooMoney — активируем подписку сразу.
  if (!SHOP_ID || !SECRET) {
    const expires = activatePro(req.user, plan.days);
    db.prepare("UPDATE payments SET status = 'succeeded' WHERE id = ?").run(paymentId);
    const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    return res.json({
      demo: true,
      message: 'Demo-режим: подписка активирована без оплаты',
      planExpires: expires,
      user: publicUser(fresh),
    });
  }

  // Боевой режим: создаём платёж в YooKassa.
  try {
    const auth = Buffer.from(`${SHOP_ID}:${SECRET}`).toString('base64');
    const resp = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Idempotence-Key': paymentId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: { value: plan.amount.toFixed(2), currency: plan.currency },
        capture: true,
        confirmation: { type: 'redirect', return_url: RETURN_URL },
        description: `diptype — ${plan.label}`,
        metadata: { paymentId, userId: req.user.id, plan: planKey },
      }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      return res.status(502).json({ error: data.description || 'Ошибка платёжной системы' });
    }
    db.prepare('UPDATE payments SET provider_id = ? WHERE id = ?').run(data.id, paymentId);
    res.json({ demo: false, confirmationUrl: data.confirmation?.confirmation_url, paymentId });
  } catch (err) {
    console.error('YooMoney error:', err.message);
    res.status(502).json({ error: 'Не удалось создать платёж' });
  }
});

// Вебхук YooMoney: подтверждение оплаты.
router.post('/webhook', express.json(), (req, res) => {
  const event = req.body || {};
  const obj = event.object || {};
  if (event.event === 'payment.succeeded' && obj.metadata) {
    const { paymentId, userId, plan } = obj.metadata;
    const planDef = PLANS[plan];
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (user && planDef) {
      activatePro(user, planDef.days);
      db.prepare("UPDATE payments SET status = 'succeeded' WHERE id = ?").run(paymentId);
    }
  }
  res.json({ ok: true });
});

module.exports = router;
