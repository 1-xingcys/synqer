import { useQuery } from "@tanstack/react-query";
import { apiFetchJson } from "@/lib/apiClient";

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

const lineGroupsKeys = {
  all: ["lineGroups"] as const,
  members: (groupId: string) =>
    [...lineGroupsKeys.all, "members", groupId] as const,
};

async function fetchLineGroups(): Promise<LineGroup[]> {
  return apiFetchJson<LineGroup[]>("/line-bot/groups");
}

async function fetchLineGroupMembers(
  groupId: string,
): Promise<LineGroupMember[]> {
  return apiFetchJson<LineGroupMember[]>(`/line-bot/groups/${groupId}/members`);
}

export function useLineGroups() {
  const query = useQuery({
    queryKey: lineGroupsKeys.all,
    queryFn: fetchLineGroups,
  });

  return {
    groups: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
  };
}

export function useLineGroupMembers(groupId: string | null) {
  const query = useQuery({
    queryKey: groupId
      ? lineGroupsKeys.members(groupId)
      : lineGroupsKeys.members("none"),
    queryFn: () => fetchLineGroupMembers(groupId as string),
    enabled: !!groupId,
  });

  return {
    members: query.data ?? [],
    loading: !!groupId && query.isLoading,
    error: query.error?.message ?? null,
  };
}
