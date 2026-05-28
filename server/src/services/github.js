/**
 * Загрузка сгенерированных файлов в GitHub-репозиторий пользователя.
 * Использует GITHUB_TOKEN (или токен, переданный в запросе).
 * Реализует часть системы работы diptype: «нейро загружает все созданные файлы в репо».
 */

async function ghRequest(token, method, url, body) {
  const res = await fetch(`https://api.github.com${url}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'diptype',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/**
 * @param {string} repo "owner/name"
 * @param {string} branch
 * @param {Array<{path:string, content:string}>} files
 * @param {string} token
 */
async function pushFiles({ repo, branch = 'main', files, token, message }) {
  if (!token) throw new Error('GitHub-токен не задан');
  if (!repo || !repo.includes('/')) throw new Error('Укажите репозиторий в формате owner/name');

  const results = [];
  for (const file of files) {
    // Узнаём текущий sha файла (если уже существует), чтобы обновить.
    const getRes = await ghRequest(
      token,
      'GET',
      `/repos/${repo}/contents/${encodeURIComponent(file.path)}?ref=${encodeURIComponent(branch)}`
    );
    const sha = getRes.ok ? getRes.data.sha : undefined;

    const putRes = await ghRequest(token, 'PUT', `/repos/${repo}/contents/${encodeURIComponent(file.path)}`, {
      message: message || `diptype: ${file.path}`,
      content: Buffer.from(file.content, 'utf8').toString('base64'),
      branch,
      sha,
    });

    if (!putRes.ok) {
      throw new Error(`Не удалось загрузить ${file.path}: ${putRes.data.message || putRes.status}`);
    }
    results.push({ path: file.path, url: putRes.data.content?.html_url });
  }
  return results;
}

module.exports = { pushFiles };
