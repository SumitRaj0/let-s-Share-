"use client";

import { useEffect } from "react";

const HREF =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap";

/**
 * Loads Material Symbols without blocking first paint (non-render-blocking).
 */
export function IconFontLoader() {
  useEffect(() => {
    if (document.querySelector(`link[data-ls-icons="1"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = HREF;
    link.dataset.lsIcons = "1";
    document.head.appendChild(link);
  }, []);

  return null;
}
