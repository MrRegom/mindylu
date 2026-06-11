export const COLOR_HEX_MAP = {
  'negro': '#000000',
  'blanco': '#FFFFFF',
  'rojo': '#FF3B30',
  'azul': '#007AFF',
  'verde': '#34C759',
  'amarillo': '#FFCC00',
  'gris': '#8E8E93',
  'beige': '#F5F5DC',
  'café': '#8B4513',
  'cafe': '#8B4513',
  'rosado': '#FF69B4',
  'morado': '#AF52DE',
  'lila': '#C8A2C8',
  'naranjo': '#FF9500',
  'celeste': '#5AC8FA',
  'mostaza': '#FFDB58',
  'burdeo': '#800020',
  'fucsia': '#FF00FF',
  'turquesa': '#40E0D0',
};

export const getHexForColor = (colorName) => {
  if (!colorName) return null;
  const normalized = colorName.toLowerCase().trim();
  return COLOR_HEX_MAP[normalized] || null;
};
