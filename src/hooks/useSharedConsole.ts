"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as Y from "yjs";
import type { SnippetLanguage } from "@/lib/types";
import { runInSandbox } from "@/lib/run/sandbox";

const CONSOLE_KEY = "console";

export type UseSharedConsoleResult = {
  logs: string[];
  run: (code: string, language: SnippetLanguage) => Promise<void>;
  clear: () => void;
  shared: boolean;
};

/**
 * Console lines backed by a Y.Array named `console` when a collab Y.Doc
 * is available; otherwise local-only state.
 */
export function useSharedConsole(doc: Y.Doc | null): UseSharedConsoleResult {
  const [logs, setLogs] = useState<string[]>([]);
  const [shared, setShared] = useState(false);
  const docRef = useRef(doc);
  docRef.current = doc;
  const yarrayRef = useRef<Y.Array<string> | null>(null);

  useEffect(() => {
    if (!doc) {
      yarrayRef.current = null;
      setShared(false);
      setLogs([]);
      return;
    }

    const yconsole = doc.getArray<string>(CONSOLE_KEY);
    yarrayRef.current = yconsole;
    setShared(true);
    setLogs(yconsole.toArray());

    const onChange = () => {
      setLogs(yconsole.toArray());
    };
    yconsole.observe(onChange);

    return () => {
      yconsole.unobserve(onChange);
      if (yarrayRef.current === yconsole) {
        yarrayRef.current = null;
      }
      setShared(false);
    };
  }, [doc]);

  const appendLines = useCallback((lines: string[]) => {
    if (lines.length === 0) return;
    const yconsole = yarrayRef.current;
    const currentDoc = docRef.current;

    if (yconsole && currentDoc) {
      currentDoc.transact(() => {
        yconsole.push(lines);
      });
      return;
    }

    setLogs((prev) => [...prev, ...lines]);
  }, []);

  const clear = useCallback(() => {
    const yconsole = yarrayRef.current;
    const currentDoc = docRef.current;

    if (yconsole && currentDoc) {
      currentDoc.transact(() => {
        if (yconsole.length > 0) {
          yconsole.delete(0, yconsole.length);
        }
      });
      return;
    }

    setLogs([]);
  }, []);

  const run = useCallback(
    async (code: string, language: SnippetLanguage) => {
      const { lines } = await runInSandbox(code, language);
      appendLines(lines);
    },
    [appendLines],
  );

  return { logs, run, clear, shared };
}
