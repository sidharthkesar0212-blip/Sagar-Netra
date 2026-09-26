import React from 'react';

interface PageHeaderProps {
  step: string;
  total: string;
  title: string;
  subtitle: string;
  rightElement?: React.ReactNode;
}

export default function PageHeader({ step, total, title, subtitle, rightElement }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="label-xs text-navy-300 font-mono tracking-wider mb-1">
          {step} / {total}
        </div>
        <h1 className="text-2xl font-bold text-navy tracking-tight mb-1">{title}</h1>
        <p className="text-sm text-navy-300 max-w-2xl leading-relaxed">{subtitle}</p>
      </div>

      {rightElement}
    </div>
  );
}

