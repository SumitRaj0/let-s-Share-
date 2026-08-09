"use client";

import type { Monaco } from "@monaco-editor/react";

/** Monaco theme id — VS Code Dark+ inspired. */
export const VSCODE_DARK_THEME = "letsshare-vscode-dark";

/**
 * Register a VS Code Dark+ style theme so the editor feels familiar.
 * Safe to call more than once (defineTheme overwrites).
 */
export function registerVsCodeDarkTheme(monaco: Monaco) {
  monaco.editor.defineTheme(VSCODE_DARK_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "D4D4D4" },
      { token: "comment", foreground: "6A9955", fontStyle: "italic" },
      { token: "string", foreground: "CE9178" },
      { token: "string.escape", foreground: "D7BA7D" },
      { token: "keyword", foreground: "569CD6" },
      { token: "keyword.control", foreground: "C586C0" },
      { token: "number", foreground: "B5CEA8" },
      { token: "regexp", foreground: "D16969" },
      { token: "type", foreground: "4EC9B0" },
      { token: "class", foreground: "4EC9B0" },
      { token: "interface", foreground: "4EC9B0" },
      { token: "function", foreground: "DCDCAA" },
      { token: "variable", foreground: "9CDCFE" },
      { token: "variable.predefined", foreground: "569CD6" },
      { token: "constant", foreground: "4FC1FF" },
      { token: "tag", foreground: "569CD6" },
      { token: "attribute.name", foreground: "9CDCFE" },
      { token: "attribute.value", foreground: "CE9178" },
      { token: "delimiter", foreground: "D4D4D4" },
      { token: "delimiter.html", foreground: "808080" },
      { token: "metatag", foreground: "569CD6" },
      { token: "meta", foreground: "D4D4D4" },
      { token: "operator", foreground: "D4D4D4" },
    ],
    colors: {
      "editor.background": "#1E1E1E",
      "editor.foreground": "#D4D4D4",
      "editorLineNumber.foreground": "#858585",
      "editorLineNumber.activeForeground": "#C6C6C6",
      "editorCursor.foreground": "#AEAFAD",
      "editor.selectionBackground": "#264F78",
      "editor.inactiveSelectionBackground": "#3A3D41",
      "editor.lineHighlightBackground": "#2A2D2E",
      "editor.lineHighlightBorder": "#2A2D2E",
      "editorWhitespace.foreground": "#3B3A32",
      "editorIndentGuide.background1": "#404040",
      "editorIndentGuide.activeBackground1": "#707070",
      "editorWidget.background": "#252526",
      "editorWidget.border": "#454545",
      "editorSuggestWidget.background": "#252526",
      "editorSuggestWidget.border": "#454545",
      "editorSuggestWidget.selectedBackground": "#094771",
      "editorHoverWidget.background": "#252526",
      "editorHoverWidget.border": "#454545",
      "editorGutter.background": "#1E1E1E",
      "editorBracketMatch.background": "#0064001a",
      "editorBracketMatch.border": "#888888",
      "scrollbarSlider.background": "#79797966",
      "scrollbarSlider.hoverBackground": "#646464b3",
      "scrollbarSlider.activeBackground": "#bfbfbf66",
      "input.background": "#3C3C3C",
      "input.foreground": "#CCCCCC",
      "focusBorder": "#007FD4",
    },
  });
}
