import React from 'react';

interface GiftImageProps {
  src?: string;
  alt: string;
  showPlaceholder?: boolean;
  className?: string;
}

export const GiftImage: React.FC<GiftImageProps> = ({
  src,
  alt,
  className = '',
}) => {
  if (!src) return null;

  return (
    <div
      className={`w-full aspect-[16/10] bg-surface-soft overflow-hidden border-b border-border ${className}`}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  );
};
