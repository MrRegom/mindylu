import React, { useState, useEffect, useRef } from 'react';
import { Skeleton } from './Skeleton';

export const ImageLoader = ({ src, alt, className = '', style = {}, skeletonClass = '', objectFit = 'cover' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setShowSkeleton(false);

    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalHeight !== 0) {
      setIsLoaded(true);
      return;
    }

    const timer = setTimeout(() => setShowSkeleton(true), 100);
    return () => clearTimeout(timer);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }} className={className}>
      {/* Esqueleto de carga visible mientras la imagen no haya cargado */}
      {(!isLoaded && showSkeleton) && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
          <Skeleton className={skeletonClass} style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} />
        </div>
      )}

      {/* Imagen real, cargada de forma diferida (lazy) */}
      <img
        ref={imgRef}
        src={hasError ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E" : src}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: objectFit,
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'scale(1)' : 'scale(1.05)',
          transition: 'opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1), transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
          position: 'relative',
          zIndex: 2,
        }}
      />
    </div>
  );
};
