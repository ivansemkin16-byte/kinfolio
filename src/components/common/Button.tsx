import React, { useState } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'soft' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  ...props
}) => {
  const [pressed, setPressed] = useState(false);

  const baseStyles =
    'relative inline-flex items-center justify-center whitespace-nowrap shrink-0 font-medium tracking-[-0.005em] transition-[background-color,border-color,color,opacity,transform,box-shadow] duration-[110ms] ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/45 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.97]';

  const sizeStyles = {
    sm: 'min-h-[36px] text-[13px] px-3 rounded-sm gap-1.5 before:content-[""] before:absolute before:-inset-y-1 before:inset-x-0',
    md: 'min-h-[42px] text-[13.5px] px-4 rounded-sm gap-2',
    lg: 'min-h-[46px] text-[14.5px] px-5 rounded-sm gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-btn-primary text-btn-primary-text hover:bg-btn-primary-hover shadow-soft',
    secondary:
      'bg-surface text-primary border border-border-strong/70 hover:bg-surface-soft hover:border-border-strong shadow-soft',
    soft: 'bg-surface-kraft text-primary border border-border hover:bg-surface-green hover:text-green-900',
    accent: 'bg-surface-green text-green-900 border border-green-300/70 hover:bg-green-300/35',
    ghost: 'text-secondary hover:text-primary hover:bg-surface-soft/80',
    danger:
      'bg-danger-bg text-danger-text border border-danger-border hover:brightness-95',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
        pressed && !disabled ? 'scale-[0.97]' : ''
      } ${className}`}
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
      {...props}
    >
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      {children}
    </button>
  );
};
