/**
 * Сервис генерации через Anthropic API.
 * Без ANTHROPIC_API_KEY работает в demo-режиме и возвращает осмысленную заглушку,
 * чтобы продукт можно было полностью прокликать локально.
 */
let Anthropic = null;
try {
  Anthropic = require('@anthropic-ai/sdk');
} catch (_) {
  /* SDK может быть не установлен в demo-окружении */
}

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';
const KEY = process.env.ANTHROPIC_API_KEY;

const client = KEY && Anthropic ? new Anthropic({ apiKey: KEY }) : null;

const KIND_LABEL = {
  diploma: 'дипломную работу',
  presentation: 'презентацию по дипломной работе',
  website: 'сайт-визитку по дипломной работе',
  speech: 'защитную речь к дипломной работе',
};

const SYSTEM_PROMPT = `Ты — академический ассистент сервиса diptype. Ты помогаешь студентам готовить материалы дипломной работы по их теме и приложенным материалам.
Всегда отвечай СТРОГО валидным JSON без markdown-ограждений вида:
{
  "title": "Короткий заголовок результата",
  "files": [
    { "path": "относительный/путь.ext", "content": "полное содержимое файла" }
  ]
}
Не добавляй никакого текста вне JSON. Пиши на русском языке, академическим стилем, с корректной структурой и оформлением.`;

function buildUserPrompt(kind, prompt, attachments) {
  const what = KIND_LABEL[kind] || KIND_LABEL.diploma;
  let text = `Сгенерируй ${what}.\n\nЗапрос пользователя:\n${prompt || '(не указан)'}\n`;
  if (attachments && attachments.length) {
    text += `\nПриложенные материалы:\n`;
    for (const a of attachments) {
      const excerpt = (a.text || '').slice(0, 8000);
      text += `\n=== Файл: ${a.name} ===\n${excerpt}\n`;
    }
  }
  text += `\nВерни результат как набор файлов в указанном JSON-формате.`;
  return text;
}

function demoResult(kind, prompt) {
  const topic = (prompt || 'Тема дипломной работы').split('\n')[0].slice(0, 120);
  const stamp = new Date().toLocaleString('ru-RU');
  const base = {
    diploma: {
      title: `Дипломная работа: ${topic}`,
      files: [
        {
          path: 'diploma.md',
          content: `# ${topic}\n\n> Сгенерировано diptype (demo-режим) ${stamp}\n\n## Введение\nАктуальность темы «${topic}» обусловлена...\n\n## Глава 1. Теоретические основы\n...\n\n## Глава 2. Анализ\n...\n\n## Глава 3. Практическая часть\n...\n\n## Заключение\nВ ходе работы были решены поставленные задачи...\n\n## Список литературы\n1. ...\n`,
        },
      ],
    },
    presentation: {
      title: `Презентация: ${topic}`,
      files: [
        {
          path: 'presentation.md',
          content: `---\n# ${topic}\nЗащита дипломной работы\n---\n## Цель и задачи\n- Цель: ...\n- Задачи: ...\n---\n## Актуальность\n...\n---\n## Результаты\n...\n---\n## Выводы\nСпасибо за внимание!\n`,
        },
      ],
    },
    website: {
      title: `Сайт: ${topic}`,
      files: [
        {
          path: 'index.html',
          content: `<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8"/>\n<meta name="viewport" content="width=device-width, initial-scale=1"/>\n<title>${topic}</title>\n<style>body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#0f172a}header{background:#2563eb;color:#fff;padding:64px 24px;text-align:center}main{max-width:820px;margin:0 auto;padding:32px 24px;line-height:1.7}</style>\n</head>\n<body>\n<header><h1>${topic}</h1><p>Дипломная работа</p></header>\n<main>\n<h2>О работе</h2>\n<p>...</p>\n<h2>Результаты</h2>\n<p>...</p>\n</main>\n</body>\n</html>\n`,
        },
      ],
    },
    speech: {
      title: `Речь к защите: ${topic}`,
      files: [
        {
          path: 'speech.md',
          content: `# Защитная речь\n\nУважаемые члены комиссии! Вашему вниманию представляется дипломная работа на тему «${topic}».\n\nАктуальность темы заключается в...\n\nЦель работы — ...\n\nДля достижения цели были поставлены задачи: ...\n\nВ результате исследования получены следующие выводы: ...\n\nДоклад окончен. Благодарю за внимание!\n`,
        },
      ],
    },
  };
  return base[kind] || base.diploma;
}

async function generate({ kind, prompt, attachments }) {
  if (!client) {
    return { ...demoResult(kind, prompt), demo: true };
  }

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(kind, prompt, attachments) }],
  });

  const raw = (message.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  const jsonText = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed.files)) throw new Error('no files');
    return { title: parsed.title || KIND_LABEL[kind], files: parsed.files, demo: false };
  } catch (_) {
    // Если модель вернула не-JSON — сохраняем как один файл.
    return {
      title: KIND_LABEL[kind] || 'Результат',
      files: [{ path: `${kind}.md`, content: raw }],
      demo: false,
    };
  }
}

module.exports = { generate, KIND_LABEL };
