const nodeIdPattern = /\b([A-Za-z0-9_]+)\s*(?=[[{(])/g;
const edgePattern = /\b([A-Za-z0-9_]+)\b\s*(?:--+|==+|-\.|\.-|-.+->|==.+=>)\s*(?:\|[^|]*\|\s*)?\b([A-Za-z0-9_]+)\b/g;

export function extractFlowchartNodeKeys(source: string) {
  const keys = new Set<string>();

  for (const match of source.matchAll(nodeIdPattern)) {
    keys.add(match[1]);
  }

  for (const match of source.matchAll(edgePattern)) {
    keys.add(match[1]);
    keys.add(match[2]);
  }

  return [...keys];
}
