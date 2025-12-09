import React from 'react';
import { HexapodDimensions, BodyPose } from '../types';

interface ControlsProps {
  dimensions: HexapodDimensions;
  pose: BodyPose;
  onDimensionChange: (key: keyof HexapodDimensions, value: number) => void;
  onPoseChange: (key: keyof BodyPose, value: number) => void;
  reset: () => void;
}

const Slider = ({
  label,
  value,
  min,
  max,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  step?: number;
}) => (
  <div className="group mb-4 last:mb-0">
    <div className="flex justify-between items-center mb-1.5">
      <label className="text-xs font-semibold text-slate-600 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
        {label}
      </label>
      <div className="w-12 text-right">
          <span className="text-xs font-mono font-medium text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
            {value.toFixed(0)}
          </span>
      </div>
    </div>
    <div className="relative h-4 w-full flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
    </div>
  </div>
);

const Section = ({ title, icon, children }: { title: string, icon?: React.ReactNode, children?: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            {icon && <span className="text-blue-500">{icon}</span>}
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                {title}
            </h3>
        </div>
        <div className="space-y-1">
            {children}
        </div>
    </div>
);

export const Controls: React.FC<ControlsProps> = ({
  dimensions,
  pose,
  onDimensionChange,
  onPoseChange,
  reset,
}) => {
  return (
    <div className="p-6 space-y-6 pb-20 bg-slate-50 min-h-full">
      
      <div className="flex justify-between items-end mb-2">
        <div>
            <h2 className="text-xl font-bold text-slate-800">Control Panel</h2>
            <p className="text-xs text-slate-500 font-medium">Configure robot parameters</p>
        </div>
        <button
          onClick={reset}
          className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 hover:text-blue-600 active:scale-95 transition-all flex items-center gap-2"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          RESET
        </button>
      </div>

      <Section 
        title="Physical Dimensions" 
        icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        }
      >
        <div className="grid grid-cols-1 gap-2">
            <Slider label="Body: Front Width" value={dimensions.front} min={50} max={150} onChange={(v) => onDimensionChange('front', v)} />
            <Slider label="Body: Side Width" value={dimensions.side} min={50} max={150} onChange={(v) => onDimensionChange('side', v)} />
            <Slider label="Body: Middle Width" value={dimensions.middle} min={50} max={150} onChange={(v) => onDimensionChange('middle', v)} />
            <div className="my-3 border-t border-slate-100"></div>
            <Slider label="Leg: Coxa" value={dimensions.coxa} min={20} max={100} onChange={(v) => onDimensionChange('coxa', v)} />
            <Slider label="Leg: Femur" value={dimensions.femur} min={20} max={150} onChange={(v) => onDimensionChange('femur', v)} />
            <Slider label="Leg: Tibia" value={dimensions.tibia} min={20} max={150} onChange={(v) => onDimensionChange('tibia', v)} />
        </div>
      </Section>

      <Section 
        title="Body Posture (IK)"
        icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        }
      >
          <div className="mb-4">
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Translation</div>
             <Slider label="X Position" value={pose.tx} min={-100} max={100} onChange={(v) => onPoseChange('tx', v)} />
             <Slider label="Y Position" value={pose.ty} min={-100} max={100} onChange={(v) => onPoseChange('ty', v)} />
             <Slider label="Height (Z)" value={pose.tz} min={-50} max={150} onChange={(v) => onPoseChange('tz', v)} />
          </div>
          
          <div className="border-t border-slate-100 my-4"></div>

          <div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Rotation</div>
             <Slider label="Roll (X)" value={pose.rx} min={-30} max={30} onChange={(v) => onPoseChange('rx', v)} />
             <Slider label="Pitch (Y)" value={pose.ry} min={-30} max={30} onChange={(v) => onPoseChange('ry', v)} />
             <Slider label="Yaw (Z)" value={pose.rz} min={-45} max={45} onChange={(v) => onPoseChange('rz', v)} />
          </div>
      </Section>

    </div>
  );
};