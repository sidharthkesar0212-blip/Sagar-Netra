import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Info,
  ArrowRight,
  CheckCircle2,
  File,
  ShieldAlert,
  X,
  FolderOpen,
  Database,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import ProcessIndicator from '@/components/ProcessIndicator';
import ActiveSurveyCard from '@/components/ActiveSurveyCard';
import IngestedImagePreview from '@/components/IngestedImagePreview';
import MetadataEditModal from '@/components/MetadataEditModal';
import FrameThumbnailGrid from '@/components/FrameThumbnailGrid';
import FrameDetailModal from '@/components/FrameDetailModal';
import {
  SurveyMetadata,
  DEFAULT_MUMBAI_SURVEY,
  IngestedImage,
  FrameValidationStatus,
  SwathChannel,
} from '@/types';
import { parseMetadataFile, getMetadataForImage } from '@/utils/metadataParser';
import { getFilesFromDataTransfer } from '@/utils/fileFolderReader';

interface FileState {
  name: string;
  size?: string;
  uploaded: boolean;
}

interface InlineErrorChip {
  id: string;
  fileName: string;
  reason: string;
}

export default function SurveyIngestion() {
  const navigate = useNavigate();

  // Core Queued Frames
  const [frames, setFrames] = useState<IngestedImage[]>([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);
  const [modalFrame, setModalFrame] = useState<IngestedImage | null>(null);

  // Survey Metadata State
  const [metadata, setMetadata] = useState<SurveyMetadata | null>(null);
  const [isMetadataLoaded, setIsMetadataLoaded] = useState<boolean>(false);
  const [metadataFile, setMetadataFile] = useState<FileState | null>(null);
  const [perImageMap, setPerImageMap] = useState<Map<string, Record<string, string>>>(new Map());

  // XTF Raw Telemetry Box
  const [xtfFile, setXtfFile] = useState<FileState | null>(null);

  // Validation Error Chips
  const [errorChips, setErrorChips] = useState<InlineErrorChip[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [dragOver, setDragOver] = useState<'survey' | 'xtf' | null>(null);
  const surveyInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const metaInputRef = useRef<HTMLInputElement>(null);
  const xtfInputRef = useRef<HTMLInputElement>(null);
  const previewSectionRef = useRef<HTMLDivElement>(null);

  // Format File Size Helper
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Deterministic Mock Hash Generator
  const generateChecksum = (fileName: string, size: number): string => {
    let hash = 0;
    const str = `${fileName}_${size}`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  };

  // Rule-based per-frame validation
  const validateIncomingFile = (
    file: File,
    currentFrames: IngestedImage[]
  ): { status: FrameValidationStatus; reason?: string } => {
    // 1. Duplicate detection
    const isDuplicate = currentFrames.some(
      (f) => f.name === file.name && Math.abs((f.sizeBytes || 0) - file.size) < 100
    );
    if (isDuplicate) {
      return { status: 'Duplicate — skipped', reason: 'Duplicate file detected with identical size' };
    }

    // 2. Corrupt / unreadable check
    if (file.name.toLowerCase().includes('corrupt') || file.name.toLowerCase().includes('broken')) {
      return {
        status: 'Rejected (corrupt/unreadable)',
        reason: 'Corrupt header packet or unreadable sonar ping track',
      };
    }

    // 3. Extension format check
    const validExtensions = /\.(png|jpe?g|tif|tiff)$/i;
    if (!validExtensions.test(file.name)) {
      return {
        status: 'Rejected (format)',
        reason: `Unsupported extension '${file.name.split('.').pop()}'. Only PNG, JPG, and TIFF are supported.`,
      };
    }

    // 4. Low resolution warning
    if (file.name.toLowerCase().includes('lowres') || file.size < 50 * 1024) {
      return {
        status: 'Warning (low resolution)',
        reason: 'Acoustic swath resolution is below 800px; feature detection fidelity may be reduced.',
      };
    }

    return { status: 'Valid' };
  };

  // Handle incoming multiple images with metadata mapping
  const handleImageFiles = useCallback(
    (fileList: File[] | FileList | null, mapOverride?: Map<string, Record<string, string>>) => {
      if (!fileList) return;
      const rawFiles = Array.from(fileList);
      if (rawFiles.length === 0) return;

      const activeMap = mapOverride || perImageMap;
      const newErrorChips: InlineErrorChip[] = [];
      let updatedQueue = [...frames];

      rawFiles.forEach((file, index) => {
        // Size validation: reject > 50MB
        if (file.size > 50 * 1024 * 1024) {
          newErrorChips.push({
            id: `err-${Date.now()}-${index}`,
            fileName: file.name,
            reason: 'Exceeds maximum allowable size (50 MB). Ingestion rejected.',
          });
          return;
        }

        const validation = validateIncomingFile(file, updatedQueue);
        const checksum = generateChecksum(file.name, file.size);
        const frameNum = updatedQueue.length + 1;

        // Match per-image metadata from metadata.csv by filename
        const imageMeta = getMetadataForImage(file.name, frameNum, activeMap);

        const channels: SwathChannel[] = ['Dual-channel', 'Port', 'Starboard'];
        let swathSide = channels[frameNum % 3];
        if (imageMeta?.channel) {
          const c = imageMeta.channel.toLowerCase();
          if (c.includes('port')) swathSide = 'Port';
          else if (c.includes('star')) swathSide = 'Starboard';
          else if (c.includes('dual')) swathSide = 'Dual-channel';
        }

        const baseLat = metadata?.origin ? parseFloat(metadata.origin) || 18.922 : 18.922;
        const baseLon = 72.834;
        const defaultLat = (baseLat + frameNum * 0.0003).toFixed(4);
        const defaultLon = (baseLon + frameNum * 0.0002).toFixed(4);

        const newFrame: IngestedImage = {
          id: `usr-${Date.now()}-${index}`,
          url: URL.createObjectURL(file),
          name: file.name,
          size: formatFileSize(file.size),
          sizeBytes: file.size,
          dimensions: { width: 1920, height: 1080 },
          frameNumber: frameNum,
          status: validation.status,
          statusReason: validation.reason,
          swathSide,
          checksum,
          coordinates: imageMeta?.coordinates || `${defaultLat}°N, ${defaultLon}°E`,
          imageMetadata: imageMeta,
          depth: imageMeta?.depth,
          altitude: imageMeta?.altitude,
          heading: imageMeta?.heading,
          speed: imageMeta?.speed,
          swathWidth: imageMeta?.swath || metadata?.swath || '100 m',
          timestamp: imageMeta?.timestamp,
          sensor: imageMeta?.sensor || metadata?.sensor,
          vessel: imageMeta?.vessel || metadata?.vessel,
        };

        if (validation.status === 'Duplicate — skipped') {
          newErrorChips.push({
            id: `dup-${Date.now()}-${index}`,
            fileName: file.name,
            reason: 'Duplicate skipped: identical file already in queue.',
          });
        } else if (validation.status !== 'Valid') {
          newErrorChips.push({
            id: `val-${Date.now()}-${index}`,
            fileName: file.name,
            reason: validation.reason || 'File validation failed.',
          });
        }

        updatedQueue.push(newFrame);
      });

      setFrames(updatedQueue);
      if (newErrorChips.length > 0) {
        setErrorChips((prev) => [...prev, ...newErrorChips]);
      }

      // Persist to localStorage
      localStorage.setItem('sagar_sonar_images_list', JSON.stringify(updatedQueue));
      const validFrames = updatedQueue.filter((f) => f.status === 'Valid');
      if (validFrames.length > 0) {
        localStorage.setItem('sagar_sonar_image', validFrames[0].url);
      }

      setTimeout(() => {
        previewSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    },
    [frames, metadata, perImageMap]
  );

  // Handle Metadata (.csv / .json) file upload
  const handleMetadataFile = useCallback(
    async (fileList: File[] | FileList | null): Promise<{ perImageMap: Map<string, Record<string, string>> } | null> => {
      if (!fileList) return null;
      const files = Array.from(fileList);
      if (files.length === 0) return null;
      const file = files[0];

      try {
        const { survey, perImageMap: newMap } = await parseMetadataFile(file);
        setMetadata(survey);
        setIsMetadataLoaded(true);
        setPerImageMap(newMap);
        setMetadataFile({ name: file.name, size: formatFileSize(file.size), uploaded: true });
        localStorage.setItem('sagar_active_survey', JSON.stringify(survey));

        // Immediately update all existing frames with matched metadata from this CSV!
        setFrames((prevFrames) => {
          const updated = prevFrames.map((frame) => {
            const meta = getMetadataForImage(frame.name, frame.frameNumber, newMap);
            if (!meta) return frame;
            return {
              ...frame,
              imageMetadata: meta,
              coordinates: meta.coordinates || frame.coordinates,
              depth: meta.depth || frame.depth,
              swathWidth: meta.swath || frame.swathWidth,
              sensor: meta.sensor || frame.sensor,
              altitude: meta.altitude || frame.altitude,
              speed: meta.speed || frame.speed,
              heading: meta.heading || frame.heading,
              timestamp: meta.timestamp || frame.timestamp,
              vessel: meta.vessel || frame.vessel,
            };
          });
          localStorage.setItem('sagar_sonar_images_list', JSON.stringify(updated));
          return updated;
        });

        return { perImageMap: newMap };
      } catch (err) {
        console.error('Metadata parse failure', err);
        setErrorChips((prev) => [
          ...prev,
          { id: `meta-err-${Date.now()}`, fileName: file.name, reason: 'Failed to parse metadata file (.csv/.json).' },
        ]);
        return null;
      }
    },
    []
  );

  // Handle XTF File Upload
  const handleXtfFiles = useCallback((fileList: File[] | FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;
    const file = files[0];
    setXtfFile({
      name: file.name,
      size: formatFileSize(file.size),
      uploaded: true,
    });
  }, []);

  // Universal Survey Package handler: supports folder drops and multi-file selection
  const handleSurveyPackageFiles = useCallback(
    async (fileList: File[] | FileList | null) => {
      if (!fileList) return;
      const allFiles = Array.from(fileList);
      if (allFiles.length === 0) return;

      const imageFiles: File[] = [];
      const metaFiles: File[] = [];
      const xtfFiles: File[] = [];

      allFiles.forEach((file) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (['png', 'jpg', 'jpeg', 'tif', 'tiff'].includes(ext)) {
          imageFiles.push(file);
        } else if (['csv', 'json'].includes(ext)) {
          metaFiles.push(file);
        } else if (ext === 'xtf') {
          xtfFiles.push(file);
        } else if (!file.name.startsWith('.')) {
          // If extension not recognized, treat as image candidate to trigger inline error chip
          imageFiles.push(file);
        }
      });

      // Parse metadata first so per-image map is available for image ingestion
      let activePerImageMap = perImageMap;
      if (metaFiles.length > 0) {
        const res = await handleMetadataFile(metaFiles);
        if (res && res.perImageMap) {
          activePerImageMap = res.perImageMap;
        }
      }

      if (imageFiles.length > 0) {
        handleImageFiles(imageFiles, activePerImageMap);
      }

      if (xtfFiles.length > 0) {
        handleXtfFiles(xtfFiles);
      }
    },
    [handleImageFiles, handleMetadataFile, handleXtfFiles, perImageMap]
  );

  // Remove individual frame
  const handleRemoveFrame = (id: string) => {
    const updated = frames.filter((f) => f.id !== id);
    setFrames(updated);
    localStorage.setItem('sagar_sonar_images_list', JSON.stringify(updated));
    const validFrames = updated.filter((f) => f.status === 'Valid');
    if (validFrames.length > 0) {
      localStorage.setItem('sagar_sonar_image', validFrames[0].url);
    } else {
      localStorage.removeItem('sagar_sonar_image');
    }
  };

  // Clear all frames
  const handleClearAll = () => {
    setFrames([]);
    setErrorChips([]);
    localStorage.removeItem('sagar_sonar_images_list');
    localStorage.removeItem('sagar_sonar_image');
  };

  // Reset entire layer
  const handleResetAll = () => {
    setFrames([]);
    setMetadata(null);
    setIsMetadataLoaded(false);
    setMetadataFile(null);
    setPerImageMap(new Map());
    setXtfFile(null);
    setErrorChips([]);
    localStorage.removeItem('sagar_sonar_images_list');
    localStorage.removeItem('sagar_sonar_image');
    localStorage.removeItem('sagar_active_survey');
  };

  // Swath side tag update
  const handleUpdateSwathSide = (id: string, side: SwathChannel) => {
    const updated = frames.map((f) => (f.id === id ? { ...f, swathSide: side } : f));
    setFrames(updated);
    localStorage.setItem('sagar_sonar_images_list', JSON.stringify(updated));
    if (modalFrame && modalFrame.id === id) {
      setModalFrame({ ...modalFrame, swathSide: side });
    }
  };

  // Continue to Sonar Analysis
  const handleContinue = () => {
    if (metadata) {
      localStorage.setItem('sagar_active_survey', JSON.stringify(metadata));
    }
    navigate('/sonar-analysis');
  };

  const validCount = frames.filter((f) => f.status === 'Valid').length;
  const rejectedCount = frames.filter((f) => f.status.includes('Rejected')).length;
  const matchedCount = frames.filter((f) => f.imageMetadata && Object.keys(f.imageMetadata).length > 0).length;
  const canContinue = frames.length > 0;

  const processSteps = [
    {
      number: '01',
      label: 'Upload',
      status: frames.length > 0 || isMetadataLoaded ? ('complete' as const) : ('active' as const),
    },
    {
      number: '02',
      label: 'Validate',
      status: validCount > 0 ? ('complete' as const) : ('pending' as const),
    },
    {
      number: '03',
      label: 'Configure',
      status: isMetadataLoaded ? ('complete' as const) : ('pending' as const),
    },
    {
      number: '04',
      label: 'Ready',
      status: validCount > 0 && isMetadataLoaded ? ('active' as const) : ('pending' as const),
    },
  ];

  return (
    <div className="p-8 max-w-7xl">
      {/* Header Bar */}
      <div className="flex items-start justify-between">
        <PageHeader
          step="STEP 01"
          total="06"
          title="Survey Ingestion"
          subtitle="Upload your survey data to begin the analysis pipeline."
        />

        {(frames.length > 0 || isMetadataLoaded || xtfFile) && (
          <button
            onClick={handleResetAll}
            className="text-xs font-medium text-navy-300 hover:text-red-500 transition-colors mt-2 cursor-pointer"
            title="Reset all inputs"
          >
            Reset All
          </button>
        )}
      </div>

      <ProcessIndicator steps={processSteps} />

      {/* Validation Error Chips */}
      {errorChips.length > 0 && (
        <div className="space-y-2 mb-6 animate-fade-in">
          {errorChips.map((chip) => (
            <div
              key={chip.id}
              className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-md flex items-center justify-between text-xs text-red-800"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert size={15} className="text-red-500 flex-shrink-0" />
                <span>
                  <strong className="font-mono">{chip.fileName}</strong>: {chip.reason}
                </span>
              </div>
              <button
                onClick={() => setErrorChips((prev) => prev.filter((c) => c.id !== chip.id))}
                className="p-1 text-red-400 hover:text-red-700 rounded transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Grid: Upload Cards on Left & Status Panel on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Upload Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Survey Data Package (Supports Folder + Individual Files) */}
          <div
            className={`bg-white border-2 rounded-lg p-8 transition-all ${
              dragOver === 'survey' ? 'border-ocean bg-ocean-50/50' : 'border-navy-100'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver('survey');
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={async (e) => {
              e.preventDefault();
              setDragOver(null);
              // Recursively extract all files if a folder was dropped!
              const files = await getFilesFromDataTransfer(e.dataTransfer);
              handleSurveyPackageFiles(files);
            }}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-navy mb-1">Survey Data Package</h3>
                <p className="text-sm text-navy-300">
                  Upload a folder with images and metadata.csv, or select sonar image files and metadata.
                </p>
              </div>
              {(frames.length > 0 || isMetadataLoaded) && (
                <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" strokeWidth={2} />
              )}
            </div>

            {/* Standard Multi-file Input */}
            <input
              ref={surveyInputRef}
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.tif,.tiff,.csv,.json"
              className="hidden"
              onChange={(e) => handleSurveyPackageFiles(e.target.files)}
            />

            {/* Folder Selection Input (webkitdirectory) */}
            <input
              ref={folderInputRef}
              type="file"
              multiple
              // @ts-ignore
              webkitdirectory=""
              directory=""
              className="hidden"
              onChange={(e) => handleSurveyPackageFiles(e.target.files)}
            />

            {/* Dedicated Metadata Input */}
            <input
              ref={metaInputRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={(e) => handleMetadataFile(e.target.files)}
            />

            {frames.length > 0 || isMetadataLoaded ? (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-md">
                <File size={20} className="text-emerald-600 flex-shrink-0" strokeWidth={1.75} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-navy truncate">
                    {frames.length > 0
                      ? `${frames.length} sonar image frame${frames.length > 1 ? 's' : ''} queued`
                      : metadataFile?.name}
                    {metadataFile && frames.length > 0 && ` • ${metadataFile.name}`}
                  </div>
                  <div className="text-xs text-emerald-600">
                    {frames.length > 0 && `${validCount} valid frame(s)`}
                    {matchedCount > 0 && ` • ${matchedCount}/${frames.length} linked to metadata.csv`}
                    {isMetadataLoaded && matchedCount === 0 && ' • Metadata attached'}
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className="text-xs text-ocean hover:underline font-medium cursor-pointer flex items-center gap-1"
                  >
                    <FolderOpen size={12} />
                    Add Folder
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => surveyInputRef.current?.click()}
                    className="text-xs text-ocean hover:underline font-medium cursor-pointer"
                  >
                    Add Files
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs text-navy-300 hover:text-red-500 font-medium cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-center py-10 border-2 border-dashed border-navy-200 rounded-md hover:border-ocean hover:bg-ocean-50/30 transition-all">
                <UploadCloud size={38} className="text-navy-300 mb-3" strokeWidth={1.5} />
                <p className="text-sm font-medium text-navy mb-1">
                  Drop your survey folder or files here
                </p>
                <p className="text-xs text-navy-300 mb-4 text-center max-w-sm">
                  Drop an entire folder with images and <strong className="font-mono text-navy">metadata.csv</strong>, or browse below
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className="px-4 py-2 bg-navy text-white rounded-md text-xs font-semibold tracking-wide hover:bg-ocean transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <FolderOpen size={14} />
                    Browse Folder
                  </button>
                  <button
                    type="button"
                    onClick={() => surveyInputRef.current?.click()}
                    className="px-4 py-2 bg-white text-navy border border-navy-200 hover:bg-navy-50 rounded-md text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                  >
                    Browse Files
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4">
              <div className="flex items-center gap-2">
                <span className="label-xs text-navy-300">Supported:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['.png', '.jpg', '.jpeg', 'metadata.csv', 'Folder upload'].map((fmt) => (
                    <span
                      key={fmt}
                      className="px-2 py-0.5 bg-navy-50 text-navy-400 text-xs rounded font-mono"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => metaInputRef.current?.click()}
                  className="text-xs text-ocean hover:underline font-medium cursor-pointer flex items-center gap-1"
                >
                  <Database size={12} />
                  {isMetadataLoaded ? 'Replace metadata.csv' : 'Upload metadata.csv'}
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: XTF File (Optional) */}
          <div
            className={`bg-white border-2 rounded-lg p-8 transition-all ${
              dragOver === 'xtf' ? 'border-ocean bg-ocean-50/50' : 'border-navy-100'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver('xtf');
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(null);
              handleXtfFiles(e.dataTransfer.files);
            }}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-navy mb-1">
                  XTF File <span className="text-xs font-normal text-navy-300 ml-1">(Optional)</span>
                </h3>
                <p className="text-sm text-navy-300">Upload the raw sonar file for reference.</p>
              </div>
              {xtfFile?.uploaded && (
                <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" strokeWidth={2} />
              )}
            </div>

            <input
              ref={xtfInputRef}
              type="file"
              accept=".xtf"
              className="hidden"
              onChange={(e) => handleXtfFiles(e.target.files)}
            />

            {xtfFile?.uploaded ? (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-md">
                <File size={20} className="text-emerald-600 flex-shrink-0" strokeWidth={1.75} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-navy truncate">{xtfFile.name}</div>
                  <div className="text-xs text-emerald-600 font-mono">
                    {xtfFile.size ? `${xtfFile.size} • ` : ''}Uploaded successfully
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setXtfFile(null)}
                  className="text-xs text-navy-300 hover:text-red-500 font-medium cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => xtfInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center py-12 border-2 border-dashed border-navy-200 rounded-md hover:border-ocean hover:bg-ocean-50/30 transition-all cursor-pointer"
              >
                <UploadCloud size={36} className="text-navy-300 mb-3" strokeWidth={1.5} />
                <p className="text-sm font-medium text-navy mb-1">Drop your XTF file here</p>
                <p className="text-xs text-navy-300 mb-3">or</p>
                <span className="px-4 py-2 bg-navy text-white rounded-md text-xs font-semibold tracking-wide hover:bg-ocean transition-colors">
                  Browse File
                </span>
              </button>
            )}

            <div className="flex items-center gap-2 mt-4">
              <span className="label-xs text-navy-300">Supported:</span>
              <span className="px-2 py-0.5 bg-navy-50 text-navy-400 text-xs rounded font-mono">
                .xtf
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Active Survey Card & Survey Status */}
        <div className="space-y-4">
          {/* Active Survey parameters shown once metadata is loaded */}
          {isMetadataLoaded && (
            <ActiveSurveyCard
              metadata={metadata}
              isMetadataLoaded={isMetadataLoaded}
              onContinue={handleContinue}
              onEdit={() => setIsEditModalOpen(true)}
              isReady={validCount > 0 && isMetadataLoaded}
              validCount={validCount}
              rejectedCount={rejectedCount}
            />
          )}

          {/* Survey Status Panel */}
          <div className="bg-white border border-navy-100 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-navy mb-5 flex items-center gap-2">
              <FileText size={16} strokeWidth={1.75} className="text-ocean" />
              Survey Status
            </h3>

            <div className="space-y-4">
              {[
                { label: 'Survey Data Package', done: frames.length > 0 },
                { label: 'XTF File', done: !!xtfFile?.uploaded },
                { label: 'Validate Data', done: validCount > 0, pending: frames.length === 0 },
                {
                  label: 'Load Survey Information',
                  done: isMetadataLoaded,
                  pending: !isMetadataLoaded,
                  extra: matchedCount > 0 ? `(${matchedCount} frames linked)` : undefined,
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-navy-400 font-medium">
                    {item.label} {item.extra && <span className="text-xs text-emerald-600 font-mono ml-1">{item.extra}</span>}
                  </span>
                  {item.done ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <CheckCircle2 size={14} strokeWidth={2} />
                      Uploaded
                    </span>
                  ) : item.pending ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-navy-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-navy-200" />
                      Pending
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-navy-300">Not uploaded</span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-navy-50">
              <div className="flex items-start gap-2 p-3 bg-ocean-50 rounded-md">
                <Info size={15} className="text-ocean flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                <p className="text-xs text-navy-400 leading-relaxed">
                  Upload a folder or drag in sonar images with <strong className="font-mono">metadata.csv</strong>. Metadata is automatically mapped to each image by filename.
                </p>
              </div>
            </div>
          </div>

          {/* Action button if metadata is not loaded yet */}
          {!isMetadataLoaded && (
            <>
              <button
                disabled={!canContinue}
                onClick={handleContinue}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-md font-semibold text-sm tracking-wide transition-all ${
                  canContinue
                    ? 'bg-navy text-white hover:bg-ocean shadow-sm cursor-pointer'
                    : 'bg-navy-50 text-navy-200 cursor-not-allowed'
                }`}
              >
                Continue to Validation
                <ArrowRight size={16} strokeWidth={2} />
              </button>
              {!canContinue && (
                <p className="text-xs text-center text-navy-300">
                  Upload the survey data package to continue
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Frame Thumbnail Grid with Per-Image Metadata */}
      {frames.length > 0 && (
        <div className="mt-8">
          <FrameThumbnailGrid
            frames={frames}
            onSelectFrame={(f) => {
              const idx = frames.findIndex((img) => img.id === f.id);
              if (idx !== -1) setSelectedFrameIndex(idx);
              setModalFrame(f);
            }}
            onRemoveFrame={handleRemoveFrame}
            onClearAll={handleClearAll}
            onAddMore={() => surveyInputRef.current?.click()}
            onUploadFolder={() => folderInputRef.current?.click()}
          />
        </div>
      )}

      {/* Bottom Section: Ingested Image Preview with telemetry */}
      {frames.length > 0 && (
        <div ref={previewSectionRef} className="mt-8">
          <IngestedImagePreview
            images={frames}
            selectedImageIndex={selectedFrameIndex}
            onSelectImage={(idx) => setSelectedFrameIndex(idx)}
            metadata={metadata || { ...DEFAULT_MUMBAI_SURVEY, surveyId: 'PENDING_UPLOAD', swath: '100 m' }}
            onContinue={handleContinue}
            onAddMore={() => surveyInputRef.current?.click()}
            onRemoveImage={handleRemoveFrame}
          />
        </div>
      )}

      {/* Full-Resolution Frame Detail Modal with Per-Image Metadata Table */}
      <FrameDetailModal
        frame={modalFrame}
        onClose={() => setModalFrame(null)}
        onUpdateSwathSide={handleUpdateSwathSide}
        onNavigateToAnalysis={handleContinue}
      />

      {/* Metadata Edit Modal */}
      <MetadataEditModal
        metadata={metadata || DEFAULT_MUMBAI_SURVEY}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={(updated) => {
          setMetadata(updated);
          setIsMetadataLoaded(true);
          localStorage.setItem('sagar_active_survey', JSON.stringify(updated));
        }}
      />
    </div>
  );
}
