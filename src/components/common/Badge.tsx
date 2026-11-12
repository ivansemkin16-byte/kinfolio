import React from 'react';

export interface BadgeProps {
  variant?: 'default' | 'accent' | 'warning' | 'danger' | 'success' | 'info';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  dot = false,
}) => {
  const baseStyles =
    'inline-flex items-center font-mono font-medium rounded-[3px] transition-colors tabular-nums tracking-[0.02em]';

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5 leading-[1.35]',
    md: 'text-[11.5px] px-2.5 py-0.5 gap-1.5 leading-[1.35]',
  };

  const variantStyles = {
    default: 'bg-surface-soft text-secondary border border-border',
    accent: 'bg-surface-green text-green-900 border border-green-300/80',
    success: 'bg-surface-green text-green-900 border border-green-300/80',
    warning: 'bg-warning-bg text-warning-text border border-warning-border',
    danger: 'bg-danger-bg text-danger-text border border-danger-border uppercase tracking-[0.05em]',
    info: 'bg-info-bg text-info-text border border-info-border',
  };

  const dotStyles = {
    default: 'bg-secondary',
    accent: 'bg-green-700',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]} shrink-0`} />}
      {children}
    </span>
  );
};
