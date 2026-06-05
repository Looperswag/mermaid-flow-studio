import { describe, expect, it } from 'vitest';

import { templates } from './templates';
import { validateMermaid } from './validateMermaid';

describe('templates', () => {
  it('exposes more than one starter template', () => {
    expect(templates.length).toBeGreaterThan(1);
  });

  it('every template is a valid flowchart with a unique id', () => {
    const ids = new Set<string>();
    for (const template of templates) {
      expect(validateMermaid(template.source).valid).toBe(true);
      expect(ids.has(template.id)).toBe(false);
      ids.add(template.id);
    }
  });
});
