import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Box,
  Sun,
  Mountain,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  ArrowLeft,
  ArrowRight,
  Share2,
  Sparkles,
  Check,
  ImageOff,
  ShieldCheck,
  X,
  Filter,
  Calculator,
  Info,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { usePipeline } from '@/context/PipelineContext';
import LayerEmptyState from '@/components/LayerEmptyState';

export interface ClassFormulaDefinition {
  classKey: 'plane' | 'shipwreck' | 'pipe' | 'ghostnet' | 'crabpot' | 'anomaly';
  title: string;
  equation: string;
  variableForm: string;
  weights: {
    c_ai: number;
    s_shape: number;
    s_shadow: number;
    s_context: number;
  };
  note?: string;
  shadowNote?: string;
}

export const CLASS_FORMULAS: Record<string, ClassFormulaDefinition> = {
  plane: {
    classKey: 'plane',
    title: 'Plane',
    equation: 'R_plane = 100 × (0.20 · C_AI + 0.30 · S_shape + 0.30 · S_shadow + 0.20 · S_context)',
    variableForm: 'R_plane = 100 × (0.20 C_AI + 0.30 S_shape + 0.30 S_shadow + 0.20 S_context)',
    weights: { c_ai: 0.20, s_shape: 0.30, s_shadow: 0.30, s_context: 0.20 },
  },
  shipwreck: {
    classKey: 'shipwreck',
    title: 'Shipwreck',
    equation: 'R_shipwreck = 100 × (0.20 · C_AI + 0.30 · S_shape + 0.30 · S_shadow + 0.20 · S_context)',
    variableForm: 'R_shipwreck = 100 × (0.20 C_AI + 0.30 S_shape + 0.30 S_shadow + 0.20 S_context)',
    weights: { c_ai: 0.20, s_shape: 0.30, s_shadow: 0.30, s_context: 0.20 },
  },
  pipe: {
    classKey: 'pipe',
    title: 'Pipe',
    equation: 'R_pipe = 100 × (0.15 · C_AI + 0.40 · S_shape + 0.30 · S_shadow + 0.15 · S_context)',
    variableForm: 'R_pipe = 100 × (0.15 C_AI + 0.40 S_shape + 0.30 S_shadow + 0.15 S_context)',
    weights: { c_ai: 0.15, s_shape: 0.40, s_shadow: 0.30, s_context: 0.15 },
  },
  ghostnet: {
    classKey: 'ghostnet',
    title: 'Ghostnet',
    equation: 'R_ghostnet = 100 × (0.20 · C_AI + 0.40 · S_shape + 0.40 · S_context)',
    variableForm: 'R_ghostnet = 100 × (0.20 C_AI + 0.40 S_shape + 0.40 S_context)',
    weights: { c_ai: 0.20, s_shape: 0.40, s_shadow: 0.00, s_context: 0.40 },
    note: 'Shadow weight = 0 (This property is not defined for this class)',
    shadowNote: 'This property is not defined for this class (Shadow weight = 0)',
  },
  crabpot: {
    classKey: 'crabpot',
    title: 'Crab Pot',
    equation: 'R_crabpot = 100 × (0.15 · C_AI + 0.35 · S_shape + 0.30 · S_shadow + 0.20 · S_context)',
    variableForm: 'R_crabpot = 100 × (0.15 C_AI + 0.35 S_shape + 0.30 S_shadow + 0.20 S_context)',
    weights: { c_ai: 0.15, s_shape: 0.35, s_shadow: 0.30, s_context: 0.20 },
  },
  anomaly: {
    classKey: 'anomaly',
    title: 'Anthropogenic Anomaly',
    equation: 'R_anomaly = 100 × (0.40 · C_AI + 0.60 · S_PatchCore)',
    variableForm: 'R_anomaly = 100 × (0.40 C_AI + 0.60 S_PatchCore)',
    weights: { c_ai: 0.40, s_shape: 0.00, s_shadow: 0.00, s_context: 0.60 },
    note: 'Out-of-Distribution novel acoustic signature evaluated via PatchCore density model',
    shadowNote: 'This property is not defined for this class (Novel Anomaly)',
  },
};

interface AuthenticEvidenceItem {
  id: string;
  name: string; // Base target filename
  displayName: string;
  className: string;
  classKey: 'plane' | 'shipwreck' | 'pipe' | 'ghostnet' | 'crabpot' | 'anomaly';
  category: 'pipes' | 'wrecks' | 'fishing' | 'anomaly';
  confidence: number;
  color: 'blue' | 'red' | 'yellow' | 'emerald';
  // Modality file URLs:
  bboxUrl: string | null;
  rawUrl: string;
  preprocessedUrl: string | null;
  segmentationUrl: string | null; // From bbox+mask folder
  shapeUrl: string | null;        // Binary contour from shape folder
  shadowUrl: string | null;       // From shadow folder (null for ghostnet, etc.)
  contextUrl: string | null;      // From context folder
  patchcoreUrl: string | null;    // From PatchCore folder
  // Authentic parameter scores for mathematical calculation:
  c_ai: number;                   // C_AI (AI confidence: 0.00 - 1.00)
  s_shape: number;                // S_shape (Shape delineation: 0.00 - 1.00)
  s_shadow: number | null;        // S_shadow (Acoustic shadow: 0.00 - 1.00, or null if undefined)
  s_context: number;              // S_context (Contextual seafloor evidence: 0.00 - 1.00)
  // Checklists:
  shadowChecklist: { text: string; present: boolean }[];
  contextChecklist: { text: string; present: boolean }[];
  reliability: string;
  reliabilitySub: string;
}

// Authentic debris & candidate anomaly items (Seabed baseline and Artificial Reef strictly excluded)
const AUTHENTIC_BBOX_EVIDENCE_ITEMS: AuthenticEvidenceItem[] = [
  {
    id: 'ev-pipe',
    name: 'pipe.png',
    displayName: 'pipe.png',
    className: 'Pipe (Pipeline)',
    classKey: 'pipe',
    category: 'pipes',
    confidence: 0.96,
    color: 'blue',
    bboxUrl: '/bbox/pipe.png',
    rawUrl: '/raw/pipe.jpeg',
    preprocessedUrl: '/pre-processed/pipe.png',
    segmentationUrl: '/bbox+mask/pipe.png',
    shapeUrl: '/shape/pipe.png',
    shadowUrl: '/shadow/pipe.png',
    contextUrl: '/context/pipe.png',
    patchcoreUrl: '/PatchCore/pipe.png',
    c_ai: 0.96,
    s_shape: 0.92,
    s_shadow: 0.88,
    s_context: 0.85,
    shadowChecklist: [
      { text: 'Clear acoustic shadow detected', present: true },
      { text: 'Consistent with sonar slant geometry', present: true },
      { text: 'Linear acoustic attenuation boundary', present: true },
    ],
    contextChecklist: [
      { text: 'Distinct raised feature above seabed', present: true },
      { text: 'Elevated backscatter echo response', present: true },
      { text: 'Valid local sediment contrast', present: true },
    ],
    reliability: 'HIGH RELIABILITY',
    reliabilitySub: 'Likely Man-Made Object',
  },
  {
    id: 'ev-pipe1',
    name: 'pipe1.png',
    displayName: 'pipe1.png',
    className: 'Pipe Joint / Conduit',
    classKey: 'pipe',
    category: 'pipes',
    confidence: 0.95,
    color: 'blue',
    bboxUrl: '/bbox/pipe1.png',
    rawUrl: '/raw/pipe1.jpeg',
    preprocessedUrl: '/pre-processed/pipe1.png',
    segmentationUrl: '/bbox+mask/pipe1.png',
    shapeUrl: '/shape/pipe1.png',
    shadowUrl: '/shadow/pipe1.png',
    contextUrl: '/context/pipe1.png',
    patchcoreUrl: '/PatchCore/pipe1.png',
    c_ai: 0.95,
    s_shape: 0.91,
    s_shadow: 0.86,
    s_context: 0.84,
    shadowChecklist: [
      { text: 'Elongated shadow trail verified', present: true },
      { text: 'Conduit elevation confirmed via grazing angle', present: true },
      { text: 'Sharp acoustic cutoff boundary', present: true },
    ],
    contextChecklist: [
      { text: 'Raised above sand ripple bed', present: true },
      { text: 'High metallic acoustic reflectance', present: true },
      { text: 'Continuous linear trajectory', present: true },
    ],
    reliability: 'HIGH RELIABILITY',
    reliabilitySub: 'Likely Man-Made Object',
  },
  {
    id: 'ev-plane',
    name: 'plane.png',
    displayName: 'plane.png',
    className: 'Aircraft Fuselage',
    classKey: 'plane',
    category: 'wrecks',
    confidence: 0.97,
    color: 'blue',
    bboxUrl: '/bbox/plane.png',
    rawUrl: '/raw/plane.jpg',
    preprocessedUrl: '/pre-processed/plane.png',
    segmentationUrl: '/bbox+mask/plane.png',
    shapeUrl: '/shape/plane.png',
    shadowUrl: '/shadow/plane.png',
    contextUrl: '/context/plane.png',
    patchcoreUrl: '/PatchCore/plane.png',
    c_ai: 0.97,
    s_shape: 0.92,
    s_shadow: 0.88,
    s_context: 0.85,
    shadowChecklist: [
      { text: 'Fuselage acoustic shadow zone confirmed', present: true },
      { text: 'Geometric aspect matches airframe silhouette', present: true },
      { text: 'Acoustic blockage matches sonar grazing path', present: true },
    ],
    contextChecklist: [
      { text: 'Strong metallic acoustic backscatter', present: true },
      { text: 'Seabed impact crater / scour line', present: true },
      { text: 'Contrasting roughness vs sediment', present: true },
    ],
    reliability: 'HIGH RELIABILITY',
    reliabilitySub: 'Confirmed Airframe Wreck',
  },
  {
    id: 'ev-plane1',
    name: 'plane1.png',
    displayName: 'plane1.png',
    className: 'Aircraft Wing Fragment',
    classKey: 'plane',
    category: 'wrecks',
    confidence: 0.96,
    color: 'blue',
    bboxUrl: '/bbox/plane1.png',
    rawUrl: '/raw/plane1.jpg',
    preprocessedUrl: '/pre-processed/plane1.png',
    segmentationUrl: '/bbox+mask/plane1.png',
    shapeUrl: '/shape/plane1.png',
    shadowUrl: '/shadow/plane1.png',
    contextUrl: '/context/plane1.png',
    patchcoreUrl: '/PatchCore/plane1.jpeg',
    c_ai: 0.96,
    s_shape: 0.89,
    s_shadow: 0.85,
    s_context: 0.83,
    shadowChecklist: [
      { text: 'Wing profile acoustic shadow confirmed', present: true },
      { text: 'Low vertical relief plate elevation', present: true },
      { text: 'Trailing acoustic attenuation in swath', present: true },
    ],
    contextChecklist: [
      { text: 'Distinct from planar sandy bed', present: true },
      { text: 'Specular acoustic echo return', present: true },
      { text: 'Non-geological structural angles', present: true },
    ],
    reliability: 'HIGH RELIABILITY',
    reliabilitySub: 'Confirmed Airframe Debris',
  },
  {
    id: 'ev-shipwreck',
    name: 'shipwreck.png',
    displayName: 'shipwreck.png',
    className: 'Shipwreck Keel',
    classKey: 'shipwreck',
    category: 'wrecks',
    confidence: 0.96,
    color: 'blue',
    bboxUrl: '/bbox/shipwreck.png',
    rawUrl: '/raw/shipwreck.png',
    preprocessedUrl: '/pre-processed/shipwreck.png',
    segmentationUrl: '/bbox+mask/shipwreck.png',
    shapeUrl: '/shape/shipwreck.png',
    shadowUrl: '/shadow/shipwreck.png',
    contextUrl: '/context/shipwreck.png',
    patchcoreUrl: '/PatchCore/shipwreck.png',
    c_ai: 0.96,
    s_shape: 0.93,
    s_shadow: 0.90,
    s_context: 0.87,
    shadowChecklist: [
      { text: 'Substantial keel shadow detected', present: true },
      { text: 'High hull elevation shadow in swath', present: true },
      { text: 'Significant acoustic blockage zone', present: true },
    ],
    contextChecklist: [
      { text: 'Elevated backscatter above seabed', present: true },
      { text: 'Seafloor current scour depression', present: true },
      { text: 'Surrounding maritime debris field', present: true },
    ],
    reliability: 'HIGH RELIABILITY',
    reliabilitySub: 'Confirmed Marine Wreck',
  },
  {
    id: 'ev-shipwreck2',
    name: 'shipwreck2.png',
    displayName: 'shipwreck2.png',
    className: 'Vessel Wreckage Hull',
    classKey: 'shipwreck',
    category: 'wrecks',
    confidence: 0.97,
    color: 'blue',
    bboxUrl: '/bbox/shipwreck2.png',
    rawUrl: '/raw/shipwreck2.png',
    preprocessedUrl: '/pre-processed/shipwreck2.png',
    segmentationUrl: '/bbox+mask/shipwreck2.png',
    shapeUrl: '/shape/shipwreck2.png',
    shadowUrl: '/shadow/shipwreck2.png',
    contextUrl: '/context/shipwreck2.png',
    patchcoreUrl: '/PatchCore/shipwreck2.png',
    c_ai: 0.97,
    s_shape: 0.94,
    s_shadow: 0.91,
    s_context: 0.88,
    shadowChecklist: [
      { text: 'Large hull acoustic silhouette confirmed', present: true },
      { text: 'Prominent hull shadow in swath', present: true },
      { text: 'Shadow orientation aligned to track', present: true },
    ],
    contextChecklist: [
      { text: 'Extreme acoustic contrast vs sand', present: true },
      { text: 'Massive artificial seabed anomaly', present: true },
      { text: 'Debris scattering around periphery', present: true },
    ],
    reliability: 'HIGH RELIABILITY',
    reliabilitySub: 'Confirmed Marine Wreck',
  },
  {
    id: 'ev-shipwreck3',
    name: 'shipwreck3.png',
    displayName: 'shipwreck3.png',
    className: 'Shipwreck Section',
    classKey: 'shipwreck',
    category: 'wrecks',
    confidence: 0.94,
    color: 'blue',
    bboxUrl: '/bbox/shipwreck3.png',
    rawUrl: '/raw/shipwreck3.jpeg',
    preprocessedUrl: '/pre-processed/shipwreck3.png',
    segmentationUrl: '/bbox+mask/shipwreck3.png',
    shapeUrl: '/shape/shipwreck3.png',
    shadowUrl: '/shadow/shipwreck3.png',
    contextUrl: '/context/shipwreck.png',
    patchcoreUrl: '/PatchCore/shipwreck3.png',
    c_ai: 0.94,
    s_shape: 0.90,
    s_shadow: 0.88,
    s_context: 0.85,
    shadowChecklist: [
      { text: 'Hull fragment acoustic shadow confirmed', present: true },
      { text: 'Raw acoustic penumbra visible in swath', present: true },
      { text: 'Shadow orientation aligned to track', present: true },
    ],
    contextChecklist: [
      { text: 'Clear demarcation from seabed', present: true },
      { text: 'High acoustic return energy', present: true },
      { text: 'Isolated wreckage fragment', present: true },
    ],
    reliability: 'HIGH RELIABILITY',
    reliabilitySub: 'Confirmed Marine Wreck',
  },
  {
    id: 'ev-crabpot',
    name: 'crabpot.png',
    displayName: 'crabpot.png',
    className: 'Abandoned Crab Pot Trap',
    classKey: 'crabpot',
    category: 'fishing',
    confidence: 0.96,
    color: 'blue',
    bboxUrl: '/bbox/crabpot.png',
    rawUrl: '/raw/crabpot.jpg',
    preprocessedUrl: '/pre-processed/crabpot.png',
    segmentationUrl: '/bbox+mask/crabpot.png',
    shapeUrl: '/shape/crabpot.png',
    shadowUrl: '/shadow/crabpot.png',
    contextUrl: '/context/crabpot.png',
    patchcoreUrl: '/PatchCore/crabpot.png',
    c_ai: 0.96,
    s_shape: 0.88,
    s_shadow: 0.84,
    s_context: 0.82,
    shadowChecklist: [
      { text: 'Compact discrete trap shadow verified', present: true },
      { text: 'Acoustic penumbra matches cage geometry', present: true },
      { text: 'Low-profile cage elevation', present: true },
    ],
    contextChecklist: [
      { text: 'Discrete item resting on silt bed', present: true },
      { text: 'Acoustic contrast against mud substrate', present: true },
      { text: 'Confirmed commercial gear signature', present: true },
    ],
    reliability: 'HIGH RELIABILITY',
    reliabilitySub: 'Likely Man-Made Object',
  },
  {
    id: 'ev-ghostnet',
    name: 'ghostnet.png',
    displayName: 'ghostnet.png',
    className: 'Derelict Ghost Net Entanglement',
    classKey: 'ghostnet',
    category: 'fishing',
    confidence: 0.96,
    color: 'blue',
    bboxUrl: '/bbox/ghostnet.png',
    rawUrl: '/raw/ghostnet.jpeg',
    preprocessedUrl: '/pre-processed/ghostnet.png',
    segmentationUrl: '/bbox+mask/ghostnet.png',
    shapeUrl: '/shape/ghostnet.png',
    shadowUrl: null, // Intentionally null: Shadow weight = 0 (Property not defined for this class)
    contextUrl: '/context/ghostnet.png',
    patchcoreUrl: '/PatchCore/ghostnet.png',
    c_ai: 0.96,
    s_shape: 0.88,
    s_shadow: null, // Not defined for this class
    s_context: 0.85,
    shadowChecklist: [
      { text: 'This property is not defined for this class', present: false },
      { text: 'Shadow weight = 0 in reliability formula', present: true },
      { text: 'Acoustically porous polymer mesh structure', present: true },
    ],
    contextChecklist: [
      { text: 'Traps shell fragments and sediment', present: true },
      { text: 'Distinct speckled texture pattern', present: true },
      { text: 'Elevated diffuse acoustic scatter', present: true },
    ],
    reliability: 'HIGH RELIABILITY',
    reliabilitySub: 'Entangled Marine Litter',
  },
  {
    id: 'ev-human',
    name: 'human.png',
    displayName: 'human.png',
    className: 'Anthropogenic Anomaly (Novel)',
    classKey: 'anomaly',
    category: 'anomaly',
    confidence: 0.91,
    color: 'red',
    bboxUrl: '/unknown/human.png',
    rawUrl: '/raw/human.jpeg',
    preprocessedUrl: '/pre-processed/human.png',
    segmentationUrl: null, // Absent in bbox+mask folder
    shapeUrl: null,
    shadowUrl: null,       // Absent in shadow folder
    contextUrl: null,      // Absent in context folder
    patchcoreUrl: '/PatchCore/human.png',
    c_ai: 0.91,
    s_shape: 0.00,
    s_shadow: null,
    s_context: 0.85,
    shadowChecklist: [
      { text: 'This property is not defined for this class', present: false },
      { text: 'Novel out-of-distribution acoustic anomaly', present: true },
      { text: 'Requires Human Review validation', present: true },
    ],
    contextChecklist: [
      { text: 'PatchCore visual anomaly activation', present: true },
      { text: 'Localized feature divergence vs normal seabed', present: true },
      { text: 'Flagged for expert operator review', present: true },
    ],
    reliability: 'OOD ANOMALY',
    reliabilitySub: 'Candidate for Human Review',
  },
];


export default function EvidenceIntelligence() {
  const navigate = useNavigate();
  const { pipelineState } = usePipeline();
  const isProcessed = pipelineState !== 'idle';

  // Category filter state for the top toolbar
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'pipes' | 'wrecks' | 'fishing' | 'anomaly'>('all');

  // Currently selected item from filmstrip (defaults to pipe.png)
  const [selectedId, setSelectedId] = useState<string>('ev-pipe');

  // Canvas View Mode: [ Evidence View ] is FIRST and default! [ Original ] is removed completely.
  const [viewMode, setViewMode] = useState<'evidence' | 'enhanced' | 'segmentation'>('evidence');

  // Telemetry overlay toggle
  const [showEvidenceOverlays, setShowEvidenceOverlays] = useState<boolean>(true);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);

  // Zoom controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Expanded Lightbox Modal State for clicking Shadow, Segmentation, or Context images
  const [expandedModal, setExpandedModal] = useState<{
    isOpen: boolean;
    title: string;
    imageUrl: string;
    modality: string;
    score: number;
    checklist: { text: string; present: boolean }[];
  } | null>(null);

  // All Class Formulas Reference Modal State
  const [showAllFormulasModal, setShowAllFormulasModal] = useState<boolean>(false);

  // Handle ESC key to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedModal(null);
        setShowAllFormulasModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered items based on top filter toolbar
  const filteredItems = AUTHENTIC_BBOX_EVIDENCE_ITEMS.filter((item) => {
    if (categoryFilter === 'all') return true;
    return item.category === categoryFilter;
  });

  // Current active asset item
  const activeIndex = AUTHENTIC_BBOX_EVIDENCE_ITEMS.findIndex((i) => i.id === selectedId);
  const activeItem =
    activeIndex !== -1
      ? AUTHENTIC_BBOX_EVIDENCE_ITEMS[activeIndex]
      : AUTHENTIC_BBOX_EVIDENCE_ITEMS[0];

  // Mathematical Reliability Calculation using the authentic class-specific formulas
  const calculateReliability = (item: AuthenticEvidenceItem) => {
    const formulaDef = CLASS_FORMULAS[item.classKey] || CLASS_FORMULAS.pipe;
    const { c_ai, s_shape, s_shadow, s_context } = formulaDef.weights;

    const termCAI = c_ai * item.c_ai;
    const termShape = s_shape * item.s_shape;
    const termShadow = s_shadow * (item.s_shadow ?? 0);
    const termContext = s_context * item.s_context;

    const sum = termCAI + termShape + termShadow + termContext;
    const computedPercentage = Math.round(100 * sum * 10) / 10;

    let substitutedString = '';
    if (item.classKey === 'ghostnet') {
      substitutedString = `100 × (0.20 · ${item.c_ai.toFixed(2)} + 0.40 · ${item.s_shape.toFixed(2)} + 0.40 · ${item.s_context.toFixed(2)})`;
    } else if (item.classKey === 'anomaly') {
      substitutedString = `100 × (0.40 · ${item.c_ai.toFixed(2)} + 0.60 · ${item.s_context.toFixed(2)})`;
    } else {
      substitutedString = `100 × (${c_ai.toFixed(2)} · ${item.c_ai.toFixed(2)} + ${s_shape.toFixed(2)} · ${item.s_shape.toFixed(2)} + ${s_shadow.toFixed(2)} · ${(item.s_shadow ?? 0).toFixed(2)} + ${s_context.toFixed(2)} · ${item.s_context.toFixed(2)})`;
    }

    return {
      formulaDef,
      computedPercentage,
      substitutedString,
      termCAI,
      termShape,
      termShadow,
      termContext,
    };
  };

  const reliabilityData = calculateReliability(activeItem);

  // Steppers for images
  const handlePrevItem = () => {
    const prevIdx =
      activeIndex > 0 ? activeIndex - 1 : AUTHENTIC_BBOX_EVIDENCE_ITEMS.length - 1;
    setSelectedId(AUTHENTIC_BBOX_EVIDENCE_ITEMS[prevIdx].id);
  };

  const handleNextItem = () => {
    const nextIdx =
      activeIndex < AUTHENTIC_BBOX_EVIDENCE_ITEMS.length - 1 ? activeIndex + 1 : 0;
    setSelectedId(AUTHENTIC_BBOX_EVIDENCE_ITEMS[nextIdx].id);
  };

  // Zoom helpers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.0));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  // Determine what image source to render on the main canvas (Original removed, Evidence View is first)
  const getCanvasSource = (): {
    url: string | null;
    placeholderTitle: string;
    placeholderDesc: string;
  } => {
    switch (viewMode) {
      case 'enhanced':
        return {
          url: activeItem.preprocessedUrl,
          placeholderTitle: 'This property is not defined for this class',
          placeholderDesc: `No pre-processed acoustic scan available for "${activeItem.name}".`,
        };
      case 'segmentation':
        return {
          url: activeItem.segmentationUrl,
          placeholderTitle: 'This property is not defined for this class',
          placeholderDesc: `No segmentation mask defined for "${activeItem.name}".`,
        };
      case 'evidence':
        // Evidence View directly renders authentic bbox image
        if (activeItem.bboxUrl) {
          return {
            url: activeItem.bboxUrl,
            placeholderTitle: 'This property is not defined for this class',
            placeholderDesc: `No bounding box annotation recorded for "${activeItem.name}".`,
          };
        }
        return {
          url: activeItem.preprocessedUrl || activeItem.bboxUrl,
          placeholderTitle: 'Evidence Scan',
          placeholderDesc: 'Acoustic survey candidate.',
        };
    }
  };

  const canvasDisplay = getCanvasSource();

  if (!isProcessed) {
    return (
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-5 select-none">
        {/* Top Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-navy-100/60 relative">
          <div>
            <div className="text-[11px] font-bold tracking-widest text-ocean font-mono mb-0.5">
              STEP 03 / 06
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-navy tracking-tight">
              Evidence Intelligence
            </h1>
            <p className="text-sm text-navy-400 max-w-3xl mt-1">
              Deep multi-modal verification using acoustic shadow, segmentation masks, and contextual evidence to confirm authentic debris.
            </p>
          </div>

          {/* Hydrographic Survey Protocol Badge */}
          <div className="bg-white border border-navy-100/80 rounded-lg px-4 py-2 text-right shadow-xs self-end">
            <div className="text-[10px] font-mono tracking-wider font-semibold text-navy-400 uppercase">
              Acoustic Evidence Fusion
            </div>
            <div className="text-xs font-mono font-bold text-ocean mt-0.5">
              SIH 26057 Protocol
            </div>
            <div className="text-[9px] font-mono text-navy-400">
              Physical Shadow • Shape • Context
            </div>
          </div>
        </div>

        <LayerEmptyState
          layerNumber="03"
          layerName="Evidence Intelligence"
          title="Multi-Modal Physical Evidence Not Available"
          description="Acoustic shadow geometry, shape regularity, and contextual divergence calculations require survey ingestion. Please upload your survey dataset in Layer 01 and click Ingest to run the processing pipeline."
          Icon={ShieldCheck}
          hint="Shadow (88.5%), Shape (91.9%), Context (88.8%), and physical reliability breakdown will unlock upon pipeline execution."
        />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-5 select-none">
      {/* Top Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-navy-100/60 relative">
        <div>
          <div className="text-[11px] font-bold tracking-widest text-ocean font-mono mb-0.5">
            STEP 03 / 06
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-navy tracking-tight">
            Evidence Intelligence
          </h1>
          <p className="text-sm text-navy-400 max-w-3xl mt-1">
            Deep multi-modal verification using acoustic shadow, segmentation masks, and contextual evidence to confirm authentic debris.
          </p>
        </div>

        {/* Hydrographic Survey Protocol Badge */}
        <div className="bg-white border border-navy-100/80 rounded-lg px-4 py-2 text-right shadow-xs self-end">
          <div className="text-[10px] font-mono tracking-wider font-semibold text-navy-400 uppercase">
            Acoustic Evidence Fusion
          </div>
          <div className="text-xs font-mono font-bold text-ocean mt-0.5">
            SIH 26057 Protocol
          </div>
          <div className="text-[9px] font-mono text-navy-400">
            Physical Shadow • Shape • Context
          </div>
        </div>
      </div>

      {/* Target Filtering & Navigation Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-navy-100/80 rounded-xl px-4 py-2.5 shadow-xs">
        {/* Left Side: Target Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <div className="flex items-center gap-1 text-xs font-bold text-navy-400 mr-1">
            <Filter size={14} className="text-ocean" />
            <span>Filter:</span>
          </div>

          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              categoryFilter === 'all'
                ? 'bg-ocean text-white shadow-xs'
                : 'text-navy-500 hover:text-navy hover:bg-mist-200'
            }`}
          >
            All Debris (10)
          </button>
          <button
            onClick={() => setCategoryFilter('pipes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              categoryFilter === 'pipes'
                ? 'bg-ocean text-white shadow-xs'
                : 'text-navy-500 hover:text-navy hover:bg-mist-200'
            }`}
          >
            Pipelines (2)
          </button>
          <button
            onClick={() => setCategoryFilter('wrecks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              categoryFilter === 'wrecks'
                ? 'bg-ocean text-white shadow-xs'
                : 'text-navy-500 hover:text-navy hover:bg-mist-200'
            }`}
          >
            Airframes & Wrecks (5)
          </button>
          <button
            onClick={() => setCategoryFilter('fishing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              categoryFilter === 'fishing'
                ? 'bg-ocean text-white shadow-xs'
                : 'text-navy-500 hover:text-navy hover:bg-mist-200'
            }`}
          >
            Fishing Gear (2)
          </button>
          <button
            onClick={() => setCategoryFilter('anomaly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              categoryFilter === 'anomaly'
                ? 'bg-ocean text-white shadow-xs'
                : 'text-navy-500 hover:text-navy hover:bg-mist-200'
            }`}
          >
            Anomalies (1)
          </button>
        </div>

        {/* Right Side: Active Target HUD & Formula Shortcut */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAllFormulasModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-50 hover:bg-navy-100 text-navy-700 text-xs font-semibold border border-navy-200 transition-colors"
            title="View all 5 class reliability formulas"
          >
            <Calculator size={13} className="text-ocean" />
            <span>Class Formulas</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-ocean-50 text-ocean font-bold border border-ocean-100">
              {activeItem.className}
            </span>
            <span className="text-navy-400">•</span>
            <span className="text-navy-600 font-bold">Confidence: {(activeItem.confidence * 100).toFixed(0)}%</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-navy">
            <span>
              Target {activeIndex + 1} of {AUTHENTIC_BBOX_EVIDENCE_ITEMS.length}
            </span>
            <div className="flex items-center gap-1 bg-mist-100 p-1 rounded-md border border-navy-100">
              <button
                onClick={handlePrevItem}
                className="p-0.5 text-navy-400 hover:text-navy transition-colors"
                title="Previous Target"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={handleNextItem}
                className="p-0.5 text-navy-400 hover:text-navy transition-colors"
                title="Next Target"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Filmstrip & Canvas (7 cols) + Right Evidence Panels (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Section: Filmstrip (Left) & Sonar Inspection Canvas (Right) */}
        <div className="lg:col-span-7 bg-white border border-navy-100/80 rounded-xl p-4 shadow-xs flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row gap-3.5 flex-1">
            {/* Left Filmstrip: Strictly showing genuine debris/anomaly targets */}
            <div className="sm:w-[110px] flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto max-h-[510px] pr-1 scrollbar-thin">
              {filteredItems.map((item) => {
                const isSelected = item.id === activeItem.id;
                const thumbSource = item.bboxUrl || item.rawUrl;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`cursor-pointer rounded-lg overflow-hidden border transition-all flex-shrink-0 group ${
                      isSelected
                        ? 'border-ocean ring-2 ring-ocean/30 shadow-xs'
                        : 'border-navy-100 hover:border-ocean-200 bg-mist-100/50'
                    }`}
                  >
                    <div className="w-full sm:w-[102px] aspect-[16/10] bg-navy-950 overflow-hidden relative">
                      <img
                        src={thumbSource}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {item.segmentationUrl && (
                        <span className="absolute top-1 right-1 px-1 py-0.2 bg-emerald-600/90 text-[8px] font-mono text-white rounded font-bold">
                          MASK
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[10px] font-mono text-center py-1 transition-colors truncate px-1 ${
                        isSelected
                          ? 'bg-ocean text-white font-bold'
                          : 'text-navy-500 group-hover:text-navy bg-white'
                      }`}
                      title={item.name}
                    >
                      {item.displayName}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main Sonar Canvas Viewport */}
            <div className="flex-1 bg-[#090e17] rounded-xl overflow-hidden relative flex flex-col border border-navy-900 shadow-inner min-h-[460px]">
              {/* Top View Mode Switcher: Evidence View is FIRST! Original is removed completely. */}
              <div className="p-3 flex items-center justify-center z-20">
                <div className="bg-navy-900/90 p-1 rounded-lg border border-white/10 flex items-center gap-1 backdrop-blur-xs">
                  <button
                    onClick={() => setViewMode('evidence')}
                    className={`px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
                      viewMode === 'evidence'
                        ? 'bg-ocean text-white shadow-xs'
                        : 'text-navy-300 hover:text-white'
                    }`}
                  >
                    Evidence View
                  </button>
                  <button
                    onClick={() => setViewMode('enhanced')}
                    className={`px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
                      viewMode === 'enhanced'
                        ? 'bg-ocean text-white shadow-xs'
                        : 'text-navy-300 hover:text-white'
                    }`}
                  >
                    Enhanced
                  </button>
                  <button
                    onClick={() => setViewMode('segmentation')}
                    className={`px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
                      viewMode === 'segmentation'
                        ? 'bg-ocean text-white shadow-xs'
                        : 'text-navy-300 hover:text-white'
                    }`}
                  >
                    Segmentation (BBox + Mask)
                  </button>
                </div>
              </div>

              {/* Viewport Image Canvas */}
              <div className="flex-1 relative overflow-hidden flex items-center justify-center p-2">
                <div
                  className="w-full h-full relative flex items-center justify-center transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  {canvasDisplay.url ? (
                    <img
                      src={canvasDisplay.url}
                      alt={activeItem.name}
                      className="max-h-[390px] w-auto max-w-full object-contain select-none"
                    />
                  ) : (
                    // Clean placeholder when property is absent
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-navy-900/70 rounded-xl border border-dashed border-navy-700 max-w-md">
                      <ImageOff size={36} className="text-navy-500 mb-2.5" />
                      <div className="text-sm font-bold text-white">
                        {canvasDisplay.placeholderTitle}
                      </div>
                      <div className="text-xs text-navy-400 mt-1">
                        {canvasDisplay.placeholderDesc}
                      </div>
                    </div>
                  )}
                </div>

                {/* Overlays: Compass Arrow & Scale */}
                {showEvidenceOverlays && (
                  <>
                    <div className="absolute top-3 right-3 text-white/90 flex flex-col items-center pointer-events-none">
                      <div className="text-[11px] font-mono font-bold tracking-widest leading-none mb-0.5">
                        N
                      </div>
                      <div className="w-0 h-0 border-x-4 border-x-transparent border-b-8 border-b-white/90" />
                      <div className="w-0.5 h-3 bg-white/70" />
                    </div>

                    <div className="absolute bottom-3 left-3 text-white/90 pointer-events-none flex flex-col items-start gap-1">
                      <div className="text-[10px] font-mono font-semibold">50 m</div>
                      <div className="flex items-center">
                        <div className="w-0.5 h-2 bg-white" />
                        <div className="w-14 h-0.5 bg-white" />
                        <div className="w-0.5 h-2 bg-white" />
                      </div>
                    </div>
                  </>
                )}

                {/* Floating Side Tools */}
                <div className="absolute top-1/2 -translate-y-1/2 right-3 flex flex-col gap-1.5 z-20">
                  <button
                    onClick={handleZoomIn}
                    className="w-8 h-8 rounded-lg bg-navy-900/80 border border-white/10 text-white/80 hover:text-white hover:bg-navy-800 flex items-center justify-center transition-colors shadow-sm"
                    title="Zoom In"
                  >
                    <ZoomIn size={15} />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="w-8 h-8 rounded-lg bg-navy-900/80 border border-white/10 text-white/80 hover:text-white hover:bg-navy-800 flex items-center justify-center transition-colors shadow-sm"
                    title="Zoom Out"
                  >
                    <ZoomOut size={15} />
                  </button>
                  <button
                    onClick={handleResetZoom}
                    className="w-8 h-8 rounded-lg bg-navy-900/80 border border-white/10 text-white/80 hover:text-white hover:bg-navy-800 flex items-center justify-center transition-colors shadow-sm"
                    title="Reset Zoom / Fit"
                  >
                    <Maximize2 size={14} />
                  </button>
                  {canvasDisplay.url && (
                    <a
                      href={canvasDisplay.url}
                      download={activeItem.name}
                      className="w-8 h-8 rounded-lg bg-navy-900/80 border border-white/10 text-white/80 hover:text-white hover:bg-navy-800 flex items-center justify-center transition-colors shadow-sm"
                      title="Download Current Asset View"
                    >
                      <Download size={14} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Telemetry & Modality Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs font-semibold text-navy border-t border-navy-50">
            <div className="flex items-center gap-2 text-navy-500 text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Active Modality: <strong className="text-navy uppercase font-bold">{viewMode === 'evidence' ? 'Evidence View (Raw / BBox)' : viewMode === 'enhanced' ? 'Enhanced Pre-processed' : 'Segmentation (BBox + Mask)'}</strong></span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showEvidenceOverlays}
                onChange={(e) => setShowEvidenceOverlays(e.target.checked)}
                className="w-4 h-4 rounded text-ocean border-navy-300 focus:ring-ocean accent-ocean"
              />
              <span className="text-navy-600 text-xs">Show Telemetry & Compass Overlays</span>
            </label>
          </div>
        </div>

        {/* Right Section: Detected Objects (Top) + Evidence Analysis & Class Formulas (Bottom) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Card 1: Detected Objects */}
          <div className="bg-white border border-navy-100/80 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-navy-50">
              <div className="flex items-center gap-2 text-navy font-bold text-sm">
                <Target size={17} className="text-ocean" />
                <span>Detected Objects ({activeItem.bboxUrl ? 1 : 0})</span>
              </div>

              <div className="flex items-center gap-1 text-xs text-navy-400 font-medium">
                <span>Class:</span>
                <span className="font-bold text-navy font-mono">{activeItem.className.split(' ')[0]}</span>
              </div>
            </div>

            {/* Authentic Detection Record */}
            <div className="p-2.5 rounded-lg border border-ocean bg-ocean-50/60 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-navy-400 w-3">1</span>
                {/* Target crop/thumbnail */}
                <div className="w-12 h-9 rounded bg-navy-950 overflow-hidden border border-navy-100 flex-shrink-0">
                  <img
                    src={activeItem.segmentationUrl || activeItem.bboxUrl || activeItem.preprocessedUrl!}
                    alt={activeItem.className}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        activeItem.color === 'blue'
                          ? 'bg-[#0070f3]'
                          : activeItem.color === 'red'
                          ? 'bg-rose-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <span className="text-xs font-bold text-navy leading-none">
                      {activeItem.className.split(' ')[0]}
                    </span>
                  </div>
                  <div className="text-[10px] text-navy-400 mt-0.5">
                    {activeItem.className}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[9px] uppercase font-semibold text-navy-300">
                    AI Confidence (C_AI)
                  </div>
                  <div className="text-xs font-mono font-bold text-ocean">
                    {activeItem.confidence.toFixed(2)}
                  </div>
                </div>
                <ChevronRight size={15} className="text-ocean" />
              </div>
            </div>
          </div>

          {/* Card 2: Evidence Analysis & Class Reliability Formula */}
          <div className="bg-white border border-navy-100/80 rounded-xl p-4 shadow-xs space-y-3.5">
            {/* Header with Object Selector */}
            <div className="flex items-center justify-between pb-2 border-b border-navy-50">
              <div className="flex items-center gap-2 text-navy font-bold text-sm">
                <Sparkles size={16} className="text-ocean" />
                <span>Evidence Analysis</span>
              </div>

              <div className="flex items-center gap-1.5 bg-mist-100 px-2 py-1 rounded-md border border-navy-100">
                <div className="w-4 h-4 rounded bg-navy-950 overflow-hidden">
                  <img
                    src={activeItem.segmentationUrl || activeItem.bboxUrl || activeItem.preprocessedUrl!}
                    alt={activeItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs font-semibold text-navy font-mono">
                  {activeItem.name}
                </span>
              </div>
            </div>

            {/* 3 Evidence Cards: Shadow, Segmentation (BBox + Mask), Context */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {/* 1. Shadow Evidence Card (Click to Expand) */}
              <div className="border border-navy-100 rounded-lg p-2.5 flex flex-col justify-between bg-white hover:border-ocean-200 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-navy">
                      <Sun size={13} className="text-ocean flex-shrink-0" />
                      <span className="truncate">Shadow Evidence</span>
                    </div>
                  </div>

                  {/* Real Shadow Image if present; Clickable to Expand! */}
                  {activeItem.shadowUrl ? (
                    <div
                      onClick={() =>
                        setExpandedModal({
                          isOpen: true,
                          title: `Acoustic Shadow Verification: ${activeItem.name}`,
                          imageUrl: activeItem.shadowUrl!,
                          modality: 'Shadow Evidence (S_shadow)',
                          score: activeItem.s_shadow ?? 0.85,
                          checklist: activeItem.shadowChecklist,
                        })
                      }
                      className="aspect-[16/9] bg-navy-950 rounded overflow-hidden relative mb-2 border border-navy-100 cursor-pointer group shadow-2xs"
                      title="Click to Expand Shadow Evidence"
                    >
                      <img
                        src={activeItem.shadowUrl}
                        alt="Shadow Evidence"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-1 right-1 bg-emerald-100 text-emerald-700 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-full shadow-xs">
                        {(activeItem.s_shadow ?? 0.85).toFixed(2)}
                      </div>
                      <div className="absolute inset-0 bg-navy-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="p-1 rounded-full bg-navy-900/80 text-white backdrop-blur-xs">
                          <Maximize2 size={13} />
                        </div>
                      </div>
                    </div>
                  ) : activeItem.classKey === 'ghostnet' ? (
                    // Explicit handling for Ghostnet as instructed: "this property is not defined for this class"
                    <div className="aspect-[16/9] bg-amber-500/10 rounded border border-dashed border-amber-300 flex flex-col items-center justify-center p-2 mb-2 text-center">
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-bold text-[9px] mb-1">
                        Shadow weight = 0
                      </span>
                      <span className="text-[10px] font-bold text-amber-900 leading-tight">
                        This property is not defined for this class
                      </span>
                      <span className="text-[8px] text-amber-700 mt-0.5">
                        Porous polymer net casts no shadow
                      </span>
                    </div>
                  ) : (
                    // General missing property indicator: "this property is not defined for this class"
                    <div className="aspect-[16/9] bg-navy-950/60 rounded border border-dashed border-navy-700 flex flex-col items-center justify-center p-2 mb-2 text-center">
                      <ImageOff size={16} className="text-navy-400 mb-1" />
                      <span className="text-[10px] font-bold text-navy-300 leading-tight">
                        This property is not defined for this class
                      </span>
                    </div>
                  )}

                  {/* Checklist */}
                  <div className="space-y-1 text-[10px] font-medium">
                    {activeItem.shadowChecklist.map((item, i) => (
                      <div key={i} className="flex items-start gap-1">
                        {item.present ? (
                          <CheckCircle2
                            size={11}
                            className="text-emerald-500 mt-0.5 flex-shrink-0"
                          />
                        ) : (
                          <AlertCircle
                            size={11}
                            className="text-amber-500 mt-0.5 flex-shrink-0"
                          />
                        )}
                        <span
                          className={item.present ? 'text-navy-600' : 'text-navy-400'}
                        >
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Segmentation (BBox + Mask) Card (Click to Expand) */}
              <div className="border border-navy-100 rounded-lg p-2.5 flex flex-col justify-between bg-white hover:border-ocean-200 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-navy">
                      <Box size={13} className="text-ocean flex-shrink-0" />
                      <span className="truncate">Segmentation (BBox+Mask)</span>
                    </div>
                  </div>

                  {/* Real Image from bbox+mask folder if present; Clickable to Expand! */}
                  {activeItem.segmentationUrl ? (
                    <div
                      onClick={() =>
                        setExpandedModal({
                          isOpen: true,
                          title: `Segmentation BBox+Mask Verification: ${activeItem.name}`,
                          imageUrl: activeItem.segmentationUrl!,
                          modality: 'Segmentation Contour (S_shape)',
                          score: activeItem.s_shape,
                          checklist: [
                            { text: 'BBox + mask boundary verified', present: true },
                            { text: 'Contour morphology segmented', present: true },
                            { text: 'Consistent with acoustic echo', present: true },
                          ],
                        })
                      }
                      className="aspect-[16/9] bg-navy-950 rounded overflow-hidden relative mb-2 border border-navy-100 cursor-pointer group shadow-2xs"
                      title="Click to Expand Segmentation"
                    >
                      <img
                        src={activeItem.segmentationUrl}
                        alt="Segmentation BBox+Mask"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-1 right-1 bg-emerald-100 text-emerald-700 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-full shadow-xs">
                        {activeItem.s_shape.toFixed(2)}
                      </div>
                      <div className="absolute inset-0 bg-navy-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="p-1 rounded-full bg-navy-900/80 text-white backdrop-blur-xs">
                          <Maximize2 size={13} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-navy-950/60 rounded border border-dashed border-navy-700 flex flex-col items-center justify-center p-2 mb-2 text-center">
                      <ImageOff size={16} className="text-navy-400 mb-1" />
                      <span className="text-[10px] font-bold text-navy-300 leading-tight">
                        This property is not defined for this class
                      </span>
                    </div>
                  )}

                  {/* Checklist */}
                  <div className="space-y-1 text-[10px] font-medium">
                    {activeItem.segmentationUrl ? (
                      <>
                        <div className="flex items-start gap-1">
                          <CheckCircle2
                            size={11}
                            className="text-emerald-500 mt-0.5 flex-shrink-0"
                          />
                          <span className="text-navy-600">BBox + mask verified</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <CheckCircle2
                            size={11}
                            className="text-emerald-500 mt-0.5 flex-shrink-0"
                          />
                          <span className="text-navy-600">Object boundary delineated</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <CheckCircle2
                            size={11}
                            className="text-emerald-500 mt-0.5 flex-shrink-0"
                          />
                          <span className="text-navy-600">Consistent with sonar swath</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start gap-1">
                          <AlertCircle
                            size={11}
                            className="text-amber-500 mt-0.5 flex-shrink-0"
                          />
                          <span className="text-navy-400">Mask not defined for this target</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <AlertCircle
                            size={11}
                            className="text-amber-500 mt-0.5 flex-shrink-0"
                          />
                          <span className="text-navy-400">Contour inferred from preprocessed</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Context Evidence Card (Click to Expand) */}
              <div className="border border-navy-100 rounded-lg p-2.5 flex flex-col justify-between bg-white hover:border-ocean-200 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-navy">
                      <Mountain size={13} className="text-ocean flex-shrink-0" />
                      <span className="truncate">Context Evidence</span>
                    </div>
                  </div>

                  {/* Real Context Image from context/ folder; Clickable to Expand! */}
                  {activeItem.contextUrl ? (
                    <div
                      onClick={() =>
                        setExpandedModal({
                          isOpen: true,
                          title: `Contextual Seafloor Verification: ${activeItem.name}`,
                          imageUrl: activeItem.contextUrl!,
                          modality: 'Context Evidence (S_context)',
                          score: activeItem.s_context,
                          checklist: activeItem.contextChecklist,
                        })
                      }
                      className="aspect-[16/9] bg-navy-950 rounded overflow-hidden relative mb-2 border border-navy-100 cursor-pointer group shadow-2xs"
                      title="Click to Expand Context Evidence"
                    >
                      <img
                        src={activeItem.contextUrl}
                        alt="Context Evidence"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-1 right-1 bg-emerald-100 text-emerald-700 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-full shadow-xs">
                        {activeItem.s_context.toFixed(2)}
                      </div>
                      <div className="absolute inset-0 bg-navy-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="p-1 rounded-full bg-navy-900/80 text-white backdrop-blur-xs">
                          <Maximize2 size={13} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-navy-950/60 rounded border border-dashed border-navy-700 flex flex-col items-center justify-center p-2 mb-2 text-center">
                      <ImageOff size={16} className="text-navy-400 mb-1" />
                      <span className="text-[10px] font-bold text-navy-300 leading-tight">
                        This property is not defined for this class
                      </span>
                    </div>
                  )}

                  {/* Checklist */}
                  <div className="space-y-1 text-[10px] font-medium">
                    {activeItem.contextChecklist.map((item, i) => (
                      <div key={i} className="flex items-start gap-1">
                        {item.present ? (
                          <CheckCircle2
                            size={11}
                            className="text-emerald-500 mt-0.5 flex-shrink-0"
                          />
                        ) : (
                          <AlertCircle
                            size={11}
                            className="text-amber-500 mt-0.5 flex-shrink-0"
                          />
                        )}
                        <span
                          className={item.present ? 'text-navy-600' : 'text-navy-400'}
                        >
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CLASS-SPECIFIC RELIABILITY FORMULA CARD (Executive Mathematical Representation) */}
            <div className="rounded-xl border border-navy-800/90 bg-gradient-to-br from-[#071326] via-[#091b36] to-[#0c2447] text-white p-4 space-y-3 shadow-md relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-ocean-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-ocean-500/20 text-ocean-300 flex items-center justify-center border border-ocean-400/30">
                    <Calculator size={13} />
                  </div>
                  <div>
                    <span className="text-xs font-bold tracking-wide uppercase font-mono text-cyan-300">
                      Adaptive Evidence Fusion Formula
                    </span>
                    <span className="text-[10px] text-navy-300 block font-sans">
                      SIH 26057 Profile: <strong className="text-white">{reliabilityData.formulaDef.title}</strong>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowAllFormulasModal(true)}
                  className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-mono text-cyan-200 border border-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Profiles</span>
                  <ChevronRight size={11} />
                </button>
              </div>

              {/* Mathematical Equation Rendered with Token Badges */}
              <div className="bg-navy-950/80 rounded-lg p-3 border border-navy-800/80 font-mono space-y-2 relative z-10 shadow-inner">
                {/* Canonical Symbolic Equation */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs text-white">
                  <span className="px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 font-bold border border-cyan-700/40">
                    R_{activeItem.classKey}
                  </span>
                  <span className="text-slate-400 font-bold">= 100 × (</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40">
                    {(reliabilityData.formulaDef.weights.c_ai).toFixed(2)} · C_AI
                  </span>
                  <span className="text-slate-400">+</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40">
                    {(reliabilityData.formulaDef.weights.s_shape).toFixed(2)} · S_shape
                  </span>
                  {reliabilityData.formulaDef.weights.s_shadow > 0 ? (
                    <>
                      <span className="text-slate-400">+</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/40">
                        {(reliabilityData.formulaDef.weights.s_shadow).toFixed(2)} · S_shadow
                      </span>
                    </>
                  ) : null}
                  <span className="text-slate-400">+</span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">
                    {(reliabilityData.formulaDef.weights.s_context).toFixed(2)} · S_context
                  </span>
                  <span className="text-slate-400 font-bold">)</span>
                </div>

                {/* Substituted Numerical Values */}
                <div className="text-[11px] text-slate-300 pt-1 border-t border-navy-800/60 overflow-x-auto whitespace-nowrap flex items-center gap-1.5">
                  <span className="text-cyan-400 font-bold">= 100 × (</span>
                  <span className="text-blue-300">
                    {(reliabilityData.formulaDef.weights.c_ai * activeItem.c_ai).toFixed(3)}
                  </span>
                  <span className="text-slate-500">+</span>
                  <span className="text-emerald-300">
                    {(reliabilityData.formulaDef.weights.s_shape * activeItem.s_shape).toFixed(3)}
                  </span>
                  {reliabilityData.formulaDef.weights.s_shadow > 0 ? (
                    <>
                      <span className="text-slate-500">+</span>
                      <span className="text-amber-300">
                        {(reliabilityData.formulaDef.weights.s_shadow * (activeItem.s_shadow ?? 0)).toFixed(3)}
                      </span>
                    </>
                  ) : null}
                  <span className="text-slate-500">+</span>
                  <span className="text-purple-300">
                    {(reliabilityData.formulaDef.weights.s_context * activeItem.s_context).toFixed(3)}
                  </span>
                  <span className="text-cyan-400 font-bold">)</span>
                  <span className="text-emerald-400 font-extrabold ml-1">
                    = {reliabilityData.computedPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Weight Distribution Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-navy-800/60 text-[10px] font-mono relative z-10">
                {reliabilityData.formulaDef.note ? (
                  <div className="text-amber-300 font-medium flex items-center gap-1">
                    <AlertCircle size={11} className="text-amber-400 flex-shrink-0" />
                    <span>{reliabilityData.formulaDef.note}</span>
                  </div>
                ) : (
                  <div className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 size={11} className="flex-shrink-0" />
                    <span>Normalized Class Weights (Total = 1.00)</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-[9px]">
                  <span className="px-1.5 py-0.5 rounded bg-blue-950/90 text-blue-300 border border-blue-800/30">
                    C_AI: {(reliabilityData.formulaDef.weights.c_ai * 100).toFixed(0)}%
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-800/30">
                    Shape: {(reliabilityData.formulaDef.weights.s_shape * 100).toFixed(0)}%
                  </span>
                  <span className={`px-1.5 py-0.5 rounded border ${reliabilityData.formulaDef.weights.s_shadow === 0 ? 'bg-amber-950/90 text-amber-300 border-amber-800/30' : 'bg-amber-950/90 text-amber-300 border-amber-800/30'}`}>
                    Shadow: {(reliabilityData.formulaDef.weights.s_shadow * 100).toFixed(0)}%
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-950/90 text-purple-300 border border-purple-800/30">
                    Context: {(reliabilityData.formulaDef.weights.s_context * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Large Bold Evaluated Reliability Score & Confirmation Badge */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-navy-100">
              <div className="w-full sm:w-1/2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-navy-400 font-mono">
                    Computed Fusion Reliability (R_{activeItem.classKey})
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 tracking-tight">
                    {reliabilityData.computedPercentage.toFixed(1)}%
                  </span>
                </div>

                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 via-emerald-500 to-green-600 rounded-full transition-all duration-500 shadow-xs"
                    style={{
                      width: `${Math.min(100, Math.max(10, reliabilityData.computedPercentage))}%`,
                    }}
                  />
                </div>
              </div>

              <div className="w-full sm:w-auto flex items-center gap-3 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200/90 shadow-xs">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Check size={18} strokeWidth={3} />
                </div>
                <div>
                  <div className="text-xs font-black text-emerald-950 tracking-wide uppercase font-mono">
                    {activeItem.reliability}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-700">
                    {activeItem.reliabilitySub}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Modal Lightbox (Opens when clicking Shadow, Segmentation, or Context image) */}
      {expandedModal && (
        <div
          className="fixed inset-0 z-50 bg-navy-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setExpandedModal(null)}
        >
          <div
            className="bg-navy-900 border border-navy-700/80 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-800 bg-navy-950/70">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded bg-ocean/20 text-ocean text-xs font-mono font-bold uppercase tracking-wider border border-ocean/30">
                  {expandedModal.modality}
                </span>
                <div>
                  <h3 className="text-base font-bold text-white leading-none">
                    {expandedModal.title}
                  </h3>
                  <p className="text-xs text-navy-400 mt-1 font-mono">
                    Target: {activeItem.displayName} • Class: {activeItem.className} • Modality Score: {expandedModal.score.toFixed(2)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExpandedModal(null)}
                className="w-8 h-8 rounded-lg bg-navy-800 text-navy-300 hover:text-white hover:bg-navy-700 flex items-center justify-center transition-colors"
                title="Close Lightbox"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Image Area */}
            <div className="relative p-6 flex items-center justify-center bg-[#070c14] min-h-[420px] max-h-[72vh] overflow-hidden">
              <img
                src={expandedModal.imageUrl}
                alt={expandedModal.title}
                className="max-h-[62vh] w-auto max-w-full object-contain rounded-lg shadow-xl border border-navy-800"
              />
              <div className="absolute bottom-4 right-4 bg-navy-900/90 border border-white/15 px-3 py-1.5 rounded-lg text-xs font-mono text-white flex items-center gap-2 backdrop-blur-xs shadow-lg">
                <span className="text-navy-400">Normalized Score:</span>
                <span className="font-bold text-emerald-400">{expandedModal.score.toFixed(2)}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-navy-800 bg-navy-950/70 flex items-center justify-between text-xs text-navy-400 font-mono">
              <span className="text-[11px]">Click backdrop or press Escape to close</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExpandedModal(null)}
                  className="px-3.5 py-1.5 rounded bg-navy-800 hover:bg-navy-700 text-white font-semibold transition-colors"
                >
                  Close
                </button>
                <a
                  href={expandedModal.imageUrl}
                  download={`${activeItem.name}_${expandedModal.modality.replace(/\s+/g, '_').toLowerCase()}.png`}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-ocean hover:bg-ocean-600 text-white font-semibold transition-colors shadow-xs"
                >
                  <Download size={13} />
                  <span>Download High-Res</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ALL 5 CLASS FORMULAS REFERENCE MODAL */}
      {showAllFormulasModal && (
        <div
          className="fixed inset-0 z-50 bg-navy-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowAllFormulasModal(false)}
        >
          <div
            className="bg-navy-900 border border-navy-700/80 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-800 bg-navy-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-ocean/20 border border-ocean/30 text-ocean">
                  <Calculator size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Class-Specific Reliability Formulas
                  </h3>
                  <p className="text-xs text-navy-400 mt-0.5">
                    Authentic equations defining multi-modal evidence fusion for each target debris class
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAllFormulasModal(false)}
                className="w-8 h-8 rounded-lg bg-navy-800 text-navy-300 hover:text-white hover:bg-navy-700 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: The 5 Formulas */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto font-mono text-xs">
              {Object.entries(CLASS_FORMULAS).map(([key, def], idx) => {
                const isCurrent = activeItem.classKey === key;

                return (
                  <div
                    key={key}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-navy-950 border-ocean ring-1 ring-ocean/50 shadow-md'
                        : 'bg-navy-950/60 border-navy-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-navy-400 font-bold text-sm">
                          {idx + 1}.
                        </span>
                        <span className="text-white font-bold text-sm font-sans">
                          {def.title}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded bg-ocean text-white text-[10px] font-bold">
                            CURRENT CLASS
                          </span>
                        )}
                      </div>
                      {def.weights.s_shadow === 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                          Shadow weight = 0
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#060a12] border border-navy-800 text-teal-300 text-xs overflow-x-auto whitespace-nowrap mb-2">
                      {def.equation}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-navy-400">
                      <div className="flex items-center gap-2">
                        <span>Weights:</span>
                        <span className="text-white">C_AI: {(def.weights.c_ai * 100).toFixed(0)}%</span>
                        <span>•</span>
                        <span className="text-white">S_shape: {(def.weights.s_shape * 100).toFixed(0)}%</span>
                        <span>•</span>
                        <span className={def.weights.s_shadow === 0 ? 'text-amber-400 font-bold' : 'text-white'}>
                          S_shadow: {(def.weights.s_shadow * 100).toFixed(0)}%
                        </span>
                        <span>•</span>
                        <span className="text-white">S_context: {(def.weights.s_context * 100).toFixed(0)}%</span>
                      </div>

                      {def.note && (
                        <span className="text-amber-400 text-[10px] font-sans">
                          {def.note}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-navy-800 bg-navy-950/80 flex items-center justify-between text-xs text-navy-400">
              <span>Formulas strictly adhere to maritime side-scan sonar physics specifications.</span>
              <button
                onClick={() => setShowAllFormulasModal(false)}
                className="px-4 py-1.5 rounded-lg bg-ocean hover:bg-ocean-600 text-white font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-navy-100/60">
        <button
          onClick={() => navigate('/sonar-analysis')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-navy-200 text-sm font-semibold text-navy hover:bg-mist-200 hover:border-navy-300 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Sonar Analysis
        </button>

        <button
          onClick={() => navigate('/human-review')}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0a58ca] hover:bg-[#084298] text-white text-sm font-semibold transition-all shadow-sm"
        >
          <span>Continue to Reliability & Prioritization</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
