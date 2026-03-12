export interface DiagramPalette {
  id: string;
  label: string;
  isDefault?: boolean;
  themeVariables: Record<string, string>;
}

export const diagramPalettes: DiagramPalette[] = [
  {
    id: 'studio-default',
    label: 'Studio',
    isDefault: true,
    themeVariables: {
      primaryColor: '#dbeee5',
      primaryBorderColor: '#1e4f46',
      primaryTextColor: '#142725',
      lineColor: '#355c58',
      secondaryColor: '#f5dcc1',
      tertiaryColor: '#f7f0e6',
      fontFamily:
        '"SF Pro Display", "Avenir Next", "PingFang SC", "Hiragino Sans GB", sans-serif',
    },
  },
];

export function getDiagramPalette(paletteId: string) {
  return (
    diagramPalettes.find((palette) => palette.id === paletteId) ?? diagramPalettes[0]
  );
}
