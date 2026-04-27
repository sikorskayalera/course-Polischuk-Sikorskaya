import { supabase } from './supabase';

async function getUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    throw new Error('Необхідна авторизація');
  }
  
  const userId = session.user.id;

  
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!existingUser) {

    const username = session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user_' + userId.slice(0, 5);
    await supabase
      .from('users')
      .insert({ 
        id: userId, 
        username: username, 
        password_hash: 'managed_by_auth' 
      });
  }

  return userId;
}

export const api = {
  // ==================== СТОРИС (КВЕСТЫ) ====================
  getStories: async () => {
    const { data, error } = await supabase
      .from('stories')
      .select('id, title, description, author_id, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  
  getStory: async (id: string) => {
    const { data, error } = await supabase
      .from('stories')
      .select('id, title, description, author_id, created_at')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
  
  createStory: async (data: { title: string; description?: string }) => {
    const userId = await getUserId();
    const { data: newStory, error } = await supabase
      .from('stories')
      .insert({ title: data.title, description: data.description || '', author_id: userId })
      .select()
      .single();
    if (error) throw error;
    return newStory;
  },
  
  updateStory: async (id: string, data: { title?: string; description?: string }) => {
    const { data: updatedStory, error } = await supabase
      .from('stories')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updatedStory;
  },
  
  deleteStory: async (id: string) => {
    const { error } = await supabase.from('stories').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  // ==================== ВУЗЛИ (СЦЕНЫ) ====================
  getNodes: async (storyId: string) => {
    const { data, error } = await supabase
      .from('nodes')
      .select('*')
      .eq('story_id', storyId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },
  
  getNode: async (id: string) => {
    const { data, error } = await supabase.from('nodes').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  
  createNode: async (storyId: string, data: { text_content: string; image_url?: string; is_start_node?: boolean; is_end_node?: boolean }) => {
    const { data: newNode, error } = await supabase
      .from('nodes')
      .insert({
        story_id: storyId,
        text_content: data.text_content,
        image_url: data.image_url || '',
        is_start_node: data.is_start_node || false,
        is_end_node: data.is_end_node || false,
      })
      .select()
      .single();
    if (error) throw error;
    return newNode;
  },
  
  updateNode: async (id: string, data: Partial<{ text_content: string; image_url: string; is_start_node: boolean; is_end_node: boolean }>) => {
    const { data: updatedNode, error } = await supabase.from('nodes').update(data).eq('id', id).select().single();
    if (error) throw error;
    return updatedNode;
  },
  
  deleteNode: async (id: string) => {
    const { error } = await supabase.from('nodes').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  // ==================== РЕБРА (ВИБОРИ) ====================
  getEdges: async (storyId: string) => {
    const { data: nodes, error: nodesError } = await supabase.from('nodes').select('id').eq('story_id', storyId);
    if (nodesError) throw nodesError;
    if (!nodes || nodes.length === 0) return [];

    const nodeIds = nodes.map(n => n.id);
    const { data: edges, error: edgesError } = await supabase.from('edges').select('*').in('from_node_id', nodeIds);
    if (edgesError) throw edgesError;
    return edges;
  },
  
  createEdge: async (data: { from_node_id: string; to_node_id: string; choice_text: string }) => {
    const { data: newEdge, error } = await supabase.from('edges').insert(data).select().single();
    if (error) throw error;
    return newEdge;
  },
  
  updateEdge: async (id: string, data: { choice_text?: string; to_node_id?: string }) => {
    const { data: updatedEdge, error } = await supabase.from('edges').update(data).eq('id', id).select().single();
    if (error) throw error;
    return updatedEdge;
  },
  
  deleteEdge: async (id: string) => {
    const { error } = await supabase.from('edges').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  // ==================== ПЛЕЄР (ГЕЙМПЛЕЙ) ====================
  playNode: async (nodeId: string) => {
    const { data: node, error: nodeError } = await supabase.from('nodes').select('*').eq('id', nodeId).single();
    if (nodeError) throw nodeError;

    const { data: choices, error: choicesError } = await supabase.from('edges').select('*').eq('from_node_id', nodeId);
    if (choicesError) throw choicesError;

    return { node, choices: choices || [] };
  },
  
  getStartNode: async (storyId: string) => {
    const { data: node, error: nodeError } = await supabase
      .from('nodes')
      .select('*')
      .eq('story_id', storyId)
      .eq('is_start_node', true)
      .limit(1)
      .single();
      
    if (nodeError) throw nodeError;
    if (!node) throw new Error("У цієї історії немає початкової сцени");

    const { data: choices, error: choicesError } = await supabase.from('edges').select('*').eq('from_node_id', node.id);
    if (choicesError) throw choicesError;

    return { node, choices: choices || [] };
  },

  // ==================== ЗБЕРЕЖЕННЯ ПРОГРЕСУ ====================
  saveProgress: async (data: { story_id: string; current_node_id: string }) => {
    const userId = await getUserId();
    
    const { data: existing } = await supabase
      .from('save_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('story_id', data.story_id)
      .maybeSingle();

    if (existing) {
      const { data: updated, error } = await supabase
        .from('save_progress')
        .update({ current_node_id: data.current_node_id, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    } else {
      const { data: inserted, error } = await supabase
        .from('save_progress')
        .insert({ user_id: userId, story_id: data.story_id, current_node_id: data.current_node_id })
        .select()
        .single();
      if (error) throw error;
      return inserted;
    }
  },
  
  getSave: async (storyId: string) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('save_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('story_id', storyId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  // ==================== ВАЛІДАЦІЯ ГРАФУ (DFS) ====================
  validateStory: async (storyId: string) => {
    const { data: nodes, error: nodesError } = await supabase.from('nodes').select('*').eq('story_id', storyId);
    if (nodesError) throw nodesError;
    if (!nodes || nodes.length === 0) return { valid: false, errors: ["Немає вузлів у базі"] };

    const nodeIds = nodes.map(n => n.id);
    const { data: edges, error: edgesError } = await supabase.from('edges').select('*').in('from_node_id', nodeIds);
    if (edgesError) throw edgesError;

    const adjacency: Record<string, string[]> = {};
    for (const nodeId of nodeIds) adjacency[nodeId] = [];
    for (const edge of edges || []) {
      adjacency[edge.from_node_id].push(edge.to_node_id);
    }

    const startNodes = nodes.filter((n) => n.is_start_node);
    if (startNodes.length === 0) return { valid: false, errors: ["Не вказано початковий вузол (Start Node)"], warnings: [], isolated_nodes: [], dead_ends: [] };
    if (startNodes.length > 1) return { valid: false, errors: ["Знайдено кілька початкових вузлів - має бути лише один"], warnings: [], isolated_nodes: [], dead_ends: [] };

    const startNodeId = startNodes[0].id;

    // Обхід у глибину (DFS)
    const visited = new Set<string>();
    function dfs(nodeId: string) {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      for (const neighbor of adjacency[nodeId] || []) {
        dfs(neighbor);
      }
    }
    dfs(startNodeId);

    const isolatedNodes = nodes.filter((n) => !visited.has(n.id));
    const deadEnds = nodes.filter((n) => !n.is_end_node && adjacency[n.id].length === 0);
    const endNodesWithEdges = nodes.filter((n) => n.is_end_node && adjacency[n.id].length > 0);

    const errors: string[] = [];
    const warnings: string[] = [];

    if (isolatedNodes.length > 0) errors.push(`Знайдено ізольовані вузли: ${isolatedNodes.length}`);
    if (deadEnds.length > 0) errors.push(`Знайдено глухі кути (сцени без виборів): ${deadEnds.length}`);
    if (endNodesWithEdges.length > 0) warnings.push(`Вузли кінцівки мають вибори (що не логічно): ${endNodesWithEdges.length}`);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      isolated_nodes: isolatedNodes.map(n => ({ id: n.id, text_content: n.text_content.slice(0, 80) })),
      dead_ends: deadEnds.map(n => ({ id: n.id, text_content: n.text_content.slice(0, 80) })),
      reachable_count: visited.size,
      total_nodes: nodes.length,
    };
  },
};