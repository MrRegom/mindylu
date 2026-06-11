import React from 'react';
import { 
  Sparkles, Shirt, ShoppingBag, Star, Crown, Heart, Diamond, Gift, Scissors, Tag, Gem,
  Layers, Cloud
} from 'lucide-react';

export const CATEGORY_ICONS = {
  Shirt: <Shirt size={28} strokeWidth={1.5} />,
  Layers: <Layers size={28} strokeWidth={1.5} />,
  Scissors: <Scissors size={28} strokeWidth={1.5} />,
  Cloud: <Cloud size={28} strokeWidth={1.5} />,
  Sparkles: <Sparkles size={28} strokeWidth={1.5} />,
  ShoppingBag: <ShoppingBag size={28} strokeWidth={1.5} />,
  Star: <Star size={28} strokeWidth={1.5} />,
  Heart: <Heart size={28} strokeWidth={1.5} />,
  Crown: <Crown size={28} strokeWidth={1.5} />,
  Diamond: <Diamond size={28} strokeWidth={1.5} />,
  Tag: <Tag size={28} strokeWidth={1.5} />
};

export const ICON_NAMES_ES = {
  Shirt: '► Poleras y Blusas',
  Layers: '► Chaquetas y Abrigos',
  Scissors: '► Pantalones y Jeans',
  Cloud: '► Sweaters y Chalecos',
  Sparkles: '► Vestidos y Faldas',
  ShoppingBag: 'Bolsa de Compras',
  Star: 'Estrella',
  Heart: 'Corazón',
  Crown: 'Corona',
  Diamond: 'Diamante',
  Tag: 'Etiquetas / Descuentos'
};

export const getCategoryIcon = (iconName, props = {}) => {
  const IconComponent = CATEGORY_ICONS[iconName];
  if (!IconComponent) return <Sparkles size={28} strokeWidth={1.5} {...props} />;
  
  return React.cloneElement(IconComponent, props);
};
