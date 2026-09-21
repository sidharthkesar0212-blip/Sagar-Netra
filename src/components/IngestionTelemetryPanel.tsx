import { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HardDrive,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface IngestionTelemetryPanelProps {
  totalReceived: number;
  validCount: number;
  rejectedCount: number;
  warningCount: number;
  totalPayloadMB: number;
  isIngesting: boolean;
  progressPercent: number;
  logs: string[];
  onClearLogs?: () => void;
}

export default function IngestionTelemetryPanel({
  totalReceived,
  validCount,
  rejectedCount,
  warningCount,
  totalPayloadMB,
  isIngesting,
  progressPercent,
  logs,
  onClearLogs,
}: IngestionTelemetryPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCopy = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
      {/* 1. Live Counters Strip (Specification #11) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Received
          </div>
          <div className="text-lg font-black text-slate-800 font-mono mt-0.5">
            {totalReceived} <span className="text-xs font-normal text-slate-400">frames</span>
          </div>
        </div>

        <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
              Valid
            </span>
            <CheckCircle2 size={12} className="text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">
            {validCount}
          </div>
        </div>

        <div className="p-3 bg-red-50/70 border border-red-100 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-red-600 tracking-wider">
              Rejected
            </span>
            <XCircle size={12} className="text-red-500" />
          </div>
          <div className="text-lg font-black text-red-600 font-mono mt-0.5">
            {rejectedCount}
          </div>
        </div>

        <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
              Warnings
            </span>
            <AlertTriangle size={12} className="text-amber-600" />
          </div>
          <div className="text-lg font-black text-amber-700 font-mono mt-0.5">
            {warningCount}
          </div>
        </div>

        <div className="p-3 bg-ocean-50/60 border border-ocean-100/60 rounded-xl col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-ocean-700 tracking-wider">
              Payload
            </span>
            <HardDrive size={12} className="text-ocean-600" />
          </div>
          <div className="text-lg font-black text-ocean-800 font-mono mt-0.5">
            {totalPayloadMB.toFixed(1)}{' '}
            <span className="text-xs font-normal text-ocean-600">MB</span>
          </div>
        </div>
      </div>

      {/* 2. Simulated Progress Bar (Specification #10) */}
      {(isIngesting || (progressPercent > 0 && progressPercent < 100)) && (
        <div className="space-y-1.5 p-3 bg-slate-50/80 border border-slate-200/70 rounded-xl animate-fade-in">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-600 font-semibold flex items-center gap-1.5">
              <Activity size={13} className="text-ocean animate-spin" />
              Ingesting & Normalizing Acoustic Headers...
            </span>
            <span className="text-ocean font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-ocean to-[#0080ff] transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* 3. Ingestion Log / Console Feed (Specification #12) */}
      <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-slate-950 text-slate-200 font-mono text-xs shadow-inner">
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300">
            <Terminal size={14} className="text-[#0080ff]" />
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-300">
              Ingestion Stream Feed ({logs.length} events)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1 transition-colors"
              title="Copy telemetry log"
            >
              {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            {onClearLogs && (
              <button
                onClick={onClearLogs}
                className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-red-300 hover:bg-slate-800 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsConsoleExpanded(!isConsoleExpanded)}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title={isConsoleExpanded ? 'Collapse Feed' : 'Expand Feed'}
            >
              {isConsoleExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

        {isConsoleExpanded && (
          <div className="p-3.5 max-h-36 overflow-y-auto space-y-1 scrollbar-thin text-[11px] leading-relaxed">
            {logs.length === 0 ? (
              <div className="text-slate-600 italic">No telemetry events recorded yet.</div>
            ) : (
              logs.map((log, index) => {
                const isErr = log.includes('REJECTED') || log.includes('Error') || log.includes('Duplicate');
                const isWarn = log.includes('Warning') || log.includes('WARN');
                const isSuccess = log.includes('OK') || log.includes('complete') || log.includes('verified');

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-2 ${
                      isErr
                        ? 'text-red-400'
                        : isWarn
                        ? 'text-amber-300'
                        : isSuccess
                        ? 'text-emerald-300'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="text-slate-600 select-none">›</span>
                    <span className="break-all">{log}</span>
                  </div>
                );
              })
            )}
            <div ref={logEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
