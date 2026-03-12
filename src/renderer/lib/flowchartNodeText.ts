function escapeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function nodeTokenPattern(nodeKey: string) {
  return new RegExp(
    `(\\b${escapeForRegex(nodeKey)}\\s*)(\\[[^\\]]*\\]|\\{[^}]*\\}|\\([^)]*\\))`,
  );
}

export function readFlowchartNodeText(source: string, nodeKey: string) {
  const match = source.match(nodeTokenPattern(nodeKey));
  if (!match) {
    return '';
  }

  return match[2].slice(1, -1);
}

export function updateFlowchartNodeText(source: string, nodeKey: string, nextText: string) {
  return source.replace(nodeTokenPattern(nodeKey), (_match, prefix: string, token: string) => {
    const opening = token[0];
    const closing = token[token.length - 1];
    return `${prefix}${opening}${nextText}${closing}`;
  });
}
