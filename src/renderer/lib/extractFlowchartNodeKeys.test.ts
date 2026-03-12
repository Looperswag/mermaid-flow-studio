import { expect, test } from 'vitest';

import { extractFlowchartNodeKeys } from './extractFlowchartNodeKeys';

test('extracts stable Mermaid node ids from flowchart source', () => {
  expect(extractFlowchartNodeKeys('flowchart TD\nA[Start] --> B{Check}')).toEqual(['A', 'B']);
});
