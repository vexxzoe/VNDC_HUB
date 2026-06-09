import React from 'react';
import { clsx } from 'clsx';

const variantClasses = {
  default: 'bg-surface-100 text-surface-600',
  primary: 'bg-primary-50 text-primary-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-yellow-50 text-yellow-700',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
  outline: 'bg-transparent border border-surface-200 text-surface-600',
};

const dotColors = {
  default: 'bg-surface-400',
  primary: 'bg-primary-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  outline: 'bg-surface-400',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export const Badge = ({
  variant = 'default',
  size = 'md',
  dot = false,
  className,
  children,
  ...rest
}) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {dot && (
        <span className={clsx('mr-1.5 h-1.5 w-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  );
};
