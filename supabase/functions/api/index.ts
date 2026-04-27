import { Hono } from "npm:hono@4.7.9";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function getSupabaseClient(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    }
  );
  return supabase;
}

function getUserId(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  // Extract user ID from JWT payload
  try {
    const token = authHeader.replace("Bearer ", "");
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

const app = new Hono();

// OPTIONS handler for CORS
app.options("/{*path}", (c) => {
  return c.json(null, 200, corsHeaders);
});

// Helper to add CORS headers to all responses
app.use("/{*path}", async (c, next) => {
  await next();
  const res = c.res;
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: { ...Object.fromEntries(res.headers.entries()), ...corsHeaders },
  });
});

// ==================== STORIES ====================

// List all stories
app.get("/api/stories", async (c) => {
  const supabase = getSupabaseClient(c.req.raw);
  const { data, error } = await supabase
    .from("stories")
    .select("id, title, description, author_id, created_at")
    .order("created_at", { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// Get single story
app.get("/api/stories/:id", async (c) => {
  const supabase = getSupabaseClient(c.req.raw);
  const id = c.req.param("id");
  const { data, error } = await supabase
    .from("stories")
    .select("id, title, description, author_id, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) return c.json({ error: error.message }, 500);
  if (!data) return c.json({ error: "Story not found" }, 404);
  return c.json(data);
});

// Create story
app.post("/api/stories", async (c) => {
  const userId = getUserId(c.req.raw);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const supabase = getSupabaseClient(c.req.raw);
  const body = await c.req.json();
  const { title, description } = body;

  if (!title) return c.json({ error: "Title is required" }, 400);

  // Ensure user exists in our users table
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!existingUser) {
    // Get username from auth metadata or use a default
    const authHeader = c.req.raw.headers.get("Authorization");
    const token = authHeader!.replace("Bearer ", "");
    let username = "user_" + userId.slice(0, 8);
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      username = payload.user_metadata?.username || payload.email || username;
    } catch {}

    await supabase
      .from("users")
      .insert({ id: userId, username, password_hash: "managed_by_auth" });
  }

  const { data, error } = await supabase
    .from("stories")
    .insert({ title, description: description || "", author_id: userId })
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data, 201);
});

// Update story
app.put("/api/stories/:id", async (c) => {
  const userId = getUserId(c.req.raw);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const supabase = getSupabaseClient(c.req.raw);
  const id = c.req.param("id");
  const body = await c.req.json();
  const { title, description } = body;

  const { data, error } = await supabase
    .from("stories")
    .update({ title, description })
    .eq("id", id)
    .eq("author_id", userId)
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 500);
  if (!data) return c.json({ error: "Story not found or not authorized" }, 404);
  return c.json(data);
});

// Delete story
app.delete("/api/stories/:id", async (c) => {
  const userId = getUserId(c.req.raw);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const supabase = getSupabaseClient(c.req.raw);
  const id = c.req.param("id");

  const { error } = await supabase
    .from("stories")
    .delete()
    .eq("id", id)
    .eq("author_id", userId);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

// ==================== NODES ====================

// List nodes for a story
app.get("/api/stories/:storyId/nodes", async (c) => {
  const supabase = getSupabaseClient(c.req.raw);
  const storyId = c.req.param("storyId");
  const { data, error } = await supabase
    .from("nodes")
    .select("id, story_id, text_content, image_url, is_start_node, is_end_node, created_at")
    .eq("story_id", storyId)
    .order("created_at", { ascending: true });
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// Get single node
app.get("/api/nodes/:id", async (c) => {
  const supabase = getSupabaseClient(c.req.raw);
  const id = c.req.param("id");
  const { data, error } = await supabase
    .from("nodes")
    .select("id, story_id, text_content, image_url, is_start_node, is_end_node, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) return c.json({ error: error.message }, 500);
  if (!data) return c.json({ error: "Node not found" }, 404);
  return c.json(data);
});

// Create node
app.post("/api/stories/:storyId/nodes", async (c) => {
  const userId = getUserId(c.req.raw);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const supabase = getSupabaseClient(c.req.raw);
  const storyId = c.req.param("storyId");
  const body = await c.req.json();
  const { text_content, image_url, is_start_node, is_end_node } = body;

  if (!text_content) return c.json({ error: "text_content is required" }, 400);

  // Verify ownership
  const { data: story } = await supabase
    .from("stories")
    .select("author_id")
    .eq("id", storyId)
    .maybeSingle();
  if (!story || story.author_id !== userId)
    return c.json({ error: "Story not found or not authorized" }, 403);

  const { data, error } = await supabase
    .from("nodes")
    .insert({
      story_id: storyId,
      text_content,
      image_url: image_url || "",
      is_start_node: is_start_node || false,
      is_end_node: is_end_node || false,
    })
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data, 201);
});

// Update node
app.put("/api/nodes/:id", async (c) => {
  const userId = getUserId(c.req.raw);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const supabase = getSupabaseClient(c.req.raw);
  const id = c.req.param("id");
  const body = await c.req.json();
  const { text_content, image_url, is_start_node, is_end_node } = body;

  // Verify ownership through story
  const { data: node } = await supabase
    .from("nodes")
    .select("story_id")
    .eq("id", id)
    .maybeSingle();
  if (!node) return c.json({ error: "Node not found" }, 404);

  const { data: story } = await supabase
    .from("stories")
    .select("author_id")
    .eq("id", node.story_id)
    .maybeSingle();
  if (!story || story.author_id !== userId)
    return c.json({ error: "Not authorized" }, 403);

  const updateData: Record<string, unknown> = {};
  if (text_content !== undefined) updateData.text_content = text_content;
  if (image_url !== undefined) updateData.image_url = image_url;
  if (is_start_node !== undefined) updateData.is_start_node = is_start_node;
  if (is_end_node !== undefined) updateData.is_end_node = is_end_node;

  const { data, error } = await supabase
    .from("nodes")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// Delete node
app.delete("/api/nodes/:id", async (c) => {
  const userId = getUserId(c.req.raw);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const supabase = getSupabaseClient(c.req.raw);
  const id = c.req.param("id");

  const { data: node } = await supabase
    .from("nodes")
    .select("story_id")
    .eq("id", id)
    .maybeSingle();
  if (!node) return c.json({ error: "Node not found" }, 404);

  const { data: story } = await supabase
    .from("stories")
    .select("author_id")
    .eq("id", node.story_id)
    .maybeSingle();
  if (!story || story.author_id !== userId)
    return c.json({ error: "Not authorized" }, 403);

  const { error } = await supabase.from("nodes").delete().eq("id", id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

// ==================== EDGES ====================

// List edges for a story
app.get("/api/stories/:storyId/edges", async (c) => {
  const supabase = getSupabaseClient(c.req.raw);
  const storyId = c.req.param("storyId");

  const { data: nodes } = await supabase
    .from("nodes")
    .select("id")
    .eq("story_id", storyId);

  if (!nodes || nodes.length === 0) return c.json([]);

  const nodeIds = nodes.map((n) => n.id);

  const { data, error } = await supabase
    .from("edges")
    .select("id, from_node_id, to_node_id, choice_text, created_at")
    .in("from_node_id", nodeIds);
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// Create edge
app.post("/api/edges", async (c) => {
  const userId = getUserId(c.req.raw);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const supabase = getSupabaseClient(c.req.raw);
  const body = await c.req.json();
  const { from_node_id, to_node_id, choice_text } = body;

  if (!from_node_id || !to_node_id || !choice_text)
    return c.json({ error: "from_node_id, to_node_id, and choice_text are required" }, 400);

  // Verify ownership through from_node's story
  const { data: fromNode } = await supabase
    .from("nodes")
    .select("story_id")
    .eq("id", from_node_id)
    .maybeSingle();
  if (!fromNode) return c.json({ error: "Source node not found" }, 404);

  const { data: story } = await supabase
    .from("stories")
    .select("author_id")
    .eq("id", fromNode.story_id)
    .maybeSingle();
  if (!story || story.author_id !== userId)
    return c.json({ error: "Not authorized" }, 403);

  const { data, error } = await supabase
    .from("edges")
    .insert({ from_node_id, to_node_id, choice_text })
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data, 201);
});

// Update edge
app.put("/api/edges/:id", async (c) => {
  const userId = getUserId(c.req.raw);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const supabase = getSupabaseClient(c.req.raw);
  const id = c.req.param("id");
  const body = await c.req.json();
  const { choice_text, to_node_id } = body;

  const { data: edge } = await supabase
    .from("edges")
    .select("from_node_id")
    .eq("id", id)
    .maybeSingle();
  if (!edge) return c.json({ error: "Edge not found" }, 404);

  const { data: fromNode } = await supabase
    .from("nodes")
    .select("story_id")
    .eq("id", edge.from_node_id)
    .maybeSingle();
  if (!fromNode) return c.json({ error: "Source node not found" }, 404);

  const { data: story } = await supabase
    .from("stories")
    .select("author_id")
    .eq("id", fromNode.story_id)
    .maybeSingle();
  if (!story || story.author_id !== userId)
    return c.json({ error: "Not authorized" }, 403);

  const updateData: Record<string, unknown> = {};
  if (choice_text !== undefined) updateData.choice_text = choice_text;
  if (to_node_id !== undefined) updateData.to_node_id = to_node_id;

  const { data, error } = await supabase
    .from("edges")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// Delete edge
app.delete("/api/edges/:id", async (c) => {
  const userId = getUserId(c.req.raw);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const supabase = getSupabaseClient(c.req.raw);
  const id = c.req.param("id");

  const { data: edge } = await supabase
    .from("edges")
    .select("from_node_id")
    .eq("id", id)
    .maybeSingle();
  if (!edge) return c.json({ error: "Edge not found" }, 404);

  const { data: fromNode } = await supabase
    .from("nodes")
    .select("story_id")
    .eq("id", edge.from_node_id)
    .maybeSingle();
  if (!fromNode) return c.json({ error: "Source node not found" }, 404);

  const { data: story } = await supabase
    .from("stories")
    .select("author_id")
    .eq("id", fromNode.story_id)
    .maybeSingle();
  if (!story || story.author_id !== userId)
    return c.json({ error: "Not authorized" }, 403);

  const { error } = await supabase.from("edges").delete().eq("id", id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

// ==================== PLAYER ====================

// Get current node with available choices
app.get("/api/nodes/:id/play", async (c) => {
  const supabase = getSupabaseClient(c.req.raw);
  const nodeId = c.req.param("id");

  const { data: node, error: nodeError } = await supabase
    .from("nodes")
    .select("id, story_id, text_content, image_url, is_start_node, is_end_node")
    .eq("id", nodeId)
    .maybeSingle();
  if (nodeError) return c.json({ error: nodeError.message }, 500);
  if (!node) return c.json({ error: "Node not found" }, 404);

  const { data: edges, error: edgesError } = await supabase
    .from("edges")
    .select("id, to_node_id, choice_text")
    .eq("from_node_id", nodeId);
  if (edgesError) return c.json({ error: edgesError.message }, 500);

  return c.json({ node, choices: edges || [] });
});

// Get start node for a story
app.get("/api/stories/:storyId/start", async (c) => {
  const supabase = getSupabaseClient(c.req.raw);
  const storyId = c.req.param("storyId");

  const { data: node, error } = await supabase
    .from("nodes")
    .select("id, story_id, text_content, image_url, is_start_node, is_end_node")
    .eq("story_id", storyId)
    .eq("is_start_node", true)
    .maybeSingle();
  if (error) return c.json({ error: error.message }, 500);
  if (!node) return c.json({ error: "No start node found for this story" }, 404);

  const { data: edges } = await supabase
    .from("edges")
    .select("id, to_node_id, choice_text")
    .eq("from_node_id", node.id);

  return c.json({ node, choices: edges || [] });
});

// ==================== SAVE PROGRESS ====================

// Save progress
app.post("/api/save", async (c) => {
  const userId = getUserId(c.req.raw);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const supabase = getSupabaseClient(c.req.raw);
  const body = await c.req.json();
  const { story_id, current_node_id } = body;

  if (!story_id || !current_node_id)
    return c.json({ error: "story_id and current_node_id are required" }, 400);

  // Upsert: update if exists, insert if not
  const { data: existing } = await supabase
    .from("save_progress")
    .select("id")
    .eq("user_id", userId)
    .eq("story_id", story_id)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("save_progress")
      .update({ current_node_id, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json(data);
  } else {
    const { data, error } = await supabase
      .from("save_progress")
      .insert({ user_id: userId, story_id, current_node_id })
      .select()
      .single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json(data, 201);
  }
});

// Get saved progress
app.get("/api/save/:storyId", async (c) => {
  const userId = getUserId(c.req.raw);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const supabase = getSupabaseClient(c.req.raw);
  const storyId = c.req.param("storyId");

  const { data, error } = await supabase
    .from("save_progress")
    .select("id, current_node_id, updated_at")
    .eq("user_id", userId)
    .eq("story_id", storyId)
    .maybeSingle();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// ==================== VALIDATION (DFS) ====================

// Validate story for isolated nodes and dead ends
app.get("/api/stories/:storyId/validate", async (c) => {
  const supabase = getSupabaseClient(c.req.raw);
  const storyId = c.req.param("storyId");

  // Get all nodes for the story
  const { data: nodes, error: nodesError } = await supabase
    .from("nodes")
    .select("id, is_start_node, is_end_node, text_content")
    .eq("story_id", storyId);
  if (nodesError) return c.json({ error: nodesError.message }, 500);
  if (!nodes || nodes.length === 0)
    return c.json({ error: "No nodes found for this story" }, 404);

  // Get all edges for the story
  const nodeIds = nodes.map((n) => n.id);
  const { data: edges, error: edgesError } = await supabase
    .from("edges")
    .select("from_node_id, to_node_id")
    .in("from_node_id", nodeIds);
  if (edgesError) return c.json({ error: edgesError.message }, 500);

  // Build adjacency list
  const adjacency: Record<string, string[]> = {};
  const reachableFrom: Record<string, string[]> = {};
  for (const nodeId of nodeIds) {
    adjacency[nodeId] = [];
    reachableFrom[nodeId] = [];
  }
  for (const edge of edges || []) {
    adjacency[edge.from_node_id].push(edge.to_node_id);
    reachableFrom[edge.to_node_id].push(edge.from_node_id);
  }

  // Find start node
  const startNodes = nodes.filter((n) => n.is_start_node);
  if (startNodes.length === 0) {
    return c.json({
      valid: false,
      errors: ["No start node defined"],
      warnings: [],
      isolated_nodes: [],
      dead_ends: [],
    });
  }
  if (startNodes.length > 1) {
    return c.json({
      valid: false,
      errors: ["Multiple start nodes defined - only one is allowed"],
      warnings: [],
      isolated_nodes: [],
      dead_ends: [],
    });
  }

  const startNodeId = startNodes[0].id;

  // DFS from start node to find all reachable nodes
  const visited = new Set<string>();
  function dfs(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    for (const neighbor of adjacency[nodeId] || []) {
      dfs(neighbor);
    }
  }
  dfs(startNodeId);

  // Find isolated nodes (not reachable from start)
  const isolatedNodes = nodes.filter((n) => !visited.has(n.id));

  // Find dead ends (non-end nodes with no outgoing edges)
  const deadEnds = nodes.filter(
    (n) => !n.is_end_node && adjacency[n.id].length === 0
  );

  // Find end nodes with outgoing edges (warning)
  const endNodesWithEdges = nodes.filter(
    (n) => n.is_end_node && adjacency[n.id].length > 0
  );

  const errors: string[] = [];
  const warnings: string[] = [];

  if (isolatedNodes.length > 0) {
    errors.push(
      `Found ${isolatedNodes.length} isolated node(s) that cannot be reached from the start`
    );
  }
  if (deadEnds.length > 0) {
    errors.push(
      `Found ${deadEnds.length} dead-end node(s) with no choices and not marked as ending`
    );
  }
  if (endNodesWithEdges.length > 0) {
    warnings.push(
      `Found ${endNodesWithEdges.length} end node(s) that still have outgoing choices`
    );
  }

  return c.json({
    valid: errors.length === 0,
    errors,
    warnings,
    isolated_nodes: isolatedNodes.map((n) => ({
      id: n.id,
      text_content: n.text_content.slice(0, 80),
    })),
    dead_ends: deadEnds.map((n) => ({
      id: n.id,
      text_content: n.text_content.slice(0, 80),
    })),
    reachable_count: visited.size,
    total_nodes: nodes.length,
  });
});

// ==================== ME ====================

app.get("/api/me", async (c) => {
  const userId = getUserId(c.req.raw);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const supabase = getSupabaseClient(c.req.raw);
  const { data, error } = await supabase
    .from("users")
    .select("id, username, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

Deno.serve(app.fetch);