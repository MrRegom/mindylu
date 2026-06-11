import React from 'react';
import { 
  Sparkles, Shirt, ShoppingBag, Star, Crown, Heart, Diamond, Gift, Scissors, Tag, Gem
} from 'lucide-react';

export const CATEGORY_ICONS = {
  Sparkles: <Sparkles size={28} strokeWidth={1.5} />,
  Shirt: <Shirt size={28} strokeWidth={1.5} />,
  ShoppingBag: <ShoppingBag size={28} strokeWidth={1.5} />,
  Star: <Star size={28} strokeWidth={1.5} />,
  Crown: <Crown size={28} strokeWidth={1.5} />,
  Heart: <Heart size={28} strokeWidth={1.5} />,
  Diamond: <Diamond size={28} strokeWidth={1.5} />,
  Gift: <Gift size={28} strokeWidth={1.5} />,
  Scissors: <Scissors size={28} strokeWidth={1.5} />,
  Tag: <Tag size={28} strokeWidth={1.5} />,
  Gem: <Gem size={28} strokeWidth={1.5} />
};

export const ICON_NAMES_ES = {
  Sparkles: 'Destellos (Por Defecto)',
  Shirt: 'Prenda / Ropa',
  ShoppingBag: 'Bolsa de Compras',
  Star: 'Estrella',
  Crown: 'Corona',
  Heart: 'Corazón',
  Diamond: 'Diamante',
  Gift: 'Regalo',
  Scissors: 'Sastrería / Medidas',
  Tag: 'Etiqueta / Colección',
  Gem: 'Joya / Accesorio'
};

export const getCategoryIcon = (iconName, props = {}) => {
  const IconComponent = CATEGORY_ICONS[iconName];
  if (!IconComponent) return <Sparkles size={28} strokeWidth={1.5} {...props} />;
  
  return React.cloneElement(IconComponent, props);
};
