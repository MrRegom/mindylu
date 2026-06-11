import React from 'react';
import { getHexForColor } from '../utils/colorMap';
import { Check } from 'lucide-react';
import './ColorPalettePicker.css';

const ColorPalettePicker = ({ availableColors, selectedColor, onSelectColor }) => {
  return (
    <div className="color-palette-picker">
      {availableColors.map((colorName) => {
        const hex = getHexForColor(colorName);
        const isSelected = selectedColor === colorName;
        // If it's a light color, we use dark text/check so it's visible. 
        // Also if we don't have a hex (it's a generic rainbow), we use light check.
        const isLight = hex === '#FFFFFF' || hex === '#F5F5DC' || hex === '#C8A2C8';
        
        return (
          <div 
            key={colorName}
            className={`color-circle ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelectColor(colorName)}
            title={colorName}
          >
            <div 
              className="color-fill"
              style={{ 
                background: hex || 'linear-gradient(45deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
                border: isLight ? '1px solid #ddd' : 'none'
              }}
            />
            {isSelected && (
              <div className={`color-check ${isLight ? 'check-dark' : 'check-light'}`}>
                <Check size={16} strokeWidth={3} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ColorPalettePicker;
