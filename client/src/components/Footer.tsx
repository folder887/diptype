import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-4">
        <div>
          <div className="font-extrabold text-brand-700">diptype</div>
          <p className="mt-3 text-sm text-slate-500">
            Дипломные работы, презентации, сайты и речи к защите — в пару кликов.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-800">Продукт</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li><a href="/#features" className="hover:text-brand-700">Возможности</a></li>
            <li><a href="/#pricing" className="hover:text-brand-700">Тарифы</a></li>
            <li><Link to="/register" className="hover:text-brand-700">Регистрация</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-800">Помощь</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li><a href="/#how" className="hover:text-brand-700">Как это работает</a></li>
            <li><a href="mailto:support@diptype.app" className="hover:text-brand-700">Поддержка</a></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-800">Оплата</h4>
          <p className="text-sm text-slate-500">Безопасные платежи через YooMoney. Подписку можно отменить в любой момент.</p>
        </div>
      </div>
      <div className="border-t border-slate-100 py-5 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} diptype. Все права защищены.
      </div>
    </footer>
  );
}
