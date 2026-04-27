import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Button, Spinner } from '../components/ui';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import type { Story, Node, Edge } from '../lib/types';

interface PlayerProps {
  storyId: string;
}

export function PlayerPage({ storyId }: PlayerProps) {
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [currentNode, setCurrentNode] = useState<Node | null>(null);
  const [choices, setChoices] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [ended, setEnded] = useState(false);
  // track visited nodes for breadcrumb-style history count
  const [stepCount, setStepCount] = useState(0);

  useEffect(() => {
    async function init() {
      const storyData = await api.getStory(storyId);
      setStory(storyData);

      let startNodeId: string | null = null;

      // try to restore saved progress
      if (user) {
        const save = await api.getSave(storyId);
        if (save?.current_node_id) startNodeId = save.current_node_id;
      }

      if (!startNodeId) {
        const startData = await api.getStartNode(storyId);
        if (startData.node) startNodeId = startData.node.id;
      }

      if (startNodeId) {
        const playData = await api.playNode(startNodeId);
        if (playData.node) {
          setCurrentNode(playData.node);
          setChoices(playData.choices ?? []);
          setEnded(playData.node.is_end_node);
        }
      }
      setLoading(false);
    }
    init();
  }, [storyId, user]);

  const handleChoice = async (edge: Edge) => {
    setTransitioning(true);
    const playData = await api.playNode(edge.to_node_id);
    if (playData.node) {
      setCurrentNode(playData.node);
      setChoices(playData.choices ?? []);
      setEnded(playData.node.is_end_node);
      setStepCount((prev) => prev + 1);

      if (user) {
        await api.saveProgress({ story_id: storyId, current_node_id: playData.node.id });
      }
    }
    setTransitioning(false);
  };

  const handleRestart = async () => {
    setLoading(true);
    setEnded(false);
    setStepCount(0);
    const startData = await api.getStartNode(storyId);
    if (startData.node) {
      setCurrentNode(startData.node);
      setChoices(startData.choices ?? []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Spinner text="Завантаження квесту..." />
      </div>
    );
  }

  if (!story || !currentNode) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <main className="pt-16 max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-white text-xl font-semibold mb-2">Квест не вдалося завантажити</p>
          <p className="text-slate-400 text-sm mb-6">
            Автор ще не встановив початкову сцену. Спробуйте інший квест.
          </p>
          <Button variant="secondary" as="a" href="#/browse">
            До каталогу
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-16 max-w-2xl mx-auto px-4 sm:px-6 py-12">

        {/* Story header */}
        <div className="mb-8">
          <a
            href="#/browse"
            className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
          >
            ← Каталог
          </a>
          <h1 className="text-2xl font-bold text-white mt-2">{story.title}</h1>
          {story.description && (
            <p className="text-slate-400 text-sm mt-1">{story.description}</p>
          )}
          {stepCount > 0 && (
            <p className="text-slate-600 text-xs mt-2">Крок {stepCount + 1}</p>
          )}
        </div>

        {/* Scene */}
        <div className={`transition-opacity duration-300 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/50 border border-slate-800 mb-6">
            {currentNode.image_url && (
              <img
                src={currentNode.image_url}
                alt=""
                className="w-full rounded-xl mb-6 object-cover max-h-64"
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
              />
            )}
            <p className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap">
              {currentNode.text_content}
            </p>
          </div>

          {/* Ended */}
          {ended && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium mb-6">
                <CheckCircle className="w-4 h-4" />
                Кінець квесту
              </div>
              {stepCount > 0 && (
                <p className="text-slate-500 text-sm mb-6">
                  Пройдено {stepCount} {stepCount === 1 ? 'крок' : 'кроків'}
                </p>
              )}
              <div className="flex gap-3 justify-center flex-wrap">
                <Button onClick={handleRestart}>
                  <RotateCcw className="w-4 h-4" />
                  Грати знову
                </Button>
                <Button variant="secondary" as="a" href="#/browse">
                  Інші квести
                </Button>
              </div>
            </div>
          )}

          {/* Choices */}
          {!ended && choices.length > 0 && (
            <div className="space-y-3">
              {choices.map((edge) => (
                <button
                  key={edge.id}
                  onClick={() => handleChoice(edge)}
                  disabled={transitioning}
                  className="w-full text-left p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-200 group-hover:text-violet-300 transition-colors">
                      {edge.choice_text}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Dead end */}
          {!ended && choices.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm mb-4">
                Ця сцена не має виборів. Схоже, квест незавершений.
              </p>
              <Button variant="secondary" onClick={handleRestart}>
                <RotateCcw className="w-4 h-4" />
                Почати спочатку
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
