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

      {rightElement ? (
        rightElement
      ) : (
        <div className="hidden sm:flex items-center gap-3 select-none opacity-85 pt-1">
          <div className="text-right">
            <div className="text-[10px] font-bold tracking-widest text-navy-400 uppercase font-mono">Cleaner Oceans</div>
            <div className="text-[9px] font-medium tracking-widest text-navy-300 uppercase font-mono">Safer Tomorrow</div>
          </div>
          <svg className="w-20 h-9 text-ocean-300 stroke-current fill-none" viewBox="0 0 100 35">
            <path d="M0 22 Q25 5, 50 18 T100 12" strokeWidth="1.75" strokeLinecap="round" />
            <path d="M0 29 Q25 14, 50 25 T100 20" strokeWidth="1" strokeOpacity="0.6" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

