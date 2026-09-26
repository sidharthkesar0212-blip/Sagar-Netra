import { ArrowRight, Edit3, CheckCircle2 } from 'lucide-react';
import { SurveyMetadata } from '@/types';

interface ActiveSurveyCardProps {
  metadata: SurveyMetadata | null;
  isMetadataLoaded?: boolean;
  onContinue: () => void;
  onEdit?: () => void;
  isReady?: boolean;
  validCount?: number;
  rejectedCount?: number;
}

export default function ActiveSurveyCard({
  metadata,
  isMetadataLoaded = false,
  onContinue,
  onEdit,
  isReady = false,
  validCount = 0,
  rejectedCount = 0,
}: ActiveSurveyCardProps) {
  const hasMeta = isMetadataLoaded && metadata && metadata.surveyId;

  const formattedCorridor =
    hasMeta && metadata.corridor
      ? metadata.corridor.length > 22
        ? `${metadata.corridor.substring(0, 20)}...`
        : metadata.corridor
      : '—';

  const canProceed = isReady && validCount > 0 && hasMeta;

  return (
    <div className="bg-white border border-navy-100 rounded-lg p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-navy-50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-navy">Active Survey</h3>
          {hasMeta && isReady && validCount > 0 && (
            <CheckCircle2 size={16} className="text-emerald-500" strokeWidth={2} />
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasMeta && onEdit && (
            <button
              onClick={onEdit}
              className="text-xs text-navy-300 hover:text-ocean flex items-center gap-1 font-medium transition-colors cursor-pointer"
              title="Edit survey metadata"
            >
              <Edit3 size={12} />
              Edit
            </button>
          )}
          <span
            className={`px-2 py-0.5 text-[11px] rounded font-medium tracking-wide ${
              hasMeta
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 font-mono'
                : 'bg-navy-50 text-navy-300'
            }`}
          >
            {hasMeta ? 'Configured' : 'Pending'}
          </span>
        </div>
      </div>

      {/* Survey ID */}
      <div className="flex items-center justify-between py-1.5 border-b border-navy-50">
        <span className="text-xs text-navy-300 font-medium">Survey ID</span>
        <span className={`text-xs font-mono font-bold tracking-wide ${hasMeta ? 'text-navy' : 'text-navy-200'}`}>
          {hasMeta ? metadata.surveyId : '—'}
        </span>
      </div>

      {/* Corridor */}
      <div className="flex items-center justify-between py-1.5 border-b border-navy-50">
        <span className="text-xs text-navy-300 font-medium">Corridor</span>
        <span
          className={`text-xs font-mono font-medium ${hasMeta ? 'text-navy' : 'text-navy-200'}`}
          title={hasMeta ? metadata.corridor : ''}
        >
          {formattedCorridor}
        </span>
      </div>

      {/* Frames & Swath */}
      <div className="grid grid-cols-2 gap-4 py-2 border-b border-navy-50">
        <div>
          <span className="text-[11px] text-navy-300 font-medium block mb-0.5">Frames</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-lg font-bold ${validCount > 0 ? 'text-navy' : 'text-navy-200'}`}>
              {validCount > 0 ? validCount : hasMeta && metadata.frames ? metadata.frames : 0}
            </span>
            {rejectedCount > 0 && (
              <span className="text-[10px] font-semibold text-red-500 font-mono">
                ({rejectedCount} rej)
              </span>
            )}
          </div>
        </div>
        <div>
          <span className="text-[11px] text-navy-300 font-medium block mb-0.5">Swath</span>
          <span className={`text-lg font-bold ${hasMeta ? 'text-navy' : 'text-navy-200'}`}>
            {hasMeta ? metadata.swath : '—'}
          </span>
        </div>
      </div>

      {/* Sensor */}
      <div className="flex items-center justify-between py-1.5 border-b border-navy-50">
        <span className="text-xs text-navy-300 font-medium">Sensor</span>
        <span className={`text-xs font-mono ${hasMeta ? 'text-navy-400' : 'text-navy-200'}`}>
          {hasMeta ? metadata.sensor : '—'}
        </span>
      </div>

      {/* Origin */}
      <div className="flex items-center justify-between py-1.5 border-b border-navy-50">
        <span className="text-xs text-navy-300 font-medium">Origin</span>
        <span className={`text-xs font-mono font-medium ${hasMeta ? 'text-ocean' : 'text-navy-200'}`}>
          {hasMeta ? metadata.origin : '—'}
        </span>
      </div>

      {/* Vessel */}
      {hasMeta && metadata.vessel && (
        <div className="flex items-center justify-between py-1 text-xs">
          <span className="text-navy-300">Vessel</span>
          <span className="text-navy-400 font-medium truncate max-w-[170px]" title={metadata.vessel}>
            {metadata.vessel}
          </span>
        </div>
      )}

      {/* Action Button */}
      <div className="pt-2">
        <button
          disabled={!canProceed}
          onClick={onContinue}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold text-xs tracking-wide transition-all ${
            canProceed
              ? 'bg-navy text-white hover:bg-ocean shadow-sm cursor-pointer'
              : 'bg-navy-50 text-navy-200 cursor-not-allowed'
          }`}
        >
          <span>Continue to Sonar Analysis</span>
          <ArrowRight size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
