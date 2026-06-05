import { describe, expect, it } from 'vitest';

import { sanitizeSvg } from './sanitizeSvg';

// A pure-SVG sample (the shape DOMPurify can faithfully represent under jsdom). Preservation
// of <foreignObject> HTML labels is browser-specific and is covered by the Playwright e2e.
const dirty = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90" viewBox="0 0 120 90">
  <style>.node rect { fill: #dbeee5; }</style>
  <marker id="arrow"><path d="M0,0 L10,5 L0,10 z"/></marker>
  <g class="node"><rect width="40" height="20" style="fill:#fff" onclick="alert(1)"/></g>
  <path d="M0,0 L40,40" marker-end="url(#arrow)"/>
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

  it('preserves the Mermaid rendering surface: style, marker, and text labels', () => {
    expect(clean).toMatch(/<style/i);
    expect(clean).toMatch(/<marker/i);
    expect(clean).toMatch(/marker-end/i);
    expect(clean).toContain('用户入口');
  });

  it('keeps the root svg namespace and dimensions', () => {
    expect(clean).toMatch(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(clean).toMatch(/width="120"/);
    expect(clean).toMatch(/height="90"/);
  });
});
