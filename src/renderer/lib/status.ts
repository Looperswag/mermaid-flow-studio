export type StatusTone = 'info' | 'success' | 'error' | 'working';

export interface AppStatus {
  tone: StatusTone;
  title: string;
  message: string;
}

export function statusFrom(tone: StatusTone, title: string, message: string): AppStatus {
  return { tone, title, message };
}

export function formatError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Mermaid 渲染失败，请检查语法后重试。';
}
