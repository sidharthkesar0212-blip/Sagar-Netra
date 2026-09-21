import { useLocation } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import {
  Upload,
  ScanLine,
  Search,
  CheckSquare,
  MapPin,
  FileText,
  Home,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { NAV_ITEMS } from '@/types';

const iconMap: Record<string, LucideIcon> = {
  Upload,
  ScanLine,
  Search,
  CheckSquare,
  MapPin,
  FileText,
};

export default function Sidebar() {
  const location = useLocation();
  const pathOrder = [
    '/survey-ingestion',
    '/sonar-analysis',
    '/evidence-intelligence',
    '/human-review',
    '/debris-hotspots',
    '/reports',
  ];
  const currentStepIndex = pathOrder.indexOf(location.pathname);

  return (
    <aside className="w-[256px] bg-white border-r border-navy-100/60 flex flex-col flex-shrink-0 h-full select-none">
      <div className="px-5 py-4 border-b border-navy-100/60 flex-shrink-0">
        <div className="label-xs text-navy-300 mb-1">ANALYSIS PIPELINE</div>
        <div className="text-sm font-semibold text-navy">Workflow Stages</div>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon] || Upload;
          const itemIndex = parseInt(item.number, 10) - 1;
          const showCheck = currentStepIndex !== -1 && itemIndex < currentStepIndex;

          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3 mx-2 rounded-md transition-all group ${
                  isActive
                    ? 'bg-ocean-50 text-navy'
                    : 'text-navy-400 hover:bg-mist-200 hover:text-navy'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {showCheck ? (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white flex-shrink-0 shadow-xs">
                      <Check size={13} strokeWidth={3} />
                    </div>
                  ) : (
                    <div
                      className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                        isActive
                          ? 'bg-ocean text-white'
                          : 'bg-navy-50 text-navy-300 group-hover:bg-navy-100 group-hover:text-navy-400'
                      }`}
                    >
                      {item.number}
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-1">
                    <Icon
                      size={16}
                      strokeWidth={1.75}
                      className={isActive ? 'text-ocean' : 'text-navy-300'}
                    />
                    <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                  </div>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-navy-100/60 flex-shrink-0">
        <NavLink
          to="/"
          className="flex items-center gap-2 text-sm text-navy-400 hover:text-ocean transition-colors font-medium"
          title="Return to initial landing page"
        >
          <Home size={15} strokeWidth={1.75} />
          Initial Page (Home)
        </NavLink>
      </div>
    </aside>
  );
}
