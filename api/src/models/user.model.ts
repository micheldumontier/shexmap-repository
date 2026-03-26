import { z } from 'zod';

export const UserIdSchema = z.object({
  userId: z.string(),
});

export interface User {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  provider: string;     // 'github' | 'orcid' | 'google'
  providerId: string;
  createdAt: string;
  apiKeys: ApiKey[];
}

export interface ApiKey {
  id: string;
  label: string;
  prefix: string;       // first 8 chars for display
  createdAt: string;
  lastUsedAt?: string;
}

export interface UserDashboard {
  user: User;
  contributions: { id: string; title: string; modifiedAt: string }[];
  starred: { id: string; title: string; authorName: string }[];
  totalContributions: number;
  totalStars: number;
}
