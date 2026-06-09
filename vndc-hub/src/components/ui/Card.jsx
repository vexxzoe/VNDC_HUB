import React from 'react';
import { clsx } from 'clsx';

const variantClasses = {
  default: 'bg-[var(--color-surface)] shadow-card',
  flat: 'bg-[var(--color-surface)]',
  bordered: 'bg-[var(--color-surface)] border border-[var(--color-border)]',
};

const paddingClasses = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = React.forwardRef(({
  variant = 'default',
  padding = 'md',
  hover = false,
  className,
  children,
  ...rest
}, ref) => {
  return (
    <div
      ref={ref}
      className={clsx(
        'rounded-2xl transition-shadow',
        variantClasses[variant],
        paddingClasses[padding],
        hover && 'hover:shadow-card-md cursor-pointer',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';
