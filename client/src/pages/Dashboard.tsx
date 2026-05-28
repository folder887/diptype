import { useRef, useState } from 'react';
import { api, GenFile, PublicUser } from '../api';
import { useAuth } from '../auth/AuthContext';
import Pricing from '../components/Pricing';

type Kind = 'diploma' | 'presentation' | 'website' | 'speech';

const KINDS: { key: Kind; label: string; icon: string; pro: boolean }[] = [
  { key: 'diploma', label: 'Дипломная работа', icon: '📄', pro: false },
  { key: 'presentation', label: 'Презентация', icon: '📊', pro: true },
  { key: 'website', label: 'Сайт по диплому', icon: '🌐', pro: true },
  { key: 'speech', label: 'Речь к защите', icon: '🎤', pro: true },
];

function download(file: GenFile) {
  const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.path.split('/').pop() || 'file.txt';
  a.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<Kind>('diploma');
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needSub, setNeedSub] = useState(false);

  const [result, setResult] = useState<{ id: string; title: string; files: GenFile[]; demo: boolean } | null>(null);
  const [activeFile, setActiveFile] = useState(0);

  // GitHub push
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [ghToken, setGhToken] = useState('');
  const [ghMsg, setGhMsg] = useState<string | null>(null);
  const [ghBusy, setGhBusy] = useState(false);

  const u = user as PublicUser;
  const selected = KINDS.find((k) => k.key === kind)!;
  const lockedByPlan = selected.pro && !u.isPro;
  const freeExhausted = kind === 'diploma' && !u.isPro && u.freeRemaining <= 0;

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)].slice(0, 10));
  };

  const generate = async () => {
    setError(null);
    setNeedSub(false);
    if (!prompt.trim() && files.length === 0) {
      setError('Добавьте промпт или прикрепите документ.');
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append('kind', kind);
      form.append('prompt', prompt);
      files.forEach((f) => form.append('files', f));
      const res = await api.generate(form);
      setResult({ id: res.id, title: res.title, files: res.files, demo: res.demo });
      setActiveFile(0);
      setUser(res.user);
      setGhMsg(null);
    } catch (e) {
      const err = e as Error & { status?: number; data?: { requiresSubscription?: boolean } };
      setError(err.message);
      if (err.status === 402 || err.data?.requiresSubscription) setNeedSub(true);
    } finally {
      setBusy(false);
    }
  };

  const pushGithub = async () => {
    if (!result) return;
    setGhMsg(null);
    if (!repo.includes('/')) {
      setGhMsg('Укажите репозиторий в формате owner/name');
      return;
    }
    setGhBusy(true);
    try {
      const res = await api.pushToGithub(result.id, repo, branch, ghToken || undefined);
      setGhMsg(`Загружено файлов: ${res.pushed.length} ✓`);
    } catch (e) {
      setGhMsg((e as Error).message);
    } finally {
      setGhBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      {/* Шапка кабинета */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Привет, {u.name} 👋</h1>
          <p className="text-sm text-slate-500">Создавайте материалы для дипломной работы.</p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-brand-50 px-5 py-3 text-sm">
          {u.isPro ? (
            <span className="font-semibold text-brand-700">Подписка Pro активна</span>
          ) : (
            <span className="text-slate-600">
              Бесплатных дипломов осталось:{' '}
              <b className="text-brand-700">{u.freeRemaining}</b> из {u.freeLimit}
            </span>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Левая колонка — форма */}
        <div className="card">
          <h2 className="text-lg font-bold text-slate-900">Новый запрос</h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {KINDS.map((k) => (
              <button
                key={k.key}
                onClick={() => setKind(k.key)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${
                  kind === k.key
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:border-brand-300'
                }`}
              >
                <span className="text-xl">{k.icon}</span>
                <span className="flex-1">{k.label}</span>
                {k.pro && (
                  <span className="rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">PRO</span>
                )}
              </button>
            ))}
          </div>

          <label className="mt-5 mb-1 block text-sm font-medium text-slate-700">Промпт / описание темы</label>
          <textarea
            className="input min-h-[120px] resize-y"
            placeholder="Например: тема «Цифровизация малого бизнеса», 60 страниц, ГОСТ, сделай акцент на анализе рынка…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <label className="mt-4 mb-1 block text-sm font-medium text-slate-700">Документы (необязательно)</label>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
            className="cursor-pointer rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 transition hover:border-brand-300"
          >
            Перетащите файлы сюда или нажмите, чтобы выбрать
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
          </div>
          {files.length > 0 && (
            <ul className="mt-3 space-y-1">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                  <span className="truncate text-slate-700">{f.name}</span>
                  <button
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-slate-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            onClick={generate}
            disabled={busy || lockedByPlan || freeExhausted}
            className="btn-primary mt-5 w-full disabled:opacity-60"
          >
            {busy ? 'Генерируем…' : lockedByPlan ? 'Доступно по подписке Pro' : freeExhausted ? 'Лимит исчерпан' : 'Сгенерировать'}
          </button>
          {(lockedByPlan || freeExhausted) && (
            <p className="mt-2 text-center text-xs text-slate-500">
              Оформите подписку ниже, чтобы продолжить.
            </p>
          )}
        </div>

        {/* Правая колонка — результат */}
        <div className="card">
          <h2 className="text-lg font-bold text-slate-900">Результат</h2>
          {!result ? (
            <div className="mt-10 grid place-items-center text-center text-slate-400">
              <div className="text-5xl">📝</div>
              <p className="mt-3 text-sm">Здесь появятся сгенерированные файлы.</p>
            </div>
          ) : (
            <div className="mt-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-800">{result.title}</h3>
                {result.demo && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    demo
                  </span>
                )}
              </div>

              {result.files.length > 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.files.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveFile(i)}
                      className={`rounded-lg px-3 py-1 text-xs font-medium ${
                        activeFile === i ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {f.path}
                    </button>
                  ))}
                </div>
              )}

              <pre className="mt-3 max-h-[320px] overflow-auto rounded-xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
                {result.files[activeFile]?.content}
              </pre>

              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => download(result.files[activeFile])} className="btn-ghost !px-4 !py-2 text-sm">
                  ⬇ Скачать файл
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(result.files[activeFile]?.content || '')}
                  className="btn-ghost !px-4 !py-2 text-sm"
                >
                  ⧉ Копировать
                </button>
              </div>

              {/* GitHub push */}
              <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <h4 className="text-sm font-semibold text-slate-800">Загрузить в GitHub</h4>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input className="input !py-2 text-sm" placeholder="owner/repository" value={repo} onChange={(e) => setRepo(e.target.value)} />
                  <input className="input !py-2 text-sm" placeholder="branch (main)" value={branch} onChange={(e) => setBranch(e.target.value)} />
                </div>
                <input
                  className="input mt-2 !py-2 text-sm"
                  placeholder="GitHub token (опционально, если не задан на сервере)"
                  type="password"
                  value={ghToken}
                  onChange={(e) => setGhToken(e.target.value)}
                />
                <button onClick={pushGithub} disabled={ghBusy} className="btn-primary mt-3 w-full !py-2 text-sm disabled:opacity-60">
                  {ghBusy ? 'Загружаем…' : 'Push в репозиторий'}
                </button>
                {ghMsg && <p className="mt-2 text-xs font-medium text-brand-700">{ghMsg}</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Подписка — показываем при необходимости или всегда для free */}
      {(needSub || !u.isPro) && (
        <div className="mt-12">
          <Pricing />
        </div>
      )}
    </div>
  );
}
