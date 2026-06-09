import React from 'react';
import { clsx } from 'clsx';

export const Skeleton = ({
  variant = 'text',
  width,
  height,
  className,
  ...rest
}) => {
  const variantClasses = {
    text: 'rounded-md',
    circle: 'rounded-full',
    rect: 'rounded-xl',
  };

  return (
    <div
      className={clsx(
        'bg-surface-200 animate-pulse-soft',
        variantClasses[variant],
        className
      )}
      style={{ width, height }}
      {...rest}
    />
  );
};
