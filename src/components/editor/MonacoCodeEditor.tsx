"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Editor, { loader, type OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditorNS } from "monaco-editor";
import type { SnippetLanguage } from "@/lib/types";
import { configureMonacoLoader } from "@/lib/monaco/setup";
import { VSCODE_DARK_THEME } from "@/lib/monaco/theme";

/** SnippetLanguage → Monaco language id */
export const MONACO_LANGUAGE_BY_SNIPPET: Record<SnippetLanguage, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  html: "html",
  css: "css",
  json: "json",
  markdown: "markdown",
  plaintext: "plaintext",
};

export function monacoLanguageId(language: SnippetLanguage): string {
  return MONACO_LANGUAGE_BY_SNIPPET[language] ?? "plaintext";
}

/** VS Code–style font stack (Consolas / Cascadia on Windows, Menlo on macOS). */
const VSCODE_FONT =
  "Consolas, 'Cascadia Code', 'Courier New', Menlo, Monaco, monospace";

type MonacoCodeEditorProps = {
  value: string;
  language: SnippetLanguage;
  onChange: (value: string) => void;
  readOnly?: boolean;
  /**
   * When true, content is owned by Yjs — editor is not React-controlled.
   * `value` is only used as the initial/default document.
   */
  collaborative?: boolean;
  onEditorMount?: OnMount;
  onBlur?: () => void;
};

/**
 * Client-only Monaco wrapper. Uncontrolled after mount so typing does not
 * round-trip through React on every keystroke (keeps the caret smooth).
 */
export function MonacoCodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
  collaborative = false,
  onEditorMount,
  onBlur,
}: MonacoCodeEditorProps) {
  const [boot, setBoot] = useState<"loading" | "ready" | "error">("loading");
  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null);
  /** Last value we pushed into Monaco or emitted via onChange — avoid echo loops. */
  const lastLocalValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;
  const onEditorMountRef = useRef(onEditorMount);
  onEditorMountRef.current = onEditorMount;
  const collaborativeRef = useRef(collaborative);
  collaborativeRef.current = collaborative;

  const editorOptions = useMemo(
    () => ({
      readOnly,
      domReadOnly: readOnly,
      minimap: { enabled: false },
      fontSize: 14,
      fontFamily: VSCODE_FONT,
      fontLigatures: false,
      lineHeight: 22,
      letterSpacing: 0,
      padding: { top: 12, bottom: 12 },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: "off" as const,
      tabSize: 2,
      renderLineHighlight: "line" as const,
      cursorBlinking: "blink" as const,
      cursorSmoothCaretAnimation: "off" as const,
      smoothScrolling: false,
      bracketPairColorization: { enabled: true },
      quickSuggestions: true,
      suggestOnTriggerCharacters: true,
      links: false,
      colorDecorators: false,
      renderWhitespace: "none" as const,
      guides: {
        indentation: true,
        bracketPairs: false,
      },
      scrollbar: {
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
        useShadows: false,
      },
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
      stickyScroll: { enabled: false },
    }),
    [readOnly],
  );

  useEffect(() => {
    let cancelled = false;
    configureMonacoLoader();
    loader
      .init()
      .then(() => {
        if (!cancelled) setBoot("ready");
      })
      .catch(() => {
        if (!cancelled) setBoot("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    editorRef.current?.updateOptions({
      readOnly,
      domReadOnly: readOnly,
    });
  }, [readOnly]);

  // External content updates only (load share / language starter) — never while typing.
  useEffect(() => {
    if (collaborative) return;
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!model) return;
    if (value === lastLocalValueRef.current) return;
    if (model.getValue() === value) {
      lastLocalValueRef.current = value;
      return;
    }
    lastLocalValueRef.current = value;
    model.setValue(value);
  }, [value, collaborative]);

  const handleMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    lastLocalValueRef.current = editor.getValue();

    // Keep JS/TS workers light when the typescript contrib is available.
    const tsDefaults = monacoInstance.languages.typescript;
    if (tsDefaults?.javascriptDefaults) {
      tsDefaults.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
      });
    }
    if (tsDefaults?.typescriptDefaults) {
      tsDefaults.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
      });
    }

    editor.updateOptions({
      readOnly,
      domReadOnly: readOnly,
    });
    editor.focus();

    editor.onDidChangeModelContent(() => {
      if (collaborativeRef.current) return;
      const next = editor.getValue();
      lastLocalValueRef.current = next;
      onChangeRef.current(next);
    });

    editor.onDidBlurEditorWidget(() => {
      onBlurRef.current?.();
    });

    onEditorMountRef.current?.(editor, monacoInstance);
  };

  if (boot === "error") {
    return (
      <div
        role="alert"
        className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 bg-[#1e1e1e] px-6 text-center text-[15px] text-[#d4d4d4]"
      >
        <p>Couldn’t load the code editor.</p>
        <button
          type="button"
          className="rounded-md bg-[#3c3c3c] px-4 py-2 text-[14px] text-[#cccccc] transition-opacity hover:opacity-90"
          onClick={() => window.location.reload()}
        >
          Reload page
        </button>
      </div>
    );
  }

  if (boot === "loading") {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-[#1e1e1e] text-[15px] text-[#858585]">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-[#1e1e1e]">
      <div className="absolute inset-0">
        <Editor
          height="100%"
          width="100%"
          language={monacoLanguageId(language)}
          defaultValue={value}
          theme={VSCODE_DARK_THEME}
          onMount={handleMount}
          loading={
            <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-[15px] text-[#858585]">
              Loading editor…
            </div>
          }
          options={editorOptions}
        />
      </div>
    </div>
  );
}
