import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { HomePage } from './pages/HomePage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { BrowsePage } from './pages/BrowsePage';
import { StudioListPage } from './pages/StudioListPage';
import { StudioPage } from './pages/StudioPage';
import { PlayerPage } from './pages/PlayerPage';

function Router() {
  const { loading } = useAuth();
  const [route, setRoute] = useState(window.location.hash.slice(1) || '/');

  useEffect(() => {
    const sync = () => setRoute(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const path = route.split('?')[0];
  const params = new URLSearchParams(route.split('?')[1] ?? '');

  if (path === '/studio' && params.get('id')) return <StudioPage storyId={params.get('id')!} />;
  if (path === '/play' && params.get('id')) return <PlayerPage storyId={params.get('id')!} />;
  if (path === '/studio') return <StudioListPage />;
  if (path === '/browse') return <BrowsePage />;
  if (path === '/login') return <LoginPage />;
  if (path === '/register') return <RegisterPage />;
  return <HomePage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
