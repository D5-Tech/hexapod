import { HexapodDimensions, BodyPose, LegConfiguration, Point3D, HexapodConfiguration } from '../types';

// Helper: Degrees to Radians
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

// Helper: Rotate point
const rotateX = (p: Point3D, theta: number): Point3D => ({
  x: p.x,
  y: p.y * Math.cos(theta) - p.z * Math.sin(theta),
  z: p.y * Math.sin(theta) + p.z * Math.cos(theta),
});

const rotateY = (p: Point3D, theta: number): Point3D => ({
  x: p.x * Math.cos(theta) + p.z * Math.sin(theta),
  y: p.y,
  z: -p.x * Math.sin(theta) + p.z * Math.cos(theta),
});

const rotateZ = (p: Point3D, theta: number): Point3D => ({
  x: p.x * Math.cos(theta) - p.y * Math.sin(theta),
  y: p.x * Math.sin(theta) + p.y * Math.cos(theta),
  z: p.z,
});

// Calculate Initial Body Points (Hexagon-ish)
const getLocalBodyPoints = (dims: HexapodDimensions): Point3D[] => {
  const { front, side, middle } = dims;
  // Standard hexapod layout: 6 points.
  // Right Middle, Right Front, Left Front, Left Middle, Left Back, Right Back
  // We'll define them in local body frame.
  return [
    { x: middle, y: 0, z: 0 },          // R Middle (Leg 0)
    { x: side, y: -front, z: 0 },       // R Front (Leg 1)
    { x: -side, y: -front, z: 0 },      // L Front (Leg 2)
    { x: -middle, y: 0, z: 0 },         // L Middle (Leg 3)
    { x: -side, y: front, z: 0 },       // L Back (Leg 4)
    { x: side, y: front, z: 0 },        // R Back (Leg 5)
  ];
};

// Calculate World Foot Positions (assumed fixed on ground in a circle/pattern)
// For simplicity, we assume feet are initially planted directly outwards from the body
// at a distance = coxa + femur + tibia (horizontal projection estimate).
// Real hexapod gaits are complex; this is a static IK demo.
const getFixedFootPoints = (dims: HexapodDimensions): Point3D[] => {
  const bodyPoints = getLocalBodyPoints(dims);
  const legReach = dims.coxa + dims.femur + dims.tibia * 0.5; // Slightly bent default

  // Angles for each leg mounting point relative to body center
  // R-Mid (0), R-Front (-45), L-Front (-135), L-Mid (180), L-Back (135), R-Back (45)
  // Approximating for simple hexagonal symmetry if needed, or using vectors.
  // We'll calculate the vector from center to hip, normalize it, and scale by reach.
  
  return bodyPoints.map((hip) => {
    const angle = Math.atan2(hip.y, hip.x);
    const reach = Math.sqrt(hip.x * hip.x + hip.y * hip.y) + legReach;
    return {
      x: Math.cos(angle) * reach,
      y: Math.sin(angle) * reach,
      z: 0, // Floor
    };
  });
};

export const solveHexapodIK = (
  dims: HexapodDimensions,
  pose: BodyPose
): HexapodConfiguration => {
  const localBodyPoints = getLocalBodyPoints(dims);
  const fixedFootPoints = getFixedFootPoints(dims);

  const { tx, ty, tz, rx, ry, rz } = pose;
  const radRx = toRad(rx);
  const radRy = toRad(ry);
  const radRz = toRad(rz);

  // 1. Transform Body Points to World Space based on Pose
  const worldBodyPoints = localBodyPoints.map((p) => {
    let curr = { ...p };
    // Rotate
    curr = rotateX(curr, radRx);
    curr = rotateY(curr, radRy);
    curr = rotateZ(curr, radRz);
    // Translate
    curr.x += tx;
    curr.y += ty;
    curr.z += tz;
    return curr;
  });

  // 2. Calculate Leg IK
  const legs: LegConfiguration[] = worldBodyPoints.map((hipWorld, index) => {
    const footWorld = fixedFootPoints[index];
    
    // Vector from Hip to Foot
    const v = {
      x: footWorld.x - hipWorld.x,
      y: footWorld.y - hipWorld.y,
      z: footWorld.z - hipWorld.z,
    };

    // Calculate orientation of the leg mount on the body (approximation for local frame)
    // We need to rotate the vector V into the leg's local coordinate system (where x is 'out')
    // Get the angle of the mounting point in the LOCAL body frame (before body rotation)
    const localHip = localBodyPoints[index];
    const mountAngle = Math.atan2(localHip.y, localHip.x);

    // To solve simpler planar IK, we consider the plane formed by the Z axis and the leg's radial line.
    // However, the body rotates, so the "radial line" direction actually changes.
    // Standard approach:
    // 1. Transform V into a frame aligned with the body's yaw, but that's complex.
    // SIMPLIFIED APPROACH:
    // The Coxa joint rotates around the body's Z-axis (locally at the hip).
    // Actually, normally Coxa Z-rotation aligns the leg to the target.
    
    // Let's transform V back by the Body Rotation to see it in "Body Frame"? No.
    // We just need the distance in the horizontal plane and the height.
    
    // Coxa Angle (Gamma in some docs, Alpha in others):
    // Angle of vector V in the XY plane minus the mounting angle.
    // But we need to account that the Body itself is rotated.
    // The mounting point normal also rotates.
    // For this visualizer, let's calculate Coxa angle required to point towards the foot
    // RELATIVE to the mounting angle *plus* body rotation (Yaw).
    
    // Actually, accurate IK:
    // We need the vector V in the *Body's Local Frame*.
    // Inverse Transform V_world -> V_body.
    // V_world = Foot - Hip_World.
    // Hip_World is already calculated.
    // Let's take Foot_World and transform it into Body Local Frame.
    
    // Inverse Translate Foot
    let fLocal = {
        x: footWorld.x - tx,
        y: footWorld.y - ty,
        z: footWorld.z - tz
    };
    // Inverse Rotate Foot (Order: Inverse Z, Inverse Y, Inverse X)
    fLocal = rotateZ(fLocal, -radRz);
    fLocal = rotateY(fLocal, -radRy);
    fLocal = rotateX(fLocal, -radRx);

    // Now fLocal is the foot position relative to the center of the unrotated body.
    // The hip is at localBodyPoints[index].
    const hipLocal = localBodyPoints[index];
    
    const vLocal = {
        x: fLocal.x - hipLocal.x,
        y: fLocal.y - hipLocal.y,
        z: fLocal.z - hipLocal.z
    };

    // Now convert to Leg Local Frame (rotate by -mountAngle around Z)
    const vLeg = rotateZ(vLocal, -mountAngle);

    // Now we are in the 2D plane of the leg.
    // x axis is "out", z axis is "up" (relative to body plane).
    // y axis should be 0 if Coxa aligns perfectly.
    
    // Coxa Angle: atan2(y, x)
    const coxaAngle = Math.atan2(vLeg.y, vLeg.x);
    
    // 2D IK for Femur/Tibia
    // Effective Reach (horizontal distance from Coxa pivot to Foot)
    // The Coxa itself has length.
    const planarDist = Math.sqrt(vLeg.x * vLeg.x + vLeg.y * vLeg.y);
    const reach = planarDist - dims.coxa;
    const height = vLeg.z; // relative vertical distance
    
    // Triangle sides: Femur(a), Tibia(b), Hypotenuse(c)
    // c = sqrt(reach^2 + height^2)
    const c = Math.sqrt(reach * reach + height * height);
    
    // Law of Cosines
    // c^2 = a^2 + b^2 - 2ab cos(Gamma)  -> for Tibia angle
    // beta (angle at Femur) requires finding angle of c relative to horizon + internal triangle angle.
    
    // Angle of c relative to horizon (atan2(height, reach))
    const alphaTri = Math.atan2(height, reach);
    
    // Interior angle at Femur joint (betaTri)
    // b^2 = a^2 + c^2 - 2ac cos(betaTri)
    // cos(betaTri) = (a^2 + c^2 - b^2) / (2ac)
    const cosBeta = (dims.femur * dims.femur + c * c - dims.tibia * dims.tibia) / (2 * dims.femur * c);
    // Clamp for safety
    const clampedCosBeta = Math.max(-1, Math.min(1, cosBeta));
    const betaTri = Math.acos(clampedCosBeta);
    
    const femurAngle = alphaTri + betaTri; // Relative to horizon line
    
    // Angle at Tibia (Gamma)
    // c^2 = a^2 + b^2 - 2ab cos(gammaTri)
    // cos(gammaTri) = (a^2 + b^2 - c^2) / (2ab)
    const cosGamma = (dims.femur * dims.femur + dims.tibia * dims.tibia - c * c) / (2 * dims.femur * dims.tibia);
    const clampedCosGamma = Math.max(-1, Math.min(1, cosGamma));
    const gammaTri = Math.acos(clampedCosGamma);
    
    // Tibia angle usually defined relative to Femur direction.
    // If straight leg is 180, then angle is 180 - gammaTri.
    // Or if 0 is folded back. Let's return the internal angle deviation from straight.
    // Usually displayed as angle relative to femur.
    const tibiaAngle = gammaTri - Math.PI; // or similar depending on servo config. 
    // Let's stick to geometric angle (radians relative to femur vector) or simpler:
    // Just return gammaTri (angle between femur and tibia).

    // --- Forward Kinematics for Visualization (Reconstruct points in World Space) ---
    // We need to draw the leg segments in the 3D scene.
    // We start at hipWorld (calculated earlier).
    // We need J1 (Coxa End/Femur Start), J2 (Femur End/Tibia Start), J3 (Foot).
    
    // We can use the angles and transformations to find these points.
    // Or easier: Build them in Leg Local Frame, then Transform to World.
    
    // Leg Frame Points:
    // P0: (0,0,0) - Hip
    // P1: (Coxa, 0, 0) rotated by CoxaAngleZ
    // P2: P1 + (Femur, 0, 0) rotated by FemurAngleY
    // P3: P2 + (Tibia, 0, 0) rotated by TibiaAngleY
    
    // 1. Start with vectors in "Leg Plane" (XZ plane effectively, after coxa rotation)
    // Hip is origin.
    // J1 (Coxa End):
    const p1_leg = { 
        x: dims.coxa * Math.cos(coxaAngle), 
        y: dims.coxa * Math.sin(coxaAngle), 
        z: 0 
    };
    
    // For Femur/Tibia, we need to deal with the pitch (FemurAngle).
    // Note: The femur rotates up/down. The plane of rotation is determined by CoxaAngle.
    // Let's work in the vertical plane aligned with Coxa first.
    // Horizontal distance component for Femur: F * cos(femurAngle)
    // Vertical component: F * sin(femurAngle)
    
    const fem_h = dims.femur * Math.cos(femurAngle);
    const fem_v = dims.femur * Math.sin(femurAngle);
    
    const p2_plane = {
        h: dims.coxa + fem_h,
        v: fem_v
    };
    
    // Tibia: starts at P2, angle is (FemurAngle + TibiaAngle) (accumulated rotation)
    // Wait, `tibiaAngle` calculated via Cosine Rule is usually the *interior* angle.
    // The actual geometric angle of the Tibia segment relative to horizon is:
    // femurAngle - (Math.PI - gammaTri) (if knee points up/out).
    // Let's use the vector addition.
    // The vector C (Hypotenuse) connects CoxaEnd to Foot.
    // We know Foot position in this plane is (reach + coxa, height).
    const p3_plane = {
        h: dims.coxa + reach,
        v: height
    };
    
    // Now map plane (h, v) back to Leg Local (x, y, z).
    // h is along the ray defined by coxaAngle.
    // x = h * cos(coxaAngle)
    // y = h * sin(coxaAngle)
    // z = v
    
    const p2_leg = {
        x: p2_plane.h * Math.cos(coxaAngle),
        y: p2_plane.h * Math.sin(coxaAngle),
        z: p2_plane.v
    };
    
    const p3_leg = {
        x: p3_plane.h * Math.cos(coxaAngle),
        y: p3_plane.h * Math.sin(coxaAngle),
        z: p3_plane.v
    };
    
    // Now transform these Leg Local points to Body Local Frame (Rotate by mountAngle)
    const p1_body = rotateZ(p1_leg, mountAngle);
    const p2_body = rotateZ(p2_leg, mountAngle);
    const p3_body = rotateZ(p3_leg, mountAngle); // Should match fLocal approx
    
    // Translate to Hip Position in Body Local
    const j1_local = { x: p1_body.x + hipLocal.x, y: p1_body.y + hipLocal.y, z: p1_body.z + hipLocal.z };
    const j2_local = { x: p2_body.x + hipLocal.x, y: p2_body.y + hipLocal.y, z: p2_body.z + hipLocal.z };
    const j3_local = { x: p3_body.x + hipLocal.x, y: p3_body.y + hipLocal.y, z: p3_body.z + hipLocal.z };
    
    // Transform to World Frame
    const toWorld = (p: Point3D) => {
        let curr = { ...p };
        curr = rotateX(curr, radRx);
        curr = rotateY(curr, radRy);
        curr = rotateZ(curr, radRz);
        curr.x += tx;
        curr.y += ty;
        curr.z += tz;
        return curr;
    };
    
    return {
      legId: index,
      coxaAngle: toDeg(coxaAngle),
      femurAngle: toDeg(femurAngle),
      tibiaAngle: toDeg(gammaTri), // Returning internal angle for display
      joints: {
        bodyContact: hipWorld,
        coxa: toWorld(j1_local),
        femur: toWorld(j2_local),
        foot: toWorld(j3_local), // Should match fixedFootPoints[index] approx
      }
    };
  });

  return {
    legs,
    bodyCorners: worldBodyPoints
  };
};
