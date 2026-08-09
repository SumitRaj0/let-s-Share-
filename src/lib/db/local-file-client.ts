import fs from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";

/** Local-only file SQLite. Kept in a separate module so Vercel never bundles it. */
export function createLocalFileClient(): Client {
  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, "letsshare.sqlite").replace(/\\/g, "/");
  return createClient({ url: `file:${dbPath}` });
}
