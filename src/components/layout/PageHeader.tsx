import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-dashed border-border-strong/70">
      <div className="space-y-1 min-w-0">
        <h1 className="type-display text-primary">
          {title}
        </h1>
        {subtitle && (
          <p className="type-hand text-[21px] sm:text-[23px] text-secondary leading-[1.2]">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="shrink-0 flex flex-wrap items-center gap-2.5">{action}</div>}
    </div>
  );
};
