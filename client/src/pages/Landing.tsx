import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ComponentType, SVGProps } from 'react';
import ShaderBackground from '../components/ShaderBackground';
import Reveal from '../components/Reveal';
import Pricing from '../components/Pricing';
import { useAuth } from '../auth/AuthContext';
import { DocumentIcon, ChartIcon, GlobeIcon, MicIcon, SparkIcon } from '../components/icons';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const FEATURES: { Icon: Icon; title: string; text: string }[] = [
  { Icon: DocumentIcon, title: 'Дипломная работа', text: 'Структурированный текст по вашей теме и материалам — введение, главы, заключение, список литературы.' },
  { Icon: ChartIcon, title: 'Презентация', text: 'Готовые слайды для защиты на основе вашей дипломной работы.' },
  { Icon: GlobeIcon, title: 'Сайт по диплому', text: 'Аккуратный сайт-визитка, который наглядно представляет вашу работу.' },
  { Icon: MicIcon, title: 'Речь к защите', text: 'Чёткая защитная речь с акцентами на цель, задачи и результаты.' },
];

const STEPS = [
  { n: '01', title: 'Зарегистрируйтесь', text: 'Создайте аккаунт за минуту — первые 3 запроса бесплатны.' },
  { n: '02', title: 'Прикрепите материалы', text: 'Загрузите документы и опишите тему в свободном промпте.' },
  { n: '03', title: 'Получите результат', text: 'ИИ обрабатывает запрос через Anthropic API и формирует готовые файлы.' },
  { n: '04', title: 'Выгрузите в GitHub', text: 'Одним кликом загрузите все созданные файлы в свой репозиторий.' },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <ShaderBackground className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/10 to-white" />
        </div>

        <div className="mx-auto max-w-5xl px-5 py-28 text-center md:py-36">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white/70 px-4 py-1.5 text-sm font-medium text-brand-700 backdrop-blur"
          >
            <SparkIcon className="h-4 w-4" />
            Дипломные работы с помощью ИИ
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl"
          >
            Написание дипломных работ{' '}
            <span className="bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
              в пару кликов
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-slate-600"
          >
            Прикрепите документы, опишите тему — и получите дипломную работу, презентацию,
            сайт и речь к защите. Первые 3 запроса бесплатны.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link to={user ? '/dashboard' : '/register'} className="btn-primary text-base">
              {user ? 'Перейти в кабинет' : 'Попробовать бесплатно'}
            </Link>
            <a href="#how" className="btn-ghost text-base">
              Как это работает
            </a>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-24">
        <Reveal>
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Всё для защиты в одном месте
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-500">
              diptype создаёт не только текст диплома, но и все сопутствующие материалы.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.07}>
              <div className="card h-full transition hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <f.Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-brand-50/50 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                Как это работает
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-500">
                Четыре шага от идеи до готовых файлов в вашем репозитории.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.07}>
                <div className="card h-full">
                  <div className="text-3xl font-extrabold text-brand-200">{s.n}</div>
                  <h3 className="mt-3 text-lg font-bold text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <Pricing />

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-brand-700 px-8 py-16 text-center text-white shadow-soft">
            <div className="absolute inset-0 -z-0 opacity-30">
              <ShaderBackground className="h-full w-full" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl font-extrabold md:text-4xl">Готовы защититься на отлично?</h2>
              <p className="mx-auto mt-3 max-w-xl text-brand-100">
                Начните бесплатно — первые 3 дипломные работы за наш счёт.
              </p>
              <Link
                to={user ? '/dashboard' : '/register'}
                className="mt-8 inline-flex rounded-xl bg-white px-7 py-3 font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                {user ? 'Перейти в кабинет' : 'Создать аккаунт'}
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
