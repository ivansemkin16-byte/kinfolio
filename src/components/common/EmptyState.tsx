import React from 'react';

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 bg-surface/85 rounded-md border border-dashed border-border-strong my-4 shadow-soft">
      {icon && (
        <div className="w-11 h-11 rounded-full bg-surface-kraft text-primary flex items-center justify-center mb-3.5 border border-border-strong/60">
          {icon}
        </div>
      )}
      <h3 className="type-title text-primary">{title}</h3>
      <p className="text-[14px] text-secondary max-w-md mt-2 mb-6 leading-[1.55]">
        {description}
      </p>
      {action && <div className="flex flex-wrap items-center justify-center gap-3">{action}</div>}
    </div>
  );
};
