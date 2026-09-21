export interface DetectionItem {
  id: number;
  className: string;
  confidence: number;
  color: 'blue' | 'red' | 'green' | 'amber';
  isNovel?: boolean;
}

export interface SonarAnalysisAsset {
  id: string;
  name: string;
  thumbnailUrl: string; // Strictly the raw unannotated image
  rawUrl: string;       // Clean raw image
  bboxUrl: string | null; // Authentic bbox file
  segmentationUrl: string | null; // Segmentation mask
  heatmapUrl: string | null; // Heatmap / PatchCore activation
  preprocessedUrl?: string | null; // Pre-processed grayscale acoustic scan
  shapeUrl?: string | null; // Shape highlight contour mask
  shadowUrl?: string | null; // Acoustic shadow contour mask
  patchcoreUrl?: string | null; // PatchCore anomaly heatmap
  enhancedUrl: string | null;
  detections: DetectionItem[];
}

export const ALL_SONAR_ANALYSIS_ASSETS: SonarAnalysisAsset[] = [
  {
    id: 'frame-1',
    name: 'pipe.jpeg',
    thumbnailUrl: '/raw/pipe.jpeg',
    rawUrl: '/raw/pipe.jpeg',
    bboxUrl: '/bbox/pipe.png',
    segmentationUrl: '/shape/pipe.png',
    heatmapUrl: '/PatchCore/pipe.png',
    preprocessedUrl: '/pre-processed/pipe.png',
    shapeUrl: '/shape/pipe.png',
    shadowUrl: '/shadow/pipe.png',
    patchcoreUrl: '/PatchCore/pipe.png',
    enhancedUrl: '/pre-processed/pipe.png',
    detections: [
      { id: 1, className: 'pipe', confidence: 0.96, color: 'blue' },
    ],
  },
  {
    id: 'frame-2',
    name: 'pipe1.jpeg',
    thumbnailUrl: '/raw/pipe1.jpeg',
    rawUrl: '/raw/pipe1.jpeg',
    bboxUrl: '/bbox/pipe1.png',
    segmentationUrl: '/shape/pipe1.png',
    heatmapUrl: '/PatchCore/pipe1.png',
    preprocessedUrl: '/pre-processed/pipe1.png',
    shapeUrl: '/shape/pipe1.png',
    shadowUrl: null,
    patchcoreUrl: '/PatchCore/pipe1.png',
    enhancedUrl: '/pre-processed/pipe1.png',
    detections: [
      { id: 1, className: 'Pipe', confidence: 0.95, color: 'blue' },
    ],
  },
  {
    id: 'frame-3',
    name: 'shipwreck2.png',
    thumbnailUrl: '/raw/shipwreck2.png',
    rawUrl: '/raw/shipwreck2.png',
    bboxUrl: '/bbox/shipwreck2.png',
    segmentationUrl: '/shape/shipwreck2.png',
    heatmapUrl: '/PatchCore/shipwreck2.png',
    preprocessedUrl: '/pre-processed/shipwreck2.png',
    shapeUrl: '/shape/shipwreck2.png',
    shadowUrl: null,
    patchcoreUrl: '/PatchCore/shipwreck2.png',
    enhancedUrl: '/pre-processed/shipwreck2.png',
    detections: [
      { id: 1, className: 'ship', confidence: 0.97, color: 'blue' },
    ],
  },
  {
    id: 'frame-4',
    name: 'shipwreck.png',
    thumbnailUrl: '/raw/shipwreck.png',
    rawUrl: '/raw/shipwreck.png',
    bboxUrl: '/bbox/shipwreck.png',
    segmentationUrl: '/shape/shipwreck.png',
    heatmapUrl: '/PatchCore/shipwreck.png',
    preprocessedUrl: '/pre-processed/shipwreck.png',
    shapeUrl: '/shape/shipwreck.png',
    shadowUrl: null,
    patchcoreUrl: '/PatchCore/shipwreck.png',
    enhancedUrl: '/pre-processed/shipwreck.png',
    detections: [
      { id: 1, className: 'shipwreck', confidence: 0.96, color: 'blue' },
    ],
  },
  {
    id: 'frame-5',
    name: 'plane.jpg',
    thumbnailUrl: '/raw/plane.jpg',
    rawUrl: '/raw/plane.jpg',
    bboxUrl: '/bbox/plane.png',
    segmentationUrl: '/shape/plane.png',
    heatmapUrl: '/PatchCore/plane.png',
    preprocessedUrl: '/pre-processed/plane.png',
    shapeUrl: '/shape/plane.png',
    shadowUrl: null,
    patchcoreUrl: '/PatchCore/plane.png',
    enhancedUrl: '/pre-processed/plane.png',
    detections: [
      { id: 1, className: 'plane', confidence: 0.97, color: 'blue' },
    ],
  },
  {
    id: 'frame-6',
    name: 'plane1.jpg',
    thumbnailUrl: '/raw/plane1.jpg',
    rawUrl: '/raw/plane1.jpg',
    bboxUrl: '/bbox/plane1.png',
    segmentationUrl: '/shape/plane1.png',
    heatmapUrl: '/PatchCore/plane.png',
    preprocessedUrl: '/pre-processed/plane1.png',
    shapeUrl: '/shape/plane1.png',
    shadowUrl: null,
    patchcoreUrl: '/PatchCore/plane.png',
    enhancedUrl: '/pre-processed/plane1.png',
    detections: [
      { id: 1, className: 'Plane', confidence: 0.97, color: 'blue' },
    ],
  },
  {
    id: 'frame-7',
    name: 'crab_pot.jpg',
    thumbnailUrl: '/raw/crab_pot.jpg',
    rawUrl: '/raw/crab_pot.jpg',
    bboxUrl: '/bbox/crab-pot1.png',
    segmentationUrl: '/shape/crab-pot.png',
    heatmapUrl: '/PatchCore/crab_pot.png',
    preprocessedUrl: '/pre-processed/crab-pot1.png',
    shapeUrl: '/shape/crab-pot.png',
    shadowUrl: null,
    patchcoreUrl: '/PatchCore/crab_pot.png',
    enhancedUrl: '/pre-processed/crab-pot1.png',
    detections: [
      { id: 1, className: 'Crab-Pot', confidence: 0.95, color: 'blue' },
      { id: 2, className: 'Crab-Pot', confidence: 0.95, color: 'blue' },
      { id: 3, className: 'Crab-Pot', confidence: 0.95, color: 'blue' },
    ],
  },
  {
    id: 'frame-8',
    name: 'crab_pot1.jpg',
    thumbnailUrl: '/raw/crab_pot1.jpg',
    rawUrl: '/raw/crab_pot1.jpg',
    bboxUrl: '/bbox/crab-pot1.png',
    segmentationUrl: '/shape/crab-pot1.png',
    heatmapUrl: '/PatchCore/crab_pot1.png',
    preprocessedUrl: '/pre-processed/crab-pot1.png',
    shapeUrl: '/shape/crab-pot1.png',
    shadowUrl: null,
    patchcoreUrl: '/PatchCore/crab_pot1.png',
    enhancedUrl: '/pre-processed/crab-pot1.png',
    detections: [
      { id: 1, className: 'Crab-Pot', confidence: 0.96, color: 'blue' },
      { id: 2, className: 'Crab-Pot', confidence: 0.96, color: 'blue' },
    ],
  },
  {
    id: 'frame-9',
    name: 'ghostnet.jpeg',
    thumbnailUrl: '/raw/ghostnet.jpeg',
    rawUrl: '/raw/ghostnet.jpeg',
    bboxUrl: '/bbox/ghost-net.png',
    segmentationUrl: '/shape/ghost-net.png',
    heatmapUrl: '/PatchCore/ghostnet.png',
    preprocessedUrl: '/pre-processed/ghost-net.png',
    shapeUrl: '/shape/ghost-net.png',
    shadowUrl: null,
    patchcoreUrl: '/PatchCore/ghostnet.png',
    enhancedUrl: '/pre-processed/ghost-net.png',
    detections: [
      { id: 1, className: 'ghostnet', confidence: 0.96, color: 'blue' },
    ],
  },
  {
    id: 'frame-10',
    name: 'human.jpeg',
    thumbnailUrl: '/raw/human.jpeg',
    rawUrl: '/raw/human.jpeg',
    bboxUrl: '/unknown/human.png',
    segmentationUrl: null,
    heatmapUrl: '/PatchCore/human.png',
    preprocessedUrl: '/unknown/human.png',
    shapeUrl: null,
    shadowUrl: null,
    patchcoreUrl: '/PatchCore/human.png',
    enhancedUrl: '/unknown/human.png',
    detections: [
      { id: 1, className: 'Anomaly', confidence: 0.91, color: 'red', isNovel: true },
    ],
  },
  {
    id: 'frame-11',
    name: 'shipwreck3.jpeg',
    thumbnailUrl: '/raw/shipwreck3.jpeg',
    rawUrl: '/raw/shipwreck3.jpeg',
    bboxUrl: '/bbox/shipwreck3.png',
    segmentationUrl: '/shape/shipwreck1.png',
    heatmapUrl: '/PatchCore/shipwreck.png',
    preprocessedUrl: '/pre-processed/shipwreck3.png',
    shapeUrl: '/shape/shipwreck1.png',
    shadowUrl: null,
    patchcoreUrl: '/PatchCore/shipwreck.png',
    enhancedUrl: '/pre-processed/shipwreck3.png',
    detections: [
      { id: 1, className: 'shipwreck', confidence: 0.94, color: 'blue' },
    ],
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

  if (match) {
    return {
      ...match,
      id: `asset-${index}`,
      name: fileName,
      rawUrl: originalUploadedUrl || match.rawUrl,
      thumbnailUrl: originalUploadedUrl || match.rawUrl,
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
    patchcoreUrl: null,
    enhancedUrl: null,
    detections: [],
  };
}
