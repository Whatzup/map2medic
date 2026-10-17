import React from 'react';

interface Map2MedicLogoProps {
  variant?: 'full' | 'icon-only' | 'light';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export const Map2MedicLogo: React.FC<Map2MedicLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
}) => {
  const heightPxMap = {
    xs: 28,
    sm: 36,
    md: 44,
    lg: 56,
    xl: 72,
  };

  const height = heightPxMap[size];
  const isLight = variant === 'light';

  return (
    <div className={`inline-flex items-center shrink-0 select-none ${className}`}>
      <img
        src="/map2medic_logo.jpeg"
        alt="map2medic logo"
        style={{ height: `${height}px`, width: 'auto' }}
        className={`shrink-0 object-contain rounded-lg ${isLight ? 'bg-white p-1 shadow-xs' : ''}`}
      />
    </div>
  );
};
