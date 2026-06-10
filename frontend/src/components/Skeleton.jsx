import React from 'react';
import './Skeleton.css';

// Componente para una caja de skeleton genérica
export const Skeleton = ({ className = '', style = {} }) => {
  return <div className={`pk2-skeleton ${className}`} style={style}></div>;
};

// Componente específico para las tarjetas de producto en el catálogo
export const SkeletonCard = () => {
  return (
    <div className="pk2-skeleton-card">
      <Skeleton className="skeleton-img" />
      <Skeleton className="skeleton-text" style={{ marginTop: '15px' }} />
      <Skeleton className="skeleton-text short" />
      <Skeleton className="skeleton-text price" />
    </div>
  );
};
