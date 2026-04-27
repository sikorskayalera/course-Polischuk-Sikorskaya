import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, ArrowRight, ChevronLeft,
  CheckCircle, XCircle, AlertTriangle, LogIn,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Button, Badge, Spinner, Textarea, Input } from '../components/ui';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import type { Story, Node, Edge, ValidationResult } from '../lib/types';

interface StudioProps {
  storyId: string;
}

export function StudioPage({ storyId }: StudioProps) {
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);

  // node form
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showNodeForm, setShowNodeForm] = useState(false);
  const [nodeText, setNodeText] = useState('');
  const [nodeImage, setNodeImage] = useState('');
  const [nodeIsStart, setNodeIsStart] = useState(false);
  const [nodeIsEnd, setNodeIsEnd] = useState(false);

  // edge form
  const [showEdgeForm, setShowEdgeForm] = useState(false);
  const [edgeFrom, setEdgeFrom] = useState('');
  const [edgeTo, setEdgeTo] = useState('');
  const [edgeChoice, setEdgeChoice] = useState('');

  // validation
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  const loadData = useCallback(async () => {
    const [storyData, nodesData, edgesData] = await Promise.all([
      api.getStory(storyId),
      api.getNodes(storyId),
      api.getEdges(storyId),
    ]);
    setStory(storyData);
    setNodes(Array.isArray(nodesData) ? nodesData : []);
    setEdges(Array.isArray(edgesData) ? edgesData : []);
    setLoading(false);
  }, [storyId]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ---------- node actions ---------- */

  const resetNodeForm = () => {
    setSelectedNode(null);
    setShowNodeForm(false);
    setNodeText('');
    setNodeImage('');
    setNodeIsStart(false);
    setNodeIsEnd(false);
  };

  const openNewNode = () => {
    resetNodeForm();
    setShowNodeForm(true);
  };

  const openEditNode = (node: Node) => {
    setSelectedNode(node);
    setShowNodeForm(true);
    setNodeText(node.text_content);
    setNodeImage(node.image_url || '');
    setNodeIsStart(node.is_start_node);
    setNodeIsEnd(node.is_end_node);
  };

  const handleSaveNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeText.trim()) return;

    const payload = {
      text_content: nodeText.trim(),
      image_url: nodeImage.trim(),
      is_start_node: nodeIsStart,
      is_end_node: nodeIsEnd,
    };

    if (selectedNode) {
      const result = await api.updateNode(selectedNode.id, payload);
      if (result.id) setNodes((prev) => prev.map((n) => (n.id === result.id ? result : n)));
    } else {
      const result = await api.createNode(storyId, payload);
      if (result.id) setNodes((prev) => [...prev, result]);
    }
    resetNodeForm();
  };

  const handleDeleteNode = async (id: string) => {
    if (!confirm('Видалити сцену разом із усіма її переходами?')) return;
    await api.deleteNode(id);
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.from_node_id !== id && e.to_node_id !== id));
    if (selectedNode?.id === id) resetNodeForm();
  };

  /* ---------- edge actions ---------- */

  const resetEdgeForm = () => {
    setShowEdgeForm(false);
    setEdgeFrom('');
    setEdgeTo('');
    setEdgeChoice('');
  };

  const handleCreateEdge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edgeFrom || !edgeTo || !edgeChoice.trim()) return;
    const result = await api.createEdge({ from_node_id: edgeFrom, to_node_id: edgeTo, choice_text: edgeChoice.trim() });
    if (result.id) {
      setEdges((prev) => [...prev, result]);
      resetEdgeForm();
    }
  };

  const handleDeleteEdge = async (id: string) => {
    await api.deleteEdge(id);
    setEdges((prev) => prev.filter((e) => e.id !== id));
  };

  /* ---------- validation ---------- */

  const handleValidate = async () => {
    setValidating(true);
    const result = await api.validateStory(storyId);
    setValidation(result);
    setValidating(false);
  };

  /* ---------- guards ---------- */

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <LogIn className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Увійдіть, щоб використовувати студію</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Spinner text="Завантаження квесту..." />
      </div>
    );
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n.text_content.slice(0, 45)]));

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-16 max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <a href="#/studio" className="text-slate-500 hover:text-slate-300 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </a>
          <div>
            <h1 className="text-2xl font-bold text-white">{story?.title}</h1>
            {story?.description && (
              <p className="text-slate-400 text-sm mt-0.5">{story.description}</p>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left: Node list + validation */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                Сцени <span className="text-slate-500 font-normal">({nodes.length})</span>
              </h2>
              <Button size="sm" onClick={openNewNode}>
                <Plus className="w-3.5 h-3.5" />
                Додати
              </Button>
            </div>

            {/* Node list */}
            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-0.5">
              {nodes.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-8">
                  Сцен ще немає — додайте першу!
                </p>
              )}
              {nodes.map((node) => (
                <div
                  key={node.id}
                  onClick={() => openEditNode(node)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedNode?.id === node.id
                      ? 'bg-violet-500/10 border-violet-500/30'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                        {node.is_start_node && <Badge color="green">СТАРТ</Badge>}
                        {node.is_end_node && <Badge color="amber">КІНЕЦЬ</Badge>}
                      </div>
                      <p className="text-slate-300 text-sm line-clamp-2 leading-relaxed">
                        {node.text_content}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }}
                      className="text-slate-600 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Validate */}
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleValidate}
              loading={validating}
            >
              Перевірити структуру (DFS)
            </Button>

            {validation && <ValidationPanel result={validation} />}
          </div>

          {/* Right: forms */}
          <div className="lg:col-span-2 space-y-6">

            {/* Node form */}
            {showNodeForm && (
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                <h3 className="text-white font-semibold mb-4">
                  {selectedNode ? 'Редагувати сцену' : 'Нова сцена'}
                </h3>
                <form onSubmit={handleSaveNode} className="space-y-4">
                  <Textarea
                    label="Текст сцени"
                    value={nodeText}
                    onChange={(e) => setNodeText(e.target.value)}
                    rows={5}
                    required
                    placeholder="Що бачить та читає гравець у цій сцені..."
                  />
                  <Input
                    label="URL зображення (необов'язково)"
                    value={nodeImage}
                    onChange={(e) => setNodeImage(e.target.value)}
                    placeholder="https://..."
                    type="url"
                  />
                  <div className="flex gap-6">
                    <CheckboxField
                      checked={nodeIsStart}
                      onChange={setNodeIsStart}
                      label="Початкова сцена"
                    />
                    <CheckboxField
                      checked={nodeIsEnd}
                      onChange={setNodeIsEnd}
                      label="Фінальна сцена"
                    />
                  </div>
                  <div className="flex gap-3 justify-end pt-1">
                    <Button variant="ghost" type="button" onClick={resetNodeForm}>
                      Скасувати
                    </Button>
                    <Button type="submit">
                      {selectedNode ? 'Зберегти' : 'Створити'}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Edges */}
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">
                  Переходи <span className="text-slate-500 font-normal">({edges.length})</span>
                </h3>
                {nodes.length >= 2 && !showEdgeForm && (
                  <Button size="sm" onClick={() => setShowEdgeForm(true)}>
                    <Plus className="w-3.5 h-3.5" />
                    Додати перехід
                  </Button>
                )}
              </div>

              {/* Edge form */}
              {showEdgeForm && (
                <form onSubmit={handleCreateEdge} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 mb-4 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Зі сцени
                      </label>
                      <NodeSelect value={edgeFrom} onChange={setEdgeFrom} nodes={nodes} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        На сцену
                      </label>
                      <NodeSelect value={edgeTo} onChange={setEdgeTo} nodes={nodes} />
                    </div>
                  </div>
                  <Input
                    label="Текст вибору"
                    value={edgeChoice}
                    onChange={(e) => setEdgeChoice(e.target.value)}
                    placeholder="Що гравець бачить як варіант дії..."
                    required
                  />
                  <div className="flex gap-3 justify-end">
                    <Button size="sm" variant="ghost" type="button" onClick={resetEdgeForm}>
                      Скасувати
                    </Button>
                    <Button size="sm" type="submit">
                      Додати
                    </Button>
                  </div>
                </form>
              )}

              {/* Edge list */}
              <div className="space-y-2">
                {edges.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">
                    Переходів ще немає
                  </p>
                ) : (
                  edges.map((edge) => (
                    <div
                      key={edge.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-800"
                    >
                      <div className="flex-1 min-w-0 flex items-center gap-2 text-sm">
                        <span className="text-slate-300 truncate">{nodeMap.get(edge.from_node_id) ?? '—'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                        <span className="text-slate-300 truncate">{nodeMap.get(edge.to_node_id) ?? '—'}</span>
                      </div>
                      <span className="text-violet-400 text-xs font-medium px-2 py-1 rounded bg-violet-500/10 truncate max-w-[140px] flex-shrink-0">
                        {edge.choice_text}
                      </span>
                      <button
                        onClick={() => handleDeleteEdge(edge.id)}
                        className="text-slate-600 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------- sub-components ---------- */

function ValidationPanel({ result }: { result: ValidationResult }) {
  return (
    <div
      className={`p-4 rounded-xl border text-sm ${
        result.valid
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-red-500/5 border-red-500/20'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {result.valid ? (
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        ) : (
          <XCircle className="w-4 h-4 text-red-400" />
        )}
        <span className={`font-semibold ${result.valid ? 'text-emerald-400' : 'text-red-400'}`}>
          {result.valid ? 'Граф коректний' : 'Знайдено проблеми'}
        </span>
      </div>

      {result.errors.map((err, i) => (
        <p key={i} className="text-red-400 text-xs flex items-start gap-1.5 mb-1">
          <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          {err}
        </p>
      ))}
      {result.warnings.map((w, i) => (
        <p key={i} className="text-amber-400 text-xs flex items-start gap-1.5 mb-1">
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          {w}
        </p>
      ))}

      <p className="text-slate-500 text-xs mt-2">
        Досяжних сцен: {result.reachable_count} з {result.total_nodes}
      </p>
    </div>
  );
}

function CheckboxField({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500/50"
      />
      <span className="text-sm text-slate-300">{label}</span>
    </label>
  );
}

function NodeSelect({
  value,
  onChange,
  nodes,
}: {
  value: string;
  onChange: (v: string) => void;
  nodes: Node[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm"
    >
      <option value="">Оберіть сцену...</option>
      {nodes.map((n) => (
        <option key={n.id} value={n.id}>
          {n.text_content.slice(0, 55)}
        </option>
      ))}
    </select>
  );
}
