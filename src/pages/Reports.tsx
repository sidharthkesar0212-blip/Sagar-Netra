import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Target,
  MapPin,
  Shield,
  BarChart3,
  PieChart as PieChartIcon,
  ListFilter,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  ArrowLeft,
  Download,
  ExternalLink,
  CheckCircle2,
  Filter,
  ShieldCheck,
  ChevronRight,
  Printer,
  X,
  Activity,
} from 'lucide-react';
import {
  REVIEWED_DETECTIONS_TABLE,
  SURVEY_HOTSPOTS,
  ReviewedDetectionRow,
} from '@/data/surveyWorkflowData';
import { OBSERVABILITY_METRICS_MAP, ObservabilityMetrics } from '@/data/sonarAnalysisData';
import { usePipeline } from '@/context/PipelineContext';
import LayerEmptyState from '@/components/LayerEmptyState';

export default function Reports() {
  const navigate = useNavigate();
  const { pipelineState } = usePipeline();
  const isProcessed = pipelineState !== 'idle';

  const [detections] = useState<ReviewedDetectionRow[]>(REVIEWED_DETECTIONS_TABLE);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [showObservabilityAudit, setShowObservabilityAudit] = useState<boolean>(false);

  // Compute aggregate observability across all 15 authentic survey images
  const obsList = useMemo(() => {
    return Object.entries(OBSERVABILITY_METRICS_MAP).map(([filename, metric]) => ({
      filename,
      ...metric,
    }));
  }, []);

  const totalObsSwaths = obsList.length;
  const avgReliabilityScore = useMemo(() => {
    return Math.round(obsList.reduce((acc, m) => acc + m.surveyReliabilityScore, 0) / totalObsSwaths);
  }, [obsList, totalObsSwaths]);

  const avgUsableArea = useMemo(() => {
    return (obsList.reduce((acc, m) => acc + m.usableAreaPercent, 0) / totalObsSwaths).toFixed(1);
  }, [obsList, totalObsSwaths]);

  const avgSnr = useMemo(() => {
    return (obsList.reduce((acc, m) => acc + m.snrDb, 0) / totalObsSwaths).toFixed(1);
  }, [obsList, totalObsSwaths]);

  const avgNadirGap = useMemo(() => {
    return (obsList.reduce((acc, m) => acc + m.nadirGapPercent, 0) / totalObsSwaths).toFixed(1);
  }, [obsList, totalObsSwaths]);

  const avgShadow = useMemo(() => {
    return (obsList.reduce((acc, m) => acc + m.acousticShadowPercent, 0) / totalObsSwaths).toFixed(1);
  }, [obsList, totalObsSwaths]);

  // Filtered detections based on tab
  const filteredDetections = useMemo(() => {
    if (filterClass === 'high') {
      return detections.filter((d) => d.priority === 'High');
    }
    if (filterClass === 'pipe') {
      return detections.filter((d) => d.classType.toLowerCase().includes('pipe'));
    }
    if (filterClass === 'net') {
      return detections.filter(
        (d) =>
          d.classType.toLowerCase().includes('net') ||
          d.classType.toLowerCase().includes('crab')
      );
    }
    if (filterClass === 'anomaly') {
      return detections.filter(
        (d) =>
          d.classType.toLowerCase().includes('anomaly') ||
          d.classType.toLowerCase().includes('plane') ||
          d.classType.toLowerCase().includes('shipwreck')
      );
    }
    return detections;
  }, [detections, filterClass]);

  // Trigger real CSV download
  const handleExportCSV = () => {
    const headers = [
      'Index,Target_ID,Class_Type,AI_Confidence,Reliability_Score,Review_Status,Latitude_Longitude,Hotspot_Cluster,Intervention_Priority',
    ];
    const rows = detections.map(
      (d) =>
        `${d.index},${d.imageId},"${d.classType}",${(d.confidence * 100).toFixed(0)}%,${
          d.reliability || 90
        }%,${d.status},"${d.location}",${d.hotspot},${d.priority}`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sagar_netra_survey_detections_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showSuccess('CSV survey records downloaded successfully');
  };

  // Trigger real GeoJSON export
  const handleExportGeoJSON = () => {
    const hotspotFeatures = SURVEY_HOTSPOTS.map((spot) => {
      const [lat, lon] = spot.location.split(',').map((v) => parseFloat(v.trim()));
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lon, lat],
        },
        properties: {
          clusterId: spot.id,
          code: spot.code,
          priority: spot.priority,
          detectionsCount: spot.detectionsCount,
          dominantTypes: spot.dominantTypes,
          featureCategory: 'Hotspot_Density_Cluster',
        },
      };
    });

    const detectionFeatures = detections.map((d) => {
      const [lat, lon] = d.location.split(',').map((v) => parseFloat(v.trim()));
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lon, lat],
        },
        properties: {
          targetId: d.imageId,
          class: d.classType,
          confidence: d.confidence,
          reliability: d.reliability || 90,
          status: d.status,
          cluster: d.hotspot,
          priority: d.priority,
          featureCategory: 'Acoustic_Debris_Detection',
        },
      };
    });

    const geojson = {
      type: 'FeatureCollection',
      name: 'Sagar_Netra_Marine_Survey_Export',
      crs: {
        type: 'name',
        properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
      },
      features: [...hotspotFeatures, ...detectionFeatures],
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: 'application/geo+json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sagar_netra_hotspots_gis_${new Date().toISOString().slice(0, 10)}.geojson`;
    link.click();
    URL.revokeObjectURL(url);
    showSuccess('GeoJSON GIS package exported successfully');
  };

  // Trigger PDF print in dedicated new tab
  const handleExportPDF = () => {
    window.open('/print-report', '_blank');
    showSuccess('Opening printable survey dossier in new tab');
  };

  // Trigger detection manifest JSON export
  const handleExportJSON = () => {
    const manifest = {
      surveyCampaign: 'SAGAR-NETRA-SN2026-09',
      surveyArea: 'Western Arabian Sea, Sector 4B',
      coordinatesExtent: '12.330° N - 12.359° N, 72.971° E - 72.996° E',
      sensor: 'EdgeTech 4200 Dual-Frequency Side-Scan Sonar (455/900 kHz)',
      totalSwathsIngested: 12,
      totalHotspots: SURVEY_HOTSPOTS.length,
      detectionsCount: detections.length,
      detections,
      hotspots: SURVEY_HOTSPOTS,
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sagar_netra_mission_manifest_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showSuccess('Complete survey mission JSON manifest exported');
  };

  const handleDownloadAll = () => {
    handleExportCSV();
    handleExportGeoJSON();
    handleExportJSON();
    showSuccess('Complete survey bundle exported (CSV + GeoJSON + JSON)');
  };

  const showSuccess = (msg: string) => {
    setDownloadSuccess(msg);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  return (
    <div className="p-6 md:p-8 max-w-[1520px] mx-auto space-y-6 select-none">
      {/* Download Alert Toast */}
      {downloadSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy-900 text-white px-4 py-3 rounded-lg shadow-xl border border-navy-700 flex items-center gap-3 animate-fade-in font-mono text-xs">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span className="font-semibold">{downloadSuccess}</span>
        </div>
      )}

      {/* Top Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-navy-100/60 relative">
        <div>
          <div className="text-[11px] font-bold tracking-widest text-ocean font-mono mb-0.5">
            STEP 06 / 06
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-navy tracking-tight">
            Reports & Export
          </h1>
          <p className="text-sm text-navy-400 max-w-3xl mt-1">
            Synthesized marine mission intelligence, multi-modal evidence reliability matrices, and standards-compliant GIS export bundles.
          </p>
        </div>

        {/* Survey Operational Identifier Badge */}
        <div className="bg-white border border-navy-100/80 rounded-lg px-4 py-2 text-right shadow-xs">
          <div className="text-[10px] font-mono tracking-wider font-semibold text-navy-400 uppercase">
            Survey Operation
          </div>
          <div className="text-xs font-mono font-bold text-ocean mt-0.5">
            SAGAR-NETRA-SN2026-09
          </div>
          <div className="text-[9px] font-mono text-navy-400">
            Sector 4B • Dual 455/900 kHz
          </div>
        </div>
      </div>

      {!isProcessed ? (
        <LayerEmptyState
          layerNumber="06"
          layerName="Mission Reports & GIS Export"
          title="Mission Intelligence Dossier Not Generated"
          description="Survey Reliability Index (SRI), GIS shapefile packages, and executive print dossiers are synthesized after running the ingestion pipeline in Layer 01. Please upload your survey dataset in Layer 01 and click Ingest to run the processing pipeline."
          Icon={FileText}
          hint="IHO S-44 standards compliance, SRI 89/100, and GeoJSON bundles will be compiled upon pipeline execution."
        />
      ) : (
        <>
          {/* Top 4 Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Images Processed */}
        <div className="bg-white border border-navy-100/80 rounded-xl p-4.5 flex items-center gap-4 shadow-xs">
          <div className="w-11 h-11 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
            <FileText size={22} strokeWidth={1.8} />
          </div>
          <div>
            <div className="text-xs font-medium text-navy-400">
              Acoustic Swaths Processed
            </div>
            <div className="text-2xl font-bold text-navy mt-0.5 font-mono">12</div>
            <div className="text-[11px] text-navy-300">Sidescan sonar frames (Step 01)</div>
          </div>
        </div>

        {/* Verified Detections */}
        <div className="bg-white border border-navy-100/80 rounded-xl p-4.5 flex items-center gap-4 shadow-xs">
          <div className="w-11 h-11 rounded-lg bg-ocean-50 flex items-center justify-center text-ocean">
            <Target size={22} strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <div className="text-xs font-medium text-navy-400">Verified Detections</div>
            <div className="text-2xl font-bold text-navy mt-0.5 font-mono">12</div>
            <div className="text-[11px] text-navy-300">Classified across Layers 02–04</div>
          </div>
        </div>

        {/* Debris Hotspots */}
        <div className="bg-white border border-navy-100/80 rounded-xl p-4.5 flex items-center gap-4 shadow-xs">
          <div className="w-11 h-11 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <MapPin size={22} strokeWidth={1.8} />
          </div>
          <div>
            <div className="text-xs font-medium text-navy-400">Hotspot Clusters</div>
            <div className="text-2xl font-bold text-navy mt-0.5 font-mono">4</div>
            <div className="text-[11px] text-navy-300">DBSCAN density zones (Step 05)</div>
          </div>
        </div>

        {/* High Priority Zones */}
        <div className="bg-white border border-navy-100/80 rounded-xl p-4.5 flex items-center gap-4 shadow-xs">
          <div className="w-11 h-11 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <Shield size={22} strokeWidth={1.8} />
          </div>
          <div>
            <div className="text-xs font-medium text-navy-400">High Priority Targets</div>
            <div className="text-2xl font-bold text-rose-600 mt-0.5 font-mono">6</div>
            <div className="text-[11px] text-navy-300">Requiring ROV intervention</div>
          </div>
        </div>
      </div>

      {/* Middle Section: 3 Visual Analysis Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Detection Summary Bar Chart */}
        <div className="lg:col-span-4 bg-white border border-navy-100/80 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center gap-2 text-navy font-semibold text-sm mb-4">
            <BarChart3 size={16} className="text-ocean" />
            <span>Detections by Classification</span>
          </div>

          <div className="flex-1 flex flex-col justify-end pt-4 pb-2">
            {/* SVG Bar Chart */}
            <div className="relative h-44 flex items-end justify-between px-3 border-b border-navy-100 pb-2">
              <div className="absolute inset-x-0 top-0 border-b border-dashed border-navy-100/70" />
              <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-navy-100/70" />

              {/* Subsea Pipe: 4 */}
              <div className="flex flex-col items-center gap-1.5 z-10 w-11">
                <span className="text-[11px] font-bold text-navy font-mono">4</span>
                <div className="w-8 bg-sky-500 rounded-t-sm h-32 transition-all hover:brightness-110" />
                <span className="text-[10px] font-semibold text-navy-400 mt-1">Pipe</span>
              </div>

              {/* Aircraft: 2 */}
              <div className="flex flex-col items-center gap-1.5 z-10 w-11">
                <span className="text-[11px] font-bold text-navy font-mono">2</span>
                <div className="w-8 bg-indigo-500 rounded-t-sm h-16 transition-all hover:brightness-110" />
                <span className="text-[10px] font-semibold text-navy-400 mt-1">Plane</span>
              </div>

              {/* Shipwreck: 2 */}
              <div className="flex flex-col items-center gap-1.5 z-10 w-11">
                <span className="text-[11px] font-bold text-navy font-mono">2</span>
                <div className="w-8 bg-rose-500 rounded-t-sm h-16 transition-all hover:brightness-110" />
                <span className="text-[10px] font-semibold text-navy-400 mt-1">Wreck</span>
              </div>

              {/* Crab Pot / Tyre: 2 */}
              <div className="flex flex-col items-center gap-1.5 z-10 w-11">
                <span className="text-[11px] font-bold text-navy font-mono">2</span>
                <div className="w-8 bg-emerald-500 rounded-t-sm h-16 transition-all hover:brightness-110" />
                <span className="text-[10px] font-semibold text-navy-400 mt-1">Pot</span>
              </div>

              {/* Ghost Net: 2 */}
              <div className="flex flex-col items-center gap-1.5 z-10 w-11">
                <span className="text-[11px] font-bold text-navy font-mono">2</span>
                <div className="w-8 bg-purple-500 rounded-t-sm h-16 transition-all hover:brightness-110" />
                <span className="text-[10px] font-semibold text-navy-400 mt-1">Net</span>
              </div>

              {/* Anthropogenic Anomaly: 1 */}
              <div className="flex flex-col items-center gap-1.5 z-10 w-11">
                <span className="text-[11px] font-bold text-navy font-mono">1</span>
                <div className="w-8 bg-amber-500 rounded-t-sm h-8 transition-all hover:brightness-110" />
                <span className="text-[10px] font-semibold text-navy-400 mt-1">Anomaly</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Hotspot Priority Donut Chart */}
        <div className="lg:col-span-4 bg-white border border-navy-100/80 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center gap-2 text-navy font-semibold text-sm mb-4">
            <PieChartIcon size={16} className="text-ocean" />
            <span>Hotspot Intervention Priority</span>
          </div>

          <div className="flex-1 flex items-center justify-center gap-6 py-3">
            {/* SVG Donut Chart: 2 High (50%), 1 Med (25%), 1 Low (25%) */}
            <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                {/* High Priority (Red) 50% -> dash 44 44 */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="4.5"
                  strokeDasharray="44 44"
                  strokeDashoffset="0"
                />
                {/* Medium Priority (Orange) 25% -> dash 22 66 offset -44 */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="4.5"
                  strokeDasharray="22 66"
                  strokeDashoffset="-44"
                />
                {/* Low Priority (Green) 25% -> dash 22 66 offset -66 */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="4.5"
                  strokeDasharray="22 66"
                  strokeDashoffset="-66"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold text-navy leading-none font-mono">4</span>
                <span className="text-[10px] text-navy-400 font-medium mt-0.5">Hotspots</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-2.5 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-navy-600">High Priority</span>
                <span className="font-bold text-navy font-mono ml-auto">2 (50%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-navy-600">Medium Priority</span>
                <span className="font-bold text-navy font-mono ml-auto">1 (25%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-navy-600">Low Priority</span>
                <span className="font-bold text-navy font-mono ml-auto">1 (25%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Survey Reliability & Acoustic Coverage */}
        <div className="lg:col-span-4 bg-white border border-navy-100/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-navy font-semibold text-sm mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-teal-600" />
              <span>Survey Reliability Index</span>
            </div>
            <button
              onClick={() => setShowObservabilityAudit(true)}
              className="text-[11px] font-mono text-ocean hover:underline flex items-center gap-1 cursor-pointer font-bold"
              title="Click to view all survey frame observability metrics"
            >
              <span>Survey Audit</span>
              <ChevronRight size={12} />
            </button>
          </div>

          {/* Circular Progress Gauge & Score */}
          <div className="flex items-center justify-center gap-5 py-2">
            <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="stroke-slate-100"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="currentColor"
                  className="text-teal-500 transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray={238.76}
                  strokeDashoffset={238.76 - (238.76 * avgReliabilityScore) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black font-mono text-navy leading-none">
                  {avgReliabilityScore}
                </span>
                <span className="text-[10px] font-mono font-bold text-navy-400 mt-0.5">
                  / 100
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                HIGH RELIABILITY
              </span>
              <div className="text-xs font-bold text-navy font-mono">
                Acoustic Observability
              </div>
              <p className="text-[11px] text-navy-400 leading-tight">
                Synthesized across all 15 authentic survey images in Sector 4B.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                <span>Hotspots: 4 Clusters (P1 - High)</span>
              </div>
            </div>
          </div>

          {/* 4 Telemetry Mini-Badges */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-navy-50 text-[11px] font-mono">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex flex-col">
              <span className="text-[9px] text-navy-400 uppercase">Acoustic Clarity</span>
              <span className="font-bold text-emerald-700">{avgUsableArea}%</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex flex-col">
              <span className="text-[9px] text-navy-400 uppercase">Mean SNR</span>
              <span className="font-bold text-navy">{avgSnr} dB</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex flex-col">
              <span className="text-[9px] text-navy-400 uppercase">Nadir Gap</span>
              <span className="font-bold text-slate-700">{avgNadirGap}%</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex flex-col">
              <span className="text-[9px] text-navy-400 uppercase">Shadow Loss</span>
              <span className="font-bold text-indigo-900">{avgShadow}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Detections Table (7 cols) + Export Packages (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Detections List */}
        <div className="lg:col-span-7 bg-white border border-navy-100/80 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 text-navy font-semibold text-sm">
              <ListFilter size={16} className="text-ocean" />
              <span>Multi-Modal Survey Detections</span>
            </div>

            {/* Classification Category Filters */}
            <div className="flex items-center gap-1 bg-mist-100 p-0.5 rounded-lg border border-navy-100 text-xs">
              <button
                onClick={() => setFilterClass('all')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  filterClass === 'all'
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'text-navy-400 hover:text-navy'
                }`}
              >
                All ({detections.length})
              </button>
              <button
                onClick={() => setFilterClass('high')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  filterClass === 'high'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-navy-400 hover:text-navy'
                }`}
              >
                High Priority
              </button>
              <button
                onClick={() => setFilterClass('pipe')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  filterClass === 'pipe'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-navy-400 hover:text-navy'
                }`}
              >
                Pipes
              </button>
              <button
                onClick={() => setFilterClass('net')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  filterClass === 'net'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-navy-400 hover:text-navy'
                }`}
              >
                Nets & Pots
              </button>
              <button
                onClick={() => setFilterClass('anomaly')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  filterClass === 'anomaly'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-navy-400 hover:text-navy'
                }`}
              >
                Anomalies
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-navy-100 text-navy-400 font-semibold uppercase tracking-wider">
                  <th className="pb-2.5 pl-1 font-mono">ID</th>
                  <th className="pb-2.5">Class / Feature</th>
                  <th className="pb-2.5 text-center">Confidence</th>
                  <th className="pb-2.5 text-center">Reliability (R)</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5">Coordinates</th>
                  <th className="pb-2.5 text-center">Cluster</th>
                  <th className="pb-2.5 text-right pr-1">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50 font-medium">
                {filteredDetections.map((row) => (
                  <tr key={row.index} className="hover:bg-mist-100/70 transition-colors">
                    <td className="py-2.5 pl-1 font-mono font-bold text-navy">{row.imageId}</td>
                    <td className="py-2.5 text-navy">{row.classType}</td>
                    <td className="py-2.5 text-center font-mono font-bold text-navy">
                      {(row.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="py-2.5 text-center font-mono font-bold text-ocean">
                      {row.reliability || 90}%
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-navy-500 text-[11px]">{row.location}</td>
                    <td className="py-2.5 text-center font-mono font-bold text-navy">
                      {row.hotspot}
                    </td>
                    <td className="py-2.5 text-right pr-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.priority === 'High'
                            ? 'bg-rose-100 text-rose-700'
                            : row.priority === 'Medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {row.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Card: Export Packages */}
        <div className="lg:col-span-5 bg-white border border-navy-100/80 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="mb-4">
            <div className="flex items-center gap-2 text-navy font-semibold text-sm">
              <Download size={16} className="text-ocean" />
              <span>Export Packages & Formats</span>
            </div>
            <p className="text-xs text-navy-400 mt-1">
              Download certified sonar survey data for GIS systems, maritime operations, and archival records.
            </p>
          </div>

          {/* 4 Action Cards in 2x2 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            {/* Download PDF Dossier */}
            <div className="border border-navy-100 rounded-lg p-3 flex flex-col justify-between hover:border-rose-300 transition-colors bg-mist-50">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-navy">Printable PDF Dossier</div>
                  <div className="text-[10px] text-navy-400 mt-0.5 leading-tight">
                    Formal survey report with maps, metrics, and fusion formulas
                  </div>
                </div>
              </div>
              <button
                onClick={handleExportPDF}
                className="mt-3 w-full py-1.5 px-2.5 rounded text-xs font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5 font-mono cursor-pointer"
                title="Opens high-resolution printable survey report in a new browser tab"
              >
                <Printer size={13} />
                <span>Open Printable Dossier (New Tab)</span>
              </button>
            </div>

            {/* Export CSV Data */}
            <div className="border border-navy-100 rounded-lg p-3 flex flex-col justify-between hover:border-emerald-300 transition-colors bg-mist-50">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-navy">CSV Analysis Table</div>
                  <div className="text-[10px] text-navy-400 mt-0.5 leading-tight">
                    Detections, coordinates, and reliability scores
                  </div>
                </div>
              </div>
              <button
                onClick={handleExportCSV}
                className="mt-3 w-full py-1.5 px-2.5 rounded text-xs font-semibold text-emerald-600 border border-emerald-200 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5 font-mono"
              >
                <Download size={12} />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Export GeoJSON */}
            <div className="border border-navy-100 rounded-lg p-3 flex flex-col justify-between hover:border-sky-300 transition-colors bg-mist-50">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0">
                  <FileCode size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-navy">GeoJSON GIS Layer</div>
                  <div className="text-[10px] text-navy-400 mt-0.5 leading-tight">
                    Standard GIS points and hotspot clusters for QGIS/ArcGIS
                  </div>
                </div>
              </div>
              <button
                onClick={handleExportGeoJSON}
                className="mt-3 w-full py-1.5 px-2.5 rounded text-xs font-semibold text-sky-600 border border-sky-200 hover:bg-sky-50 transition-colors flex items-center justify-center gap-1.5 font-mono"
              >
                <Download size={12} />
                <span>Export GeoJSON</span>
              </button>
            </div>

            {/* Export JSON Manifest */}
            <div className="border border-navy-100 rounded-lg p-3 flex flex-col justify-between hover:border-purple-300 transition-colors bg-mist-50">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <ImageIcon size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-navy">Mission JSON Manifest</div>
                  <div className="text-[10px] text-navy-400 mt-0.5 leading-tight">
                    Structured telemetry, detection bounds, and parameters
                  </div>
                </div>
              </div>
              <button
                onClick={handleExportJSON}
                className="mt-3 w-full py-1.5 px-2.5 rounded text-xs font-semibold text-purple-600 border border-purple-200 hover:bg-purple-50 transition-colors flex items-center justify-center gap-1.5 font-mono"
              >
                <Download size={12} />
                <span>Export JSON</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-navy-100/60">
        <button
          onClick={() => navigate('/debris-hotspots')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-navy-200 text-sm font-semibold text-navy hover:bg-mist-200 hover:border-navy-300 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Debris Hotspots
        </button>

        <button
          onClick={handleDownloadAll}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0a58ca] hover:bg-[#084298] text-white text-sm font-semibold transition-all shadow-sm"
        >
          <Download size={16} />
          <span>Export All Survey Assets (Zip / Bundle)</span>
        </button>
      </div>
      </>
      )}

      {/* 15-Swath Acoustic Observability Audit Modal */}
      {showObservabilityAudit && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowObservabilityAudit(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-navy-100 flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-navy-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy font-mono">
                    15-Swath Acoustic Observability & Reliability Audit
                  </h3>
                  <p className="text-xs text-navy-400 font-mono">
                    SIH 26057 Hydrographic Specification • Sector 4B Arabian Sea Survey
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowObservabilityAudit(false)}
                className="p-1.5 rounded-lg text-navy-400 hover:text-navy hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Summary Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b border-navy-50 text-xs font-mono bg-slate-50 rounded-xl px-4 my-3">
              <div>
                <span className="text-[10px] text-navy-400 block">MEAN RELIABILITY</span>
                <span className="font-bold text-teal-700 text-sm">{avgReliabilityScore}/100</span>
              </div>
              <div>
                <span className="text-[10px] text-navy-400 block">USABLE SWATH AVG</span>
                <span className="font-bold text-emerald-700 text-sm">{avgUsableArea}%</span>
              </div>
              <div>
                <span className="text-[10px] text-navy-400 block">MEAN ACOUSTIC SNR</span>
                <span className="font-bold text-navy text-sm">{avgSnr} dB</span>
              </div>
              <div>
                <span className="text-[10px] text-navy-400 block">QUALITY TIERS</span>
                <span className="font-bold text-slate-800 text-sm">12 High / 2 Med / 1 Low</span>
              </div>
            </div>

            {/* Modal Table */}
            <div className="flex-1 overflow-y-auto border border-navy-100 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 border-b border-navy-100 text-navy-500 font-mono text-[10px] uppercase sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Swath File</th>
                    <th className="py-2.5 px-2 text-center">Usable Area</th>
                    <th className="py-2.5 px-2 text-center">SNR (dB)</th>
                    <th className="py-2.5 px-2 text-center">Quality Tier</th>
                    <th className="py-2.5 px-2 text-center">Score</th>
                    <th className="py-2.5 px-3">Propagation & Seabed Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-50 font-mono text-navy-700">
                  {obsList.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 font-bold text-navy-400">{m.imageId}</td>
                      <td className="py-2 px-3 font-bold text-navy">{m.filename}</td>
                      <td className="py-2 px-2 text-center font-bold text-emerald-700">{m.usableAreaPercent}%</td>
                      <td className="py-2 px-2 text-center">{m.snrDb.toFixed(1)} dB</td>
                      <td className="py-2 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          m.qualityTier === 'HIGH'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.qualityTier === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {m.qualityTier}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-teal-800">{m.surveyReliabilityScore}</td>
                      <td className="py-2 px-3 text-[11px] font-sans text-navy-500 max-w-xs truncate" title={m.notes}>
                        {m.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 mt-3 border-t border-navy-50 flex items-center justify-between text-xs text-navy-400 font-mono">
              <span>Acoustic Observability calculated per SIH 26057 System Architecture Section 7</span>
              <button
                onClick={() => setShowObservabilityAudit(false)}
                className="px-5 py-2 bg-navy hover:bg-ocean text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
