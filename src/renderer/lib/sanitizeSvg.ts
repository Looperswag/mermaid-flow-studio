import DOMPurify from 'dompurify';

/**
 * Defense-in-depth sanitization of the diagram SVG before it is injected via
 * dangerouslySetInnerHTML.
 *
 * Mermaid's `securityLevel: 'strict'` already sanitizes its output, but this is an
 * independent pass at the injection boundary so a single misconfiguration can't lead to
 * script execution. It runs on the final interactive SVG (after free-layout data-* attrs
 * are added), and DOMPurify's default allow-list preserves those data attributes, inline
 * <style>, <marker> arrowheads, and SVG <text> labels while stripping <script>, on*
 * handlers, and javascript: URLs.
 *
 * NOTE: do NOT use USE_PROFILES.svg — it drops foreignObject XHTML content; we render
 * labels as SVG <text> (htmlLabels:false) precisely so this pass keeps every label.
 */
export function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    ADD_TAGS: ['style', 'foreignObject'],
    ADD_ATTR: ['transform-origin', 'dominant-baseline'],
  });
}
