import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Center, ContactShadows, Environment } from '@react-three/drei';
import { HexapodConfiguration, Point3D, LegConfiguration } from '../types';
import * as THREE from 'three';

interface Props {
  config: HexapodConfiguration;
}

// --- Helpers ---
const toVec3 = (p: Point3D): [number, number, number] => [p.x, p.z, -p.y]; 

const Strut = ({ start, end, width = 4, height = 4, color = "#94a3b8" }: { start: Point3D; end: Point3D; width?: number; height?: number; color?: string }) => {
  const s = new THREE.Vector3(...toVec3(start));
  const e = new THREE.Vector3(...toVec3(end));
  const dist = s.distanceTo(e);
  const mid = new THREE.Vector3().addVectors(s, e).multiplyScalar(0.5);
  
  const quaternion = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const dir = new THREE.Vector3().subVectors(e, s).normalize();
  quaternion.setFromUnitVectors(up, dir);

  return (
    <mesh position={mid} quaternion={quaternion}>
      <boxGeometry args={[width, dist, height]} />
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.6} />
    </mesh>
  );
};

// --- Component Parts ---

// A block representing a Servo Motor (e.g., MG996R)
const Servo = ({ position, rotationAxis = 'y', scale = 1 }: { position: Point3D; rotationAxis?: 'x' | 'y' | 'z'; scale?: number }) => {
  const dims = [15 * scale, 30 * scale, 30 * scale] as [number, number, number]; 
  
  return (
    <group position={toVec3(position)}>
        {/* Main Servo Body - Black Plastic */}
        <mesh castShadow receiveShadow>
            <boxGeometry args={dims} />
            <meshStandardMaterial color="#1f2937" roughness={0.7} metalness={0.1} />
        </mesh>
        {/* Label on Servo */}
        <mesh position={[0, 0, dims[2]/2 + 0.1]}>
             <planeGeometry args={[10 * scale, 15 * scale]} />
             <meshStandardMaterial color="#374151" />
        </mesh>
        {/* Servo Horn/Shaft (Silver) */}
        <mesh position={[0, dims[1]/2, 0]}>
             <cylinderGeometry args={[4 * scale, 4 * scale, 2 * scale, 16]} />
             <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
        </mesh>
    </group>
  );
};

// The Body Chassis: Two hexagonal plates
const Chassis = ({ corners }: { corners: Point3D[] }) => {
  const centroid = useMemo(() => {
      const c = { x: 0, y: 0, z: 0 };
      corners.forEach(p => { c.x += p.x; c.y += p.y; c.z += p.z });
      return { x: c.x / corners.length, y: c.y / corners.length, z: c.z / corners.length };
  }, [corners]);

  return (
    <group>
        {/* Central Hub / Electronics Box */}
        <mesh position={toVec3(centroid)} castShadow receiveShadow>
            <cylinderGeometry args={[35, 35, 12, 6]} />
            <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.5} />
        </mesh>

        {/* Top and Bottom Plates frame */}
        {corners.map((p, i) => {
            const next = corners[(i + 1) % corners.length];
            return (
                <React.Fragment key={i}>
                    {/* Perimeter */}
                    <Strut start={p} end={next} width={8} height={2} color="#0f172a" />
                    {/* Spoke to Center */}
                    <Strut start={centroid} end={p} width={10} height={2} color="#1e293b" />
                </React.Fragment>
            )
        })}
        
        {/* Decorative "Bolts" at corners (Brass/Gold look) */}
        {corners.map((p, i) => (
             <mesh key={`bolt-${i}`} position={toVec3(p)}>
                <cylinderGeometry args={[2.5, 2.5, 5, 8]} />
                <meshStandardMaterial color="#f59e0b" metalness={1} roughness={0.3} />
             </mesh>
        ))}
    </group>
  );
};

const LegAssembly: React.FC<{ leg: LegConfiguration }> = ({ leg }) => {
    // Silver Brackets + Black Servos
    const bracketColor = "#cbd5e1"; // Light Silver

    return (
        <group>
            {/* --- Coxa Joint --- */}
            <Servo position={leg.joints.bodyContact} scale={1} />
            <Strut start={leg.joints.bodyContact} end={leg.joints.coxa} width={12} height={6} color="#0f172a" />

            {/* --- Femur Joint --- */}
            <Servo position={leg.joints.coxa} scale={1} />
            
            {/* Femur Segment - Industrial C-Bracket style */}
            <Strut start={leg.joints.coxa} end={leg.joints.femur} width={6} height={14} color={bracketColor} />
             {/* Decorative 'cutout' */}
             <Strut start={leg.joints.coxa} end={leg.joints.femur} width={2} height={15} color="#475569" />

            {/* --- Tibia Joint --- */}
            <Servo position={leg.joints.femur} scale={1} />

            {/* Tibia Segment - Tapered Point */}
            {(() => {
                const start = new THREE.Vector3(...toVec3(leg.joints.femur));
                const end = new THREE.Vector3(...toVec3(leg.joints.foot));
                const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
                const len = start.distanceTo(end);
                const quaternion = new THREE.Quaternion().setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0), 
                    new THREE.Vector3().subVectors(end, start).normalize()
                );
                
                return (
                    <group>
                        {/* Main Shin Rod */}
                        <mesh position={mid} quaternion={quaternion} castShadow>
                            <cylinderGeometry args={[3, 6, len, 8]} />
                            <meshStandardMaterial color={bracketColor} metalness={0.6} roughness={0.4} />
                        </mesh>
                        {/* Rubber Foot - Red */}
                        <mesh position={toVec3(leg.joints.foot)}>
                            <sphereGeometry args={[5, 16, 16]} />
                            <meshStandardMaterial color="#dc2626" roughness={0.9} />
                        </mesh>
                    </group>
                );
            })()}
        </group>
    );
}

export const Hexapod3D: React.FC<Props> = ({ config }) => {
  return (
    <div className="w-full h-full bg-slate-100 relative overflow-hidden shadow-inner">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={[350, 250, 350]} fov={35} />
        <OrbitControls 
            makeDefault 
            minPolarAngle={0} 
            maxPolarAngle={Math.PI / 2 - 0.05} 
            enablePan={true}
            target={[0, 0, 0]}
        />
        
        {/* Lighting: Clean Studio setup */}
        <ambientLight intensity={0.7} color="#ffffff" />
        <directionalLight 
            position={[150, 300, 150]} 
            intensity={1.8} 
            castShadow 
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
            color="#ffffff"
        />
        <directionalLight position={[-200, 100, -200]} intensity={0.5} color="#bfdbfe" />

        {/* Environment Floor */}
        <Grid 
            args={[2000, 2000]} 
            cellSize={50} 
            cellThickness={0.5} 
            cellColor="#cbd5e1" 
            sectionSize={200} 
            sectionThickness={1}
            sectionColor="#94a3b8"
            fadeDistance={1200}
            infiniteGrid
            position={[0, -0.1, 0]}
        />
        <ContactShadows resolution={1024} scale={500} blur={2.5} opacity={0.4} far={50} color="#0f172a" />
        
        {/* Robot Assembly */}
        <group>
           <Chassis corners={config.bodyCorners} />
           
           {config.legs.map((leg) => (
               <LegAssembly key={leg.legId} leg={leg} />
           ))}
        </group>

      </Canvas>
      
      {/* Viewport Overlay */}
      <div className="absolute top-4 left-4 pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-200 text-slate-500 text-[10px] font-mono shadow-sm">
              <span className="text-blue-600 font-bold">VIEW:</span> LMB Rotate • RMB Pan • Scroll Zoom
          </div>
      </div>
    </div>
  );
};