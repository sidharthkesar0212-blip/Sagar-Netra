import { Link } from 'react-router-dom';
import { Info, Target, HelpCircle, Eye, Home } from 'lucide-react';
import Logo from './Logo';

export default function Navbar() {
  return (
    <header className="h-16 bg-white/90 backdrop-blur-sm border-b border-navy-100/60 flex items-center px-6 sticky top-0 z-50">
      <Link to="/" className="flex items-center" title="Go to Home / Initial Page">
        <Logo size="sm" />
      </Link>

      <div className="w-px h-8 bg-navy-100 mx-4" />

      <div className="hidden md:flex flex-col leading-tight">
        <span className="text-xs font-bold text-navy-900 tracking-wide">Indian Ocean Survey Program</span>
        <span className="text-[11px] font-semibold text-navy-600 tracking-wide">Marine Debris Intelligence</span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-navy-600 hover:text-navy-900 hover:bg-mist-200 rounded-md transition-colors"
          >
            <Home size={15} strokeWidth={2} />
            Home
          </Link>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-navy-600 hover:text-navy-900 hover:bg-mist-200 rounded-md transition-colors cursor-pointer">
            <Info size={15} strokeWidth={2} />
            About
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-navy-600 hover:text-navy-900 hover:bg-mist-200 rounded-md transition-colors">
            <Target size={15} strokeWidth={2} />
            Our Mission
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-navy-600 hover:text-navy-900 hover:bg-mist-200 rounded-md transition-colors">
            <HelpCircle size={15} strokeWidth={2} />
            Help
          </button>
        </nav>

        <div className="w-px h-8 bg-navy-100 mx-3 hidden md:block" />

        <div className="flex items-center gap-2 px-3 py-1.5 bg-ocean-50 border border-ocean-100 rounded-md">
          <Eye size={14} strokeWidth={2} className="text-ocean-700" />
          <span className="text-xs font-bold text-ocean-700 tracking-wide">Live Survey</span>
        </div>
      </div>
    </header>
  );
}
