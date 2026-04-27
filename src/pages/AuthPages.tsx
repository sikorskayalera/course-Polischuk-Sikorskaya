import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Button, Input } from '../components/ui';

// ---- Login ----

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      window.location.hash = '#/';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка входу');
    } finally {
      setLoading(false);
    }
  };

  return <AuthLayout title="З поверненням" subtitle="Увійдіть у свій акаунт">
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorAlert>{error}</ErrorAlert>}
      <Input
        label="Електронна пошта"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
      />
      <Input
        label="Пароль"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" loading={loading} className="w-full">
        Увійти
      </Button>
    </form>
    <p className="text-center text-slate-400 text-sm mt-6">
      Немає акаунту?{' '}
      <a href="#/register" className="text-violet-400 hover:text-violet-300">
        Зареєструватися
      </a>
    </p>
  </AuthLayout>;
}

// ---- Register ----

export function RegisterPage() {
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Пароль має містити щонайменше 6 символів');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, username);
      window.location.hash = '#/';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка реєстрації');
    } finally {
      setLoading(false);
    }
  };

  return <AuthLayout title="Створити акаунт" subtitle="Почніть писати власні квести">
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorAlert>{error}</ErrorAlert>}
      <Input
        label="Ім'я користувача"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        autoFocus
      />
      <Input
        label="Електронна пошта"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="Пароль (мін. 6 символів)"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
      />
      <Button type="submit" loading={loading} className="w-full">
        Зареєструватися
      </Button>
    </form>
    <p className="text-center text-slate-400 text-sm mt-6">
      Вже є акаунт?{' '}
      <a href="#/login" className="text-violet-400 hover:text-violet-300">
        Увійти
      </a>
    </p>
  </AuthLayout>;
}

// ---- Shared layout ----

function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <a href="#/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/30 transition-colors">
            <BookOpen className="w-4 h-4 text-violet-400" />
          </div>
          <span className="text-white font-semibold">NarrativeForge</span>
        </a>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
          <p className="text-slate-400 text-sm">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function ErrorAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
      {children}
    </div>
  );
}
