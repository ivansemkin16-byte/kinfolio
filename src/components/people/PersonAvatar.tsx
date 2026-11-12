import React from 'react';

interface PersonAvatarProps {
  name: string;
  photoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const PersonAvatar: React.FC<PersonAvatarProps> = ({
  name,
  photoUrl,
  size = 'md',
  className = '',
}) => {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizeStyles = {
    sm: 'w-9 h-9 text-[13px]',
    md: 'w-12 h-12 text-[16px]',
    lg: 'w-14 h-14 text-[19px]',
    xl: 'w-[76px] h-[76px] text-[24px]',
  };

  if (photoUrl) {
    return (
      <div
        className={`p-1 bg-surface border border-border-strong/75 rounded-[3px] shadow-soft shrink-0 ${sizeStyles[size]} ${className}`}
      >
        <img
          src={photoUrl}
          alt={name}
          className="w-full h-full object-cover rounded-[2px]"
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`bg-surface-kraft text-primary border border-border-strong/80 rounded-[4px] flex items-center justify-center font-serif font-semibold tracking-tight shrink-0 shadow-soft ${sizeStyles[size]} ${className}`}
    >
      {initials || '?'}
    </div>
  );
};
