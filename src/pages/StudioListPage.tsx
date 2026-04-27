import { useState } from 'react';
import { PenTool, Play, Trash2, Plus, LogIn, Edit3 } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Button, Card, EmptyState, Input, Modal, Spinner, Textarea } from '../components/ui';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { useStories } from '../hooks/useStories';
import type { Story } from '../lib/types';

export function StudioListPage() {
  const { user } = useAuth();
  const { stories: allStories, loading, reload } = useStories();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const myStories = user ? allStories.filter((s) => s.author_id === user.id) : [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      const story = await api.createStory({ title: title.trim(), description: description.trim() });
      if (story.id) {
        window.location.hash = `#/studio?id=${story.id}`;
      }
    } finally {
      setCreating(false);
      setShowCreate(false);
      setTitle('');
      setDescription('');
    }
  };

  const handleDelete = async (story: Story) => {
    if (!confirm(`Видалити «${story.title}»? Це незворотно.`)) return;
    setDeleting(story.id);
    try {
      await api.deleteStory(story.id);
      reload();
    } finally {
      setDeleting(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <main className="pt-16 max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
          <LogIn className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg mb-4">Увійдіть, щоб відкрити студію</p>
          <Button as="a" href="#/login">Увійти</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-16 max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Моя студія</h1>
            <p className="text-slate-400">
              {loading ? '' : `${myStories.length} ${myStories.length === 1 ? 'квест' : 'квестів'}`}
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            Новий квест
          </Button>
        </div>

        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Новий квест">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Назва"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              placeholder="Назва вашого квесту"
            />
            <Textarea
              label="Опис"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Короткий опис для каталогу"
            />
            <div className="flex gap-3 justify-end pt-1">
              <Button variant="ghost" type="button" onClick={() => setShowCreate(false)}>
                Скасувати
              </Button>
              <Button type="submit" loading={creating}>
                Створити
              </Button>
            </div>
          </form>
        </Modal>

        {loading ? (
          <Spinner />
        ) : myStories.length === 0 ? (
          <EmptyState
            icon={PenTool}
            title="У вас ще немає квестів"
            subtitle="Натисніть «Новий квест», щоб розпочати"
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {myStories.map((story) => (
              <StoryRow
                key={story.id}
                story={story}
                onDelete={() => handleDelete(story)}
                deleting={deleting === story.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StoryRow({
  story,
  onDelete,
  deleting,
}: {
  story: Story;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-white font-semibold line-clamp-1">{story.title}</h3>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="text-slate-600 hover:text-red-400 transition-colors p-1 flex-shrink-0 disabled:opacity-50"
          title="Видалити"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <p className="text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed flex-1">
        {story.description || 'Без опису'}
      </p>
      <div className="flex gap-2">
        <a
          href={`#/studio?id=${story.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 text-sm font-medium hover:bg-violet-500/20 transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Редагувати
        </a>
        <a
          href={`#/play?id=${story.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          <Play className="w-3.5 h-3.5" />
          Переглянути
        </a>
      </div>
    </Card>
  );
}
