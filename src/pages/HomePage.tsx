import { BookOpen, PenTool, Play, GitBranch, Shield, Zap } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';

export function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent" />
          <div className="absolute top-24 left-1/3 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-48 right-1/4 w-72 h-72 bg-fuchsia-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-28 sm:pt-40 pb-20 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-8">
              <GitBranch className="w-3.5 h-3.5" />
              Платформа розгалужених наративів
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.08] mb-6">
              Пиши та грай у<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400">
                інтерактивні квести
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Конструктор розгалужених сюжетів. Кожен вузол — нова сцена, кожне ребро — вибір гравця.
              Будуй, валідуй і публікуй без жодного рядка конфігурації.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#/browse"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-400 transition-all shadow-lg shadow-violet-500/25"
              >
                <Play className="w-5 h-5" />
                Переглянути квести
              </a>
              <a
                href="#/studio"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700 transition-all border border-slate-700"
              >
                <PenTool className="w-5 h-5" />
                Відкрити студію
              </a>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-28">
          <div className="grid sm:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition-colors">
                  <f.icon className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-slate-800 bg-slate-900/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
            <h2 className="text-2xl font-bold text-white text-center mb-12">Як це працює</h2>
            <div className="grid sm:grid-cols-3 gap-8">
              {steps.map((s, i) => (
                <div key={s.title} className="text-center">
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 text-violet-400 font-bold text-lg flex items-center justify-center mx-auto mb-4">
                    {i + 1}
                  </div>
                  <h4 className="text-white font-semibold mb-2">{s.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

const features = [
  {
    icon: PenTool,
    title: 'Редактор сцен',
    desc: 'Додавай текстові вузли, прикріплюй зображення та задавай теги початку й кінця прямо в інтерфейсі.',
  },
  {
    icon: GitBranch,
    title: 'Граф переходів',
    desc: 'Пов\'язуй сцени виборами. Кожен перехід — підписаний напрямок у орієнтованому графі твоєї розповіді.',
  },
  {
    icon: Shield,
    title: 'DFS-валідація',
    desc: 'Обхід у глибину виявляє ізольовані вузли, тупики та недосяжні гілки до публікації.',
  },
  {
    icon: Play,
    title: 'Режим плеєра',
    desc: 'Занурюйся в квест: читай текст, обирай шлях, а прогрес зберігається автоматично.',
  },
  {
    icon: BookOpen,
    title: 'Публічний каталог',
    desc: 'Усі опубліковані квести доступні всім авторизованим користувачам платформи.',
  },
  {
    icon: Zap,
    title: 'Збереження прогресу',
    desc: 'Система автозбереження дозволяє продовжити квест із точки де ти зупинився.',
  },
];

const steps = [
  { title: 'Реєструйся', desc: 'Створи акаунт і отримай доступ до особистої студії.' },
  { title: 'Будуй квест', desc: 'Додавай сцени, задавай вибори та перевіряй структуру через валідатор.' },
  { title: 'Грай та ділись', desc: 'Опублікований квест одразу з\'являється в загальному каталозі.' },
];
