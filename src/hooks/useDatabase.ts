// ============================================================
// useDatabase Hook — Initialize DB on app start
// ============================================================

import { useState, useEffect } from 'react';
import { initializeDatabase } from '../database/schema';

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await initializeDatabase();
        if (mounted) setIsReady(true);
      } catch (err) {
        console.error('Database initialization failed:', err);
        if (mounted) setError(String(err));
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  return { isReady, error };
}
