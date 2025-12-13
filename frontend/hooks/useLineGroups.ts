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
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch LINE groups");
      }

      const data = (await response.json()) as LineGroup[];
      setGroups(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching LINE groups:", err);
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

  const fetchMembers = useCallback(async () => {
    if (!groupId) {
      setMembers([]);
      return;
    }

    try {
      if (!process.env.NEXT_PUBLIC_API) {
        throw new Error("NEXT_PUBLIC_API is not set");
      }
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/line-bot/groups/${groupId}/members`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch group members");
      }

      const data = (await response.json()) as LineGroupMember[];
      setMembers(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching group members:", err);
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
  };
}

