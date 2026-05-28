const express = require('express');
const multer = require('multer');
const { nanoid } = require('nanoid');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { publicUser, isPro, FREE_LIMIT } = require('../util/user');
const { generate, KIND_LABEL } = require('../services/anthropic');
const { pushFiles } = require('../services/github');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 10 },
});

const TEXT_EXT = ['.txt', '.md', '.markdown', '.csv', '.json', '.tex', '.rtf', '.html'];

// Функции, доступные только по подписке (помимо базовой генерации диплома).
const PRO_ONLY = new Set(['presentation', 'website', 'speech']);

function extractText(file) {
  const name = file.originalname || 'file';
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
  if (TEXT_EXT.includes(ext)) {
    return { name, text: file.buffer.toString('utf8') };
  }
  // Бинарные форматы (docx/pdf) — передаём только имя; полный парсинг можно добавить отдельно.
  return { name, text: `[прикреплён файл «${name}», ${Math.round(file.size / 1024)} КБ]` };
}

router.post('/generate', requireAuth, upload.array('files', 10), async (req, res) => {
  const user = req.user;
  const kind = (req.body.kind || 'diploma').toString();
  const prompt = (req.body.prompt || '').toString();

  if (!KIND_LABEL[kind]) return res.status(400).json({ error: 'Неизвестный тип генерации' });
  if (!prompt.trim() && (!req.files || req.files.length === 0)) {
    return res.status(400).json({ error: 'Добавьте промпт или прикрепите документ' });
  }

  const pro = isPro(user);

  // Гейтинг подписки.
  if (PRO_ONLY.has(kind) && !pro) {
    return res.status(402).json({
      error: 'Эта функция доступна по подписке diptype Pro',
      requiresSubscription: true,
    });
  }
  if (kind === 'diploma' && !pro && user.free_used >= FREE_LIMIT) {
    return res.status(402).json({
      error: `Бесплатный лимит (${FREE_LIMIT} запроса) исчерпан. Оформите подписку diptype Pro.`,
      requiresSubscription: true,
    });
  }

  const attachments = (req.files || []).map(extractText);

  let result;
  try {
    result = await generate({ kind, prompt, attachments });
  } catch (err) {
    console.error('Generation error:', err.message);
    return res.status(500).json({ error: 'Ошибка генерации. Попробуйте позже.' });
  }

  // Списываем бесплатный запрос только за базовую генерацию диплома и только для free-плана.
  if (kind === 'diploma' && !pro) {
    db.prepare('UPDATE users SET free_used = free_used + 1 WHERE id = ?').run(user.id);
    user.free_used += 1;
  }

  const gen = {
    id: nanoid(),
    user_id: user.id,
    kind,
    prompt,
    title: result.title,
    status: 'done',
    files_json: JSON.stringify(result.files),
    created_at: Date.now(),
  };
  db.prepare(
    `INSERT INTO generations (id, user_id, kind, prompt, title, status, files_json, created_at)
     VALUES (@id, @user_id, @kind, @prompt, @title, @status, @files_json, @created_at)`
  ).run(gen);

  res.json({
    id: gen.id,
    kind,
    title: result.title,
    files: result.files,
    demo: !!result.demo,
    user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(user.id)),
  });
});

// История генераций пользователя.
router.get('/generations', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT id, kind, title, created_at FROM generations WHERE user_id = ? ORDER BY created_at DESC LIMIT 50')
    .all(req.user.id);
  res.json({ generations: rows });
});

router.get('/generations/:id', requireAuth, (req, res) => {
  const row = db
    .prepare('SELECT * FROM generations WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'Не найдено' });
  res.json({
    id: row.id,
    kind: row.kind,
    title: row.title,
    prompt: row.prompt,
    files: JSON.parse(row.files_json || '[]'),
    createdAt: row.created_at,
  });
});

// Загрузка результата в GitHub-репозиторий пользователя.
router.post('/generations/:id/push', requireAuth, async (req, res) => {
  const { repo, branch, token } = req.body || {};
  const row = db
    .prepare('SELECT * FROM generations WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'Не найдено' });

  const ghToken = token || process.env.GITHUB_TOKEN;
  if (!ghToken) {
    return res.status(400).json({ error: 'Не задан GitHub-токен (передайте token или настройте GITHUB_TOKEN)' });
  }

  try {
    const files = JSON.parse(row.files_json || '[]');
    const pushed = await pushFiles({
      repo,
      branch: branch || 'main',
      files,
      token: ghToken,
      message: `diptype: ${row.title}`,
    });
    res.json({ pushed });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
