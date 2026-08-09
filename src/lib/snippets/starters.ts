import type { SnippetLanguage } from "@/lib/types";

/** Simple starter templates shown when the user picks a language. */
export const LANGUAGE_STARTERS: Record<SnippetLanguage, string> = {
  javascript: `// JavaScript starter
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("Let'sShare"));
console.log(2 + 2);
`,

  typescript: `// TypeScript starter
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

const message: string = greet("Let'sShare");
console.log(message);
`,

  python: `# Python starter
def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("Let'sShare"))
print(2 + 2)
`,

  html: `<!-- HTML starter -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Let'sShare</title>
  </head>
  <body>
    <h1>Hello from Let'sShare</h1>
    <p>Edit this HTML and share the link.</p>
  </body>
</html>
`,

  css: `/* CSS starter */
:root {
  --ink: #0b0c0e;
  --accent: #3d5a80;
}

body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: var(--ink);
  background: #f5f6f8;
}

.hero {
  padding: 2rem;
  border-left: 4px solid var(--accent);
}
`,

  json: `{
  "name": "letsshare-starter",
  "version": "1.0.0",
  "message": "Hello from Let'sShare",
  "tags": ["share", "snippet"]
}
`,

  markdown: `# Let'sShare

Share notes and docs with a link.

## Quick start

1. Edit this markdown
2. Click **Share**
3. Send the link to a friend

\`\`\`js
console.log("Hello from Let'sShare");
\`\`\`
`,

  plaintext: `Let'sShare plaintext starter

Type anything here and share the link.
No syntax highlighting — just your words.
`,
};

export function starterFor(language: SnippetLanguage): string {
  return LANGUAGE_STARTERS[language] ?? LANGUAGE_STARTERS.plaintext;
}

/** True if content is empty or matches a known starter (safe to auto-replace). */
export function isStarterOrEmpty(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return true;
  return Object.values(LANGUAGE_STARTERS).some(
    (starter) => starter.trim() === trimmed,
  );
}
