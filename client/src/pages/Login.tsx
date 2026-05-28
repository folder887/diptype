import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import ShaderBackground from '../components/ShaderBackground';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative grid min-h-[calc(100vh-64px)] place-items-center px-5 py-16">
      <div className="absolute inset-0 -z-10 opacity-60">
        <ShaderBackground className="h-full w-full" />
        <div className="absolute inset-0 bg-white/60" />
      </div>

      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-extrabold text-slate-900">С возвращением 👋</h1>
        <p className="mt-1 text-sm text-slate-500">Войдите, чтобы продолжить работу над дипломом.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Пароль</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Входим…' : 'Войти'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Нет аккаунта?{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
