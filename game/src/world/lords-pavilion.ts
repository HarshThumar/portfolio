import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import type { SharedMaterials } from './palette';

export interface LordsPavilionInstance {
  group: THREE.Group;
  dispose: () => void;
}

function createBalcony(materials: SharedMaterials): THREE.Group {
  const balconyGroup = new THREE.Group();

  // Tier 1 Balcony deck
  const deck1Geo = new THREE.BoxGeometry(16, 0.3, 3.2);
  const deck1 = new THREE.Mesh(deck1Geo, materials.cream);
  deck1.position.set(0, 3.5, 2.4);
  deck1.castShadow = true;
  balconyGroup.add(deck1);

  // Balcony railings
  const railGeo = new THREE.BoxGeometry(16, 0.7, 0.1);
  const rail1 = new THREE.Mesh(railGeo, materials.cream);
  rail1.position.set(0, 4.0, 3.9);
  balconyGroup.add(rail1);

  // Tier 2 Upper balcony
  const deck2 = new THREE.Mesh(deck1Geo, materials.cream);
  deck2.position.set(0, 6.2, 2.0);
  const rail2 = new THREE.Mesh(railGeo, materials.cream);
  rail2.position.set(0, 6.7, 3.5);
  balconyGroup.add(deck2, rail2);

  return balconyGroup;
}

function createRoof(materials: SharedMaterials): THREE.Group {
  const roofGroup = new THREE.Group();

  // Main hipped roof
  const roofGeo = new THREE.ConeGeometry(9.5, 3.5, 4);
  roofGeo.rotateY(Math.PI / 4);
  roofGeo.scale(1.4, 0.8, 0.9);
  const roof = new THREE.Mesh(roofGeo, materials.timber);
  roof.position.set(0, 8.8, 0);
  roof.castShadow = true;
  roofGroup.add(roof);

  // Twin ornamental Victorian turrets
  const turretGeo = new THREE.ConeGeometry(1.2, 2.5, 6);
  const turret1 = new THREE.Mesh(turretGeo, materials.timber);
  turret1.position.set(-7.5, 9.5, 1.8);
  const turret2 = new THREE.Mesh(turretGeo, materials.timber);
  turret2.position.set(7.5, 9.5, 1.8);
  roofGroup.add(turret1, turret2);

  // Weather vane on central cupola
  const vaneGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6);
  const vane = new THREE.Mesh(vaneGeo, materials.ink);
  vane.position.set(0, 10.6, 0);
  roofGroup.add(vane);

  return roofGroup;
}

function createFacade(materials: SharedMaterials): THREE.Group {
  const facadeGroup = new THREE.Group();

  // Terracotta / red-brick main facade block
  const mainBlockGeo = new THREE.BoxGeometry(17, 7.5, 6.5);
  const mainBlock = new THREE.Mesh(mainBlockGeo, materials.leather);
  mainBlock.position.set(0, 3.75, 0);
  mainBlock.castShadow = true;
  facadeGroup.add(mainBlock);

  // Timber columns supporting balcony
  const colGeo = new THREE.BoxGeometry(0.35, 3.5, 0.35);
  for (let x = -7; x <= 7; x += 3.5) {
    const col = new THREE.Mesh(colGeo, materials.timber);
    col.position.set(x, 1.75, 3.2);
    facadeGroup.add(col);
  }

  // Entrance steps to Long Room
  const stepGeo = new THREE.BoxGeometry(5.0, 0.3, 1.8);
  const steps = new THREE.Mesh(stepGeo, materials.cream);
  steps.position.set(0, 0.15, 3.8);
  facadeGroup.add(steps);

  return facadeGroup;
}

export function createLordsPavilion(
  scene: THREE.Scene,
  world: RAPIER.World,
  rapier: typeof RAPIER,
  materials: SharedMaterials,
  position = { x: 0, y: 0, z: -54 },
  rotationY = 0
): LordsPavilionInstance {
  const group = new THREE.Group();
  group.name = 'lords-pavilion';
  group.position.set(position.x, position.y, position.z);
  group.rotation.y = rotationY;

  const facade = createFacade(materials);
  const balcony = createBalcony(materials);
  const roof = createRoof(materials);

  group.add(facade, balcony, roof);
  scene.add(group);

  // Rapier physics colliders for pavilion structure
  const bodyDesc = rapier.RigidBodyDesc.fixed().setTranslation(
    position.x,
    position.y + 3.75,
    position.z
  );
  const body = world.createRigidBody(bodyDesc);
  const colliderDesc = rapier.ColliderDesc.cuboid(9.0, 4.0, 4.0);
  world.createCollider(colliderDesc, body);

  return {
    group,
    dispose: () => {
      scene.remove(group);
      world.removeRigidBody(body);
    }
  };
}
