interface StatusBadgeProps {
  status: 'pending' | 'confirmed' | 'rejected' | 'needs-review' | 'complete' | 'active' | 'inactive';
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const styles = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', dot: 'bg-amber-400' },
    confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    rejected: { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-200', dot: 'bg-red-400' },
    'needs-review': { bg: 'bg-ocean-50', text: 'text-ocean', border: 'border-ocean-200', dot: 'bg-ocean' },
    complete: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    active: { bg: 'bg-ocean-50', text: 'text-ocean', border: 'border-ocean-200', dot: 'bg-ocean' },
    inactive: { bg: 'bg-navy-50', text: 'text-navy-300', border: 'border-navy-100', dot: 'bg-navy-200' },
  };

  const s = styles[status];
  const text = label || status.replace('-', ' ');

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${s.bg} ${s.text} ${s.border} border`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      <span className="capitalize">{text}</span>
    </span>
  );
}
