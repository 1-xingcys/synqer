import { useState, useCallback } from "react";

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
      if (!process.env.NEXT_PUBLIC_API) {
        throw new Error("NEXT_PUBLIC_API is not set");
      }
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/users/search?q=${encodeURIComponent(query)}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to search users");
      }

      const data = (await response.json()) as SearchedUser[];
      setResults(data);
      setError(null);
    } catch (err) {
      console.error("Error searching users:", err);
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

