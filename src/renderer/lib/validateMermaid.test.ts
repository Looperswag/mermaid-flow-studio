import { validateMermaid } from './validateMermaid';

test('rejects non-flowchart diagrams', () => {
  const result = validateMermaid('sequenceDiagram\nAlice->>Bob: Hi');

  expect(result.valid).toBe(false);
  expect(result.message).toMatch(/flowchart/i);
});

test('accepts flowchart diagrams', () => {
  const result = validateMermaid('flowchart TD\nA-->B');

  expect(result.valid).toBe(true);
});
