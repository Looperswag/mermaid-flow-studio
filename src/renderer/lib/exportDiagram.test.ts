import { buildExportFileName, qualityScaleMap } from './exportDiagram';

test('maps quality presets to bitmap scale factors', () => {
  expect(qualityScaleMap.low).toBe(1);
  expect(qualityScaleMap.medium).toBe(2);
  expect(qualityScaleMap.high).toBe(3);
});

test('builds a timestamped export filename', () => {
  const result = buildExportFileName(new Date('2026-03-10T08:09:10Z'));

  expect(result).toBe('mermaid-export-20260310-080910');
});
