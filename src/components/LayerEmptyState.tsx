import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LucideIcon, UploadCloud, Play, Sparkles } from 'lucide-react';
import { usePipeline } from '@/context/PipelineContext';

interface LayerEmptyStateProps {
  layerNumber: string;
  layerName: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  hint?: string;
}

export default function LayerEmptyState({
  layerNumber,
  layerName,
  title,
  description,
  Icon,
  hint,
}: LayerEmptyStateProps) {
  const navigate = useNavigate();
  const { startPipeline, ingestedFrames } = usePipeline();

  const hasQueuedFrames = ingestedFrames && ingestedFrames.length > 0;

  return (
    <div className="bg-white border border-navy-100/80 rounded-xl p-10 md:p-14 text-center shadow-xs max-w-3xl mx-auto my-8 flex flex-col items-center animate-fade-in">
      {/* Visual Sensor Pulse Icon */}
      <div className="relative w-16 h-16 rounded-full bg-ocean-50/80 border border-ocean-100 flex items-center justify-center text-ocean mb-5">
        <Icon size={28} strokeWidth={1.75} />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white animate-pulse" />
      </div>

      {/* Layer Step Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-50 text-navy-400 text-[11px] font-mono font-bold tracking-wider uppercase mb-3 border border-navy-100/60">
        <span>LAYER {layerNumber}</span>
        <span>•</span>
        <span>AWAITING INGESTION</span>
      </div>

      {/* Title */}
      <h2 className="text-xl md:text-2xl font-bold text-navy tracking-tight mb-2.5">
        {title}
      </h2>

      {/* Description */}
      <p className="text-sm text-navy-400 max-w-xl leading-relaxed mb-6">
        {description}
      </p>

      {/* Mission Workflow Guidance Card */}
      <div className="w-full max-w-md bg-mist-100/70 border border-navy-100 rounded-lg p-4 mb-7 text-left">
        <div className="text-xs font-bold text-navy mb-2 flex items-center gap-1.5 font-mono">
          <Sparkles size={14} className="text-ocean" />
          Autonomous Pipeline Sequence
        </div>
        <ol className="space-y-1.5 text-xs text-navy-400">
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-navy text-white text-[10px] font-mono font-bold flex items-center justify-center flex-shrink-0">
              1
            </span>
            <span>Upload survey folder (<code className="font-mono text-navy font-bold">Input_File</code>) in Layer 01</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-navy text-white text-[10px] font-mono font-bold flex items-center justify-center flex-shrink-0">
              2
            </span>
            <span>Click the <strong className="text-navy font-semibold font-mono">"Ingest"</strong> button to execute processing</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-ocean text-white text-[10px] font-mono font-bold flex items-center justify-center flex-shrink-0">
              3
            </span>
            <span>Outputs for {layerName} will unlock automatically</span>
          </li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {hasQueuedFrames ? (
          <button
            type="button"
            onClick={startPipeline}
            className="px-6 py-3 bg-ocean hover:bg-ocean-600 text-white rounded-md text-xs font-semibold tracking-wide transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <Play size={14} fill="currentColor" />
            <span>Ingest & Process Queued Survey Now</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/survey-ingestion')}
            className="px-6 py-3 bg-navy hover:bg-ocean text-white rounded-md text-xs font-semibold tracking-wide transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <UploadCloud size={16} />
            <span>Go to Layer 01: Survey Ingestion</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {hint && (
        <p className="text-[11px] text-navy-300 mt-4 font-mono">
          {hint}
        </p>
      )}
    </div>
  );
}
