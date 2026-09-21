import { useState } from 'react';
import {
  Maximize2,
  Minimize2,
  Sliders,
  Compass,
  Download,
  CheckCircle2,
  Layers,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from 'lucide-react';
import { SurveyMetadata, IngestedImage } from '@/types';

interface IngestedImagePreviewProps {
  images: IngestedImage[];
  selectedImageIndex: number;
  onSelectImage: (index: number) => void;
  metadata: SurveyMetadata;
  onContinue: () => void;
  onAddMore?: () => void;
  onRemoveImage?: (id: string) => void;
}

export default function IngestedImagePreview({
  images,
  selectedImageIndex,
  onSelectImage,
  metadata,
  onContinue,
  onAddMore,
  onRemoveImage,
}: IngestedImagePreviewProps) {
  const [filterMode, setFilterMode] = useState<'normal' | 'sonar-blue' | 'sonar-amber' | 'grayscale'>('normal');
  const [showGrid, setShowGrid] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (images.length === 0) return null;

  const currentImage = images[selectedImageIndex] || images[0];

  const filterClasses = {
    normal: '',
    'sonar-blue': 'hue-rotate-180 contrast-125 saturate-150',
    'sonar-amber': 'sepia contrast-125 saturate-200 brightness-95',
    grayscale: 'grayscale contrast-125',
  };

  const handlePrev = () => {
    if (selectedImageIndex > 0) {
      onSelectImage(selectedImageIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedImageIndex < images.length - 1) {
      onSelectImage(selectedImageIndex + 1);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all mt-8">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-ocean-100 text-ocean flex items-center justify-center flex-shrink-0">
            <Layers size={18} strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                Ingested Sonar Imagery ({images.length} {images.length === 1 ? 'Frame' : 'Frames'})
              </h3>
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <CheckCircle2 size={12} strokeWidth={2.2} />
                Ingestion Complete
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono flex items-center gap-2">
              <span>Frame {String(selectedImageIndex + 1).padStart(2, '0')} of {String(images.length).padStart(2, '0')}: {currentImage.name} • {currentImage.size} • Swath: {currentImage.swathWidth || metadata.swath}</span>
              {currentImage.imageMetadata && Object.keys(currentImage.imageMetadata).length > 0 && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  CSV Linked
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Frame stepper & Controls */}
        <div className="flex items-center gap-2">
          {/* Frame Stepper */}
          {images.length > 1 && (
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs mr-1">
              <button
                onClick={handlePrev}
                disabled={selectedImageIndex === 0}
                className="p-1 rounded text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-600"
                title="Previous Frame"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 font-mono font-semibold text-slate-700">
                {selectedImageIndex + 1} / {images.length}
              </span>
              <button
                onClick={handleNext}
                disabled={selectedImageIndex === images.length - 1}
                className="p-1 rounded text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-600"
                title="Next Frame"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Palette selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
            <span className="px-2 text-slate-400 font-medium flex items-center gap-1">
              <Sliders size={12} /> Palette:
            </span>
            <button
              onClick={() => setFilterMode('normal')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                filterMode === 'normal' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Default
            </button>
            <button
              onClick={() => setFilterMode('sonar-blue')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                filterMode === 'sonar-blue' ? 'bg-ocean text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ocean
            </button>
            <button
              onClick={() => setFilterMode('sonar-amber')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                filterMode === 'sonar-amber' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Amber
            </button>
            <button
              onClick={() => setFilterMode('grayscale')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                filterMode === 'grayscale' ? 'bg-slate-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gray
            </button>
          </div>

          {/* Metric Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showGrid
                ? 'bg-ocean-50 border-ocean-200 text-ocean'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle Sonar Metric Grid"
          >
            <Compass size={14} />
            <span className="hidden sm:inline">Grid</span>
          </button>

          {/* Fullscreen view */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs transition-colors"
            title="Toggle Expanded View"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Main Sonar Viewport */}
      <div
        className={`relative bg-slate-950 overflow-hidden select-none transition-all ${
          isFullscreen ? 'h-[75vh]' : 'h-[440px]'
        }`}
      >
        <img
          src={currentImage.url}
          alt={`Sonar frame ${currentImage.frameNumber}`}
          className={`w-full h-full object-cover transition-all duration-300 ${filterClasses[filterMode]}`}
        />

        {/* Scan line textures & animation */}
        <div className="absolute inset-0 scan-line pointer-events-none opacity-40" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="w-full h-0.5 bg-ocean-300/30 animate-scan-sweep" />
        </div>

        {/* Metric Grid Overlay */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none border border-ocean-400/20">
            {/* Center Nadir Line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-ocean-400/40 border-r border-dashed border-ocean-300/60 flex items-center justify-center">
              <span className="bg-slate-950/80 text-[10px] font-mono text-ocean-300 px-1 py-0.5 rounded rotate-90 transform origin-center uppercase tracking-widest">
                Nadir Track
              </span>
            </div>

            {/* Port & Starboard range markers */}
            <div className="absolute top-3 left-4 bg-slate-950/70 backdrop-blur-sm px-2.5 py-1 rounded text-[11px] font-mono text-ocean-200 border border-ocean-500/30">
              PORT CHANNEL (50m)
            </div>
            <div className="absolute top-3 right-4 bg-slate-950/70 backdrop-blur-sm px-2.5 py-1 rounded text-[11px] font-mono text-ocean-200 border border-ocean-500/30">
              STARBOARD CHANNEL (50m)
            </div>

            {/* Coordinates & Swath info */}
            <div className="absolute bottom-3 left-4 bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded text-[11px] font-mono text-slate-300 border border-slate-700/50 flex items-center gap-2">
              <span>POS: <span className="text-ocean-300 font-bold">{currentImage.coordinates || metadata.origin}</span></span>
              {currentImage.depth && (
                <span className="text-slate-400">| DEPTH: <span className="text-emerald-300 font-bold">{currentImage.depth}</span></span>
              )}
            </div>
            <div className="absolute bottom-3 right-4 bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded text-[11px] font-mono text-slate-300 border border-slate-700/50">
              FRAME {String(selectedImageIndex + 1).padStart(2, '0')}/{String(images.length).padStart(2, '0')} • SWATH: <span className="text-emerald-400 font-bold">{currentImage.swathWidth || metadata.swath}</span> • {currentImage.sensor || metadata.sensor}
            </div>
          </div>
        )}
      </div>



      {/* Footer Info & Next Steps */}
      <div className="px-6 py-4 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-xs text-slate-500">
          <div>
            <span className="text-slate-400">Survey ID:</span>{' '}
            <span className="font-mono font-semibold text-slate-700">{metadata.surveyId}</span>
          </div>
          <div>
            <span className="text-slate-400">Total Frames:</span>{' '}
            <span className="font-semibold text-slate-700 font-mono">{images.length}</span>
          </div>
          <div>
            <span className="text-slate-400">Active Frame:</span>{' '}
            <span className="font-mono text-slate-700">{currentImage.name}</span>
          </div>
          {currentImage.coordinates && (
            <div>
              <span className="text-slate-400">Position:</span>{' '}
              <span className="font-mono text-ocean-700 font-medium">{currentImage.coordinates}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <a
            href={currentImage.url}
            download={currentImage.name}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            title="Download Active Frame"
          >
            <Download size={13} />
            Download Frame
          </a>

          <button
            onClick={onContinue}
            className="px-5 py-2.5 bg-[#0066f5] hover:bg-[#0055d4] text-white rounded-lg font-semibold text-xs flex items-center gap-2 shadow-sm transition-all group"
          >
            <span>Continue to Sonar Analysis</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
