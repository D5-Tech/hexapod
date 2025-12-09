import React from 'react';
import { HexapodConfiguration } from '../types';

interface Props {
  config: HexapodConfiguration;
}

const LEG_NAMES = ["Right Middle", "Right Front", "Left Front", "Left Middle", "Left Back", "Right Back"];

export const DataPanel: React.FC<Props> = ({ config }) => {
  return (
    <div className="w-full h-full p-4 overflow-y-auto custom-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {config.legs.map((leg) => (
          <div key={leg.legId} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                    {LEG_NAMES[leg.legId] || `Leg ${leg.legId}`}
                </span>
                <span className="text-[9px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">ID:{leg.legId}</span>
            </div>
            
            <div className="space-y-3">
                {/* Coxa */}
                <div>
                   <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">Coxa</span>
                        <span className="text-xs font-mono font-bold text-blue-600">{leg.coxaAngle.toFixed(1)}°</span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, (leg.coxaAngle + 90) / 1.8))}%` }}></div>
                   </div>
                </div>

                {/* Femur */}
                <div>
                   <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">Femur</span>
                        <span className="text-xs font-mono font-bold text-indigo-600">{leg.femurAngle.toFixed(1)}°</span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, (leg.femurAngle + 90) / 1.8))}%` }}></div>
                   </div>
                </div>

                {/* Tibia */}
                <div>
                   <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">Tibia</span>
                        <span className="text-xs font-mono font-bold text-violet-600">{leg.tibiaAngle.toFixed(1)}°</span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, (leg.tibiaAngle + 180) / 3.6))}%` }}></div>
                   </div>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};