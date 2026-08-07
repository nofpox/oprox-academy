import React from 'react';

interface SkeletonProps {
  type?: 'card' | 'table' | 'metrics' | 'list' | 'text';
  count?: number;
  theme?: 'dark' | 'light';
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({
  type = 'card',
  count = 3,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const shimmerClass = isDark ? 'animate-shimmer bg-slate-900 border-slate-800' : 'animate-shimmer-light bg-slate-200/80 border-slate-300';
  const pulseBlock = isDark ? 'bg-slate-800/60' : 'bg-slate-300/60';

  if (type === 'metrics') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border ${shimmerClass} space-y-3`}
          >
            <div className={`h-3 w-1/2 rounded ${pulseBlock}`} />
            <div className={`h-7 w-3/4 rounded ${pulseBlock}`} />
            <div className={`h-2 w-1/3 rounded ${pulseBlock}`} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`p-5 rounded-2xl border ${shimmerClass} space-y-4 w-full`}>
        <div className={`h-4 w-1/4 rounded ${pulseBlock}`} />
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className={`h-4 w-1/3 rounded ${pulseBlock}`} />
              <div className={`h-4 w-1/4 rounded ${pulseBlock}`} />
              <div className={`h-4 w-1/6 rounded ${pulseBlock}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-3 w-full">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl border ${shimmerClass} flex items-center justify-between gap-4`}
          >
            <div className="flex items-center gap-3 w-full">
              <div className={`w-8 h-8 rounded-lg ${pulseBlock} shrink-0`} />
              <div className="space-y-1.5 w-full">
                <div className={`h-3 w-1/2 rounded ${pulseBlock}`} />
                <div className={`h-2 w-1/3 rounded ${pulseBlock}`} />
              </div>
            </div>
            <div className={`h-6 w-16 rounded-lg ${pulseBlock} shrink-0`} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`p-6 rounded-2xl border ${shimmerClass} space-y-4`}
        >
          <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-xl ${pulseBlock}`} />
            <div className={`w-12 h-4 rounded ${pulseBlock}`} />
          </div>
          <div className={`h-4 w-2/3 rounded ${pulseBlock}`} />
          <div className={`h-3 w-full rounded ${pulseBlock}`} />
          <div className={`h-3 w-4/5 rounded ${pulseBlock}`} />
          <div className={`h-8 w-full rounded-xl ${pulseBlock} pt-2`} />
        </div>
      ))}
    </div>
  );
};
