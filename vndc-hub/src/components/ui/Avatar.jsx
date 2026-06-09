import React from 'react';
import { clsx } from 'clsx';

const sizes = {
  sm: 'w-[28px] h-[28px] text-xs',
  md: 'w-[36px] h-[36px] text-sm',
  lg: 'w-[48px] h-[48px] text-base',
  xl: 'w-[64px] h-[64px] text-xl',
};

const colors = [
  'bg-green-100 text-green-700',
  'bg-teal-100 text-teal-700',
  'bg-slate-100 text-slate-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-cyan-100 text-cyan-700',
];

const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ')
    .map(word => word.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const getColorClass = (name) => {
  if (!name) return colors[2];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const Avatar = ({ name, src, size = 'md', className, ...rest }) => {
  const initials = getInitials(name);
  const colorClass = src ? '' : getColorClass(name);

  return (
    <div
      className={clsx(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 font-semibold',
        sizes[size],
        colorClass,
        className
      )}
      {...rest}
    >
      {src ? (
        <img src={src} alt={name || 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};
