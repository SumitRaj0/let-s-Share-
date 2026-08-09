"use client";

import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { registerVsCodeDarkTheme } from "@/lib/monaco/theme";

let configured = false;

/**
 * Use the npm `monaco-editor` build instead of the default jsDelivr CDN.
 * CSP `script-src 'self'` blocks the CDN, which left the UI stuck on
 * "Loading editor…" with `Monaco initialization: error: [object Event]`.
 */
export function configureMonacoLoader() {
  if (configured || typeof window === "undefined") return;
  configured = true;
  loader.config({ monaco });
  registerVsCodeDarkTheme(monaco);
}
