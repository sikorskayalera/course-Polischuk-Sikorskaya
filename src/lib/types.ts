export interface Story {
  id: string;
  title: string;
  description: string;
  author_id: string;
  created_at: string;
  node_count?: number;
}

export interface Node {
  id: string;
  story_id: string;
  text_content: string;
  image_url: string;
  is_start_node: boolean;
  is_end_node: boolean;
  created_at: string;
}

export interface Edge {
  id: string;
  from_node_id: string;
  to_node_id: string;
  choice_text: string;
  created_at: string;
}

export interface PlayNode {
  node: Node;
  choices: Edge[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  isolated_nodes: { id: string; text_content: string }[];
  dead_ends: { id: string; text_content: string }[];
  reachable_count: number;
  total_nodes: number;
}
