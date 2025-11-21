export interface User {
  id: number;
  displayName: string | null;
  primaryEmail: string | null;
  avatarUrl: string | null;
  providers: string[];
}
