import '@testing-library/jest-dom/vitest';

interface SvgElementWithMeasurement extends SVGElement {
  getBBox?: () => { x: number; y: number; width: number; height: number };
  getComputedTextLength?: () => number;
}

const svgPrototype = SVGElement.prototype as SvgElementWithMeasurement;

if (!svgPrototype.getBBox) {
  svgPrototype.getBBox = function getBBox() {
    const width = Number.parseFloat(this.getAttribute('width') ?? '120');
    const height = Number.parseFloat(this.getAttribute('height') ?? '40');

    return {
      x: 0,
      y: 0,
      width: Number.isFinite(width) ? width : 120,
      height: Number.isFinite(height) ? height : 40,
    };
  };
}

// jsdom does not measure SVG text. With htmlLabels=false Mermaid measures labels via
// getComputedTextLength, so provide a deterministic approximation for tests.
if (!svgPrototype.getComputedTextLength) {
  svgPrototype.getComputedTextLength = function getComputedTextLength() {
    return (this.textContent?.length ?? 0) * 8;
  };
}
