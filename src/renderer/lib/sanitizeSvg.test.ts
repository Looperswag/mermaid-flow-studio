import { describe, expect, it } from 'vitest';

import { sanitizeSvg } from './sanitizeSvg';

// A pure-SVG sample (the shape used now that htmlLabels=false). It also carries the
// free-layout data-node-* attributes, which must survive sanitization.
const dirty = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90" viewBox="0 0 120 90">
  <style>.node rect { fill: #dbeee5; }</style>
  <marker id="arrow"><path d="M0,0 L10,5 L0,10 z"/></marker>
  <g class="node" data-node-key="A" data-node-x="10" data-node-y="20" data-node-width="40" data-node-height="20">
    <rect class="label-container" width="40" height="20" style="fill:#fff" onclick="alert(1)"/>
  </g>
  <path class="flowchart-link" d="M0,0 L40,40" marker-end="url(#arrow)"/>
  <text x="10" y="15" class="nodeLabel">用户入口</text>
  <script>alert('xss')</script>
  <a xlink:href="javascript:alert(1)"><text>link</text></a>
</svg>`;

describe('sanitizeSvg', () => {
  const clean = sanitizeSvg(dirty);

  it('strips script tags, inline event handlers, and javascript: URLs', () => {
    expect(clean).not.toMatch(/<script/i);
    expect(clean).not.toMatch(/onclick/i);
    expect(clean.toLowerCase()).not.toContain('javascript:');
  });

  it('preserves the rendering surface: style, marker, and SVG text labels', () => {
    expect(clean).toMatch(/<style/i);
    expect(clean).toMatch(/<marker/i);
    expect(clean).toMatch(/marker-end/i);
    expect(clean).toContain('用户入口');
  });

  it('preserves free-layout data-node-* attributes', () => {
    expect(clean).toMatch(/data-node-key="A"/);
    expect(clean).toMatch(/data-node-x="10"/);
    expect(clean).toMatch(/data-node-width="40"/);
  });
});
