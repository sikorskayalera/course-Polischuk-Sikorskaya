import { BookOpen, PenTool, Play, LogOut, LogIn, Home } from 'lucide-react';
import { useAuth } from '../../lib/auth';

interface NavProps {
  currentRoute?: string;
}

export function Navbar({ currentRoute }: NavProps) {
  const { user, signOut } = useAuth();
  const route = currentRoute ?? window.location.hash.slice(1) ?? '/';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="#/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/30 transition-colors">
            <BookOpen className="w-4 h-4 text-violet-400" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">NarrativeForge</span>
        </a>

        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink href="#/" active={route === '/'} icon={<Home className="w-4 h-4" />} label="Головна" />
          <NavLink href="#/browse" active={route.startsWith('/browse')} icon={<Play className="w-4 h-4" />} label="Каталог" />

          {user ? (
            <>
              <NavLink
                href="#/studio"
                active={route.startsWith('/studio')}
                icon={<PenTool className="w-4 h-4" />}
                label="Студія"
              />
              <button
                onClick={signOut}
                className="px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Вийти"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <a
              href="#/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-violet-500 text-white hover:bg-violet-400 transition-colors font-medium"
            >
              <LogIn className="w-3.5 h-3.5" />
              Увійти
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}

interface NavLinkProps {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}

function NavLink({ href, active, icon, label }: NavLinkProps) {
  return (
    <a
      href={href}
      className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5 ${
        active
          ? 'text-violet-400 bg-violet-500/10'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      <span className="sm:hidden">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
}
