import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

const variantClasses = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'bg-white border border-surface-200 hover:bg-surface-50 text-surface-900',
  ghost: 'bg-transparent hover:bg-surface-100 text-surface-900',
  danger: 'bg-white border border-red-200 text-red-600 hover:bg-red-50',
  success: 'bg-green-50 text-green-700 border-none hover:bg-green-100',
};

const sizeClasses = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = React.forwardRef(({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: IconLeft,
  iconRight: IconRight,
  className,
  children,
  ...rest
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-xl font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none';
  const vClass = variantClasses[variant];
  const sClass = sizeClasses[size];
  const isDisabled = disabled || loading;

  const classes = clsx(
    baseClasses,
    vClass,
    sClass,
    isDisabled && 'opacity-60 cursor-not-allowed',
    className
  );

  return (
    <button ref={ref} disabled={isDisabled} className={classes} {...rest}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!loading && IconLeft && <IconLeft className="mr-2 h-4 w-4" />}
      {children}
      {!loading && IconRight && <IconRight className="ml-2 h-4 w-4" />}
    </button>
  );
});

Button.displayName = 'Button';
