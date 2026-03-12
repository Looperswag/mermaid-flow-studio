import '@testing-library/jest-dom/vitest';

if (!SVGElement.prototype.getBBox) {
  SVGElement.prototype.getBBox = function getBBox() {
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
