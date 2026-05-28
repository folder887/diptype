import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-brand-700">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">d</span>
          <span className="text-lg tracking-tight">diptype</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          <a href="/#features" className="hover:text-brand-700">Возможности</a>
          <a href="/#how" className="hover:text-brand-700">Как это работает</a>
          <a href="/#pricing" className="hover:text-brand-700">Тарифы</a>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm font-semibold text-brand-700 hover:underline">
                Кабинет
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-brand-700 hover:underline">
                Войти
              </Link>
              <Link to="/register" className="btn-primary !px-4 !py-2 text-sm">
                Начать бесплатно
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
