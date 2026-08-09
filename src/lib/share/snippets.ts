/**
 * Snippet helpers — delegates to durable store (libSQL / Turso).
 */

import * as snippetsDb from "@/lib/db/snippets";
import type { ListExploreOptions } from "@/lib/db/snippets";
import type {
  CreateSnippetInput,
  ShareSnippet,
  UpdateSnippetInput,
} from "@/lib/types";

export type { ListExploreOptions };

export async function createSnippet(
  input: CreateSnippetInput,
): Promise<ShareSnippet> {
  return snippetsDb.createSnippet(input);
}

export async function getById(id: string): Promise<ShareSnippet | null> {
  return snippetsDb.getById(id);
}

export async function getByShareCode(
  shareCode: string,
): Promise<ShareSnippet | null> {
  return snippetsDb.getByShareCode(shareCode);
}

export async function updateSnippet(
  id: string,
  input: UpdateSnippetInput,
): Promise<ShareSnippet | null> {
  return snippetsDb.updateSnippet(id, input);
}

export async function deleteSnippet(id: string): Promise<boolean> {
  return snippetsDb.deleteSnippet(id);
}

export async function listPublic(limit = 20): Promise<ShareSnippet[]> {
  return snippetsDb.listPublic(limit);
}

export async function listExplore(
  options: ListExploreOptions = {},
): Promise<ShareSnippet[]> {
  return snippetsDb.listExplore(options);
}

export async function listByOwner(ownerId: string): Promise<ShareSnippet[]> {
  return snippetsDb.listByOwner(ownerId);
}

export async function incrementViews(id: string): Promise<ShareSnippet | null> {
  return snippetsDb.incrementViews(id);
}

export {
  sharePath,
  isShareCodeFormat,
  absoluteShareUrl,
  normalizeShareCode,
} from "@/lib/share/codes";
