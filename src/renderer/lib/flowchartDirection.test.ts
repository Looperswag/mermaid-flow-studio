import { expect, test } from 'vitest';

import { rewriteFlowchartDirection } from './flowchartDirection';

test('rewrites the leading flowchart direction token', () => {
  const result = rewriteFlowchartDirection('flowchart TD\nA-->B', 'left');

  expect(result).toContain('flowchart RL');
});
