import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

const sizes = {
  sm: 'w-[16px] h-[16px]',
  md: 'w-[20px] h-[20px]',
  lg: 'w-[32px] h-[32px]',
};

export const Spinner = ({ size = 'md', className, ...rest }) => {
  return (
    <Loader2
      className={clsx('animate-spin text-current', sizes[size], className)}
      {...rest}
    />
  );
};
