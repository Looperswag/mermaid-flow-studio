export interface ValidationResult {
  valid: boolean;
  message: string;
}

const unsupportedTypes = [
  'sequencediagram',
  'classdiagram',
  'statediagram',
  'erdiagram',
  'journey',
  'gantt',
  'pie',
  'mindmap',
  'timeline',
];

// Mermaid renders both `flowchart` and its legacy alias `graph`.
const supportedPrefixes = ['flowchart', 'graph'];

/**
 * Strip a surrounding Markdown code fence (```mermaid ... ``` or ``` ... ```) and trim,
 * so pasted snippets copied out of docs/chat still validate and render. The editor keeps
 * the user's original text; only validation and rendering use the cleaned form.
 */
export function stripMermaidFence(input: string): string {
  const trimmed = input.trim();
  const fenceMatch = trimmed.match(/^```[\w-]*\s*\n([\s\S]*?)\n?```$/);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

export function validateMermaid(input: string): ValidationResult {
  const cleaned = stripMermaidFence(input);

  if (!cleaned) {
    return {
      valid: false,
      message: '请输入 Mermaid flowchart 内容后再渲染。',
    };
  }

  const normalized = cleaned.toLowerCase();
  const supported = supportedPrefixes.some((prefix) => normalized.startsWith(prefix));
  if (!supported) {
    const matchedUnsupported = unsupportedTypes.find((candidate) =>
      normalized.startsWith(candidate),
    );

    return {
      valid: false,
      message: matchedUnsupported
        ? '当前版本仅支持 flowchart / graph 流程图，请改用 flowchart 后再渲染。'
        : '当前版本仅支持以 flowchart 或 graph 开头的 Mermaid 流程图。',
    };
  }

  return {
    valid: true,
    message: 'Valid flowchart',
  };
}
