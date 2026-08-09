import type {
  AiAssistMode,
  AiAssistRequest,
  AiAssistResponse,
  SnippetLanguage,
} from "@/lib/types";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o-mini";

const MODE_LABELS: Record<AiAssistMode, string> = {
  explain: "Explain this code",
  title: "Suggest a concise title",
  readme: "Write a README section",
  interview: "Generate interview questions",
};

function extractFunctionNames(content: string, language: SnippetLanguage): string[] {
  const names: string[] = [];
  const patterns: RegExp[] = [];

  if (language === "python") {
    patterns.push(/^\s*def\s+([A-Za-z_][\w]*)\s*\(/gm);
    patterns.push(/^\s*class\s+([A-Za-z_][\w]*)\s*[:(]/gm);
  } else if (
    language === "javascript" ||
    language === "typescript"
  ) {
    patterns.push(
      /(?:export\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/g,
    );
    patterns.push(
      /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g,
    );
    patterns.push(/(?:export\s+)?class\s+([A-Za-z_$][\w$]*)\b/g);
  } else if (language === "css") {
    patterns.push(/\.([A-Za-z_-][\w-]*)\s*\{/g);
  } else if (language === "html") {
    patterns.push(/<(?:section|article|main|nav|form|div)\s+[^>]*id=["']([^"']+)["']/gi);
  }

  for (const re of patterns) {
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      if (match[1] && !names.includes(match[1])) {
        names.push(match[1]);
      }
      if (names.length >= 8) return names;
    }
  }

  return names;
}

function firstNonEmptyLines(content: string, limit = 12): string[] {
  return content
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0)
    .slice(0, limit);
}

function guessPurpose(content: string, language: SnippetLanguage): string {
  const lower = content.toLowerCase();
  if (/\bfetch\s*\(|axios\.|xmlhttprequest/.test(lower)) {
    return "network / API data fetching";
  }
  if (/\buseState\b|\buseEffect\b|\breact\b/.test(content)) {
    return "a React UI component or hook";
  }
  if (/\bexpress\b|\bapp\.(get|post|put|delete)\b/.test(lower)) {
    return "an HTTP API / server handler";
  }
  if (/\bpytest\b|\bdescribe\s*\(|\bit\s*\(|\bassert\b/.test(content)) {
    return "tests / assertions";
  }
  if (language === "css" || /\{\s*[\w-]+:/.test(content)) {
    return "styling / layout";
  }
  if (language === "html") {
    return "markup / page structure";
  }
  if (language === "json") {
    return "structured configuration or data";
  }
  if (language === "markdown") {
    return "documentation";
  }
  if (/\bsort\b|\bsearch\b|\bmap\b|\breduce\b|\bfilter\b/.test(lower)) {
    return "data transformation or algorithms";
  }
  return `a ${language} snippet`;
}

function mockExplain(
  language: SnippetLanguage,
  content: string,
  title?: string,
): string {
  const lines = content.split(/\r?\n/).length;
  const chars = content.length;
  const fns = extractFunctionNames(content, language);
  const purpose = guessPurpose(content, language);
  const preview = firstNonEmptyLines(content, 6);

  const parts: string[] = [];
  parts.push(
    title?.trim()
      ? `**${title.trim()}** looks like ${purpose} written in **${language}**.`
      : `This snippet looks like ${purpose} written in **${language}**.`,
  );
  parts.push("");
  parts.push(
    `It is about **${lines}** line${lines === 1 ? "" : "s"} (~${chars} characters).`,
  );

  if (fns.length > 0) {
    parts.push("");
    parts.push("Notable symbols:");
    for (const name of fns.slice(0, 5)) {
      parts.push(`- \`${name}\``);
    }
  }

  if (preview.length > 0) {
    parts.push("");
    parts.push("Opening lines:");
    parts.push("```" + language);
    parts.push(...preview);
    parts.push("```");
  }

  parts.push("");
  parts.push(
    "_Offline mock explanation — set `OPENAI_API_KEY` for a live model response._",
  );
  return parts.join("\n");
}

function mockTitle(language: SnippetLanguage, content: string): string {
  const fns = extractFunctionNames(content, language);
  if (fns[0]) {
    const base = fns[0]
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return `${base} (${language})`;
  }

  const purpose = guessPurpose(content, language);
  const short = purpose
    .replace(/^a\s+/i, "")
    .replace(/^an\s+/i, "")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return `${short.slice(0, 48)}`;
}

function mockReadme(
  language: SnippetLanguage,
  content: string,
  title?: string,
): string {
  const name = title?.trim() || mockTitle(language, content);
  const fns = extractFunctionNames(content, language);
  const purpose = guessPurpose(content, language);

  const lines: string[] = [
    `# ${name}`,
    "",
    `A shared **${language}** snippet for ${purpose}.`,
    "",
    "## Overview",
    "",
    `This code lives in Let'sShare so others can view, fork, and collaborate on it.`,
    "",
    "## Language",
    "",
    `- Runtime / dialect: \`${language}\``,
    `- Approx. size: ${content.split(/\r?\n/).length} lines`,
    "",
  ];

  if (fns.length > 0) {
    lines.push("## Key pieces", "");
    for (const fn of fns.slice(0, 6)) {
      lines.push(`- \`${fn}\``);
    }
    lines.push("");
  }

  lines.push(
    "## Getting started",
    "",
    "1. Open the share link in Let'sShare.",
    "2. Review the code in the editor (or open it for live collaboration).",
    "3. Run or adapt the snippet for your environment.",
    "",
    "## Notes",
    "",
    "_Generated offline without an API key. Replace with a polished README via OpenAI when configured._",
  );

  return lines.join("\n");
}

function mockInterview(
  language: SnippetLanguage,
  content: string,
  title?: string,
): string {
  const fns = extractFunctionNames(content, language);
  const purpose = guessPurpose(content, language);
  const label = title?.trim() || "this snippet";

  const qs: string[] = [
    `1. In a few sentences, what problem does **${label}** solve, and why is **${language}** a good fit?`,
    `2. Walk through the control flow for a typical input — where could it fail or throw?`,
    `3. How would you test ${purpose}? Name at least two edge cases.`,
    `4. What would you change to improve readability or performance without changing behavior?`,
    `5. If this ran in production, what observability (logs, metrics, errors) would you add?`,
  ];

  if (fns[0]) {
    qs.push(
      `6. Explain the responsibility of \`${fns[0]}\` and how callers should use it.`,
    );
  }
  if (fns[1]) {
    qs.push(
      `7. How do \`${fns[0]}\` and \`${fns[1]}\` interact, and what coupling concerns do you see?`,
    );
  } else {
    qs.push(
      `6. How would you refactor this into smaller modules while keeping the public API stable?`,
    );
  }

  return [
    `Interview questions for **${label}** (${language}):`,
    "",
    ...qs,
    "",
    "_Offline mock questions — set `OPENAI_API_KEY` for model-generated prompts._",
  ].join("\n");
}

function mockAssist(req: AiAssistRequest): AiAssistResponse {
  const { mode, language, content, title } = req;
  let text: string;
  switch (mode) {
    case "explain":
      text = mockExplain(language, content, title);
      break;
    case "title":
      text = mockTitle(language, content);
      break;
    case "readme":
      text = mockReadme(language, content, title);
      break;
    case "interview":
      text = mockInterview(language, content, title);
      break;
    default: {
      const _exhaustive: never = mode;
      text = String(_exhaustive);
    }
  }
  return { mode, text, mocked: true };
}

function buildSystemPrompt(mode: AiAssistMode): string {
  const base =
    "You help developers share and discuss code snippets on Let'sShare. Be concise, accurate, and practical. Prefer plain language. Use markdown when helpful.";

  switch (mode) {
    case "explain":
      return `${base} Explain what the code does, its structure, and notable edge cases. Do not rewrite the entire file unless asked.`;
    case "title":
      return `${base} Reply with ONLY a short snippet title (max ~60 characters). No quotes, no markdown, no explanation.`;
    case "readme":
      return `${base} Write a short README (markdown) suitable for sharing: title, overview, usage notes. Keep it under ~400 words.`;
    case "interview":
      return `${base} Produce 5–8 technical interview questions grounded in THIS code (not generic CS trivia). Number them.`;
    default: {
      const _exhaustive: never = mode;
      return String(_exhaustive);
    }
  }
}

function buildUserPrompt(req: AiAssistRequest): string {
  const titleLine = req.title?.trim()
    ? `Current title: ${req.title.trim()}\n`
    : "";
  return [
    `Mode: ${MODE_LABELS[req.mode]}`,
    `Language: ${req.language}`,
    titleLine.trimEnd(),
    "Code:",
    "```" + req.language,
    req.content,
    "```",
  ]
    .filter(Boolean)
    .join("\n");
}

async function callOpenAI(
  req: AiAssistRequest,
  apiKey: string,
): Promise<string> {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: req.mode === "title" ? 0.4 : 0.5,
      max_tokens: req.mode === "title" ? 64 : 1200,
      messages: [
        { role: "system", content: buildSystemPrompt(req.mode) },
        { role: "user", content: buildUserPrompt(req) },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `OpenAI request failed (${res.status})${errText ? `: ${errText.slice(0, 200)}` : ""}`,
    );
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("OpenAI returned an empty response");
  }
  return text;
}

/**
 * AI assist for sharing: explain, title, README, or interview questions.
 * Uses OpenAI when `OPENAI_API_KEY` is set; otherwise high-quality heuristics.
 */
export async function runAiAssist(
  req: AiAssistRequest,
): Promise<AiAssistResponse> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return mockAssist(req);
  }

  try {
    const text = await callOpenAI(req, apiKey);
    return { mode: req.mode, text, mocked: false };
  } catch {
    // Fall back so the product still helps when the key/network fails
    const fallback = mockAssist(req);
    return {
      ...fallback,
      text: `${fallback.text}\n\n_(Live AI unavailable — showing offline mock.)_`,
    };
  }
}
