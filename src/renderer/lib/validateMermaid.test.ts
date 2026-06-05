import { stripMermaidFence, validateMermaid } from './validateMermaid';

test('rejects non-flowchart diagrams', () => {
  const result = validateMermaid('sequenceDiagram\nAlice->>Bob: Hi');

  expect(result.valid).toBe(false);
  expect(result.message).toMatch(/flowchart/i);
});

test('accepts flowchart diagrams', () => {
  const result = validateMermaid('flowchart TD\nA-->B');

  expect(result.valid).toBe(true);
});

test('accepts the legacy `graph` alias', () => {
  expect(validateMermaid('graph TD\nA-->B').valid).toBe(true);
});

test('accepts source wrapped in a ```mermaid code fence', () => {
  const fenced = '```mermaid\nflowchart LR\n  A --> B\n```';
  expect(validateMermaid(fenced).valid).toBe(true);
  expect(stripMermaidFence(fenced)).toBe('flowchart LR\n  A --> B');
});

test('rejects empty input', () => {
  expect(validateMermaid('   ').valid).toBe(false);
});
