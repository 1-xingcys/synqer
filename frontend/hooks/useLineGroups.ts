import { useState, useEffect, useCallback } from "react";

export interface LineGroup {
  id: string;
  lineGroupId: string;
  groupName: string | null;
  memberCount: number;
  botJoinedAt: string;
  updatedAt: string;
}

export interface LineGroupMember {
  id: string;
  lineUserId: string;
  displayName: string | null;
  pictureUrl: string | null;
  isLinked: boolean;
  linkedUser: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  firstSeenAt: string;
  lastSeenAt: string;
}

export function useLineGroups() {
  const [groups, setGroups] = useState<LineGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      if (!process.env.NEXT_PUBLIC_API) {
        throw new Error("NEXT_PUBLIC_API is not set");
      }
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/line-bot/groups`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch LINE groups");
      }

      const data = (await response.json()) as LineGroup[];
      setGroups(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    loading,
    error,
    refetch: fetchGroups,
  };
}

export function useLineGroupMembers(groupId: string | null) {
  const [members, setMembers] = useState<LineGroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset members when groupId becomes null
    if (!groupId) {
      setMembers((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    let cancelled = false;

    const fetchMembers = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_API) {
          throw new Error("NEXT_PUBLIC_API is not set");
        }
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API}/line-bot/groups/${groupId}/members`,
          {
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch group members");
        }

        const data = (await response.json()) as LineGroupMember[];
        if (!cancelled) {
          setMembers(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load members",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchMembers();

    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const refetch = useCallback(async () => {
    if (!groupId || !process.env.NEXT_PUBLIC_API) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/line-bot/groups/${groupId}/members`,
        { credentials: "include" },
      );
      if (response.ok) {
        const data = (await response.json()) as LineGroupMember[];
        setMembers(data);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  return {
    members,
    loading,
    error,
    refetch,
  };
}
