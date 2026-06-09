import React from 'react';
import { clsx } from 'clsx';

export const Input = React.forwardRef(({
  label,
  error,
  hint,
  icon: IconLeft,
  iconRight: IconRight,
  className,
  id,
  ...rest
}, ref) => {
  const inputId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);

  return (
    <div className={clsx('w-full flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-surface-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        {IconLeft && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <IconLeft className="h-5 w-5 text-surface-400" />
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full rounded-xl border bg-white px-4 py-2.5 text-sm transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
            error 
              ? 'border-red-500 text-red-900 focus-visible:ring-red-500' 
              : 'border-surface-200 text-surface-900',
            IconLeft && 'pl-10',
            IconRight && 'pr-10',
            rest.disabled && 'opacity-60 cursor-not-allowed bg-surface-50'
          )}
          {...rest}
        />
        
        {IconRight && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <IconRight className="h-5 w-5 text-surface-400" />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {hint && !error && <p className="text-sm text-surface-500">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';
