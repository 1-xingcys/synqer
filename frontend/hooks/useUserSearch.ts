import { useState, useCallback } from "react";
import { apiFetchJson } from "@/lib/apiClient";

export interface SearchedUser {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  avatarUrl: string | null;
}

export function useUserSearch() {
  const [results, setResults] = useState<SearchedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const data = await apiFetchJson<SearchedUser[]>(
        `/users/search?q=${encodeURIComponent(query)}`,
      );
      setResults(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search users");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  };
}
