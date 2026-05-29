import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, PublicUser, TonCheckout } from '../api';
import { useAuth } from '../auth/AuthContext';
import Reveal from './Reveal';

interface Plan {
  key: string;
  price: string;
  period: string;
  badge?: string;
  highlight?: boolean;
  note: string;
}

const PLANS: Plan[] = [
  { key: 'free', price: '0 ₽', period: 'навсегда', note: '3 бесплатных диплома' },
  { key: 'monthly_rub', price: '4 990 ₽', period: 'в месяц', note: 'Полный доступ', highlight: true, badge: 'Популярно' },
  { key: 'yearly_rub', price: '29 990 ₽', period: 'в год', note: 'Выгодно — 2 месяца в подарок', badge: 'Выгодно' },
];

const PRO_FEATURES = [
  'Безлимит дипломных работ',
  'Презентации по дипломной работе',
  'Сайт-визитка по дипломной работе',
  'Защитная речь к диплому',
  'Загрузка результатов в GitHub',
  'Приоритетная генерация',
];

type Method = 'yoomoney' | 'ton';

export default function Pricing() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [method, setMethod] = useState<Method>('yoomoney');
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [ton, setTon] = useState<TonCheckout | null>(null);

  const choose = async (key: string) => {
    setMsg(null);
    if (key === 'free') {
      navigate(user ? '/dashboard' : '/register');
      return;
    }
    if (!user) {
      navigate('/register');
      return;
    }
    setBusy(key);
    try {
      const res = await api.checkout(key, method);
      if (method === 'ton') {
        setTon(res as TonCheckout);
        return;
      }
      if (res.confirmationUrl) {
        window.location.href = res.confirmationUrl;
        return;
      }
      if (res.user) setUser(res.user);
      setMsg(res.message || 'Подписка diptype Pro активирована!');
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-5 py-24">
      <Reveal>
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">Простые тарифы</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            Первые 3 запроса — бесплатно. Полный набор инструментов — по подписке diptype Pro.
          </p>
        </div>
      </Reveal>

      {/* Выбор способа оплаты */}
      <Reveal delay={0.05}>
        <div className="mx-auto mt-8 flex w-fit items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1">
          <button
            onClick={() => setMethod('yoomoney')}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
              method === 'yoomoney' ? 'bg-brand-600 text-white shadow-soft' : 'text-slate-600 hover:text-brand-700'
            }`}
          >
            💳 Банковская карта
          </button>
          <button
            onClick={() => setMethod('ton')}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
              method === 'ton' ? 'bg-brand-600 text-white shadow-soft' : 'text-slate-600 hover:text-brand-700'
            }`}
          >
            💎 Криптовалюта TON
          </button>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {PLANS.map((p, i) => (
          <Reveal key={p.key} delay={i * 0.05}>
            <div className={`card flex h-full flex-col ${p.highlight ? 'ring-2 ring-brand-500' : ''}`}>
              {p.badge && (
                <span className="mb-3 w-fit rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                  {p.badge}
                </span>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">{p.price}</span>
                <span className="text-sm text-slate-400">/ {p.period}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{p.note}</p>

              {p.key !== 'free' ? (
                <ul className="mt-5 space-y-2 text-sm text-slate-600">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-0.5 text-brand-600">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="mt-5 space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-brand-600">✓</span>3 дипломные работы</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-brand-600">✓</span>Прикрепление документов</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-slate-300">—</span>Презентации / сайты / речи</li>
                </ul>
              )}

              <button
                onClick={() => choose(p.key)}
                disabled={busy === p.key || (!!user?.isPro && p.key !== 'free')}
                className={`mt-6 ${p.highlight ? 'btn-primary' : 'btn-ghost'} w-full disabled:opacity-60`}
              >
                {busy === p.key
                  ? 'Оформление…'
                  : p.key === 'free'
                  ? 'Начать бесплатно'
                  : user?.isPro
                  ? 'Активно'
                  : method === 'ton'
                  ? 'Оплатить в TON'
                  : 'Оформить'}
              </button>
            </div>
          </Reveal>
        ))}
      </div>

      {msg && <p className="mt-6 text-center text-sm font-medium text-brand-700">{msg}</p>}

      {ton && (
        <TonModal
          data={ton}
          onClose={() => setTon(null)}
          onPaid={(u) => {
            setUser(u);
            setTon(null);
            setMsg('Оплата в TON подтверждена — подписка diptype Pro активна!');
          }}
        />
      )}
    </section>
  );
}

function TonModal({
  data,
  onClose,
  onPaid,
}: {
  data: TonCheckout;
  onClose: () => void;
  onPaid: (u: PublicUser) => void;
}) {
  const [checking, setChecking] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=${encodeURIComponent(
    data.tonLink || ''
  )}`;

  const copy = (text: string) => navigator.clipboard.writeText(text);

  const verify = async () => {
    if (!data.paymentId) return;
    setNote(null);
    setChecking(true);
    try {
      const res = await api.tonVerify(data.paymentId);
      if (res.paid && res.user) onPaid(res.user);
      else setNote(res.message || 'Перевод пока не найден.');
    } catch (e) {
      setNote((e as Error).message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">💎 Оплата в сети TON</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          {data.planLabel} · {data.amountRub?.toLocaleString('ru-RU')} ₽
        </p>

        <div className="mt-4 grid place-items-center rounded-xl bg-slate-50 p-4">
          <img src={qr} alt="TON QR" width={200} height={200} className="rounded-lg bg-white p-2" />
          <div className="mt-3 text-center">
            <div className="text-2xl font-extrabold text-brand-700">{data.amountTon} TON</div>
            <div className="text-xs text-slate-400">≈ {data.amountRub?.toLocaleString('ru-RU')} ₽ · курс {data.rubPerTon} ₽/TON</div>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <Field label="Адрес кошелька" value={data.address || ''} onCopy={copy} mono />
          <Field label="Комментарий (обязательно!)" value={data.comment || ''} onCopy={copy} mono />
        </div>

        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Укажите комментарий к переводу — по нему мы определим ваш платёж.
        </p>

        <a href={data.tonkeeperLink} target="_blank" rel="noreferrer" className="btn-primary mt-4 w-full">
          Открыть в Tonkeeper
        </a>
        <a href={data.tonhubLink} target="_blank" rel="noreferrer" className="mt-2 block text-center text-xs text-brand-600 hover:underline">
          или открыть в Tonhub
        </a>

        <button onClick={verify} disabled={checking} className="btn-ghost mt-4 w-full disabled:opacity-60">
          {checking ? 'Проверяем перевод…' : 'Я оплатил — проверить'}
        </button>
        {note && <p className="mt-2 text-center text-sm text-slate-500">{note}</p>}
        {data.demo && (
          <p className="mt-2 text-center text-xs text-amber-600">
            Demo-режим: проверка подтвердит оплату без реальной транзакции.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onCopy,
  mono,
}: {
  label: string;
  value: string;
  onCopy: (v: string) => void;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-slate-500">{label}</div>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <span className={`flex-1 truncate ${mono ? 'font-mono text-xs' : ''} text-slate-800`}>{value}</span>
        <button onClick={() => onCopy(value)} className="shrink-0 text-brand-600 hover:text-brand-800" title="Копировать">
          ⧉
        </button>
      </div>
    </div>
  );
}
