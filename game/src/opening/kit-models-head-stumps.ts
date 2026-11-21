import * as THREE from 'three/webgpu';
import { PALETTE } from '../world/palette';

export interface HeadStumpsMaterials {
  leather: THREE.MeshStandardMaterial;
  outfield: THREE.MeshStandardMaterial;
  cream: THREE.MeshStandardMaterial;
  ink: THREE.MeshStandardMaterial;
  willow: THREE.MeshStandardMaterial;
  timber: THREE.MeshStandardMaterial;
  dispose: () => void;
}

export function createHeadStumpsMaterials(): HeadStumpsMaterials {
  const leather = new THREE.MeshStandardMaterial({ color: PALETTE.leather, roughness: 0.45 });
  const outfield = new THREE.MeshStandardMaterial({ color: PALETTE.outfield, roughness: 0.6 });
  const cream = new THREE.MeshStandardMaterial({ color: PALETTE.cream, roughness: 0.5 });
  const ink = new THREE.MeshStandardMaterial({ color: PALETTE.ink, roughness: 0.35 });
  const willow = new THREE.MeshStandardMaterial({ color: PALETTE.willow, roughness: 0.5 });
  const timber = new THREE.MeshStandardMaterial({ color: PALETTE.timber, roughness: 0.6 });

  return {
    leather,
    outfield,
    cream,
    ink,
    willow,
    timber,
    dispose: () => {
      leather.dispose();
      outfield.dispose();
      cream.dispose();
      ink.dispose();
      willow.dispose();
      timber.dispose();
    }
  };
}

export interface HeadStumpsGeometries {
  helmetShell: THREE.SphereGeometry;
  helmetGrilleBar: THREE.CylinderGeometry;
  capCrown: THREE.SphereGeometry;
  capButton: THREE.SphereGeometry;
  visor: THREE.BufferGeometry;
  stump: THREE.CapsuleGeometry;
  bail: THREE.CapsuleGeometry;
  smallBall: THREE.SphereGeometry;
  smallBallSeam: THREE.TorusGeometry;
  dispose: () => void;
}

function buildVisorGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.35, 0);
  shape.quadraticCurveTo(0, 0.28, 0.35, 0);
  shape.quadraticCurveTo(0, 0.08, -0.35, 0);

  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.015,
    bevelThickness: 0.015
  });
}

export function createHeadStumpsGeometries(): HeadStumpsGeometries {
  const helmetShell = new THREE.SphereGeometry(0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58);
  const helmetGrilleBar = new THREE.CylinderGeometry(0.012, 0.012, 0.48, 6);
  const capCrown = new THREE.SphereGeometry(0.5, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.46);
  const capButton = new THREE.SphereGeometry(0.05, 8, 8);
  const visor = buildVisorGeometry();
  const stump = new THREE.CapsuleGeometry(0.045, 1.8, 4, 8);
  const bail = new THREE.CapsuleGeometry(0.025, 0.22, 4, 8);
  const smallBall = new THREE.SphereGeometry(0.42, 16, 16);
  const smallBallSeam = new THREE.TorusGeometry(0.423, 0.014, 6, 24);

  return {
    helmetShell,
    helmetGrilleBar,
    capCrown,
    capButton,
    visor,
    stump,
    bail,
    smallBall,
    smallBallSeam,
    dispose: () => {
      helmetShell.dispose();
      helmetGrilleBar.dispose();
      capCrown.dispose();
      capButton.dispose();
      visor.dispose();
      stump.dispose();
      bail.dispose();
      smallBall.dispose();
      smallBallSeam.dispose();
    }
  };
}

export function buildHelmetObject(
  geo: HeadStumpsGeometries,
  mat: HeadStumpsMaterials
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'kit-helmet';

  const shell = new THREE.Mesh(geo.helmetShell, mat.ink);
  group.add(shell);

  const peak = new THREE.Mesh(geo.visor, mat.ink);
  peak.rotation.x = Math.PI / 2;
  peak.position.set(0, 0.05, 0.45);
  group.add(peak);

  for (let i = 0; i < 3; i++) {
    const bar = new THREE.Mesh(geo.helmetGrilleBar, mat.cream);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, -0.12 - i * 0.1, 0.42);
    group.add(bar);
  }

  return group;
}

export function buildCapObject(geo: HeadStumpsGeometries, mat: HeadStumpsMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'kit-cap';

  const crown = new THREE.Mesh(geo.capCrown, mat.outfield);
  group.add(crown);

  const visor = new THREE.Mesh(geo.visor, mat.outfield);
  visor.rotation.x = Math.PI / 2;
  visor.position.set(0, 0.02, 0.4);
  group.add(visor);

  const button = new THREE.Mesh(geo.capButton, mat.cream);
  button.position.set(0, 0.49, 0);
  group.add(button);

  return group;
}

export function buildStumpsObject(geo: HeadStumpsGeometries, mat: HeadStumpsMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'kit-stumps';

  const spacing = 0.22;
  for (let i = -1; i <= 1; i++) {
    const s = new THREE.Mesh(geo.stump, mat.willow);
    s.position.set(i * spacing, 0, 0);
    group.add(s);
  }

  const bail1 = new THREE.Mesh(geo.bail, mat.timber);
  bail1.rotation.z = Math.PI / 2;
  bail1.position.set(-spacing / 2, 0.95, 0);
  group.add(bail1);

  const bail2 = new THREE.Mesh(geo.bail, mat.timber);
  bail2.rotation.z = Math.PI / 2;
  bail2.position.set(spacing / 2, 0.95, 0);
  group.add(bail2);

  return group;
}

export function buildSmallBallObject(
  geo: HeadStumpsGeometries,
  mat: HeadStumpsMaterials
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'kit-ball';

  const ball = new THREE.Mesh(geo.smallBall, mat.leather);
  group.add(ball);

  const seam = new THREE.Mesh(geo.smallBallSeam, mat.cream);
  seam.rotation.x = Math.PI / 2;
  group.add(seam);

  return group;
}
