import { useQuery } from "@tanstack/react-query";
import type { operations } from "@/generated/openapi";
import { apiFetchJson } from "@/lib/api/apiClient";

export type LineGroup =
  operations["LineBotController_getMyGroups"]["responses"][200]["content"]["application/json"][number];

export type LineGroupMember =
  operations["LineBotController_getMyGroupMembers"]["responses"][200]["content"]["application/json"][number];

const lineGroupsKeys = {
  all: ["lineGroups"] as const,
  members: (groupId: string) =>
    [...lineGroupsKeys.all, "members", groupId] as const,
};

async function fetchMyLineGroups(): Promise<LineGroup[]> {
  return apiFetchJson<LineGroup[]>("/line-bot/my-groups");
}

async function fetchMyLineGroupMembers(
  groupId: string,
): Promise<LineGroupMember[]> {
  return apiFetchJson<LineGroupMember[]>(
    `/line-bot/my-groups/${groupId}/members`,
  );
}

export function useLineGroups() {
  const query = useQuery({
    queryKey: lineGroupsKeys.all,
    queryFn: fetchMyLineGroups,
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
    queryFn: () => fetchMyLineGroupMembers(groupId as string),
    enabled: !!groupId,
  });

  return {
    members: query.data ?? [],
    loading: !!groupId && query.isLoading,
    error: query.error?.message ?? null,
  };
}
