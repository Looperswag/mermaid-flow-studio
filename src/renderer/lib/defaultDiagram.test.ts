import { defaultDiagram } from './defaultDiagram';

test('default diagram starts with flowchart', () => {
  expect(defaultDiagram.startsWith('flowchart')).toBe(true);
});
