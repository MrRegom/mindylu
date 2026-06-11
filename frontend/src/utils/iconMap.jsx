import React from 'react';
import { 
  Sparkles, Shirt, ShoppingBag, Star, Crown, Glasses, 
  Heart, Diamond, Gift, Umbrella, Zap, Scissors, Briefcase, 
  Watch, Palmtree, Sun, Moon, Cloud, Snowflake, Flame, Droplet
} from 'lucide-react';

export const CATEGORY_ICONS = {
  Sparkles: <Sparkles size={28} strokeWidth={1.5} />,
  Shirt: <Shirt size={28} strokeWidth={1.5} />,
  ShoppingBag: <ShoppingBag size={28} strokeWidth={1.5} />,
  Star: <Star size={28} strokeWidth={1.5} />,
  Crown: <Crown size={28} strokeWidth={1.5} />,
  Glasses: <Glasses size={28} strokeWidth={1.5} />,
  Heart: <Heart size={28} strokeWidth={1.5} />,
  Diamond: <Diamond size={28} strokeWidth={1.5} />,
  Gift: <Gift size={28} strokeWidth={1.5} />,
  Umbrella: <Umbrella size={28} strokeWidth={1.5} />,
  Zap: <Zap size={28} strokeWidth={1.5} />,
  Scissors: <Scissors size={28} strokeWidth={1.5} />,
  Briefcase: <Briefcase size={28} strokeWidth={1.5} />,
  Watch: <Watch size={28} strokeWidth={1.5} />,
  Palmtree: <Palmtree size={28} strokeWidth={1.5} />,
  Sun: <Sun size={28} strokeWidth={1.5} />,
  Moon: <Moon size={28} strokeWidth={1.5} />,
  Cloud: <Cloud size={28} strokeWidth={1.5} />,
  Snowflake: <Snowflake size={28} strokeWidth={1.5} />,
  Flame: <Flame size={28} strokeWidth={1.5} />,
  Droplet: <Droplet size={28} strokeWidth={1.5} />
};

export const getCategoryIcon = (iconName, props = {}) => {
  const IconComponent = CATEGORY_ICONS[iconName];
  if (!IconComponent) return <Sparkles size={28} strokeWidth={1.5} {...props} />;
  
  return React.cloneElement(IconComponent, props);
};
