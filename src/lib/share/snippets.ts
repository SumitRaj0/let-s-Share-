/**
 * Snippet helpers — delegates to durable SQLite store.
 */

import * as snippetsDb from "@/lib/db/snippets";
import type { ListExploreOptions } from "@/lib/db/snippets";
import type {
  CreateSnippetInput,
  ShareSnippet,
  UpdateSnippetInput,
} from "@/lib/types";

export type { ListExploreOptions };

export function createSnippet(input: CreateSnippetInput): ShareSnippet {
  return snippetsDb.createSnippet(input);
}

export function getById(id: string): ShareSnippet | null {
  return snippetsDb.getById(id);
}

export function getByShareCode(shareCode: string): ShareSnippet | null {
  return snippetsDb.getByShareCode(shareCode);
}

export function updateSnippet(
  id: string,
  input: UpdateSnippetInput,
): ShareSnippet | null {
  return snippetsDb.updateSnippet(id, input);
}

export function deleteSnippet(id: string): boolean {
  return snippetsDb.deleteSnippet(id);
}

export function listPublic(limit = 20): ShareSnippet[] {
  return snippetsDb.listPublic(limit);
}

export function listExplore(options: ListExploreOptions = {}): ShareSnippet[] {
  return snippetsDb.listExplore(options);
}

export function listByOwner(ownerId: string): ShareSnippet[] {
  return snippetsDb.listByOwner(ownerId);
}

export function incrementViews(id: string): ShareSnippet | null {
  return snippetsDb.incrementViews(id);
}

export { sharePath, isShareCodeFormat, absoluteShareUrl, normalizeShareCode } from "@/lib/share/codes";
