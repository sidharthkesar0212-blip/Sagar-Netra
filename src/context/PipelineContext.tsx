import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface PipelineStageInfo {
  id: number;
  name: string;
  shortCode: string;
  description: string;
  durationMs: number;
  outputKey: string;
  routePath: string;
}

export const PIPELINE_STAGES: PipelineStageInfo[] = [
  {
    id: 1,
    name: 'Acoustic Swath Ingestion & Georeferencing',
    shortCode: 'INGESTION',
    description: 'Parsing dual-frequency ping packets, water column clearance & GPS navigation interpolation',
    durationMs: 1100,
    outputKey: '15 acoustic frames validated • EdgeTech 4200 (455/900 kHz)',
    routePath: '/survey-ingestion',
  },
  {
    id: 2,
    name: 'Dual-Waterfall Contrast & PatchCore Anomaly Segmentation',
    shortCode: 'SEGMENTATION',
    description: 'Running CLAHE normalization, deep patch memory bank & candidate mask generation',
    durationMs: 1300,
    outputKey: '12 candidate anomaly activations extracted',
    routePath: '/sonar-analysis',
  },
  {
    id: 3,
    name: 'Multi-Modal Physical Evidence Fusion',
    shortCode: 'EVIDENCE_FUSION',
    description: 'Correlating acoustic shadow geometry, shape regularity & seabed context divergence',
    durationMs: 1200,
    outputKey: 'Shadow (88.5%) • Shape (91.9%) • Context (88.8%) computed',
    routePath: '/evidence-intelligence',
  },
  {
    id: 4,
    name: 'Human-in-the-Loop Quality Assurance Queue',
    shortCode: 'HUMAN_REVIEW',
    description: 'Evaluating confidence thresholds and routing high-priority anomalies to expert queue',
    durationMs: 1000,
    outputKey: '12 targets verified • 6 high-priority contacts flagged',
    routePath: '/human-review',
  },
  {
    id: 5,
    name: 'DBSCAN Spatial Hotspot Clustering & Georeferencing',
    shortCode: 'HOTSPOTS',
    description: 'Running density-based spatial clustering (ε = 450m, MinPts = 2) & risk ranking',
    durationMs: 1100,
    outputKey: '4 Hotspot clusters identified (H-1 to H-4) • P1-High Urgency',
    routePath: '/debris-hotspots',
  },
  {
    id: 6,
    name: 'Mission Intelligence Synthesis & GIS Export Dossier',
    shortCode: 'REPORTS_GIS',
    description: 'Synthesizing Survey Reliability Index (89/100), GeoJSON packages & 2-page print dossier',
    durationMs: 900,
    outputKey: 'Survey Reliability Index: 89/100 • IHO S-44 Compliant',
    routePath: '/reports',
  },
];

export interface LogMessage {
  id: string;
  timestamp: string;
  stage: string;
  text: string;
  type: 'info' | 'success' | 'process' | 'warn';
}

interface PipelineContextType {
  pipelineState: 'idle' | 'running' | 'completed';
  currentStageIndex: number;
  progressPercent: number;
  logs: LogMessage[];
  isDatasetLoaded: boolean;
  isModalOpen: boolean;
  ingestedFrames: any[];
  setIngestedFrames: React.Dispatch<React.SetStateAction<any[]>>;
  ingestedMetadata: any | null;
  setIngestedMetadata: React.Dispatch<React.SetStateAction<any | null>>;
  setIsModalOpen: (open: boolean) => void;
  setIsDatasetLoaded: (loaded: boolean) => void;
  startPipeline: () => void;
  skipPipeline: () => void;
  resetPipeline: () => void;
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

export const PipelineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always start in fresh idle state so data is NOT pre-ingested on page open/refresh
  const [pipelineState, setPipelineState] = useState<'idle' | 'running' | 'completed'>('idle');
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isDatasetLoaded, setIsDatasetLoaded] = useState<boolean>(false);
  const [ingestedFrames, setIngestedFrames] = useState<any[]>([]);
  const [ingestedMetadata, setIngestedMetadata] = useState<any | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogMessage[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((stage: string, text: string, type: 'info' | 'success' | 'process' | 'warn' = 'info') => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0')}`;
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: timeStr,
        stage,
        text,
        type,
      },
    ]);
  }, []);

  // Run pipeline simulation sequence
  const startPipeline = useCallback(() => {
    setPipelineState('running');
    setIsModalOpen(true);
    setCurrentStageIndex(0);
    setProgressPercent(0);
    setLogs([]);

    addLog('SYSTEM', 'Autonomous Marine Survey Pipeline initialized for Sector 4B.', 'info');
    addLog('INPUT_FILE', 'Reading raw sonar telemetry stream from Input_File/ (15 frames)...', 'process');

    let currentStage = 0;
    let currentProgress = 0;
    const totalStages = PIPELINE_STAGES.length;

    // Timer tick every 100ms
    const stepInterval = 100;
    const totalDuration = PIPELINE_STAGES.reduce((sum, s) => sum + s.durationMs, 0);
    const progressPerTick = (100 / (totalDuration / stepInterval));

    let elapsed = 0;
    let stageStartTime = 0;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      elapsed += stepInterval;
      currentProgress = Math.min(99, currentProgress + progressPerTick);
      setProgressPercent(Math.round(currentProgress));

      const stageDef = PIPELINE_STAGES[currentStage];
      const stageElapsed = elapsed - stageStartTime;

      // When current stage finishes
      if (stageElapsed >= stageDef.durationMs) {
        addLog(stageDef.shortCode, `Stage complete: ${stageDef.outputKey}`, 'success');

        if (currentStage < totalStages - 1) {
          currentStage += 1;
          setCurrentStageIndex(currentStage);
          stageStartTime = elapsed;
          const nextStage = PIPELINE_STAGES[currentStage];
          addLog(nextStage.shortCode, `Executing: ${nextStage.description}...`, 'process');
        } else {
          // All stages complete!
          if (intervalRef.current) clearInterval(intervalRef.current);
          setProgressPercent(100);
          setPipelineState('completed');
          setIsDatasetLoaded(true);
          localStorage.setItem('sagar_pipeline_state', 'completed');
          localStorage.setItem('sagar_pipeline_stage', '6');
          localStorage.setItem('sagar_dataset_loaded', 'true');
          addLog('MISSION', 'Pipeline synthesis complete. All 6 analysis layers unlocked and operational.', 'success');
        }
      }
    }, stepInterval);
  }, [addLog]);

  // Fast-forward skip
  const skipPipeline = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgressPercent(100);
    setCurrentStageIndex(PIPELINE_STAGES.length - 1);
    setPipelineState('completed');
    setIsDatasetLoaded(true);
    localStorage.setItem('sagar_pipeline_state', 'completed');
    localStorage.setItem('sagar_pipeline_stage', '6');
    localStorage.setItem('sagar_dataset_loaded', 'true');
    addLog('FAST_FORWARD', 'Analysis simulation fast-forwarded to completion. All outputs active.', 'success');
  }, [addLog]);

  // Reset pipeline back to start
  const resetPipeline = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPipelineState('idle');
    setCurrentStageIndex(0);
    setProgressPercent(0);
    setIsModalOpen(false);
    setIsDatasetLoaded(false);
    setIngestedFrames([]);
    setIngestedMetadata(null);
    setLogs([]);
    localStorage.removeItem('sagar_pipeline_state');
    localStorage.removeItem('sagar_pipeline_stage');
    localStorage.removeItem('sagar_sonar_images_list');
    localStorage.removeItem('sagar_active_survey');
    localStorage.removeItem('sagar_dataset_loaded');
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <PipelineContext.Provider
      value={{
        pipelineState,
        currentStageIndex,
        progressPercent,
        logs,
        isDatasetLoaded,
        isModalOpen,
        ingestedFrames,
        setIngestedFrames,
        ingestedMetadata,
        setIngestedMetadata,
        setIsModalOpen,
        setIsDatasetLoaded,
        startPipeline,
        skipPipeline,
        resetPipeline,
      }}
    >
      {children}
    </PipelineContext.Provider>
  );
};

export const usePipeline = (): PipelineContextType => {
  const context = useContext(PipelineContext);
  if (!context) {
    throw new Error('usePipeline must be used within a PipelineProvider');
  }
  return context;
};
