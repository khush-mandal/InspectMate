import React from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-xl font-medium',
    md: 'text-sm px-4 py-2 gap-2 rounded-xl font-semibold',
    lg: 'text-base px-5 py-2.5 gap-2.5 rounded-2xl font-semibold'
  }[size];

  let variantClasses = '';

  switch (variant) {
    case 'primary':
      variantClasses = `
        bg-gradient-to-r from-indigo-600 via-indigo-700 to-teal-600 text-white
        shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30
        hover:from-indigo-700 hover:to-teal-700 active:scale-[0.98] border border-indigo-400/30
      `;
      break;

    case 'secondary':
      variantClasses = `
        bg-white/70 hover:bg-white/95 text-slate-800 border border-slate-200/90
        backdrop-blur-md shadow-xs hover:shadow-md hover:border-slate-300
        active:scale-[0.98]
      `;
      break;

    case 'destructive':
      variantClasses = `
        bg-rose-50/80 hover:bg-rose-100/90 text-rose-700 border border-rose-200/90
        backdrop-blur-md shadow-xs hover:shadow-sm hover:border-rose-300
        active:scale-[0.98]
      `;
      break;

    case 'ghost':
      variantClasses = `
        bg-transparent hover:bg-slate-100/80 text-slate-700 active:scale-[0.98]
      `;
      break;
  }

  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center transition-all duration-200 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        ${variantClasses} ${sizeClasses} ${className}
      `}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  );
};
