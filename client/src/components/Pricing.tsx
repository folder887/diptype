import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
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
  { key: 'free', price: '0 ₽', period: 'навсегда', note: '3 бесплатных диплома', },
  { key: 'monthly_usd', price: '$49', period: 'в месяц', note: 'Оплата в долларах', highlight: true, badge: 'Популярно' },
  { key: 'monthly_rub', price: '4 990 ₽', period: 'в месяц', note: 'Оплата в рублях' },
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

export default function Pricing() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

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
      const res = await api.checkout(key);
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

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p, i) => (
          <Reveal key={p.key} delay={i * 0.05}>
            <div
              className={`card flex h-full flex-col ${
                p.highlight ? 'ring-2 ring-brand-500' : ''
              }`}
            >
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

              {p.key !== 'free' && (
                <ul className="mt-5 space-y-2 text-sm text-slate-600">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-0.5 text-brand-600">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              )}
              {p.key === 'free' && (
                <ul className="mt-5 space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-brand-600">✓</span>3 дипломные работы</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-brand-600">✓</span>Прикрепление документов</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-slate-300">—</span>Презентации / сайты / речи</li>
                </ul>
              )}

              <button
                onClick={() => choose(p.key)}
                disabled={busy === p.key || (user?.isPro && p.key !== 'free')}
                className={`mt-6 ${p.highlight ? 'btn-primary' : 'btn-ghost'} w-full disabled:opacity-60`}
              >
                {busy === p.key
                  ? 'Переход к оплате…'
                  : p.key === 'free'
                  ? 'Начать бесплатно'
                  : user?.isPro
                  ? 'Активно'
                  : 'Оформить'}
              </button>
            </div>
          </Reveal>
        ))}
      </div>

      {msg && <p className="mt-6 text-center text-sm font-medium text-brand-700">{msg}</p>}
    </section>
  );
}
