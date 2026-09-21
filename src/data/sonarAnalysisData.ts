export interface DetectionItem {
  id: number;
  className: string;
  confidence: number;
  color: 'blue' | 'red' | 'green' | 'amber';
  isNovel?: boolean;
}

export interface ObservabilityMetrics {
  imageId: number;
  usableAreaPercent: number;
  nadirGapPercent: number;
  weakSignalPercent: number;
  acousticShadowPercent: number;
  qualityTier: 'HIGH' | 'MEDIUM' | 'DEGRADED';
  snrDb: number;
  surveyReliabilityScore: number;
  notes: string;
}

export interface SonarAnalysisAsset {
  id: string;
  name: string;
  thumbnailUrl: string; // Strictly the raw unannotated image
  rawUrl: string;       // Clean raw image
  bboxUrl: string | null; // Authentic bbox file (/bbox/...)
  segmentationUrl: string | null; // Segmentation mask (/bbox+mask/...)
  heatmapUrl: string | null; // Heatmap / PatchCore activation (/PatchCore/...)
  preprocessedUrl?: string | null; // Pre-processed grayscale acoustic scan (/pre-processed/...)
  shapeUrl?: string | null; // Shape highlight contour mask (/shape/...)
  shadowUrl?: string | null; // Acoustic shadow contour mask (/shadow/...)
  contextUrl?: string | null; // Seafloor context crop (/context/...)
  patchcoreUrl?: string | null; // PatchCore anomaly heatmap (/PatchCore/...)
  enhancedUrl: string | null;
  detections: DetectionItem[];
  observability?: ObservabilityMetrics;
}

export const OBSERVABILITY_METRICS_MAP: Record<string, ObservabilityMetrics> = {
  'artificial_reef.png': {
    imageId: 1,
    usableAreaPercent: 92.4,
    nadirGapPercent: 3.8,
    weakSignalPercent: 3.8,
    acousticShadowPercent: 1.2,
    qualityTier: 'HIGH',
    snrDb: 24.2,
    surveyReliabilityScore: 93,
    notes: 'Optimal baseline acoustic return; distinct structural backscatter with minimal attenuation.',
  },
  'crabpot.jpg': {
    imageId: 2,
    usableAreaPercent: 88.5,
    nadirGapPercent: 4.5,
    weakSignalPercent: 4.8,
    acousticShadowPercent: 2.2,
    qualityTier: 'HIGH',
    snrDb: 22.0,
    surveyReliabilityScore: 89,
    notes: 'Clear swath coverage; dual discrete trap acoustic reflections detected with prominent shadows.',
  },
  'shipwreck3.jpeg': {
    imageId: 3,
    usableAreaPercent: 87.1,
    nadirGapPercent: 4.9,
    weakSignalPercent: 5.4,
    acousticShadowPercent: 2.6,
    qualityTier: 'HIGH',
    snrDb: 21.4,
    surveyReliabilityScore: 88,
    notes: 'Stable backscatter response; localized structural acoustic occlusion behind hull fragment.',
  },
  'ghostnet.jpeg': {
    imageId: 4,
    usableAreaPercent: 86.8,
    nadirGapPercent: 4.8,
    weakSignalPercent: 6.2,
    acousticShadowPercent: 2.2,
    qualityTier: 'MEDIUM',
    snrDb: 19.8,
    surveyReliabilityScore: 87,
    notes: 'Fibrous diffuse scatter; shadow attenuation absent due to porous polymer mesh geometry.',
  },
  'human.jpeg': {
    imageId: 5,
    usableAreaPercent: 84.5,
    nadirGapPercent: 5.2,
    weakSignalPercent: 7.1,
    acousticShadowPercent: 3.2,
    qualityTier: 'MEDIUM',
    snrDb: 18.6,
    surveyReliabilityScore: 85,
    notes: 'Out-of-distribution anomaly area; acoustic density divergence flagged by PatchCore.',
  },
  'pipe.jpeg': {
    imageId: 6,
    usableAreaPercent: 91.2,
    nadirGapPercent: 3.9,
    weakSignalPercent: 3.5,
    acousticShadowPercent: 1.4,
    qualityTier: 'HIGH',
    snrDb: 23.5,
    surveyReliabilityScore: 92,
    notes: 'High backscatter linear conduit with continuous geometry-consistent acoustic shadow.',
  },
  'pipe1.jpeg': {
    imageId: 7,
    usableAreaPercent: 90.6,
    nadirGapPercent: 4.1,
    weakSignalPercent: 3.9,
    acousticShadowPercent: 1.4,
    qualityTier: 'HIGH',
    snrDb: 22.8,
    surveyReliabilityScore: 91,
    notes: 'Excellent acoustic clarity; raised joint casting sharp acoustic penumbra into starboard swath.',
  },
  'plane.jpg': {
    imageId: 8,
    usableAreaPercent: 93.1,
    nadirGapPercent: 3.5,
    weakSignalPercent: 2.4,
    acousticShadowPercent: 1.0,
    qualityTier: 'HIGH',
    snrDb: 25.1,
    surveyReliabilityScore: 94,
    notes: 'Crisp specular acoustic return from fuselage skin; extensive low-loss observable swath.',
  },
  'plane1.jpg': {
    imageId: 9,
    usableAreaPercent: 89.4,
    nadirGapPercent: 4.3,
    weakSignalPercent: 4.7,
    acousticShadowPercent: 1.6,
    qualityTier: 'HIGH',
    snrDb: 22.3,
    surveyReliabilityScore: 90,
    notes: 'Wing section resting on sand; trailing shadow correlates with sonar flight vector.',
  },
  'seabed.png': {
    imageId: 10,
    usableAreaPercent: 95.2,
    nadirGapPercent: 2.8,
    weakSignalPercent: 2.0,
    acousticShadowPercent: 0.0,
    qualityTier: 'HIGH',
    snrDb: 26.4,
    surveyReliabilityScore: 96,
    notes: 'Pristine sandy seabed reference baseline; uniform backscatter across entire range swath.',
  },
  'seabed1.jpg': {
    imageId: 11,
    usableAreaPercent: 94.0,
    nadirGapPercent: 3.2,
    weakSignalPercent: 2.8,
    acousticShadowPercent: 0.0,
    qualityTier: 'HIGH',
    snrDb: 25.0,
    surveyReliabilityScore: 95,
    notes: 'Normal bedrock ripple texture; clean acoustic SNR supporting reliable reference embedding.',
  },
  'seabed3.png': {
    imageId: 12,
    usableAreaPercent: 71.5,
    nadirGapPercent: 6.8,
    weakSignalPercent: 14.2,
    acousticShadowPercent: 7.5,
    qualityTier: 'DEGRADED',
    snrDb: 14.3,
    surveyReliabilityScore: 72,
    notes: 'Acoustic attenuation and thermocline interference observed; far-range roll-off requires cautious interpretation.',
  },
  'seabed4.png': {
    imageId: 13,
    usableAreaPercent: 91.8,
    nadirGapPercent: 4.0,
    weakSignalPercent: 4.2,
    acousticShadowPercent: 0.0,
    qualityTier: 'HIGH',
    snrDb: 23.9,
    surveyReliabilityScore: 92,
    notes: 'Stable reference seabed; normal sand waves without anthropogenic anomalies.',
  },
  'shipwreck.png': {
    imageId: 14,
    usableAreaPercent: 87.6,
    nadirGapPercent: 4.6,
    weakSignalPercent: 5.2,
    acousticShadowPercent: 2.6,
    qualityTier: 'HIGH',
    snrDb: 21.8,
    surveyReliabilityScore: 88,
    notes: 'Large high-relief wreck hull projecting major acoustic shadow into starboard swath.',
  },
  'shipwreck2.png': {
    imageId: 15,
    usableAreaPercent: 86.2,
    nadirGapPercent: 4.8,
    weakSignalPercent: 5.8,
    acousticShadowPercent: 3.2,
    qualityTier: 'HIGH',
    snrDb: 21.0,
    surveyReliabilityScore: 87,
    notes: 'Extensive wreckage field; significant acoustic blockage behind central superstructure.',
  },
};

export const ALL_SONAR_ANALYSIS_ASSETS: SonarAnalysisAsset[] = [
  {
    id: 'frame-1',
    name: 'pipe.jpeg',
    thumbnailUrl: '/raw/pipe.jpeg',
    rawUrl: '/raw/pipe.jpeg',
    bboxUrl: '/bbox/pipe.png',
    segmentationUrl: '/bbox+mask/pipe.png',
    heatmapUrl: '/PatchCore/pipe.png',
    preprocessedUrl: '/pre-processed/pipe.png',
    shapeUrl: '/shape/pipe.png',
    shadowUrl: '/shadow/pipe.png',
    contextUrl: '/context/pipe.png',
    patchcoreUrl: '/PatchCore/pipe.png',
    enhancedUrl: '/pre-processed/pipe.png',
    detections: [
      { id: 1, className: 'Pipe', confidence: 0.96, color: 'blue' },
    ],
    observability: OBSERVABILITY_METRICS_MAP['pipe.jpeg'],
  },
  {
    id: 'frame-2',
    name: 'pipe1.jpeg',
    thumbnailUrl: '/raw/pipe1.jpeg',
    rawUrl: '/raw/pipe1.jpeg',
    bboxUrl: '/bbox/pipe1.png',
    segmentationUrl: '/bbox+mask/pipe1.png',
    heatmapUrl: '/PatchCore/pipe1.png',
    preprocessedUrl: '/pre-processed/pipe1.png',
    shapeUrl: '/shape/pipe1.png',
    shadowUrl: '/shadow/pipe1.png',
    contextUrl: '/context/pipe1.png',
    patchcoreUrl: '/PatchCore/pipe1.png',
    enhancedUrl: '/pre-processed/pipe1.png',
    detections: [
      { id: 1, className: 'Pipe', confidence: 0.95, color: 'blue' },
    ],
    observability: OBSERVABILITY_METRICS_MAP['pipe1.jpeg'],
  },
  {
    id: 'frame-3',
    name: 'shipwreck2.png',
    thumbnailUrl: '/raw/shipwreck2.png',
    rawUrl: '/raw/shipwreck2.png',
    bboxUrl: '/bbox/shipwreck2.png',
    segmentationUrl: '/bbox+mask/shipwreck2.png',
    heatmapUrl: '/PatchCore/shipwreck2.png',
    preprocessedUrl: '/pre-processed/shipwreck2.png',
    shapeUrl: '/shape/shipwreck2.png',
    shadowUrl: '/shadow/shipwreck2.png',
    contextUrl: '/context/shipwreck2.png',
    patchcoreUrl: '/PatchCore/shipwreck2.png',
    enhancedUrl: '/pre-processed/shipwreck2.png',
    detections: [
      { id: 1, className: 'Shipwreck', confidence: 0.97, color: 'blue' },
    ],
    observability: OBSERVABILITY_METRICS_MAP['shipwreck2.png'],
  },
  {
    id: 'frame-4',
    name: 'shipwreck.png',
    thumbnailUrl: '/raw/shipwreck.png',
    rawUrl: '/raw/shipwreck.png',
    bboxUrl: '/bbox/shipwreck.png',
    segmentationUrl: '/bbox+mask/shipwreck.png',
    heatmapUrl: '/PatchCore/shipwreck.png',
    preprocessedUrl: '/pre-processed/shipwreck.png',
    shapeUrl: '/shape/shipwreck.png',
    shadowUrl: '/shadow/shipwreck.png',
    contextUrl: '/context/shipwreck.png',
    patchcoreUrl: '/PatchCore/shipwreck.png',
    enhancedUrl: '/pre-processed/shipwreck.png',
    detections: [
      { id: 1, className: 'Shipwreck', confidence: 0.96, color: 'blue' },
    ],
    observability: OBSERVABILITY_METRICS_MAP['shipwreck.png'],
  },
  {
    id: 'frame-5',
    name: 'plane.jpg',
    thumbnailUrl: '/raw/plane.jpg',
    rawUrl: '/raw/plane.jpg',
    bboxUrl: '/bbox/plane.png',
    segmentationUrl: '/bbox+mask/plane.png',
    heatmapUrl: '/PatchCore/plane.png',
    preprocessedUrl: '/pre-processed/plane.png',
    shapeUrl: '/shape/plane.png',
    shadowUrl: '/shadow/plane.png',
    contextUrl: '/context/plane.png',
    patchcoreUrl: '/PatchCore/plane.png',
    enhancedUrl: '/pre-processed/plane.png',
    detections: [
      { id: 1, className: 'Plane', confidence: 0.97, color: 'blue' },
    ],
    observability: OBSERVABILITY_METRICS_MAP['plane.jpg'],
  },
  {
    id: 'frame-6',
    name: 'plane1.jpg',
    thumbnailUrl: '/raw/plane1.jpg',
    rawUrl: '/raw/plane1.jpg',
    bboxUrl: '/bbox/plane1.png',
    segmentationUrl: '/bbox+mask/plane1.png',
    heatmapUrl: '/PatchCore/plane1.jpeg',
    preprocessedUrl: '/pre-processed/plane1.png',
    shapeUrl: '/shape/plane1.png',
    shadowUrl: '/shadow/plane1.png',
    contextUrl: '/context/plane1.png',
    patchcoreUrl: '/PatchCore/plane1.jpeg',
    enhancedUrl: '/pre-processed/plane1.png',
    detections: [
      { id: 1, className: 'Plane', confidence: 0.96, color: 'blue' },
    ],
    observability: OBSERVABILITY_METRICS_MAP['plane1.jpg'],
  },
  {
    id: 'frame-7',
    name: 'crabpot.jpg',
    thumbnailUrl: '/raw/crabpot.jpg',
    rawUrl: '/raw/crabpot.jpg',
    bboxUrl: '/bbox/crabpot.png',
    segmentationUrl: '/bbox+mask/crabpot.png',
    heatmapUrl: '/PatchCore/crabpot.png',
    preprocessedUrl: '/pre-processed/crabpot.png',
    shapeUrl: '/shape/crabpot.png',
    shadowUrl: '/shadow/crabpot.png',
    contextUrl: '/context/crabpot.png',
    patchcoreUrl: '/PatchCore/crabpot.png',
    enhancedUrl: '/pre-processed/crabpot.png',
    detections: [
      { id: 1, className: 'Crab-Pot', confidence: 0.96, color: 'blue' },
      { id: 2, className: 'Crab-Pot', confidence: 0.95, color: 'blue' },
    ],
    observability: OBSERVABILITY_METRICS_MAP['crabpot.jpg'],
  },
  {
    id: 'frame-8',
    name: 'ghostnet.jpeg',
    thumbnailUrl: '/raw/ghostnet.jpeg',
    rawUrl: '/raw/ghostnet.jpeg',
    bboxUrl: '/bbox/ghostnet.png',
    segmentationUrl: '/bbox+mask/ghostnet.png',
    heatmapUrl: '/PatchCore/ghostnet.png',
    preprocessedUrl: '/pre-processed/ghostnet.png',
    shapeUrl: '/shape/ghostnet.png',
    shadowUrl: null, // Shadow is not defined for ghostnet (weight = 0)
    contextUrl: '/context/ghostnet.png',
    patchcoreUrl: '/PatchCore/ghostnet.png',
    enhancedUrl: '/pre-processed/ghostnet.png',
    detections: [
      { id: 1, className: 'Ghostnet', confidence: 0.96, color: 'blue' },
    ],
    observability: OBSERVABILITY_METRICS_MAP['ghostnet.jpeg'],
  },
  {
    id: 'frame-9',
    name: 'human.jpeg',
    thumbnailUrl: '/raw/human.jpeg',
    rawUrl: '/raw/human.jpeg',
    bboxUrl: '/unknown/human.png',
    segmentationUrl: null,
    heatmapUrl: '/PatchCore/human.png',
    preprocessedUrl: '/pre-processed/human.png',
    shapeUrl: null,
    shadowUrl: null,
    contextUrl: null,
    patchcoreUrl: '/PatchCore/human.png',
    enhancedUrl: '/pre-processed/human.png',
    detections: [
      { id: 1, className: 'Anomaly', confidence: 0.91, color: 'red', isNovel: true },
    ],
    observability: OBSERVABILITY_METRICS_MAP['human.jpeg'],
  },
  {
    id: 'frame-10',
    name: 'shipwreck3.jpeg',
    thumbnailUrl: '/raw/shipwreck3.jpeg',
    rawUrl: '/raw/shipwreck3.jpeg',
    bboxUrl: '/bbox/shipwreck3.png',
    segmentationUrl: '/bbox+mask/shipwreck3.png',
    heatmapUrl: '/PatchCore/shipwreck3.png',
    preprocessedUrl: '/pre-processed/shipwreck3.png',
    shapeUrl: '/shape/shipwreck3.png',
    shadowUrl: '/shadow/shipwreck3.png',
    contextUrl: '/context/shipwreck.png',
    patchcoreUrl: '/PatchCore/shipwreck3.png',
    enhancedUrl: '/pre-processed/shipwreck3.png',
    detections: [
      { id: 1, className: 'Shipwreck', confidence: 0.94, color: 'blue' },
    ],
    observability: OBSERVABILITY_METRICS_MAP['shipwreck3.jpeg'],
  },
  {
    id: 'frame-11',
    name: 'Artificial_Reef.png',
    thumbnailUrl: '/raw/Artificial_Reef.png',
    rawUrl: '/raw/Artificial_Reef.png',
    bboxUrl: null,
    segmentationUrl: null,
    heatmapUrl: null,
    preprocessedUrl: '/pre-processed/Artificial_Reef.png',
    shapeUrl: null,
    shadowUrl: null,
    contextUrl: null,
    patchcoreUrl: null,
    enhancedUrl: '/pre-processed/Artificial_Reef.png',
    detections: [],
    observability: OBSERVABILITY_METRICS_MAP['artificial_reef.png'],
  },
  {
    id: 'frame-12',
    name: 'seabed.png',
    thumbnailUrl: '/raw/seabed.png',
    rawUrl: '/raw/seabed.png',
    bboxUrl: null,
    segmentationUrl: null,
    heatmapUrl: null,
    preprocessedUrl: '/pre-processed/seabed.png',
    shapeUrl: null,
    shadowUrl: null,
    contextUrl: null,
    patchcoreUrl: null,
    enhancedUrl: '/pre-processed/seabed.png',
    detections: [],
    observability: OBSERVABILITY_METRICS_MAP['seabed.png'],
  },
  {
    id: 'frame-13',
    name: 'seabed1.jpg',
    thumbnailUrl: '/raw/seabed1.jpg',
    rawUrl: '/raw/seabed1.jpg',
    bboxUrl: null,
    segmentationUrl: null,
    heatmapUrl: null,
    preprocessedUrl: '/pre-processed/seabed1.png',
    shapeUrl: null,
    shadowUrl: null,
    contextUrl: null,
    patchcoreUrl: null,
    enhancedUrl: '/pre-processed/seabed1.png',
    detections: [],
    observability: OBSERVABILITY_METRICS_MAP['seabed1.jpg'],
  },
  {
    id: 'frame-14',
    name: 'seabed3.png',
    thumbnailUrl: '/raw/seabed3.png',
    rawUrl: '/raw/seabed3.png',
    bboxUrl: null,
    segmentationUrl: null,
    heatmapUrl: null,
    preprocessedUrl: '/pre-processed/seabed3.png',
    shapeUrl: null,
    shadowUrl: null,
    contextUrl: null,
    patchcoreUrl: null,
    enhancedUrl: '/pre-processed/seabed3.png',
    detections: [],
    observability: OBSERVABILITY_METRICS_MAP['seabed3.png'],
  },
  {
    id: 'frame-15',
    name: 'seabed4.png',
    thumbnailUrl: '/raw/seabed4.png',
    rawUrl: '/raw/seabed4.png',
    bboxUrl: null,
    segmentationUrl: null,
    heatmapUrl: null,
    preprocessedUrl: '/pre-processed/seabed4.png',
    shapeUrl: null,
    shadowUrl: null,
    contextUrl: null,
    patchcoreUrl: null,
    enhancedUrl: '/pre-processed/seabed4.png',
    detections: [],
    observability: OBSERVABILITY_METRICS_MAP['seabed4.png'],
  },
];

export const DEFAULT_SONAR_ANALYSIS_ASSETS = ALL_SONAR_ANALYSIS_ASSETS;

export function resolveSonarAsset(fileName: string, index: number, originalUploadedUrl?: string): SonarAnalysisAsset {
  const cleanName = fileName.toLowerCase().trim();

  // Find exact or stem match in authentic asset catalogue
  const match = ALL_SONAR_ANALYSIS_ASSETS.find((asset) => {
    const assetStem = asset.name.toLowerCase().split('.')[0].replace(/[-_]/g, '');
    const targetStem = cleanName.split('.')[0].replace(/[-_]/g, '');
    return (
      asset.name.toLowerCase() === cleanName ||
      targetStem === assetStem ||
      (targetStem.length >= 4 && assetStem.includes(targetStem)) ||
      (assetStem.length >= 4 && targetStem.includes(assetStem))
    );
  });

  const obs = OBSERVABILITY_METRICS_MAP[cleanName] ||
    (match ? match.observability : undefined) || {
      imageId: index + 1,
      usableAreaPercent: 88.0,
      nadirGapPercent: 4.5,
      weakSignalPercent: 5.0,
      acousticShadowPercent: 2.5,
      qualityTier: 'HIGH',
      snrDb: 22.0,
      surveyReliabilityScore: 88,
      notes: 'Standard hydrographic acoustic scan; baseline backscatter profile.',
    };

  if (match) {
    return {
      ...match,
      id: `asset-${index}`,
      name: fileName,
      rawUrl: originalUploadedUrl || match.rawUrl,
      thumbnailUrl: originalUploadedUrl || match.rawUrl,
      observability: obs,
    };
  }

  // Fallback for unrecognised files
  return {
    id: `asset-${index}`,
    name: fileName,
    rawUrl: originalUploadedUrl || '/raw/pipe.jpeg',
    thumbnailUrl: originalUploadedUrl || '/raw/pipe.jpeg',
    bboxUrl: null,
    segmentationUrl: null,
    heatmapUrl: null,
    preprocessedUrl: null,
    shapeUrl: null,
    shadowUrl: null,
    contextUrl: null,
    patchcoreUrl: null,
    enhancedUrl: null,
    detections: [],
    observability: obs,
  };
}
