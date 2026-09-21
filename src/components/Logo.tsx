import { Eye } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export default function Logo({ size = 'md', showText = true, variant = 'dark' }: LogoProps) {
  const sizeMap = {
    sm: { icon: 18, text: 'text-sm', sub: 'text-[9px]' },
    md: { icon: 24, text: 'text-base', sub: 'text-[10px]' },
    lg: { icon: 32, text: 'text-xl', sub: 'text-xs' },
    xl: { icon: 56, text: 'text-4xl', sub: 'text-sm' },
  };

  const s = sizeMap[size];
  const sagarColor = variant === 'light' ? 'text-white' : 'text-navy';
  const netraColor = variant === 'light' ? 'text-ocean-200' : 'text-ocean';
  const subColor = variant === 'light' ? 'text-ocean-200/70' : 'text-navy-300';

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative flex items-center justify-center rounded-lg"
        style={{
          width: s.icon + 12,
          height: s.icon + 12,
          background: variant === 'light' ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #082B52 0%, #0968B4 100%)',
        }}
      >
        <Eye
          size={s.icon}
          strokeWidth={1.75}
          className={variant === 'light' ? 'text-white' : 'text-white'}
        />
        <div
          className="absolute rounded-full border border-ocean-300/40"
          style={{ width: s.icon + 4, height: s.icon + 4 }}
        />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-extrabold tracking-wider ${s.text}`}>
            <span className={sagarColor}>SAGAR</span>
            <span className={netraColor}> NETRA</span>
          </div>
          <div className={`${s.sub} ${subColor} tracking-[0.18em] uppercase font-medium mt-1`}>
            Marine Debris Intelligence
          </div>
        </div>
      )}
    </div>
  );
}
