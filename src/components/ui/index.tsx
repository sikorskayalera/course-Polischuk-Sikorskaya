import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

// ---- Button ----

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  className = '',
  ...rest
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-colors disabled:opacity-50';
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm' };
  const variants = {
    primary: 'bg-violet-500 text-white hover:bg-violet-400',
    secondary: 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700',
    ghost: 'text-slate-400 hover:text-white hover:bg-slate-800',
    danger: 'text-red-400 hover:text-white hover:bg-red-500/20',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}

// ---- Input ----

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...rest }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300">{label}</label>
      )}
      <input
        className={`w-full px-4 py-2.5 rounded-lg bg-slate-800 border ${
          error ? 'border-red-500/50' : 'border-slate-700'
        } text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 ${className}`}
        {...rest}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ---- Textarea ----

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className = '', ...rest }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300">{label}</label>
      )}
      <textarea
        className={`w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 resize-none ${className}`}
        {...rest}
      />
    </div>
  );
}

// ---- Card ----

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`p-5 rounded-2xl bg-slate-900/50 border border-slate-800 ${className}`}>
      {children}
    </div>
  );
}

// ---- Badge ----

type BadgeColor = 'green' | 'amber' | 'red' | 'violet' | 'slate';

export function Badge({ children, color = 'slate' }: { children: ReactNode; color?: BadgeColor }) {
  const colors: Record<BadgeColor, string> = {
    green: 'bg-emerald-500/15 text-emerald-400',
    amber: 'bg-amber-500/15 text-amber-400',
    red: 'bg-red-500/15 text-red-400',
    violet: 'bg-violet-500/15 text-violet-400',
    slate: 'bg-slate-700 text-slate-300',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${colors[color]}`}>
      {children}
    </span>
  );
}

// ---- Modal ----

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="text-xl font-bold text-white mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

// ---- Empty state ----

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center py-20">
      <Icon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
      <p className="text-slate-400 text-lg mb-1">{title}</p>
      {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
    </div>
  );
}

// ---- Spinner ----

export function Spinner({ text = 'Завантаження...' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-500">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm animate-pulse">{text}</span>
    </div>
  );
}
