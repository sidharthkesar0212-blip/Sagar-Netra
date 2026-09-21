import { Check } from 'lucide-react';

interface ProcessIndicatorProps {
  steps: { number: string; label: string; status: 'complete' | 'active' | 'pending' }[];
}

export default function ProcessIndicator({ steps }: ProcessIndicatorProps) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((step, i) => (
        <div key={step.number} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold border-2 transition-all ${
                step.status === 'complete'
                  ? 'bg-ocean border-ocean text-white'
                  : step.status === 'active'
                  ? 'bg-ocean-50 border-ocean text-ocean'
                  : 'bg-white border-navy-100 text-navy-300'
              }`}
            >
              {step.status === 'complete' ? (
                <Check size={16} strokeWidth={2.5} />
              ) : (
                step.number
              )}
            </div>
            <span
              className={`text-xs font-medium ${
                step.status === 'pending' ? 'text-navy-300' : 'text-navy'
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-0.5 flex-1 mx-3 mb-5 rounded transition-colors ${
                step.status === 'complete' ? 'bg-ocean' : 'bg-navy-100'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
