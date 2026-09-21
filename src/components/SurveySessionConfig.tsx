import { useState } from 'react';
import { Sliders, Compass, Settings2, RefreshCw } from 'lucide-react';
import { SurveyMetadata } from '@/types';

interface SurveySessionConfigProps {
  metadata: SurveyMetadata;
  onUpdateMetadata: (updated: Partial<SurveyMetadata>) => void;
}

export const REGION_PRESETS = [
  { id: 'arabian-sea', name: 'Arabian Sea Coastal Shelf (Default)', origin: '18.9220°N, 72.8340°E', swath: '100 m' },
  { id: 'goa-port', name: 'Goa Port Approach & Harbor', origin: '15.4250°N, 73.8150°E', swath: '75 m' },
  { id: 'khambhat', name: 'Gulf of Khambhat Shoals', origin: '21.0500°N, 72.3500°E', swath: '120 m' },
  { id: 'kochi', name: 'Kochi Deepwater Trench', origin: '9.9680°N, 76.2450°E', swath: '150 m' },
];

export const FREQUENCY_PRESETS = [
  'Klein 4900 (Dual-Freq 455/900 kHz)',
  'EdgeTech 4200 (100/400 kHz Deep)',
  'Klein 5000 V2 (Multi-beam High Speed)',
];

export default function SurveySessionConfig({
  metadata,
  onUpdateMetadata,
}: SurveySessionConfigProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRegionChange = (regionName: string) => {
    const found = REGION_PRESETS.find((r) => r.name === regionName);
    if (found) {
      onUpdateMetadata({
        region: found.name,
        origin: found.origin,
        swath: found.swath,
      });
    } else {
      onUpdateMetadata({ region: regionName });
    }
  };

  const handleGenerateId = () => {
    const randomHex = Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .toUpperCase()
      .padStart(6, '0');
    const newId = `SS-2026-${randomHex}`;
    onUpdateMetadata({ surveyId: newId });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Settings2 size={16} className="text-ocean" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Survey Session Setup & Acoustic Configuration
          </h3>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold text-ocean hover:text-ocean-700 transition-colors"
        >
          {isExpanded ? 'Simple View' : 'Configure Parameters'}
        </button>
      </div>

      {/* Primary Config Fields Grid (Specifications #17 & #18) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Survey ID with Regenerate button */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Survey ID (Session)
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={metadata.surveyId}
              onChange={(e) => onUpdateMetadata({ surveyId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-ocean"
            />
            <button
              type="button"
              onClick={handleGenerateId}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
              title="Generate new Survey ID"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Region / Grid Origin Selector (Specification #18) */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Region & Grid Origin Preset
          </label>
          <select
            value={metadata.region || REGION_PRESETS[0].name}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-ocean cursor-pointer"
          >
            {REGION_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.name}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sonar Sensor / Frequency Preset (Specification #17) */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Sonar Acoustic Preset
          </label>
          <select
            value={metadata.frequency || FREQUENCY_PRESETS[0]}
            onChange={(e) => onUpdateMetadata({ frequency: e.target.value, sensor: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-ocean cursor-pointer"
          >
            {FREQUENCY_PRESETS.map((freq) => (
              <option key={freq} value={freq}>
                {freq}
              </option>
            ))}
          </select>
        </div>

        {/* Operator Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Operator / Organization
          </label>
          <input
            type="text"
            value={metadata.operator || 'Cmdr. R. Sharma (IN-Naval Survey)'}
            onChange={(e) => onUpdateMetadata({ operator: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-ocean"
          />
        </div>
      </div>

      {/* Expanded view for custom GPS coordinates & Swath Width */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Active Grid Coordinates
            </label>
            <input
              type="text"
              value={metadata.origin}
              onChange={(e) => onUpdateMetadata({ origin: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-ocean focus:outline-none focus:border-ocean"
              placeholder="e.g. 18.9220°N, 72.8340°E"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Swath Width Range
            </label>
            <input
              type="text"
              value={metadata.swath}
              onChange={(e) => onUpdateMetadata({ swath: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-ocean"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Vessel / Tow Vehicle Label
            </label>
            <input
              type="text"
              value={metadata.vessel || 'RV Sagar Kanya • Hydrographic Division'}
              onChange={(e) => onUpdateMetadata({ vessel: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-ocean"
            />
          </div>
        </div>
      )}
    </div>
  );
}
