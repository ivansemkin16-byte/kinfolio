import React, { useState } from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'default' | 'soft' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export const IconButton: React.FC<IconButtonProps> = ({
  label,
  variant = 'default',
  size = 'md',
  className = '',
  disabled,
  children,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  ...props
}) => {
  const [pressed, setPressed] = useState(false);

  // Expanded invisible hit target via ::before ensures >= 44px touch ergonomics without visual bloat
  const sizeStyles = {
    sm: 'w-8 h-8 rounded-sm before:content-[""] before:absolute before:-inset-1.5',
    md: 'w-10 h-10 rounded-md before:content-[""] before:absolute before:-inset-0.5',
  };

  const variantStyles = {
    default: 'text-secondary hover:text-primary hover:bg-surface-soft',
    soft: 'text-green-900 bg-surface-soft hover:bg-surface-green',
    danger: 'text-secondary hover:text-danger-text hover:bg-danger-bg',
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onPointerDown={(e) => {
        if (!disabled) setPressed(true);
        onPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        setPressed(false);
        onPointerUp?.(e);
      }}
      onPointerLeave={(e) => {
        setPressed(false);
        onPointerLeave?.(e);
      }}
      onPointerCancel={(e) => {
        setPressed(false);
        onPointerCancel?.(e);
      }}
      className={`relative inline-flex items-center justify-center transition-[background-color,color,opacity,transform] duration-[110ms] ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/45 focus-visible:ring-offset-1 focus-visible:ring-offset-canvas disabled:opacity-40 disabled:pointer-events-none active:scale-[0.92] ${
        pressed && !disabled ? 'scale-[0.92]' : ''
      } ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
