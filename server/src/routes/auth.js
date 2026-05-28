const express = require('express');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const db = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');
const { publicUser } = require('../util/user');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Введите корректный email' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть не короче 6 символов' });
  }

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (exists) return res.status(409).json({ error: 'Пользователь с таким email уже существует' });

  const user = {
    id: nanoid(),
    email: email.toLowerCase(),
    name: name || email.split('@')[0],
    password_hash: bcrypt.hashSync(password, 10),
    free_used: 0,
    plan: 'free',
    plan_expires: null,
    created_at: Date.now(),
  };

  db.prepare(
    `INSERT INTO users (id, email, name, password_hash, free_used, plan, plan_expires, created_at)
     VALUES (@id, @email, @name, @password_hash, @free_used, @plan, @plan_expires, @created_at)`
  ).run(user);

  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Введите email и пароль' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Неверный email или пароль' });
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
