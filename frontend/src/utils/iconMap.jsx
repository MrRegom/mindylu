import React from 'react';
import { 
  Sparkles, Shirt, ShoppingBag, Star, Crown, Heart, Diamond, Gift, Tag, Gem
} from 'lucide-react';

const PantsIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 2h12a1 1 0 0 1 1 1v19H14l-2-12-2 12H5V3a1 1 0 0 1 1-1z"/>
  </svg>
);

const DressIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 2h6l2 6 3.5 14h-17L7 8l2-6z"/>
    <path d="M7 8h10"/>
  </svg>
);

const JacketIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M7 3h10l4 6-2 2-2-4v14H7V7L5 11 3 9l4-6z"/>
    <path d="M12 3v19"/>
  </svg>
);

const SweaterIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M7 3h10l4 6-2 2-2-4v14H7V7L5 11 3 9l4-6z"/>
    <path d="M9 3l3 4 3-4"/>
  </svg>
);

export const CATEGORY_ICONS = {
  Shirt: <Shirt size={28} strokeWidth={1.5} />,
  Jacket: <JacketIcon />,
  Pants: <PantsIcon />,
  Sweater: <SweaterIcon />,
  Dress: <DressIcon />,
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
  Jacket: '► Chaquetas y Abrigos',
  Pants: '► Pantalones y Jeans',
  Sweater: '► Sweaters y Chalecos',
  Dress: '► Vestidos y Faldas',
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
