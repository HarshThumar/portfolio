import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import { PALETTE, type SharedMaterials } from './palette';

export interface GroundBaseInstance {
  group: THREE.Group;
  dispose: () => void;
}

export interface GroundBaseOptions {
  hideNorthSightScreen?: boolean;
}

const BOUNDARY_RADIUS_X = 42;
const BOUNDARY_RADIUS_Z = 50;

function createMowingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const col1 = `#${PALETTE.outfield.toString(16).padStart(6, '0')}`;
    const col2 = `#${PALETTE.outfield2.toString(16).padStart(6, '0')}`;
    for (let y = 0; y < 64; y++) {
      ctx.fillStyle = y % 2 === 0 ? col1 : col2;
      ctx.fillRect(0, y, 2, 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 16);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

function createOutfieldMesh(texture: THREE.CanvasTexture): {
  mesh: THREE.Mesh;
  dispose: () => void;
} {
  const shape = new THREE.Shape();
  const segments = 64;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = Math.cos(theta) * 44;
    const y = Math.sin(theta) * 52;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }

  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshLambertMaterial({ map: texture });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;

  return {
    mesh,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    }
  };
}

function createPitchMesh(materials: SharedMaterials): {
  group: THREE.Group;
  dispose: () => void;
} {
  const group = new THREE.Group();
  const pitchGeo = new THREE.PlaneGeometry(3.2, 20.12);
  const pitchMesh = new THREE.Mesh(pitchGeo, materials.pitch);
  pitchMesh.rotation.x = -Math.PI / 2;
  pitchMesh.position.y = 0.015;
  pitchMesh.receiveShadow = true;
  group.add(pitchMesh);

  // Bowling & popping creases
  const creaseMat = materials.cream;
  const lineGeo = new THREE.PlaneGeometry(2.64, 0.08);
  const popGeo = new THREE.PlaneGeometry(3.66, 0.08);

  const zPositions = [-8.8, 8.8];
  for (const z of zPositions) {
    const bowl = new THREE.Mesh(lineGeo, creaseMat);
    bowl.rotation.x = -Math.PI / 2;
    bowl.position.set(0, 0.02, z);
    group.add(bowl);

    const pop = new THREE.Mesh(popGeo, creaseMat);
    pop.rotation.x = -Math.PI / 2;
    const popZ = z > 0 ? z - 1.22 : z + 1.22;
    pop.position.set(0, 0.02, popZ);
    group.add(pop);
  }

  return {
    group,
    dispose: () => {
      pitchGeo.dispose();
      lineGeo.dispose();
      popGeo.dispose();
    }
  };
}

function createBoundaryRope(materials: SharedMaterials): {
  group: THREE.Group;
  dispose: () => void;
} {
  const group = new THREE.Group();
  const curvePoints: THREE.Vector3[] = [];
  const segments = 80;

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = Math.cos(theta) * BOUNDARY_RADIUS_X;
    const z = Math.sin(theta) * BOUNDARY_RADIUS_Z;
    curvePoints.push(new THREE.Vector3(x, 0.08, z));
  }

  const curve = new THREE.CatmullRomCurve3(curvePoints, true);
  const ropeGeo = new THREE.TubeGeometry(curve, 96, 0.08, 6, true);
  const ropeMesh = new THREE.Mesh(ropeGeo, materials.cream);
  group.add(ropeMesh);

  // Add boundary triangular markers every 20 degrees
  const markerGeo = new THREE.ConeGeometry(0.2, 0.3, 4);
  markerGeo.rotateX(Math.PI / 2);
  for (let i = 0; i < 18; i++) {
    const theta = (i / 18) * Math.PI * 2;
    const x = Math.cos(theta) * (BOUNDARY_RADIUS_X + 0.3);
    const z = Math.sin(theta) * (BOUNDARY_RADIUS_Z + 0.3);
    const mat = i % 2 === 0 ? materials.cream : materials.leather;
    const marker = new THREE.Mesh(markerGeo, mat);
    marker.position.set(x, 0.1, z);
    marker.rotation.y = -theta;
    group.add(marker);
  }

  return {
    group,
    dispose: () => {
      ropeGeo.dispose();
      markerGeo.dispose();
    }
  };
}

function createSightScreen(materials: SharedMaterials, zPos: number): THREE.Group {
  const screen = new THREE.Group();
  screen.position.set(0, 0, zPos);

  // Wooden frame
  const postGeo = new THREE.BoxGeometry(0.2, 3.5, 0.2);
  const post1 = new THREE.Mesh(postGeo, materials.timber);
  post1.position.set(-2.8, 1.75, 0);
  const post2 = new THREE.Mesh(postGeo, materials.timber);
  post2.position.set(2.8, 1.75, 0);
  screen.add(post1, post2);

  // Cream slatted board
  const boardGeo = new THREE.BoxGeometry(5.4, 3.0, 0.1);
  const board = new THREE.Mesh(boardGeo, materials.cream);
  board.position.set(0, 1.8, 0);
  screen.add(board);

  return screen;
}

function createStandsShell(materials: SharedMaterials): {
  group: THREE.Group;
  dispose: () => void;
} {
  const group = new THREE.Group();
  const disposables: Array<() => void> = [];

  // 3 stepped tiers surrounding the boundary
  const tiers = [
    { innerX: 45, innerZ: 53, outerX: 49, outerZ: 57, y: 0.6, height: 1.2 },
    { innerX: 49, innerZ: 57, outerX: 53, outerZ: 61, y: 1.8, height: 1.2 },
    { innerX: 53, innerZ: 61, outerX: 57, outerZ: 65, y: 3.0, height: 1.2 }
  ];

  for (const tier of tiers) {
    const shape = new THREE.Shape();
    const segments = 48;
    // Outer loop
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const x = Math.cos(theta) * tier.outerX;
      const y = Math.sin(theta) * tier.outerZ;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    // Inner hole (counter-clockwise)
    const hole = new THREE.Path();
    for (let i = segments; i >= 0; i--) {
      const theta = (i / segments) * Math.PI * 2;
      const x = Math.cos(theta) * tier.innerX;
      const y = Math.sin(theta) * tier.innerZ;
      if (i === segments) hole.moveTo(x, y);
      else hole.lineTo(x, y);
    }
    shape.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: tier.height,
      bevelEnabled: false
    });
    const mesh = new THREE.Mesh(geo, materials.cream);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = tier.y - tier.height / 2;
    group.add(mesh);
    disposables.push(() => geo.dispose());
  }

  return {
    group,
    dispose: () => {
      for (const fn of disposables) fn();
    }
  };
}

export function createGroundBase(
  scene: THREE.Scene,
  world: RAPIER.World,
  rapier: typeof RAPIER,
  materials: SharedMaterials,
  options: GroundBaseOptions = {}
): GroundBaseInstance {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'ground-base';

  const mowingTexture = createMowingTexture();
  const outfield = createOutfieldMesh(mowingTexture);
  rootGroup.add(outfield.mesh);

  const pitch = createPitchMesh(materials);
  rootGroup.add(pitch.group);

  const rope = createBoundaryRope(materials);
  rootGroup.add(rope.group);

  let screenCol1: RAPIER.Collider | undefined;
  if (!options.hideNorthSightScreen) {
    const northScreen = createSightScreen(materials, -53);
    rootGroup.add(northScreen);
    const screenDesc1 = rapier.ColliderDesc.cuboid(3, 2, 0.2).setTranslation(0, 1.75, -53);
    screenCol1 = world.createCollider(screenDesc1);
  }

  const southScreen = createSightScreen(materials, 53);
  rootGroup.add(southScreen);

  const stands = createStandsShell(materials);
  rootGroup.add(stands.group);

  scene.add(rootGroup);

  const groundDesc = rapier.ColliderDesc.cuboid(60, 0.5, 60).setTranslation(0, -0.5, 0);
  const groundCollider = world.createCollider(groundDesc);

  const screenDesc2 = rapier.ColliderDesc.cuboid(3, 2, 0.2).setTranslation(0, 1.75, 53);
  const screenCol2 = world.createCollider(screenDesc2);

  return {
    group: rootGroup,
    dispose: () => {
      scene.remove(rootGroup);
      mowingTexture.dispose();
      outfield.dispose();
      pitch.dispose();
      rope.dispose();
      stands.dispose();
      world.removeCollider(groundCollider, false);
      if (screenCol1) world.removeCollider(screenCol1, false);
      world.removeCollider(screenCol2, false);
    }
  };
}
