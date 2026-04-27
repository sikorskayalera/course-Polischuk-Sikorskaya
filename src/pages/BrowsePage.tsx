import { Play, Clock, BookOpen } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { EmptyState, Spinner } from '../components/ui';
import { useStories } from '../hooks/useStories';

export function BrowsePage() {
  const { stories, loading } = useStories();

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-16 max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Каталог квестів</h1>
          <p className="text-slate-400">
            {loading ? '' : `${stories.length} ${pluralStory(stories.length)} доступно`}
          </p>
        </header>

        {loading ? (
          <Spinner />
        ) : stories.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Квестів ще немає"
            subtitle="Будьте першим — відкрийте студію та створіть свій!"
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StoryCard({ story }: { story: import('../lib/types').Story }) {
  const date = new Date(story.created_at).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <a
      href={`#/play?id=${story.id}`}
      className="group flex flex-col p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-violet-500/30 transition-all hover:shadow-lg hover:shadow-violet-500/5"
    >
      <div className="flex-1 mb-4">
        <h3 className="text-white font-semibold mb-2 group-hover:text-violet-400 transition-colors line-clamp-1">
          {story.title}
        </h3>
        <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed">
          {story.description || 'Опис відсутній'}
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-800">
        <span className="flex items-center gap-1.5 text-slate-500 text-xs">
          <Clock className="w-3.5 h-3.5" />
          {date}
        </span>
        <span className="inline-flex items-center gap-1 text-violet-400 text-sm font-medium">
          <Play className="w-3.5 h-3.5" />
          Грати
        </span>
      </div>
    </a>
  );
}

function pluralStory(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'квест';
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'квести';
  return 'квестів';
}
