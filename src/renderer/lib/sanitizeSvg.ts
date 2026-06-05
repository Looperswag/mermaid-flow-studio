import DOMPurify from 'dompurify';

/**
 * Defense-in-depth sanitization of the Mermaid-produced SVG before it is injected via
 * dangerouslySetInnerHTML.
 *
 * Mermaid's `securityLevel: 'strict'` already sanitizes its output, but this is an
 * independent pass at the injection boundary so a single misconfiguration can't lead to
 * script execution. The config deliberately preserves everything Mermaid needs to render —
 * inline `<style>` theming, `<marker>` arrowheads, and `<foreignObject>` HTML labels — while
 * DOMPurify still strips `<script>`, event-handler attributes, and `javascript:` URLs.
 */
export function sanitizeSvg(svg: string): string {
  // NOTE: do NOT use USE_PROFILES here — the svg profile drops the XHTML content inside
  // <foreignObject>, which is where Mermaid renders every node/edge label. DOMPurify's
  // default allow-list spans HTML + SVG + the foreignObject namespace transition, which
  // keeps labels intact while still stripping <script>, on* handlers, and javascript: URLs.
  return DOMPurify.sanitize(svg, {
    ADD_TAGS: ['style', 'foreignObject'],
    ADD_ATTR: ['transform-origin', 'dominant-baseline'],
  });
}
