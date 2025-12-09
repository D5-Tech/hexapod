export interface HexapodDimensions {
  front: number;
  side: number;
  middle: number;
  coxa: number;
  femur: number;
  tibia: number;
}

export interface BodyPose {
  tx: number;
  ty: number;
  tz: number;
  rx: number;
  ry: number;
  rz: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface LegConfiguration {
  legId: number;
  coxaAngle: number;
  femurAngle: number;
  tibiaAngle: number;
  joints: {
    bodyContact: Point3D;
    coxa: Point3D;
    femur: Point3D;
    foot: Point3D;
  };
}

export interface HexapodConfiguration {
  legs: LegConfiguration[];
  bodyCorners: Point3D[];
}