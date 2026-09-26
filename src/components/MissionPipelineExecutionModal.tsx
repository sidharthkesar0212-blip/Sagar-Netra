import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  FastForward,
  CheckCircle2,
  Terminal,
  Activity,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Search,
  CheckSquare,
  MapPin,
  FileText,
  UploadCloud,
} from 'lucide-react';
import { usePipeline, PIPELINE_STAGES } from '@/context/PipelineContext';

const STAGE_ICONS = [
  UploadCloud,
  Layers,
  Search,
  CheckSquare,
  MapPin,
  FileText,
];

export default function MissionPipelineExecutionModal() {
  const navigate = useNavigate();
  const {
    pipelineState,
    currentStageIndex,
    progressPercent,
    logs,
    isModalOpen,
    setIsModalOpen,
    skipPipeline,
    resetPipeline,
  } = usePipeline();

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal log to bottom as new messages arrive
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  if (!isModalOpen) return null;

  const isCompleted = pipelineState === 'completed';

  const handleGoToSonarAnalysis = () => {
    setIsModalOpen(false);
    navigate('/sonar-analysis');
  };

  const handleGoToReports = () => {
    setIsModalOpen(false);
    navigate('/reports');
  };

  // SVG Gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-ocean/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Subtle hydrodynamic grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

        {/* Top Header Bar */}
        <div className="relative px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-ocean/20 border border-ocean/40 text-ocean">
              <Activity size={18} className={!isCompleted ? 'animate-pulse' : ''} />
              {!isCompleted && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-ocean animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Autonomous Sonar Processing Pipeline
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-ocean/20 text-ocean-300 border border-ocean/40 animate-pulse'
                  }`}
                >
                  {isCompleted ? 'MISSION READY' : 'PROCESSING ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Target Dataset: <span className="text-ocean-300 font-semibold">Input_File/</span> • Sector 4B (15 Frames) • EdgeTech 4200 (455/900 kHz)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCompleted && (
              <button
                onClick={skipPipeline}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-ocean-300 text-xs font-mono font-semibold border border-slate-700 transition-colors cursor-pointer"
                title="Fast-forward processing simulation"
              >
                <FastForward size={14} />
                <span>Fast-Forward</span>
              </button>
            )}
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="relative flex-1 overflow-y-auto p-6 space-y-6 z-10 scrollbar-thin">
          {/* Top Progress & Radar Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Left: Animated Sonar Ring & Progress Gauge */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center relative overflow-hidden">
              {/* Radar sweep pulse */}
              {!isCompleted && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                  <div className="w-36 h-36 rounded-full border border-ocean/40 animate-ping" />
                </div>
              )}

              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className="stroke-slate-800"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="currentColor"
                    className={`transition-all duration-300 ease-out ${
                      isCompleted ? 'text-emerald-400' : 'text-ocean'
                    }`}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black font-mono text-white leading-none">
                    {progressPercent}%
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase mt-1">
                    {isCompleted ? 'Complete' : 'Progress'}
                  </span>
                </div>
              </div>

              <div className="mt-2 text-xs font-mono text-slate-300 font-semibold">
                {isCompleted ? 'All Layers Synthesized' : `Executing Stage ${currentStageIndex + 1} of 6`}
              </div>
            </div>

            {/* Right: Active Stage Focus Banner */}
            <div className="md:col-span-8 p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between h-full space-y-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-ocean font-bold mb-1">
                  Active Mission Operation
                </div>
                <h4 className="text-base font-bold text-white tracking-tight">
                  {PIPELINE_STAGES[currentStageIndex]?.name}
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-1 leading-relaxed">
                  {PIPELINE_STAGES[currentStageIndex]?.description}
                </p>
              </div>

              {/* Real-time Stage Output Banner */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-ocean">
                  <Cpu size={14} />
                  <span>Output:</span>
                  <span className="font-bold text-white">
                    {PIPELINE_STAGES[currentStageIndex]?.outputKey}
                  </span>
                </div>
                <span className="text-[10px] text-ocean font-bold uppercase">
                  {isCompleted ? '✓ Done' : 'Live'}
                </span>
              </div>
            </div>
          </div>

          {/* 6 Sequential Pipeline Stages Tracker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="uppercase tracking-wider font-bold">Pipeline Stages (6 Layers)</span>
              <span>{isCompleted ? '6 / 6 Complete' : `${currentStageIndex} of 6 ready`}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {PIPELINE_STAGES.map((stage, idx) => {
                const Icon = STAGE_ICONS[idx] || Layers;
                const isPast = idx < currentStageIndex || isCompleted;
                const isCurrent = idx === currentStageIndex && !isCompleted;

                return (
                  <div
                    key={stage.id}
                    className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                      isPast
                        ? 'bg-slate-950/70 border-emerald-500/40'
                        : isCurrent
                        ? 'bg-slate-900 border-ocean shadow-md ring-1 ring-ocean/30'
                        : 'bg-slate-950/30 border-slate-800/80 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold font-mono ${
                        isPast
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : isCurrent
                          ? 'bg-ocean text-white animate-pulse'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isPast ? <CheckCircle2 size={15} /> : stage.id}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white truncate font-mono">
                          {stage.shortCode}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                            isPast
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : isCurrent
                              ? 'text-ocean-300 bg-ocean/20 animate-pulse'
                              : 'text-slate-500'
                          }`}
                        >
                          {isPast ? 'Ready ✓' : isCurrent ? 'Running...' : 'Queued'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {stage.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-Time Monospace Terminal Stream */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <Terminal size={13} className="text-ocean" />
                <span className="uppercase tracking-wider font-bold">Operational Telemetry Log</span>
              </div>
              <span className="text-[10px] text-slate-500">Autonomous Sonar Engine</span>
            </div>

            <div className="h-36 bg-slate-950 rounded-xl border border-slate-800 p-3 font-mono text-[11px] overflow-y-auto space-y-1.5 scrollbar-thin">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-600 text-[10px] flex-shrink-0">[{log.timestamp}]</span>
                  <span
                    className={`px-1 rounded text-[9px] font-bold flex-shrink-0 ${
                      log.type === 'success'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                        : log.type === 'process'
                        ? 'bg-ocean-950 text-ocean-300 border border-ocean-800/50'
                        : log.type === 'warn'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {log.stage}
                  </span>
                  <span
                    className={
                      log.type === 'success'
                        ? 'text-emerald-300 font-semibold'
                        : log.type === 'process'
                        ? 'text-ocean-200'
                        : 'text-slate-300'
                    }
                  >
                    {log.text}
                  </span>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>

        {/* Modal Footer / Navigation Trigger */}
        <div className="relative px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 z-10">
          <div className="text-xs font-mono text-slate-400">
            {isCompleted ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 size={15} />
                All 6 layers synthesized and ready for deep inspection.
              </span>
            ) : (
              <span className="text-ocean-400 flex items-center gap-1.5 animate-pulse">
                <Activity size={14} />
                Executing mission pipeline across 15 acoustic frames...
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isCompleted ? (
              <>
                <button
                  onClick={handleGoToReports}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold transition-colors cursor-pointer"
                >
                  View Mission Dossier (Layer 06)
                </button>
                <button
                  onClick={handleGoToSonarAnalysis}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-ocean hover:bg-ocean-600 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <span>Proceed to Sonar Analysis (Layer 02)</span>
                  <ArrowRight size={15} />
                </button>
              </>
            ) : (
              <button
                onClick={skipPipeline}
                className="w-full sm:w-auto px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-ocean-300 border border-slate-700 text-xs font-mono font-semibold transition-colors cursor-pointer"
              >
                Fast-Forward Simulation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
