import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Image as ImageIcon,
  Crosshair,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Layers,
  Activity,
  X,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import {
  SonarAnalysisAsset,
  DEFAULT_SONAR_ANALYSIS_ASSETS,
  resolveSonarAsset,
} from '@/data/sonarAnalysisData';
import { IngestedImage } from '@/types';
import { usePipeline } from '@/context/PipelineContext';
import LayerEmptyState from '@/components/LayerEmptyState';

type ProcessedTabType = 'original' | 'enhanced' | 'segmented' | 'heatmap';

const PROCESSED_MODES: ProcessedTabType[] = ['original', 'enhanced', 'segmented', 'heatmap'];

/**
 * Ensures the first four sonar images strictly follow the required priority sequence:
 * 1. Shipwreck
 * 2. Ghost Net
 * 3. Human
 * 4. Natural Reef
 * All remaining available images appear in their existing order.
 */
function prioritizeSonarFrames(rawFrames: SonarAnalysisAsset[]): SonarAnalysisAsset[] {
  const result: SonarAnalysisAsset[] = [];
  const remaining = [...rawFrames];

  // 1. Shipwreck: prioritize canonical 'shipwreck.png', otherwise any item containing 'shipwreck'
  let shipwreckIdx = remaining.findIndex((f) => f.name.toLowerCase() === 'shipwreck.png');
  if (shipwreckIdx === -1) {
    shipwreckIdx = remaining.findIndex((f) => f.name.toLowerCase().includes('shipwreck'));
  }
  if (shipwreckIdx !== -1) {
    result.push(remaining.splice(shipwreckIdx, 1)[0]);
  }

  // 2. Ghost Net: item containing 'ghost' (e.g. ghostnet.jpeg)
  const ghostnetIdx = remaining.findIndex((f) => f.name.toLowerCase().includes('ghost'));
  if (ghostnetIdx !== -1) {
    result.push(remaining.splice(ghostnetIdx, 1)[0]);
  }

  // 3. Human: item containing 'human' (e.g. human.jpeg)
  const humanIdx = remaining.findIndex((f) => f.name.toLowerCase().includes('human'));
  if (humanIdx !== -1) {
    result.push(remaining.splice(humanIdx, 1)[0]);
  }

  // 4. Natural Reef: item containing 'reef' (e.g. Artificial_Reef.png)
  const reefIdx = remaining.findIndex((f) => f.name.toLowerCase().includes('reef'));
  if (reefIdx !== -1) {
    result.push(remaining.splice(reefIdx, 1)[0]);
  }

  // 5. All remaining available images in any existing order
  result.push(...remaining);
  return result;
}

/**
 * Returns human-readable target labels, badge styling, anomaly indicators,
 * and classification descriptions for a given sonar asset matching the existing UI typography.
 */
function getImageTypeInfo(frame: SonarAnalysisAsset): {
  typeLabel: string;
  badgeColor: string;
  isAnomaly: boolean;
  classification: string;
} {
  const name = frame.name.toLowerCase();

  if (name.includes('shipwreck')) {
    return {
      typeLabel: 'Shipwreck',
      badgeColor: 'text-ocean bg-ocean-50 border-ocean-100',
      isAnomaly: false,
      classification: 'Shipwreck',
    };
  }
  if (name.includes('ghost')) {
    return {
      typeLabel: 'Ghost Net',
      badgeColor: 'text-amber-800 bg-amber-50 border-amber-100',
      isAnomaly: false,
      classification: 'Ghost Net',
    };
  }
  if (name.includes('human')) {
    return {
      typeLabel: 'Human',
      badgeColor: 'text-rose-800 bg-rose-50 border-rose-100',
      isAnomaly: true,
      classification: 'Anthropogenic Anomaly',
    };
  }
  if (name.includes('reef')) {
    return {
      typeLabel: 'Natural Reef',
      badgeColor: 'text-emerald-800 bg-emerald-50 border-emerald-100',
      isAnomaly: false,
      classification: 'Natural Reef',
    };
  }
  if (name.includes('pipe')) {
    return {
      typeLabel: 'Subsea Pipe',
      badgeColor: 'text-sky-800 bg-sky-50 border-sky-100',
      isAnomaly: false,
      classification: 'Subsea Pipeline',
    };
  }
  if (name.includes('plane')) {
    return {
      typeLabel: 'Aircraft / Plane',
      badgeColor: 'text-indigo-800 bg-indigo-50 border-indigo-100',
      isAnomaly: false,
      classification: 'Aircraft Wreckage',
    };
  }
  if (name.includes('crabpot')) {
    return {
      typeLabel: 'Crab-Pot',
      badgeColor: 'text-teal-800 bg-teal-50 border-teal-100',
      isAnomaly: false,
      classification: 'Crab-Pot Trap',
    };
  }
  if (name.includes('seabed')) {
    return {
      typeLabel: 'Seabed Reference',
      badgeColor: 'text-navy-600 bg-slate-50 border-navy-100',
      isAnomaly: false,
      classification: 'Seabed Baseline',
    };
  }

  // Fallback to detection if available
  if (frame.detections && frame.detections.length > 0) {
    const d = frame.detections[0];
    return {
      typeLabel: d.className,
      badgeColor: d.isNovel
        ? 'text-rose-800 bg-rose-50 border-rose-100'
        : 'text-ocean bg-ocean-50 border-ocean-100',
      isAnomaly: !!d.isNovel,
      classification: d.className,
    };
  }

  return {
    typeLabel: 'Sonar Scan',
    badgeColor: 'text-navy-400 bg-slate-50 border-navy-100',
    isAnomaly: false,
    classification: 'Acoustic Waterfall Scan',
  };
}

export default function SonarAnalysis() {
  const navigate = useNavigate();
  const { pipelineState } = usePipeline();
  const isProcessed = pipelineState !== 'idle';

  // Frames state, initialized with priority ordering
  const [frames, setFrames] = useState<SonarAnalysisAsset[]>(() =>
    prioritizeSonarFrames(DEFAULT_SONAR_ANALYSIS_ASSETS)
  );
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Processed view mode: 'original' | 'enhanced' | 'segmented' | 'heatmap'
  // Independent from selectedFrameIndex
  const [processedTab, setProcessedTab] = useState<ProcessedTabType>('original');
  const [highlightedDetection, setHighlightedDetection] = useState<number | null>(null);

  // Lightbox modal for high-resolution inspection
  const [expandedSection, setExpandedSection] = useState<ProcessedTabType | null>(null);
  const [modalZoomLevel, setModalZoomLevel] = useState<number>(1);

  // Thumbnail container ref for smooth auto-scroll on navigation
  const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load uploaded frames from Step 1 (Survey Ingestion) if available
  useEffect(() => {
    const savedList = localStorage.getItem('sagar_sonar_images_list');
    if (savedList) {
      try {
        const parsed: IngestedImage[] = JSON.parse(savedList);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Strictly filter out any obsolete IMG_001 entries
          const validFrames = parsed.filter(
            (item) =>
              item.name.toLowerCase() !== 'img_001.png' &&
              item.name.toLowerCase() !== 'img.001.png' &&
              !item.name.toLowerCase().includes('img_001') &&
              !item.name.toLowerCase().includes('img.001')
          );
          if (validFrames.length > 0) {
            const mappedAssets: SonarAnalysisAsset[] = validFrames.map((item, index) =>
              resolveSonarAsset(item.name, index, item.url)
            );
            setFrames(prioritizeSonarFrames(mappedAssets));
            return;
          }
        }
      } catch (err) {
        console.error('Failed to parse saved sonar images for SonarAnalysis:', err);
      }
    }
    setFrames(prioritizeSonarFrames(DEFAULT_SONAR_ANALYSIS_ASSETS));
  }, []);

  const activeFrame = frames[selectedFrameIndex] || frames[0] || DEFAULT_SONAR_ANALYSIS_ASSETS[0];
  const typeInfo = getImageTypeInfo(activeFrame);

  // Auto-scroll selected thumbnail into view
  useEffect(() => {
    const el = thumbnailRefs.current[selectedFrameIndex];
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedFrameIndex]);

  // Image Navigation Handlers (UP / DOWN)
  const handlePrevImage = () => {
    setSelectedFrameIndex((curr) => (curr > 0 ? curr - 1 : frames.length - 1));
    setHighlightedDetection(null);
  };

  const handleNextImage = () => {
    setSelectedFrameIndex((curr) => (curr < frames.length - 1 ? curr + 1 : 0));
    setHighlightedDetection(null);
  };

  // Processed View Navigation Handlers (LEFT / RIGHT)
  // Order: Original → Enhanced → Segmentation → Heatmap
  const handlePrevMode = () => {
    setProcessedTab((curr) => {
      const idx = PROCESSED_MODES.indexOf(curr);
      return PROCESSED_MODES[(idx - 1 + PROCESSED_MODES.length) % PROCESSED_MODES.length];
    });
  };

  const handleNextMode = () => {
    setProcessedTab((curr) => {
      const idx = PROCESSED_MODES.indexOf(curr);
      return PROCESSED_MODES[(idx + 1) % PROCESSED_MODES.length];
    });
  };

  // Keyboard navigation listener:
  // LEFT / RIGHT: change ONLY the processed-view mode
  // UP / DOWN: change ONLY the selected sonar image
  // Prevents default window scrolling and avoids interfering with input elements
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (isInput) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevMode();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextMode();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevImage();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [frames.length]);

  // Zoom handlers for main viewport
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  // Modal zoom handlers
  const handleModalZoomIn = () => setModalZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleModalZoomOut = () => setModalZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleModalResetZoom = () => setModalZoomLevel(1);

  // Resolve image URL for a given processed mode
  const getSectionImageUrl = (section: ProcessedTabType): string | null => {
    switch (section) {
      case 'original':
        return activeFrame.rawUrl;
      case 'enhanced':
        return activeFrame.preprocessedUrl || activeFrame.enhancedUrl || null;
      case 'segmented':
        return activeFrame.segmentationUrl || null;
      case 'heatmap':
        return activeFrame.heatmapUrl || null;
      default:
        return null;
    }
  };

  const currentViewUrl = getSectionImageUrl(processedTab);
  const modalSectionUrl = expandedSection ? getSectionImageUrl(expandedSection) : null;

  if (!isProcessed) {
    return (
      <div className="p-8 max-w-7xl">
        <PageHeader
          step="STEP 02"
          total="06"
          title="Sonar Analysis"
          subtitle="Preprocess the sonar images and detect known objects and novel anomalies using AI."
        />

        <LayerEmptyState
          layerNumber="02"
          layerName="Sonar Analysis"
          title="No Sonar Analysis Data Ingested"
          description="Acoustic waterfall contrast enhancement and PatchCore candidate segmentation require survey ingestion. Please upload your survey dataset in Layer 01 and click Ingest to run the processing pipeline."
          Icon={Layers}
          hint="Dual-waterfall contrast, PatchCore anomaly activations, and bounded targets will be rendered here once ingested."
        />
      </div>
    );
  }

  // Primary detection if present
  const primaryDetection =
    activeFrame.detections && activeFrame.detections.length > 0 ? activeFrame.detections[0] : null;

  return (
    <div className="p-8 max-w-7xl">
      {/* Header Bar */}
      <PageHeader
        step="STEP 02"
        total="06"
        title="Sonar Analysis"
        subtitle="Preprocess the sonar images and detect known objects and novel anomalies using AI."
      />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 of 12 cols): Large Sonar Image Viewer Primary Workspace */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl border border-navy-100 shadow-xs overflow-hidden flex flex-col">
            {/* Viewer Header */}
            <div className="px-5 py-3 border-b border-navy-50 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <ImageIcon size={18} className="text-ocean" strokeWidth={2} />
                <h3 className="text-sm font-semibold text-navy">Sonar Image Viewer</h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded border font-medium ${typeInfo.badgeColor}`}
                >
                  {typeInfo.typeLabel}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-navy-400 font-medium">
                  Image {selectedFrameIndex + 1} of {frames.length}
                </span>
                {/* Header On-Screen Arrow Controls: ↑ / ↓ for Image Navigation */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevImage}
                    className="w-6 h-6 flex items-center justify-center border border-navy-100 rounded text-navy-400 hover:text-navy hover:border-ocean hover:bg-ocean-50/50 transition-colors cursor-pointer"
                    title="Previous Image (Keyboard: ↑)"
                    aria-label="Previous Image"
                  >
                    <ChevronUp size={13} strokeWidth={2} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="w-6 h-6 flex items-center justify-center border border-navy-100 rounded text-navy-400 hover:text-navy hover:border-ocean hover:bg-ocean-50/50 transition-colors cursor-pointer"
                    title="Next Image (Keyboard: ↓)"
                    aria-label="Next Image"
                  >
                    <ChevronDown size={13} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>

            {/* Viewer Body: Left Filmstrip + Central Viewport */}
            <div className="flex flex-row overflow-hidden border-b border-navy-50">
              {/* Left Filmstrip Column (Strictly Raw Authentic Images in Priority Order) */}
              <div className="w-[88px] bg-slate-50/70 border-r border-navy-50 p-2 space-y-2.5 max-h-[500px] overflow-y-auto scrollbar-thin select-none flex-shrink-0">
                {frames.map((frame, index) => {
                  const isSelected = index === selectedFrameIndex;
                  const itemInfo = getImageTypeInfo(frame);
                  return (
                    <div
                      key={frame.id || index}
                      ref={(el) => (thumbnailRefs.current[index] = el)}
                      onClick={() => {
                        setSelectedFrameIndex(index);
                        setHighlightedDetection(null);
                      }}
                      className="cursor-pointer group flex flex-col items-center"
                    >
                      <div
                        className={`w-full aspect-[16/10] bg-navy-950 rounded-sm overflow-hidden transition-all duration-200 ${
                          isSelected
                            ? 'ring-2 ring-ocean border border-ocean shadow-xs scale-102'
                            : 'border border-navy-100 opacity-70 group-hover:opacity-100'
                        }`}
                      >
                        <img
                          src={frame.rawUrl}
                          alt={frame.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span
                        className={`text-[10px] text-center truncate block mt-1 w-full ${
                          isSelected ? 'text-ocean font-semibold' : 'text-navy-400 font-medium'
                        }`}
                        title={`${frame.name} (${itemInfo.typeLabel})`}
                      >
                        {itemInfo.typeLabel}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Central Sonar Image Viewport */}
              <div
                className={`relative flex-1 bg-black overflow-hidden flex items-center justify-center transition-all ${
                  isFullscreen ? 'h-[78vh]' : 'h-[500px]'
                }`}
              >
                {/* TOP CONTROLS BAR: Solid white, subtle border, compact, non-transparent */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none select-none z-20">
                  <div />

                  {/* Center: Processed-View Control with On-Screen ← / → */}
                  <div className="pointer-events-auto bg-white border border-navy-100 rounded-md shadow-xs p-0.5 flex items-center gap-1">
                    {/* On-Screen ← Arrow for Processed View */}
                    <button
                      onClick={handlePrevMode}
                      className="w-6 h-6 flex items-center justify-center rounded text-navy-400 hover:text-navy hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Previous Processed View (Keyboard: ←)"
                      aria-label="Previous Processed View"
                    >
                      <ChevronLeft size={13} strokeWidth={2} />
                    </button>

                    {/* Mode Buttons: Original, Enhanced, Segmentation, Heatmap */}
                    <div className="flex items-center gap-0.5">
                      {(['original', 'enhanced', 'segmented', 'heatmap'] as const).map((tab) => {
                        const isActive = processedTab === tab;
                        const labels: Record<ProcessedTabType, string> = {
                          original: 'Original',
                          enhanced: 'Enhanced',
                          segmented: 'Segmentation',
                          heatmap: 'Heatmap',
                        };

                        return (
                          <button
                            key={tab}
                            onClick={() => setProcessedTab(tab)}
                            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-navy text-white font-semibold shadow-xs'
                                : 'text-navy-500 hover:text-navy hover:bg-slate-50 font-medium'
                            }`}
                          >
                            {labels[tab]}
                          </button>
                        );
                      })}
                    </div>

                    {/* On-Screen → Arrow for Processed View */}
                    <button
                      onClick={handleNextMode}
                      className="w-6 h-6 flex items-center justify-center rounded text-navy-400 hover:text-navy hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Next Processed View (Keyboard: →)"
                      aria-label="Next Processed View"
                    >
                      <ChevronRight size={13} strokeWidth={2} />
                    </button>
                  </div>

                  {/* Right: Current Image Counter */}
                  <div className="pointer-events-auto bg-white border border-navy-100 rounded-md shadow-xs px-2.5 py-1 text-xs font-medium text-navy">
                    Image {selectedFrameIndex + 1} of {frames.length}
                  </div>
                </div>

                {/* Scaled Sonar Display Canvas */}
                <div
                  className="w-full h-full flex items-center justify-center transition-transform duration-200 relative"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  {currentViewUrl ? (
                    <img
                      src={currentViewUrl}
                      alt={`${processedTab} view of ${activeFrame.name}`}
                      className="max-h-full max-w-full object-contain select-none"
                    />
                  ) : (
                    /* Clean Placeholder if selected processed view image is not available */
                    <div className="flex flex-col items-center justify-center p-6 text-center max-w-md select-none">
                      <div className="w-10 h-10 rounded-lg bg-navy-900 border border-navy-700 text-slate-300 flex items-center justify-center mb-3">
                        {processedTab === 'segmented' ? (
                          <Layers size={20} className="text-emerald-400" />
                        ) : processedTab === 'heatmap' ? (
                          <Activity size={20} className="text-amber-400" />
                        ) : (
                          <Sparkles size={20} className="text-ocean-300" />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-white tracking-wide uppercase">
                        {processedTab === 'segmented'
                          ? 'No Segmentation Mask Available'
                          : processedTab === 'heatmap'
                          ? 'No Anomaly Heatmap Available'
                          : 'Enhanced Imagery Space'}
                      </span>
                      <span className="text-xs text-navy-300 mt-1 leading-relaxed">
                        {processedTab === 'segmented'
                          ? 'Segmentation mask has not been generated for this sonar swath.'
                          : processedTab === 'heatmap'
                          ? 'Thermal anomaly inference not computed for this unannotated baseline.'
                          : 'Super-resolution and despeckling acoustic model output reserved.'}
                      </span>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => setProcessedTab('original')}
                          className="px-3 py-1 bg-white border border-navy-200 text-navy hover:bg-slate-50 rounded text-xs font-medium transition-colors cursor-pointer"
                        >
                          View Original Scan
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Target Focus indicator if user clicked 'View' on a detection */}
                  {highlightedDetection && (
                    <div className="absolute top-16 left-5 pointer-events-none flex items-center z-10">
                      <div className="border border-navy-200 bg-white rounded px-2.5 py-1 text-navy text-xs font-medium shadow-sm flex items-center gap-1.5">
                        <Crosshair size={12} className="text-ocean" />
                        Target Focus #{highlightedDetection}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom-Left: Active Mode Watermark Tag */}
                <div className="absolute bottom-12 left-5 select-none pointer-events-none z-10">
                  <div className="px-2 py-0.5 rounded bg-white/95 border border-navy-100 text-[10px] font-medium text-navy shadow-xs">
                    {processedTab === 'original' && 'Original Sonar Swath'}
                    {processedTab === 'enhanced' && 'Pre-Processed • Contrast Enhanced'}
                    {processedTab === 'segmented' && 'Acoustic Segmentation Masks'}
                    {processedTab === 'heatmap' && 'PatchCore Anomaly Heatmap'}
                  </div>
                </div>

                {/* Bottom-Right: 50m Scale Bar */}
                <div className="absolute bottom-12 right-5 select-none pointer-events-none opacity-90 z-10 text-right">
                  <div className="text-[10px] font-medium text-white mb-0.5">50 m</div>
                  <div className="w-20 h-0.5 bg-white relative flex justify-between">
                    <div className="w-0.5 h-2 bg-white -top-1.5 absolute left-0" />
                    <div className="w-0.5 h-2 bg-white -top-1.5 absolute right-0" />
                  </div>
                </div>

                {/* Bottom Toolbar: Zoom Controls & Fullscreen */}
                <div className="absolute bottom-3 inset-x-4 flex items-center justify-between pointer-events-none select-none z-10">
                  {/* Zoom Controls Pill */}
                  <div className="pointer-events-auto flex items-center bg-white border border-navy-100 rounded-md shadow-xs p-0.5 text-xs">
                    <button
                      onClick={handleZoomOut}
                      className="px-2 py-1 text-navy-400 hover:text-navy hover:bg-slate-50 rounded transition-colors cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut size={13} />
                    </button>
                    <button
                      onClick={handleResetZoom}
                      className="px-2 py-1 font-semibold text-navy hover:text-ocean transition-colors cursor-pointer"
                      title="Reset Zoom"
                    >
                      {Math.round(zoomLevel * 100)}%
                    </button>
                    <button
                      onClick={handleZoomIn}
                      className="px-2 py-1 text-navy-400 hover:text-navy hover:bg-slate-50 rounded transition-colors cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn size={13} />
                    </button>
                  </div>

                  {/* Modal Expand & Fullscreen Controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setExpandedSection(processedTab)}
                      className="pointer-events-auto px-2.5 py-1.5 bg-white border border-navy-100 text-navy hover:text-ocean hover:bg-slate-50 rounded-md shadow-xs text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Open High-Resolution Inspector Modal"
                    >
                      <SlidersHorizontal size={13} className="text-ocean" />
                      <span>Inspect Mode</span>
                    </button>

                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="pointer-events-auto p-1.5 bg-white border border-navy-100 text-navy-400 hover:text-navy hover:bg-slate-50 rounded-md shadow-xs transition-colors cursor-pointer"
                      title="Toggle Fullscreen"
                    >
                      {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 of 12 cols): Detections in This Image + AI Analysis / Image Information */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Detections in This Image */}
          <div className="bg-white rounded-xl border border-navy-100 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crosshair size={18} className="text-ocean" strokeWidth={2} />
                <h3 className="text-sm font-semibold text-navy">Detections in This Image</h3>
              </div>
              {activeFrame.detections && activeFrame.detections.length > 0 && (
                <span className="text-xs font-medium text-ocean bg-ocean-50 px-2 py-0.5 rounded border border-ocean-100">
                  {activeFrame.detections.length} Target
                  {activeFrame.detections.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Detections Table / Clean Empty State */}
            {activeFrame.detections && activeFrame.detections.length > 0 ? (
              <div className="w-full text-xs">
                <div className="grid grid-cols-12 gap-2 text-navy-300 font-semibold border-b border-navy-50 pb-2 mb-2 text-[11px]">
                  <div className="col-span-1">#</div>
                  <div className="col-span-4">Class</div>
                  <div className="col-span-5">Confidence</div>
                  <div className="col-span-2 text-right">Action</div>
                </div>

                <div className="space-y-2.5">
                  {activeFrame.detections.map((d) => {
                    const isHighlighted = highlightedDetection === d.id;

                    const barColor =
                      d.color === 'red' || d.isNovel
                        ? 'bg-[#eb3838]'
                        : d.color === 'green'
                        ? 'bg-[#10b981]'
                        : 'bg-[#0080ff]';

                    return (
                      <div
                        key={d.id}
                        className={`grid grid-cols-12 gap-2 items-center py-1 transition-colors ${
                          isHighlighted ? 'bg-ocean-50/80 -mx-2 px-2 rounded-md' : ''
                        }`}
                      >
                        {/* # Number */}
                        <div className="col-span-1 text-navy-400 font-medium">{d.id}</div>

                        {/* Class */}
                        <div className="col-span-4 truncate">
                          {d.isNovel ? (
                            <span className="text-[#eb3838] font-semibold">{d.className}</span>
                          ) : (
                            <span className="text-navy font-medium">{d.className}</span>
                          )}
                        </div>

                        {/* Confidence Progress Bar + Label */}
                        <div className="col-span-5 flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                              style={{ width: `${Math.round(d.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-navy-400 text-xs w-8 font-medium">
                            {d.confidence.toFixed(2)}
                          </span>
                        </div>

                        {/* Action View Button */}
                        <div className="col-span-2 text-right">
                          <button
                            onClick={() => setHighlightedDetection(d.id)}
                            className="px-2.5 py-0.5 border border-navy-200 hover:border-ocean text-navy-600 hover:text-ocean rounded text-xs font-medium bg-white hover:bg-ocean-50/50 transition-colors cursor-pointer shadow-2xs"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Clean Placeholder for unannotated frames */
              <div className="py-7 flex flex-col items-center justify-center text-center text-navy-300">
                <div className="w-9 h-9 rounded-full bg-navy-50 flex items-center justify-center mb-2 text-navy-300">
                  <Crosshair size={18} strokeWidth={1.5} />
                </div>
                <p className="text-xs font-semibold text-navy-500">No Bounding Box Detections</p>
                <p className="text-xs text-navy-300 mt-1 max-w-[210px] leading-relaxed font-normal">
                  No target classes or anomalies identified for this sonar swath.
                </p>
              </div>
            )}
          </div>

          {/* Card 2: AI Analysis / Image Information Panel */}
          <div className="bg-white rounded-xl border border-navy-100 shadow-xs p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-navy-50">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-ocean" strokeWidth={2} />
                <h3 className="text-sm font-semibold text-navy">AI Analysis & Telemetry</h3>
              </div>
              {primaryDetection ? (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  Model Inferred
                </span>
              ) : (
                <span className="text-xs font-medium text-navy-400 bg-slate-50 px-2 py-0.5 rounded border border-navy-100">
                  Baseline Scan
                </span>
              )}
            </div>

            {/* AI Target Analysis Section */}
            <div className="space-y-2.5">
              <div className="label-xs text-navy-300">AI TARGET ANALYSIS</div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Current Target */}
                <div className="bg-slate-50/60 p-2.5 rounded-md border border-navy-50">
                  <div className="label-xs text-navy-300 mb-0.5">Current Target</div>
                  <div className="font-semibold text-navy truncate">
                    {typeInfo.typeLabel}
                  </div>
                </div>

                {/* Detection Status */}
                <div className="bg-slate-50/60 p-2.5 rounded-md border border-navy-50">
                  <div className="label-xs text-navy-300 mb-0.5">Detection Status</div>
                  <div className="font-semibold text-navy flex items-center gap-1.5">
                    {primaryDetection ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Detected
                      </span>
                    ) : (
                      <span className="text-navy-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />
                        No Detection
                      </span>
                    )}
                  </div>
                </div>

                {/* Confidence */}
                <div className="bg-slate-50/60 p-2.5 rounded-md border border-navy-50">
                  <div className="label-xs text-navy-300 mb-0.5">Confidence</div>
                  <div className="font-semibold text-navy">
                    {primaryDetection ? (
                      <span>
                        {Math.round(primaryDetection.confidence * 100)}%
                        <span className="text-navy-400 font-normal ml-1">
                          ({primaryDetection.confidence.toFixed(2)})
                        </span>
                      </span>
                    ) : (
                      <span className="text-navy-300 font-normal">N/A</span>
                    )}
                  </div>
                </div>

                {/* Classification */}
                <div className="bg-slate-50/60 p-2.5 rounded-md border border-navy-50">
                  <div className="label-xs text-navy-300 mb-0.5">Classification</div>
                  <div className="font-semibold text-navy truncate">
                    {primaryDetection ? primaryDetection.className : typeInfo.classification}
                  </div>
                </div>
              </div>

              {/* Anomaly Status Bar */}
              <div className="bg-slate-50/60 p-2.5 rounded-md border border-navy-50 flex items-center justify-between text-xs">
                <span className="label-xs text-navy-300">Anomaly Status</span>
                {typeInfo.isAnomaly ||
                (activeFrame.detections && activeFrame.detections.some((d) => d.isNovel)) ? (
                  <span className="text-[#eb3838] font-semibold text-xs flex items-center gap-1.5">
                    <AlertTriangle size={13} /> Anomaly Detected
                  </span>
                ) : activeFrame.detections && activeFrame.detections.length > 0 ? (
                  <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> Normal (Known Class)
                  </span>
                ) : (
                  <span className="text-navy-400 font-medium text-xs">
                    Normal Seafloor Profile
                  </span>
                )}
              </div>
            </div>

            {/* Image Information Section */}
            <div className="pt-2 border-t border-navy-50 space-y-2">
              <div className="label-xs text-navy-300">IMAGE INFORMATION</div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-navy-50/60">
                  <span className="text-navy-400 font-medium">File Name</span>
                  <span className="font-semibold text-navy truncate max-w-[170px]" title={activeFrame.name}>
                    {activeFrame.name}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-navy-50/60">
                  <span className="text-navy-400 font-medium">Image Index</span>
                  <span className="font-semibold text-navy">
                    {selectedFrameIndex + 1} of {frames.length}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-navy-50/60">
                  <span className="text-navy-400 font-medium">Resolution</span>
                  <span className="font-semibold text-navy">1024 × 512 px</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-navy-400 font-medium">Processing Status</span>
                  <span className="font-semibold text-ocean">
                    {activeFrame.segmentationUrl && activeFrame.heatmapUrl
                      ? 'Fully Inferred'
                      : activeFrame.preprocessedUrl
                      ? 'Pre-Processed'
                      : 'Raw Ingested'}
                  </span>
                </div>
              </div>
            </div>

            {/* Acoustic Note Section */}
            {activeFrame.observability?.notes && (
              <div className="pt-2 border-t border-navy-50">
                <div className="label-xs text-navy-300 mb-1">ACOUSTIC NOTE</div>
                <p className="text-xs text-navy-500 font-normal leading-relaxed bg-slate-50/60 p-2.5 rounded-md border border-navy-50">
                  {activeFrame.observability.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-navy-100/60">
        <button
          onClick={() => navigate('/survey-ingestion')}
          className="px-4 py-2 bg-ocean-50 hover:bg-ocean-100 border border-ocean-200 text-ocean rounded-md text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Ingestion
        </button>

        <button
          onClick={() => navigate('/evidence-intelligence')}
          className="px-5 py-2.5 bg-navy hover:bg-ocean text-white rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm group"
        >
          <span>Continue to Evidence Intelligence</span>
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* High-Resolution Expanded Section Modal Lightbox */}
      {expandedSection && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl max-w-5xl w-full p-6 shadow-xl border border-navy-100 max-h-[95vh] flex flex-col justify-between overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-navy-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-ocean-50 text-ocean flex items-center justify-center">
                  <SlidersHorizontal size={18} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy capitalize">
                    {expandedSection} View • {activeFrame.name}
                  </h3>
                  <p className="text-xs text-navy-400 mt-0.5">
                    Frame {selectedFrameIndex + 1} of {frames.length} ({typeInfo.typeLabel})
                  </p>
                </div>
              </div>

              {/* Section Switcher Tabs inside Modal */}
              <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-md">
                {(['original', 'enhanced', 'segmented', 'heatmap'] as const).map((tab) => {
                  const labels: Record<ProcessedTabType, string> = {
                    original: 'Original',
                    enhanced: 'Enhanced',
                    segmented: 'Segmentation',
                    heatmap: 'Heatmap',
                  };
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setExpandedSection(tab);
                        setProcessedTab(tab);
                      }}
                      className={`px-3 py-1 rounded text-xs font-semibold capitalize transition-all cursor-pointer ${
                        expandedSection === tab
                          ? 'bg-navy text-white shadow-xs'
                          : 'text-navy-400 hover:text-navy'
                      }`}
                    >
                      {labels[tab]}
                    </button>
                  );
                })}
              </div>

              {/* Modal Zoom & Close Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 rounded-md p-0.5 text-xs">
                  <button
                    onClick={handleModalZoomOut}
                    className="p-1 rounded text-navy-400 hover:text-navy"
                    title="Zoom Out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="px-1.5 text-navy font-semibold">
                    {Math.round(modalZoomLevel * 100)}%
                  </span>
                  <button
                    onClick={handleModalZoomIn}
                    className="p-1 rounded text-navy-400 hover:text-navy"
                    title="Zoom In"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <button
                    onClick={handleModalResetZoom}
                    className="p-1 rounded text-navy-400 hover:text-navy"
                    title="Reset Zoom"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    setExpandedSection(null);
                    setModalZoomLevel(1);
                  }}
                  className="p-1.5 rounded-md text-navy-400 hover:text-navy hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body Viewport */}
            <div className="py-4 flex-1 overflow-hidden flex items-center justify-center bg-black rounded-lg border border-navy-100 relative min-h-[420px]">
              {modalSectionUrl ? (
                <div
                  className="w-full h-full flex items-center justify-center transition-transform duration-200"
                  style={{ transform: `scale(${modalZoomLevel})` }}
                >
                  <img
                    src={modalSectionUrl}
                    alt={`${expandedSection} expanded view`}
                    className="max-h-[65vh] max-w-full object-contain select-none shadow-lg"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-navy-300">
                  <div className="w-10 h-10 rounded-lg bg-navy-900 text-slate-300 flex items-center justify-center mb-3">
                    {expandedSection === 'segmented' ? (
                      <Layers size={22} />
                    ) : expandedSection === 'heatmap' ? (
                      <Activity size={22} />
                    ) : (
                      <Sparkles size={22} />
                    )}
                  </div>
                  <span className="text-sm font-bold text-white uppercase">
                    No {expandedSection} View Available
                  </span>
                  <span className="text-xs text-navy-300 mt-1 max-w-sm">
                    This sonar swath does not have an authentic {expandedSection} data layer.
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-navy-50 flex items-center justify-between flex-shrink-0">
              <div className="text-xs text-navy-400">
                Active Section: <strong className="text-navy uppercase">{expandedSection}</strong>
              </div>

              <div className="flex items-center gap-3">
                {modalSectionUrl && (
                  <a
                    href={modalSectionUrl}
                    download={`${activeFrame.name}_${expandedSection}`}
                    className="px-4 py-2 border border-navy-200 hover:bg-slate-50 rounded-md text-xs font-semibold text-navy flex items-center gap-1.5 transition-colors"
                  >
                    <Download size={13} />
                    Download {expandedSection} Image
                  </a>
                )}
                <button
                  onClick={() => {
                    setExpandedSection(null);
                    setModalZoomLevel(1);
                  }}
                  className="px-5 py-2 bg-navy hover:bg-ocean text-white rounded-md text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
