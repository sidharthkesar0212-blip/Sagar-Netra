import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Image as ImageIcon,
  Crosshair,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Layers,
  Activity,
  ScanLine,
  X,
  Download,
  RotateCcw,
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

export default function SonarAnalysis() {
  const navigate = useNavigate();
  const { pipelineState } = usePipeline();
  const isProcessed = pipelineState !== 'idle';

  // Frames state
  const [frames, setFrames] = useState<SonarAnalysisAsset[]>(DEFAULT_SONAR_ANALYSIS_ASSETS);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Right-side processed view tabs: Original, Enhanced, Segmented, Heatmap
  const [processedTab, setProcessedTab] = useState<ProcessedTabType>('original');
  const [highlightedDetection, setHighlightedDetection] = useState<number | null>(null);

  // Expanded modal for the 4 processed sections
  const [expandedSection, setExpandedSection] = useState<ProcessedTabType | null>(null);
  const [modalZoomLevel, setModalZoomLevel] = useState<number>(1);

  // Load uploaded frames from Step 1 (Survey Ingestion) if available
  useEffect(() => {
    const savedList = localStorage.getItem('sagar_sonar_images_list');
    if (savedList) {
      try {
        const parsed: IngestedImage[] = JSON.parse(savedList);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Strictly filter out any obsolete IMG_001.png entries
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
            setFrames(mappedAssets);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to parse saved sonar images for SonarAnalysis:', err);
      }
    }
    setFrames(DEFAULT_SONAR_ANALYSIS_ASSETS);
  }, []);

  const activeFrame = frames[selectedFrameIndex] || frames[0] || DEFAULT_SONAR_ANALYSIS_ASSETS[0];

  // Navigation handlers
  const handlePrev = () => {
    if (selectedFrameIndex > 0) {
      setSelectedFrameIndex(selectedFrameIndex - 1);
    } else {
      setSelectedFrameIndex(frames.length - 1);
    }
    setHighlightedDetection(null);
  };

  const handleNext = () => {
    if (selectedFrameIndex < frames.length - 1) {
      setSelectedFrameIndex(selectedFrameIndex + 1);
    } else {
      setSelectedFrameIndex(0);
    }
    setHighlightedDetection(null);
  };

  // Zoom handlers for main viewport
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  // Modal zoom handlers
  const handleModalZoomIn = () => setModalZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleModalZoomOut = () => setModalZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleModalResetZoom = () => setModalZoomLevel(1);

  // Get image URL or null for given section
  const getSectionImageUrl = (section: ProcessedTabType): string | null => {
    switch (section) {
      case 'original':
        return activeFrame.rawUrl;
      case 'enhanced':
        return activeFrame.preprocessedUrl || activeFrame.enhancedUrl || null;
      case 'segmented':
        return activeFrame.segmentationUrl;
      case 'heatmap':
        return activeFrame.heatmapUrl;
      default:
        return null;
    }
  };

  const currentSectionUrl = getSectionImageUrl(processedTab);
  const modalSectionUrl = expandedSection ? getSectionImageUrl(expandedSection) : null;

  if (!isProcessed) {
    return (
      <div className="p-8 max-w-7xl">
        {/* Header Bar */}
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
        {/* Left Column (8 of 12 cols): Sonar Image Viewer (Displays Bounded Box Photo) */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl border border-navy-100 shadow-xs overflow-hidden flex flex-col">
            {/* Viewer Header */}
            <div className="px-5 py-3 border-b border-navy-50 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <ImageIcon size={18} className="text-ocean" strokeWidth={2} />
                <h3 className="text-sm font-semibold text-navy">Sonar Image Viewer</h3>
                {activeFrame.bboxUrl ? (
                  <span className="text-[11px] font-mono text-ocean bg-ocean-50 px-2 py-0.5 rounded border border-ocean-100">
                    Bounded Swath
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-navy-400 bg-slate-50 px-2 py-0.5 rounded border border-navy-100">
                    Raw Scan
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-navy-300">
                  Image {selectedFrameIndex + 1} of {frames.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrev}
                    className="w-6 h-6 flex items-center justify-center border border-navy-100 rounded text-navy-400 hover:text-navy hover:border-ocean hover:bg-ocean-50/50 transition-colors cursor-pointer"
                    title="Previous Image"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={handleNext}
                    className="w-6 h-6 flex items-center justify-center border border-navy-100 rounded text-navy-400 hover:text-navy hover:border-ocean hover:bg-ocean-50/50 transition-colors cursor-pointer"
                    title="Next Image"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Viewer Body: Left Filmstrip + Right Main Viewport */}
            <div className="flex flex-row overflow-hidden border-b border-navy-50">
              {/* Left Filmstrip Column (Strictly Raw Authentic Images) */}
              <div className="w-[84px] bg-slate-50/70 border-r border-navy-50 p-2 space-y-2.5 max-h-[440px] overflow-y-auto scrollbar-thin select-none flex-shrink-0">
                {frames.map((frame, index) => {
                  const isSelected = index === selectedFrameIndex;
                  return (
                    <div
                      key={frame.id || index}
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
                        {/* Filmstrip thumbnail is strictly the raw unannotated image */}
                        <img
                          src={frame.rawUrl}
                          alt={frame.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span
                        className={`text-[9px] font-mono text-center truncate block mt-1 w-full ${
                          isSelected ? 'text-ocean font-bold' : 'text-navy-300'
                        }`}
                        title={frame.name}
                      >
                        {frame.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Right: Main Sonar Viewport (Displays Bounded Box Photo) */}
              <div
                className={`relative flex-1 bg-black overflow-hidden flex items-center justify-center transition-all ${
                  isFullscreen ? 'h-[75vh]' : 'h-[440px]'
                }`}
              >
                {/* Scaled Sonar Display Canvas: Displays the Bounded Box Photo */}
                <div
                  className="w-full h-full flex items-center justify-center transition-transform duration-200 relative"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <img
                    src={activeFrame.bboxUrl || activeFrame.rawUrl}
                    alt={`Bounded sonar swath ${activeFrame.name}`}
                    className="max-h-full max-w-full object-contain select-none"
                  />

                  {/* Highlight box indicator if user clicked 'View' on a detection */}
                  {highlightedDetection && (
                    <div className="absolute top-4 left-5 pointer-events-none flex items-center">
                      <div className="border border-ocean-400 bg-navy-950/85 backdrop-blur-xs rounded px-2.5 py-1 text-ocean-200 font-mono text-[11px] shadow-lg flex items-center gap-1.5 animate-pulse">
                        <Crosshair size={12} className="text-ocean-300" />
                        Target Focus #{highlightedDetection}
                      </div>
                    </div>
                  )}
                </div>

                {/* Top-Right: North Compass Arrow */}
                <div className="absolute top-4 right-4 flex flex-col items-center select-none pointer-events-none opacity-90">
                  <span className="text-[11px] font-mono font-bold text-white tracking-widest leading-none mb-0.5">
                    N
                  </span>
                  <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[10px] border-b-white" />
                  <div className="w-0.5 h-3 bg-white/70 mt-0.5" />
                </div>

                {/* Bottom-Left: 50m Scale Bar */}
                <div className="absolute bottom-12 left-5 select-none pointer-events-none opacity-90">
                  <div className="text-[10px] font-mono text-white mb-0.5">50 m</div>
                  <div className="w-20 h-0.5 bg-white relative flex justify-between">
                    <div className="w-0.5 h-2 bg-white -top-1.5 absolute left-0" />
                    <div className="w-0.5 h-2 bg-white -top-1.5 absolute right-0" />
                  </div>
                </div>

                {/* Bottom Toolbar: Zoom Controls & Fullscreen */}
                <div className="absolute bottom-3 inset-x-4 flex items-center justify-between pointer-events-none select-none">
                  {/* Zoom Controls Pill */}
                  <div className="pointer-events-auto flex items-center bg-white/95 backdrop-blur-xs border border-navy-100 rounded-lg shadow-xs p-0.5 text-xs font-mono">
                    <button
                      onClick={handleZoomOut}
                      className="px-2 py-1 text-navy-400 hover:text-navy hover:bg-slate-100 rounded transition-colors cursor-pointer"
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
                      className="px-2 py-1 text-navy-400 hover:text-navy hover:bg-slate-100 rounded transition-colors cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn size={13} />
                    </button>
                  </div>

                  {/* Fullscreen Expand Button */}
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="pointer-events-auto p-1.5 bg-white/95 backdrop-blur-xs border border-navy-100 text-navy-400 hover:text-navy hover:bg-slate-100 rounded-lg shadow-xs transition-colors cursor-pointer"
                    title="Toggle Fullscreen"
                  >
                    {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 of 12 cols): Detections & 4 Processed Sections */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Detections in This Image */}
          <div className="bg-white rounded-xl border border-navy-100 shadow-xs p-5">
            <div className="flex items-center gap-2 mb-4">
              <Crosshair size={18} className="text-ocean" strokeWidth={2} />
              <h3 className="text-sm font-semibold text-navy">Detections in This Image</h3>
            </div>

            {/* Detections Table / Empty State Placeholder */}
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
                        <div className="col-span-1 font-mono text-navy-300">{d.id}</div>

                        {/* Class */}
                        <div className="col-span-4 truncate font-mono">
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
                          <span className="font-mono text-navy-400 text-[11px] w-8">
                            {d.confidence.toFixed(2)}
                          </span>
                        </div>

                        {/* Action View Button */}
                        <div className="col-span-2 text-right">
                          <button
                            onClick={() => {
                              setHighlightedDetection(d.id);
                            }}
                            className="px-2.5 py-0.5 border border-navy-200 hover:border-ocean text-navy-600 hover:text-ocean rounded text-[11px] font-medium bg-white hover:bg-ocean-50/50 transition-colors cursor-pointer shadow-2xs"
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
                <p className="text-[11px] text-navy-300 mt-1 max-w-[210px] leading-relaxed">
                  No target classes or anomalies identified for this sonar swath.
                </p>
              </div>
            )}
          </div>

          {/* Card 2: Processed View with the 4 Sections: Enhanced, Bounded, Segmented, Heatmap */}
          <div className="bg-white rounded-xl border border-navy-100 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-ocean" strokeWidth={2} />
                <h3 className="text-sm font-semibold text-navy">Processed View</h3>
              </div>
              <span className="text-[10px] font-mono text-navy-300">
                Click image to expand
              </span>
            </div>

            {/* 4 Sections Control: Original, Enhanced, Segmentation, Heatmap */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/80 rounded-lg mb-3">
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
                    className={`py-1.5 px-1 rounded text-xs font-semibold capitalize transition-all cursor-pointer text-center ${
                      isActive
                        ? 'bg-navy text-white shadow-xs'
                        : 'text-navy-400 hover:text-navy hover:bg-slate-200/60'
                    }`}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* Processed View Image Container with Click-to-Expand */}
            <div
              onClick={() => setExpandedSection(processedTab)}
              className="group relative rounded-lg overflow-hidden bg-black aspect-[21/9] flex items-center justify-center border border-navy-100 cursor-pointer shadow-xs"
              title="Click to expand this view"
            >
              {/* Section 1: Original (Authentic Clean Unannotated Raw Sonar Scan) */}
              {processedTab === 'original' && (
                <>
                  <img
                    src={activeFrame.rawUrl}
                    alt="Original sonar scan"
                    className="w-full h-full object-cover select-none"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[9px] font-mono text-ocean-200 border border-ocean-500/30">
                    Original Sonar Swath
                  </div>
                </>
              )}

              {/* Section 2: Enhanced (Authentic Pre-Processed Acoustic Scan) */}
              {processedTab === 'enhanced' && (
                (activeFrame.preprocessedUrl || activeFrame.enhancedUrl) ? (
                  <>
                    <img
                      src={(activeFrame.preprocessedUrl || activeFrame.enhancedUrl)!}
                      alt="Enhanced pre-processed acoustic scan"
                      className="w-full h-full object-cover select-none"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[9px] font-mono text-cyan-300 border border-cyan-500/30">
                      Pre-Processed • Contrast & Bilateral Enhanced
                    </div>
                  </>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={activeFrame.rawUrl}
                      alt="Enhanced space preview"
                      className="w-full h-full object-cover select-none opacity-30 filter contrast-125"
                    />
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-2xs flex flex-col items-center justify-center p-3 text-center">
                      <div className="w-7 h-7 rounded-full bg-ocean-500/20 text-ocean-300 flex items-center justify-center mb-1">
                        <Sparkles size={14} />
                      </div>
                      <span className="text-xs font-semibold text-white font-mono">
                        Enhanced Imagery Space
                      </span>
                      <span className="text-[10px] text-ocean-200 mt-0.5">
                        Super-resolution & despeckling model output reserved
                      </span>
                    </div>
                  </div>
                )
              )}

              {/* Section 3: Segmented (Authentic Mask or Placeholder) */}
              {processedTab === 'segmented' && (
                activeFrame.segmentationUrl ? (
                  <>
                    <img
                      src={activeFrame.segmentationUrl}
                      alt="Segmentation mask view"
                      className="w-full h-full object-cover select-none"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[9px] font-mono text-emerald-300 border border-emerald-500/30">
                      Acoustic Segmentation Masks
                    </div>
                  </>
                ) : (
                  /* Segmented Placeholder */
                  <div className="w-full h-full bg-navy-950/95 flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mb-1.5">
                      <Layers size={16} strokeWidth={1.75} />
                    </div>
                    <span className="text-xs font-semibold text-white font-mono">
                      No Segmentation Mask Available
                    </span>
                    <span className="text-[10px] text-navy-300 mt-1 max-w-[210px] leading-relaxed">
                      Segmentation mask has not been generated for this frame.
                    </span>
                  </div>
                )
              )}

              {/* Section 4: Heatmap (Authentic Heatmap or Placeholder) */}
              {processedTab === 'heatmap' && (
                activeFrame.heatmapUrl ? (
                  <>
                    <img
                      src={activeFrame.heatmapUrl}
                      alt="Heatmap view"
                      className="w-full h-full object-cover select-none"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[9px] font-mono text-amber-300 border border-amber-500/30">
                      Novelty & Anomaly Thermal Heatmap
                    </div>
                  </>
                ) : (
                  /* Heatmap Placeholder */
                  <div className="w-full h-full bg-navy-950/95 flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mb-1.5">
                      <Activity size={16} strokeWidth={1.75} />
                    </div>
                    <span className="text-xs font-semibold text-white font-mono">
                      No Anomaly Heatmap Available
                    </span>
                    <span className="text-[10px] text-navy-300 mt-1 max-w-[210px] leading-relaxed">
                      Thermal anomaly inference not computed for this unannotated frame.
                    </span>
                  </div>
                )
              )}

              {/* Hover Expand Overlay Hint */}
              <div className="absolute inset-0 bg-navy-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-semibold flex items-center gap-1.5 shadow-md">
                  <Maximize2 size={13} /> Click to Expand
                </span>
              </div>
            </div>
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-navy-100 max-h-[95vh] flex flex-col justify-between overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-navy-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-ocean-50 text-ocean flex items-center justify-center">
                  <SlidersHorizontal size={18} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy font-mono capitalize">
                    {expandedSection} View • {activeFrame.name}
                  </h3>
                  <p className="text-xs text-navy-300 font-mono mt-0.5">
                    Frame {selectedFrameIndex + 1} of {frames.length}
                  </p>
                </div>
              </div>

              {/* Section Switcher Tabs inside Modal */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
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
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-mono">
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
                  className="p-1.5 rounded-lg text-navy-400 hover:text-navy hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body Viewport */}
            <div className="py-4 flex-1 overflow-hidden flex items-center justify-center bg-slate-950 rounded-xl border border-navy-100 relative min-h-[420px]">
              {modalSectionUrl ? (
                <div
                  className="w-full h-full flex items-center justify-center transition-transform duration-200"
                  style={{ transform: `scale(${modalZoomLevel})` }}
                >
                  <img
                    src={modalSectionUrl}
                    alt={`${expandedSection} expanded view`}
                    className="max-h-[65vh] max-w-full object-contain select-none shadow-2xl"
                  />
                </div>
              ) : expandedSection === 'enhanced' ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
                  <img
                    src={activeFrame.rawUrl}
                    alt="Enhanced base"
                    className="max-h-[65vh] max-w-full object-contain select-none opacity-25 filter contrast-150"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-ocean-500/20 text-ocean-300 flex items-center justify-center mb-3">
                      <Sparkles size={24} />
                    </div>
                    <span className="text-base font-bold text-white font-mono">
                      Enhanced Imagery Pipeline Space
                    </span>
                    <span className="text-xs text-ocean-200 mt-1 max-w-md">
                      Space reserved for bilateral despeckling and super-resolution acoustic model inference output.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-navy-300">
                  <div className="w-12 h-12 rounded-full bg-slate-900 text-slate-400 flex items-center justify-center mb-3">
                    {expandedSection === 'segmented' ? (
                      <Layers size={24} />
                    ) : (
                      <Activity size={24} />
                    )}
                  </div>
                  <span className="text-sm font-bold text-white font-mono">
                    No {expandedSection === 'segmented' ? 'SEGMENTATION' : 'HEATMAP'} Image Available
                  </span>
                  <span className="text-xs text-navy-300 mt-1 max-w-sm">
                    This sonar frame does not have an authentic {expandedSection} file. Placeholders are shown to preserve data integrity.
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-navy-50 flex items-center justify-between flex-shrink-0">
              <div className="text-xs text-navy-300 font-mono">
                Active Section: <strong className="text-navy uppercase">{expandedSection}</strong>
              </div>

              <div className="flex items-center gap-3">
                {modalSectionUrl && (
                  <a
                    href={modalSectionUrl}
                    download={`${activeFrame.name}_${expandedSection}`}
                    className="px-4 py-2 border border-navy-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-navy flex items-center gap-1.5 transition-colors"
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
                  className="px-5 py-2 bg-navy hover:bg-ocean text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
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
