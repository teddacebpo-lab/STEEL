import React, { ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  fullWidth?: boolean;
  className?: string;
  position?: 'top' | 'bottom';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, fullWidth = false, className = '', position = 'top' }) => {
  const positionClass = position === 'top' 
    ? 'bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2' 
    : 'top-[calc(100%+8px)] left-1/2 -translate-x-1/2';
    
  const arrowClass = position === 'top'
    ? 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 dark:border-t-slate-700'
    : 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 dark:border-b-slate-700';

  return (
    <div className={`group relative ${fullWidth ? 'w-full' : 'inline-block'} ${className}`}>
      {children}
      <div className={`pointer-events-none absolute ${positionClass} opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 z-50 w-max max-w-[280px]`}>
        <div className="bg-slate-800 dark:bg-slate-700 text-white text-xs py-2 px-3 rounded-md shadow-lg relative border border-slate-700 dark:border-slate-600 text-left">
          {content}
          {/* Arrow */}
          <div className={`absolute border-4 border-transparent ${arrowClass}`}></div>
        </div>
      </div>
    </div>
  );
};

export default Tooltip;