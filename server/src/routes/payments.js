const express = require('express');
const { nanoid } = require('nanoid');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { publicUser } = require('../util/user');
const ton = require('../services/ton');

const router = express.Router();

const PLANS = {
  monthly_rub: { amount: 4990.0, currency: 'RUB', days: 31, label: 'Месячная подписка' },
  yearly_rub: { amount: 29990.0, currency: 'RUB', days: 366, label: 'Годовая подписка' },
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
  res.json({
    plans: PLANS,
    methods: {
      yoomoney: { label: 'Банковская карта (YooMoney)', demo: !(SHOP_ID && SECRET) },
      ton: { label: 'Криптовалюта (TON)', demo: ton.isDemo() },
    },
  });
});

router.post('/checkout', requireAuth, async (req, res) => {
  const planKey = (req.body.plan || '').toString();
  const method = (req.body.method || 'yoomoney').toString();
  const plan = PLANS[planKey];
  if (!plan) return res.status(400).json({ error: 'Неизвестный тариф' });
  if (!['yoomoney', 'ton'].includes(method)) return res.status(400).json({ error: 'Неизвестный способ оплаты' });

  const paymentId = nanoid();

  // ── Оплата криптовалютой TON ──
  if (method === 'ton') {
    const comment = `diptype-${paymentId.slice(0, 10)}`;
    const tonPay = await ton.buildPayment({ amountRub: plan.amount, comment });

    db.prepare(
      `INSERT INTO payments (id, user_id, plan, amount, currency, status, method, ton_comment, ton_nano, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', 'ton', ?, ?, ?)`
    ).run(paymentId, req.user.id, planKey, plan.amount, plan.currency, comment, tonPay.amountNano, Date.now());

    return res.json({
      method: 'ton',
      paymentId,
      demo: tonPay.demo,
      address: tonPay.address,
      amountTon: tonPay.amountTon,
      amountNano: tonPay.amountNano,
      rubPerTon: tonPay.rubPerTon,
      comment,
      tonLink: tonPay.tonLink,
      tonkeeperLink: tonPay.tonkeeperLink,
      tonhubLink: tonPay.tonhubLink,
      planLabel: plan.label,
      amountRub: plan.amount,
    });
  }

  // ── Оплата через YooMoney ──
  db.prepare(
    `INSERT INTO payments (id, user_id, plan, amount, currency, status, method, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', 'yoomoney', ?)`
  ).run(paymentId, req.user.id, planKey, plan.amount, plan.currency, Date.now());

  // Demo-режим: нет ключей YooMoney — активируем подписку сразу.
  if (!SHOP_ID || !SECRET) {
    const expires = activatePro(req.user, plan.days);
    db.prepare("UPDATE payments SET status = 'succeeded' WHERE id = ?").run(paymentId);
    const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    return res.json({
      method: 'yoomoney',
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
    res.json({ method: 'yoomoney', demo: false, confirmationUrl: data.confirmation?.confirmation_url, paymentId });
  } catch (err) {
    console.error('YooMoney error:', err.message);
    res.status(502).json({ error: 'Не удалось создать платёж' });
  }
});

// Проверка поступления TON-платежа.
router.post('/ton/verify', requireAuth, async (req, res) => {
  const paymentId = (req.body.paymentId || '').toString();
  const payment = db
    .prepare("SELECT * FROM payments WHERE id = ? AND user_id = ? AND method = 'ton'")
    .get(paymentId, req.user.id);
  if (!payment) return res.status(404).json({ error: 'Платёж не найден' });

  if (payment.status === 'succeeded') {
    const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    return res.json({ paid: true, user: publicUser(fresh) });
  }

  const plan = PLANS[payment.plan];
  const paid = await ton.verifyPayment({ comment: payment.ton_comment, amountNano: payment.ton_nano });

  if (!paid) {
    return res.json({ paid: false, message: 'Перевод пока не найден. Подождите подтверждения сети и попробуйте снова.' });
  }

  activatePro(req.user, plan.days);
  db.prepare("UPDATE payments SET status = 'succeeded' WHERE id = ?").run(paymentId);
  const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ paid: true, user: publicUser(fresh) });
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
