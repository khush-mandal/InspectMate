import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverEffect?: boolean;
  className?: string;
  glowColor?: 'indigo' | 'teal' | 'amber' | 'rose' | 'none';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  hoverEffect = false,
  className = '',
  glowColor = 'none',
  ...props
}) => {
  const glowClasses = {
    none: '',
    indigo: 'hover:border-indigo-300/80 hover:shadow-indigo-500/10',
    teal: 'hover:border-teal-300/80 hover:shadow-teal-500/10',
    amber: 'hover:border-amber-300/80 hover:shadow-amber-500/10',
    rose: 'hover:border-rose-300/80 hover:shadow-rose-500/10',
  }[glowColor];

  return (
    <div
      className={`
        glass-card rounded-[22px] p-5 sm:p-6 text-slate-800
        ${hoverEffect ? 'glass-card-hover cursor-pointer' : ''}
        ${glowClasses}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
