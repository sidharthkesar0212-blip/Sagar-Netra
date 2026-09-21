import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Image as ImageIcon,
  MapPin,
  CheckSquare,
  MessageSquare,
  User,
  Check,
  Leaf,
  X,
  Clock,
  Compass,
  Maximize2,
  ZoomIn,
  ArrowRight,
  ArrowLeft,
  Info,
  Minus,
  ShieldAlert,
} from 'lucide-react';
import {
  INITIAL_REVIEW_CANDIDATES,
  ReviewCandidate,
} from '@/data/surveyWorkflowData';

type ReviewViewMode = 'raw' | 'heatmap' | 'bbox';

const STORAGE_KEY = 'sagar_human_review_candidates_v4';

export default function HumanReview() {
  const navigate = useNavigate();

  // Load human review candidate (strictly human.png and its corresponding images)
  const [candidates, setCandidates] = useState<ReviewCandidate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          (parsed[0].name === 'human.png' || parsed[0].id === 'cand-human')
        ) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to load review candidates:', e);
      }
    }
    return INITIAL_REVIEW_CANDIDATES;
  });

  const [activeView, setActiveView] = useState<ReviewViewMode>('raw');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Active single candidate: human.png
  const activeCandidate = candidates[0] || INITIAL_REVIEW_CANDIDATES[0];

  // Persist review decisions
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
  }, [candidates]);

  // Handle human decision action
  const handleDecision = (
    decision: 'confirmed' | 'natural' | 'false-positive' | 'needs-review'
  ) => {
    const updated = [...candidates];
    updated[0] = {
      ...updated[0],
      decision,
    };
    setCandidates(updated);
  };

  // Handle note change
  const handleNoteChange = (text: string) => {
    const updated = [...candidates];
    updated[0] = {
      ...updated[0],
      notes: text.slice(0, 300),
    };
    setCandidates(updated);
  };

  // Quick append note tag
  const appendNoteTag = (tag: string) => {
    const current = activeCandidate.notes || '';
    const newText = current ? `${current} • ${tag}` : tag;
    handleNoteChange(newText);
  };

  // Toggle checklist item
  const toggleChecklist = (key: keyof ReviewCandidate['checklist']) => {
    const currentVal = activeCandidate.checklist[key];
    let nextVal: any = currentVal;
    if (key === 'naturalSimilarity') {
      nextVal = currentVal === 'Low' ? 'Medium' : currentVal === 'Medium' ? 'High' : 'Low';
    } else {
      nextVal = currentVal === 'Yes' ? 'Unclear' : currentVal === 'Unclear' ? 'No' : 'Yes';
    }

    const updated = [...candidates];
    updated[0] = {
      ...updated[0],
      checklist: {
        ...updated[0].checklist,
        [key]: nextVal,
      },
    };
    setCandidates(updated);
  };

  const isReviewed = activeCandidate.decision !== null && activeCandidate.decision !== undefined;

  return (
    <div className="p-6 md:p-8 max-w-[1560px] mx-auto space-y-6 select-none">
      {/* Top Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-navy-100/60">
        <div>
          <div className="text-[11px] font-bold tracking-widest text-ocean font-mono mb-0.5">
            STEP 04 / 06
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-navy tracking-tight">
            Human Review
          </h1>
          <p className="text-sm text-navy-400 max-w-3xl mt-1">
            Expert human-in-the-loop inspection of novel acoustic anomalies and out-of-distribution detections identified by the unsupervised PatchCore engine.
          </p>
        </div>

        {/* Top Right KPI Metrics & Status */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
          {/* Candidate Status Card */}
          <div className="bg-white border border-navy-100/80 rounded-lg px-4 py-2.5 flex items-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-navy-400 uppercase tracking-wide">
                Target Category
              </div>
              <div className="text-sm font-bold text-navy font-mono leading-none mt-0.5">
                Anthropogenic Anomaly
              </div>
            </div>
          </div>

          {/* Review Status Card */}
          <div className="bg-white border border-navy-100/80 rounded-lg px-4 py-2.5 flex items-center gap-3 shadow-xs">
            <div
              className={`w-9 h-9 rounded-md flex items-center justify-center ${
                isReviewed
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-navy-50 text-navy-400'
              }`}
            >
              <CheckCircle2 size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-navy-400 uppercase tracking-wide">
                Decision Status
              </div>
              <div className="text-sm font-bold text-navy leading-none mt-0.5">
                {activeCandidate.decision
                  ? activeCandidate.decision.toUpperCase().replace('-', ' ')
                  : 'PENDING REVIEW'}
              </div>
            </div>
          </div>

          {/* Progress Indicator Card */}
          <div className="bg-white border border-navy-100/80 rounded-lg px-4 py-2.5 min-w-[170px] shadow-xs">
            <div className="text-[10px] font-bold text-navy-400 mb-1.5 flex justify-between items-center">
              <span>{isReviewed ? '100%' : '0%'} Complete</span>
              <span className="text-navy-300 font-mono font-normal">
                {isReviewed ? '1/1' : '0/1'}
              </span>
            </div>
            <div className="w-full h-2 bg-mist-300 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isReviewed ? 'bg-emerald-500 w-full' : 'bg-ocean w-0'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Multi-Modal Canvas (7 cols) + Right Decision Console (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Container: Modality Selector & Sonar Inspection Viewport */}
        <div className="lg:col-span-7 bg-white border border-navy-100/80 rounded-xl overflow-hidden shadow-xs flex flex-col">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-navy-100/60 bg-white">
            <div className="flex items-center gap-2.5 text-navy font-semibold text-sm">
              <ImageIcon size={17} className="text-navy-400" />
              <span>Review Queue</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-navy-400 font-medium">
                Candidate 1 of 1
              </span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-bold rounded">
                human.png
              </span>
            </div>
          </div>

          {/* Body: Single Candidate in Left Column + Main Sonar Viewport on Right */}
          <div className="flex-1 flex flex-col md:flex-row min-h-[490px]">
            {/* Left Queue: Exactly ONE candidate card for human.png */}
            <div className="w-full md:w-36 bg-mist-100/70 border-r border-navy-100/60 p-3 flex md:flex-col gap-2.5">
              <div className="text-[10px] font-mono font-bold text-navy-400 uppercase tracking-wider mb-0.5 hidden md:block">
                Queue (1)
              </div>

              {/* Just One Candidate Card */}
              <div className="relative rounded-lg overflow-hidden border-2 border-ocean ring-2 ring-ocean/20 shadow-sm text-left flex-shrink-0 bg-white group cursor-pointer">
                <div className="aspect-[4/3] bg-navy-950 relative overflow-hidden">
                  <img
                    src="/raw/human.jpeg"
                    alt="human.png"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {isReviewed && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 px-1 py-0.2 bg-amber-500/90 text-white font-mono text-[8px] font-bold rounded">
                    NOVEL
                  </span>
                </div>
                <div className="p-2 bg-white text-center">
                  <div className="text-[11px] font-mono font-bold text-navy truncate">
                    human.png
                  </div>
                  <div className="text-[9px] font-mono text-ocean font-semibold">
                    ANO-001
                  </div>
                </div>
              </div>
            </div>

            {/* Main Sonar Viewport */}
            <div className="flex-1 bg-[#090e17] flex flex-col relative select-none overflow-hidden min-h-[460px]">
              {/* Top View Mode Switcher Header: Strictly 3 Sections */}
              <div className="p-2.5 flex items-center justify-between border-b border-navy-900 bg-navy-950/90 z-20">
                <div className="flex items-center gap-1.5 bg-navy-900/90 p-1 rounded-lg border border-white/10">
                  <button
                    onClick={() => setActiveView('raw')}
                    className={`px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
                      activeView === 'raw'
                        ? 'bg-ocean text-white shadow-xs'
                        : 'text-navy-300 hover:text-white'
                    }`}
                  >
                    Raw image
                  </button>
                  <button
                    onClick={() => setActiveView('heatmap')}
                    className={`px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
                      activeView === 'heatmap'
                        ? 'bg-ocean text-white shadow-xs'
                        : 'text-navy-300 hover:text-white'
                    }`}
                  >
                    Heatmap
                  </button>
                  <button
                    onClick={() => setActiveView('bbox')}
                    className={`px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
                      activeView === 'bbox'
                        ? 'bg-ocean text-white shadow-xs'
                        : 'text-navy-300 hover:text-white'
                    }`}
                  >
                    Bounding box
                  </button>
                </div>
              </div>

              {/* Viewport Canvas Body */}
              <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Single Focused Viewport for the Selected Section */}
                <div
                  className="relative transition-transform duration-150 ease-out flex items-center justify-center"
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                >
                  <img
                    src={
                      activeView === 'heatmap'
                        ? '/PatchCore/human.png'
                        : activeView === 'bbox'
                        ? '/unknown/human.png'
                        : '/raw/human.jpeg'
                    }
                    alt={
                      activeView === 'heatmap'
                        ? 'Heatmap'
                        : activeView === 'bbox'
                        ? 'Bounding box'
                        : 'Raw image'
                    }
                    className="max-h-[380px] max-w-full rounded object-contain border border-navy-800 shadow-xl pointer-events-none"
                  />
                </div>

                {/* Compass North Indicator */}
                <div className="absolute top-4 right-4 bg-navy-900/80 backdrop-blur-xs border border-navy-700/60 rounded px-2 py-1 flex items-center gap-1.5 text-[11px] font-mono font-bold text-white shadow-sm pointer-events-none">
                  <Compass size={14} className="text-ocean-300" />
                  <span>N</span>
                </div>

                {/* Scale Bar */}
                <div className="absolute bottom-4 left-4 bg-navy-900/80 backdrop-blur-xs border border-navy-700/60 rounded px-2.5 py-1 text-[11px] font-mono text-ocean-100 flex items-center gap-2 shadow-sm pointer-events-none">
                  <div className="w-8 h-1 bg-ocean-300 rounded-full" />
                  <span>50 m</span>
                </div>
              </div>

              {/* Bottom Canvas Toolbar */}
              <div className="h-11 bg-white border-t border-navy-100/80 px-4 flex items-center justify-between">
                <div className="text-xs font-mono text-navy-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Engine: PatchCore Out-of-Distribution Density</span>
                </div>

                {/* Zoom & Reset Controls */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-mist-200 rounded-md p-0.5 text-navy-400">
                    <button
                      onClick={() => setZoomLevel(Math.max(50, zoomLevel - 15))}
                      className="p-1 hover:text-navy transition-colors"
                      title="Zoom Out"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-xs font-mono font-semibold px-2 text-navy">
                      {zoomLevel}%
                    </span>
                    <button
                      onClick={() => setZoomLevel(Math.min(200, zoomLevel + 15))}
                      className="p-1 hover:text-navy transition-colors"
                      title="Zoom In"
                    >
                      <ZoomIn size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => setZoomLevel(100)}
                    className="p-1.5 rounded-md border border-navy-100 text-navy-400 hover:text-navy hover:bg-mist-200 transition-colors"
                    title="Reset Zoom"
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Container: Inspection Details, Checklist & Human Decision Console */}
        <div className="lg:col-span-5 space-y-4">
          {/* Top Row: Review Details + Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Review Details Card */}
            <div className="bg-white border border-navy-100/80 rounded-xl p-4 shadow-xs">
              <div className="flex items-center gap-2 text-navy font-semibold text-xs uppercase tracking-wider mb-3">
                <FileText size={14} className="text-ocean" />
                <span>Review Details</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-navy-50">
                  <span className="text-navy-300">Candidate Type</span>
                  <span className="font-semibold text-navy">Anthropogenic Anomaly</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-navy-50">
                  <span className="text-navy-300">Detection Engine</span>
                  <span className="font-semibold text-navy">PatchCore Model</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-navy-50">
                  <span className="text-navy-300">Target ID</span>
                  <span className="font-mono font-semibold text-ocean">human.png</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-navy-50">
                  <span className="text-navy-300">Location Status</span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-600">
                    <MapPin size={11} /> Geo-referenced
                  </span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-navy-50">
                  <span className="text-navy-300">Coordinates</span>
                  <span className="font-mono font-medium text-navy">12.3412° N, 72.9721° E</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-navy-300">Estimated Depth</span>
                  <span className="font-mono font-medium text-navy">19.0 m</span>
                </div>
              </div>
            </div>

            {/* Notes & Analyst Observations */}
            <div className="bg-white border border-navy-100/80 rounded-xl p-4 shadow-xs flex flex-col">
              <div className="flex items-center gap-2 text-navy font-semibold text-xs uppercase tracking-wider mb-2">
                <MessageSquare size={14} className="text-ocean" />
                <span>Analyst Observations</span>
              </div>
              <div className="flex-1 flex flex-col">
                <textarea
                  value={activeCandidate.notes || ''}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="Record verification notes, acoustic penumbra details, or seabed context..."
                  className="w-full flex-1 min-h-[90px] p-2.5 text-xs text-navy bg-mist-100 border border-navy-100 rounded-md resize-none outline-none focus:border-ocean focus:bg-white transition-all placeholder:text-navy-300"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => appendNoteTag('High anomaly activation')}
                      className="px-1.5 py-0.5 rounded bg-mist-200 hover:bg-mist-300 text-[9px] text-navy-600 font-mono transition-colors"
                    >
                      + Anomaly Peak
                    </button>
                    <button
                      onClick={() => appendNoteTag('Non-geological')}
                      className="px-1.5 py-0.5 rounded bg-mist-200 hover:bg-mist-300 text-[9px] text-navy-600 font-mono transition-colors"
                    >
                      + Non-Geological
                    </button>
                  </div>
                  <div className="text-[10px] text-navy-300 font-mono">
                    {(activeCandidate.notes || '').length}/300
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Assessment (Checklist) Card */}
          <div className="bg-white border border-navy-100/80 rounded-xl p-4.5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-navy font-semibold text-sm">
                <CheckSquare size={16} className="text-ocean" />
                <span>Visual Assessment (Checklist)</span>
              </div>
              <span className="text-[10px] font-mono text-navy-400">Click to toggle criteria</span>
            </div>

            <div className="space-y-2">
              {/* Distinct structure */}
              <div
                onClick={() => toggleChecklist('distinctStructure')}
                className="flex items-center justify-between p-2 rounded-lg bg-mist-100/60 hover:bg-mist-200/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-xs font-medium text-navy">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Check size={12} strokeWidth={2.5} />
                  </div>
                  <span>Distinct Non-Natural Structure</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  {activeCandidate.checklist.distinctStructure}
                </span>
              </div>

              {/* Object-like geometry */}
              <div
                onClick={() => toggleChecklist('objectGeometry')}
                className="flex items-center justify-between p-2 rounded-lg bg-mist-100/60 hover:bg-mist-200/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-xs font-medium text-navy">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Check size={12} strokeWidth={2.5} />
                  </div>
                  <span>Irregular / Man-Made Geometry</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  {activeCandidate.checklist.objectGeometry}
                </span>
              </div>

              {/* Natural seabed similarity */}
              <div
                onClick={() => toggleChecklist('naturalSimilarity')}
                className="flex items-center justify-between p-2 rounded-lg bg-mist-100/60 hover:bg-mist-200/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-xs font-medium text-navy">
                  <div className="w-5 h-5 rounded-full bg-ocean-100 text-ocean-600 flex items-center justify-center">
                    <Info size={12} strokeWidth={2.5} />
                  </div>
                  <span>Natural Seabed Similarity</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-ocean-100 text-ocean-700">
                  {activeCandidate.checklist.naturalSimilarity}
                </span>
              </div>
            </div>
          </div>

          {/* Human Decision Action Box */}
          <div className="bg-white border border-navy-100/80 rounded-xl p-4.5 shadow-xs">
            <div className="flex items-center gap-2 text-navy font-semibold text-sm mb-3">
              <User size={16} className="text-ocean" />
              <span>Human Classification Decision</span>
            </div>

            {/* Current decision status banner */}
            {activeCandidate.decision ? (
              <div className="mb-3 p-2.5 bg-mist-100 border border-navy-100 rounded-lg text-xs flex items-center justify-between">
                <span className="text-navy-400 font-medium">Classified As:</span>
                <span className="font-bold uppercase tracking-wider text-ocean font-mono">
                  {activeCandidate.decision.replace('-', ' ')}
                </span>
              </div>
            ) : (
              <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium flex items-center gap-1.5">
                <Clock size={13} className="text-amber-600" />
                <span>Requires human sign-off to proceed into Hotspot Analysis</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {/* Confirm Debris Button */}
                <button
                  onClick={() => handleDecision('confirmed')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold text-white transition-all shadow-xs ${
                    activeCandidate.decision === 'confirmed'
                      ? 'bg-emerald-700 ring-2 ring-emerald-400'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Check size={14} strokeWidth={3} />
                  <span>Confirm Debris</span>
                </button>

                {/* Mark Natural Button */}
                <button
                  onClick={() => handleDecision('natural')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold text-white transition-all shadow-xs ${
                    activeCandidate.decision === 'natural'
                      ? 'bg-ocean-700 ring-2 ring-ocean-400'
                      : 'bg-ocean hover:bg-ocean-600'
                  }`}
                >
                  <Leaf size={14} strokeWidth={2.5} />
                  <span>Mark Natural</span>
                </button>

                {/* False Positive Button */}
                <button
                  onClick={() => handleDecision('false-positive')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold text-white transition-all shadow-xs ${
                    activeCandidate.decision === 'false-positive'
                      ? 'bg-rose-700 ring-2 ring-rose-400'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  <X size={14} strokeWidth={3} />
                  <span>False Positive</span>
                </button>
              </div>

              {/* Needs More Review Secondary Button */}
              <button
                onClick={() => handleDecision('needs-review')}
                className={`w-full flex items-center justify-center gap-2 py-2 px-3 border border-navy-200/80 rounded-lg text-xs font-semibold text-navy hover:bg-mist-100 transition-colors ${
                  activeCandidate.decision === 'needs-review' ? 'bg-mist-200 border-navy-400' : 'bg-white'
                }`}
              >
                <Clock size={13} className="text-navy-400" />
                <span>Needs Acoustic Resurvey / Further Sensor Run</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-navy-100/60">
        <button
          onClick={() => navigate('/evidence-intelligence')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-navy-200 text-sm font-semibold text-navy hover:bg-mist-200 hover:border-navy-300 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Evidence Intelligence
        </button>

        <button
          onClick={() => navigate('/debris-hotspots')}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0a58ca] hover:bg-[#084298] text-white text-sm font-semibold transition-all shadow-sm"
        >
          <span>Continue to Debris Hotspots</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
