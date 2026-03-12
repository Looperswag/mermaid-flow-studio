import { expect, test } from 'vitest';

import { readFlowchartNodeText, updateFlowchartNodeText } from './flowchartNodeText';

test('reads and updates the label for a flowchart node', () => {
  const source = 'flowchart TD\nA[Old label] --> B{Check}';

  expect(readFlowchartNodeText(source, 'A')).toBe('Old label');
  expect(updateFlowchartNodeText(source, 'A', 'New label')).toContain('A[New label]');
});
