import React from 'react';

interface DetailGroupProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const DetailGroup: React.FC<DetailGroupProps> = ({ title, action, children }) => {
  return (
    <section className="receipt-slip border border-border-strong/65 rounded-[2px] px-4 sm:px-5 py-4">
      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-dashed border-border-strong/70">
        <h3 className="font-mono text-[11px] font-semibold text-secondary uppercase tracking-[0.08em]">
          {title}
        </h3>
        {action && <div>{action}</div>}
      </div>
      <div className="divide-y divide-dotted divide-border-strong/60">{children}</div>
    </section>
  );
};

interface DetailItemProps {
  label: string;
  value?: string;
  emptyText?: string;
}

export const DetailItem: React.FC<DetailItemProps> = ({
  label,
  value,
  emptyText = '—',
}) => {
  return (
    <div className="py-2.5 flex items-baseline justify-between gap-3">
      <span className="font-mono text-[11.5px] uppercase tracking-[0.04em] text-secondary shrink-0">
        {label}
      </span>
      <span
        className={`font-mono text-[13px] text-right leading-[1.4] tabular-nums break-words ${
          value ? 'font-semibold text-primary' : 'text-muted'
        }`}
      >
        {value || emptyText}
      </span>
    </div>
  );
};
