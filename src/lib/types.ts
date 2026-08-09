/**
 * Shared domain types for Let'sShare.
 * Subagents must import from here — do not redefine these shapes.
 */

export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type AuthSession = {
  userId: string;
  email: string;
  name: string;
  token: string;
  expiresAt: string;
};

export type SnippetLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "html"
  | "css"
  | "json"
  | "markdown"
  | "plaintext";

export type ShareSnippet = {
  id: string;
  title: string;
  language: SnippetLanguage;
  content: string;
  ownerId: string | null;
  ownerName: string | null;
  isPublic: boolean;
  shareCode: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  /** When true, only owner can edit; others are view-only */
  isLocked: boolean;
  /** ISO timestamp after which the share is inaccessible; null = never */
  expiresAt: string | null;
  /** Soft-revoke: link becomes dead without deleting history */
  isRevoked: boolean;
  /** Public explore tags (lowercase slugs) */
  tags: string[];
};

export type CreateSnippetInput = {
  title?: string;
  language?: SnippetLanguage;
  content: string;
  isPublic?: boolean;
  ownerId?: string | null;
  ownerName?: string | null;
  isLocked?: boolean;
  expiresAt?: string | null;
  tags?: string[];
};

export type UpdateSnippetInput = {
  title?: string;
  language?: SnippetLanguage;
  content?: string;
  isPublic?: boolean;
  isLocked?: boolean;
  expiresAt?: string | null;
  isRevoked?: boolean;
  tags?: string[];
  /** Custom short link slug (normalized lowercase). */
  shareCode?: string;
};

export type AiAssistMode = "explain" | "title" | "readme" | "interview";

export type AiAssistRequest = {
  mode: AiAssistMode;
  language: SnippetLanguage;
  content: string;
  title?: string;
};

export type AiAssistResponse = {
  mode: AiAssistMode;
  text: string;
  /** true when OPENAI_API_KEY missing and heuristic mock used */
  mocked: boolean;
};

export type RoomRole = "owner" | "editor" | "viewer";

export type RoomPresence = {
  id: string;
  name: string;
  color: string;
  role: RoomRole;
  joinedAt: string;
};

export type RoomSettings = {
  shareCode: string;
  snippetId: string;
  /** When true: owner observes; joiners default to editor (interview) or viewer */
  interviewMode: boolean;
  /** Default role for new joiners (ignored for snippet owner) */
  defaultJoinRole: RoomRole;
  updatedAt: string;
};

export type ShareRoom = {
  id: string;
  snippetId: string;
  shareCode: string;
  settings: RoomSettings;
  participants: RoomPresence[];
  createdAt: string;
};
