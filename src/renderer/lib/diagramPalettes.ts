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
  {
    id: 'harbor-blue',
    label: 'Harbor',
    themeVariables: {
      primaryColor: '#dcebf6',
      primaryBorderColor: '#1e5278',
      primaryTextColor: '#11293d',
      lineColor: '#2e658d',
      secondaryColor: '#f4d9c5',
      tertiaryColor: '#eef4f8',
      fontFamily:
        '"SF Pro Display", "Avenir Next", "PingFang SC", "Hiragino Sans GB", sans-serif',
    },
  },
  {
    id: 'ember-terracotta',
    label: 'Ember',
    themeVariables: {
      primaryColor: '#f4d8c8',
      primaryBorderColor: '#8a4b2a',
      primaryTextColor: '#3f2114',
      lineColor: '#a35b32',
      secondaryColor: '#f6ead9',
      tertiaryColor: '#fbf4ea',
      fontFamily:
        '"SF Pro Display", "Avenir Next", "PingFang SC", "Hiragino Sans GB", sans-serif',
    },
  },
  {
    id: 'moss-garden',
    label: 'Moss',
    themeVariables: {
      primaryColor: '#dbe7d1',
      primaryBorderColor: '#4b6a3d',
      primaryTextColor: '#20301b',
      lineColor: '#5f7d50',
      secondaryColor: '#e8dcc5',
      tertiaryColor: '#f4f4ec',
      fontFamily:
        '"SF Pro Display", "Avenir Next", "PingFang SC", "Hiragino Sans GB", sans-serif',
    },
  },
  {
    id: 'graphite-paper',
    label: 'Graphite',
    themeVariables: {
      primaryColor: '#e7e4df',
      primaryBorderColor: '#44403a',
      primaryTextColor: '#1f1d1a',
      lineColor: '#57524c',
      secondaryColor: '#ddd6cb',
      tertiaryColor: '#f4efe8',
      fontFamily:
        '"SF Pro Display", "Avenir Next", "PingFang SC", "Hiragino Sans GB", sans-serif',
    },
  },
  {
    id: 'citrus-sun',
    label: 'Citrus',
    themeVariables: {
      primaryColor: '#f6efc9',
      primaryBorderColor: '#8a6c12',
      primaryTextColor: '#3c3008',
      lineColor: '#a88518',
      secondaryColor: '#dce9d0',
      tertiaryColor: '#fcf9eb',
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
