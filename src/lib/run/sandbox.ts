import type { SnippetLanguage } from "@/lib/types";

export type SandboxResult = {
  lines: string[];
};

const DEFAULT_TIMEOUT_MS = 2000;

/** Very light TS → JS so common snippets can run in the Function sandbox. */
function stripTypeScript(source: string): string {
  let code = source;
  code = code.replace(/^\s*export\s+/gm, "");
  code = code.replace(/^\s*interface\s+\w+[^{]*\{[\s\S]*?\}\s*/gm, "");
  code = code.replace(/^\s*type\s+\w[\w<>,\s]*=\s*[^;]+;\s*/gm, "");
  code = code.replace(/\s+as\s+const\b/g, "");
  code = code.replace(/\s+as\s+[A-Za-z_][\w.]*/g, "");
  // Parameter / var annotations: `name: Type`
  code = code.replace(
    /(\(|,|var |let |const )\s*([A-Za-z_]\w*)\s*:\s*[A-Za-z_][\w.<|&\s[\],?]*/g,
    "$1$2",
  );
  // Return types: `): Type {` / `): Type =>`
  code = code.replace(/\)\s*:\s*[A-Za-z_][\w.<|&\s[\],?]*(?=\s*[{=])/g, ")");
  return code;
}

function formatArg(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatArgs(args: unknown[]): string {
  return args.map(formatArg).join(" ");
}

/**
 * Safe-ish in-browser runner: isolated Function scope, mocked console,
 * no intentional DOM/network APIs passed in. Sync infinite loops cannot
 * be interrupted; async / returning work races against a timeout.
 */
export async function runInSandbox(
  code: string,
  language: SnippetLanguage,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<SandboxResult> {
  const stamp = new Date().toLocaleTimeString();
  const lines: string[] = [`[${stamp}] Run started (${language})`];

  if (language !== "javascript" && language !== "typescript") {
    lines.push(
      `Live execution is not available for ${language} — showing preview info only.`,
    );
    lines.push("Run finished (mock).");
    return { lines };
  }

  let source = code;
  if (language === "typescript") {
    source = stripTypeScript(code);
    lines.push("[info] TypeScript types stripped lightly; running as JavaScript.");
  }

  const captured: string[] = [];
  const sandboxConsole = {
    log: (...args: unknown[]) => {
      captured.push(formatArgs(args));
    },
    info: (...args: unknown[]) => {
      captured.push(`[info] ${formatArgs(args)}`);
    },
    warn: (...args: unknown[]) => {
      captured.push(`[warn] ${formatArgs(args)}`);
    },
    error: (...args: unknown[]) => {
      captured.push(`[error] ${formatArgs(args)}`);
    },
  };

  // Deny common globals by shadowing; Function still inherits the realm.
  const blocked = () => {
    throw new Error("Network and DOM access are disabled in the sandbox.");
  };

  try {
    const runner = new Function(
      "console",
      "fetch",
      "XMLHttpRequest",
      "WebSocket",
      "document",
      "window",
      "localStorage",
      "sessionStorage",
      `"use strict";\n${source}\n`,
    );

    const execute = () =>
      runner(
        sandboxConsole,
        blocked,
        blocked,
        blocked,
        undefined,
        undefined,
        undefined,
        undefined,
      );

    const result = await Promise.race([
      Promise.resolve().then(execute),
      new Promise<never>((_, reject) => {
        window.setTimeout(() => {
          reject(new Error(`Execution timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);

    if (captured.length === 0) {
      lines.push("Completed with no console output.");
    } else {
      lines.push(...captured);
    }

    if (result !== undefined) {
      lines.push(`⇒ ${formatArg(result)}`);
    }

    lines.push("Run finished.");
  } catch (e) {
    if (captured.length > 0) {
      lines.push(...captured);
    }
    lines.push(
      `Error: ${e instanceof Error ? e.message : "Execution failed"}`,
    );
  }

  return { lines };
}
