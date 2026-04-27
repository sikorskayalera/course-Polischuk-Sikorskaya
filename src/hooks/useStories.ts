import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { Story } from '../lib/types';

export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStories();
      setStories(Array.isArray(data) ? data : []);
    } catch {
      setError('Не вдалося завантажити список історій');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { stories, loading, error, reload: load };
}
