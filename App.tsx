import React, { useState, useMemo } from 'react';
import { Hexapod3D } from './components/Hexapod3D';
import { Controls } from './components/Controls';
import { DataPanel } from './components/DataPanel';
import { HexapodDimensions, BodyPose } from './types';
import { solveHexapodIK } from './utils/hexapodLogic';

// Constants
const DEFAULT_DIMENSIONS: HexapodDimensions = {
  front: 100,
  side: 100,
  middle: 100,
  coxa: 50,
  femur: 100,
  tibia: 120,
};

const DEFAULT_POSE: BodyPose = {
  tx: 0,
  ty: 0,
  tz: 80, // Initial height off ground
  rx: 0,
  ry: 0,
  rz: 0,
};

const DEVELOPER_NAME = "My Name";

export default function App() {
  const [dimensions, setDimensions] = useState<HexapodDimensions>(DEFAULT_DIMENSIONS);
  const [pose, setPose] = useState<BodyPose>(DEFAULT_POSE);
  const [isDataPanelOpen, setIsDataPanelOpen] = useState(true);

  // Memoize IK Calculation
  const hexapodConfig = useMemo(() => {
    return solveHexapodIK(dimensions, pose);
  }, [dimensions, pose]);

  const handleDimensionChange = (key: keyof HexapodDimensions, value: number) => {
    setDimensions((prev) => ({ ...prev, [key]: value }));
  };

  const handlePoseChange = (key: keyof BodyPose, value: number) => {
    setPose((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => {
    setDimensions(DEFAULT_DIMENSIONS);
    setPose(DEFAULT_POSE);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Header */}
      <header className="flex-none h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-30 shadow-sm">
        <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 bg-blue-600 rounded-lg shadow-sm">
                 <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                 </svg>
            </div>
            <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-800 leading-tight">
                  HEXAPOD<span className="text-blue-600">SIM</span>
                </h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Inverse Kinematics</p>
            </div>
        </div>
        <div className="text-xs text-slate-500 font-medium hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            System Ready
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Left: 3D View Area */}
        <div className="flex-1 flex flex-col relative order-1 md:order-1 h-[55vh] md:h-auto bg-slate-100">
            <div className="flex-1 relative overflow-hidden">
                <Hexapod3D config={hexapodConfig} />
            </div>
            
            {/* Data Panel */}
            <div className={`flex-none bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out ${isDataPanelOpen ? 'h-56' : 'h-10'} overflow-hidden flex flex-col z-10`}>
               <div 
                 className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                 onClick={() => setIsDataPanelOpen(!isDataPanelOpen)}
               >
                  <div className="flex items-center gap-2">
                      <span className={`p-1 rounded-md bg-white border border-slate-200 shadow-sm text-slate-500 transition-transform duration-300 ${isDataPanelOpen ? 'rotate-180' : ''}`}>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      </span>
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Servo Telemetry</span>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">LIVE</span>
               </div>
               <div className="flex-1 overflow-auto bg-slate-50/50">
                 <DataPanel config={hexapodConfig} />
               </div>
            </div>
        </div>

        {/* Right: Controls Sidebar */}
        <div className="w-full md:w-[400px] flex-none bg-white border-l border-slate-200 z-20 shadow-xl overflow-y-auto order-2 md:order-2 h-[45vh] md:h-full">
          <Controls 
            dimensions={dimensions} 
            pose={pose} 
            onDimensionChange={handleDimensionChange}
            onPoseChange={handlePoseChange}
            reset={reset}
          />
        </div>

      </div>
    </div>
  );
}