import React from 'react';
import './GlobalSpinner.css';

const GlobalSpinner = ({ isVisible, text = 'Procesando...' }) => {
  if (!isVisible) return null;

  return (
    <div className="global-spinner-overlay animate-fade-in">
      <div className="global-spinner-container">
        <div className="spinner"></div>
        <p className="spinner-text">{text}</p>
      </div>
    </div>
  );
};

export default GlobalSpinner;
