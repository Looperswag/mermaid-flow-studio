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

export function validateMermaid(input: string): ValidationResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      valid: false,
      message: '请输入 Mermaid flowchart 内容后再渲染。',
    };
  }

  const normalized = trimmed.toLowerCase();
  if (!normalized.startsWith('flowchart')) {
    const matchedUnsupported = unsupportedTypes.find((candidate) =>
      normalized.startsWith(candidate),
    );

    return {
      valid: false,
      message: matchedUnsupported
        ? '当前版本仅支持 flowchart 语法，请改为 flowchart 后再渲染。'
        : '当前版本仅支持以 flowchart 开头的 Mermaid 图表。',
    };
  }

  return {
    valid: true,
    message: 'Valid flowchart',
  };
}
