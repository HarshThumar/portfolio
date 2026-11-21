import * as THREE from 'three';
import type { SharedMaterials } from '../world/palette';

export interface RollerModel {
  group: THREE.Group;
  frontDrum: THREE.Mesh;
  rearDrum: THREE.Mesh;
  steeringWheel: THREE.Mesh;
  dispose: () => void;
}

function createDrums(materials: SharedMaterials): {
  frontDrum: THREE.Mesh;
  rearDrum: THREE.Mesh;
  dispose: () => void;
} {
  const drumGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 16);
  drumGeo.rotateZ(Math.PI / 2);

  const frontDrum = new THREE.Mesh(drumGeo, materials.ink);
  frontDrum.position.set(0, 0.5, 0.8);
  frontDrum.castShadow = true;

  const rearDrum = new THREE.Mesh(drumGeo, materials.ink);
  rearDrum.position.set(0, 0.5, -0.8);
  rearDrum.castShadow = true;

  return {
    frontDrum,
    rearDrum,
    dispose: () => drumGeo.dispose()
  };
}

function createBodyFrame(materials: SharedMaterials): {
  group: THREE.Group;
  steeringWheel: THREE.Mesh;
  dispose: () => void;
} {
  const group = new THREE.Group();
  const disposables: Array<() => void> = [];

  // Chassis box
  const chassisGeo = new THREE.BoxGeometry(1.2, 0.5, 2.2);
  const chassis = new THREE.Mesh(chassisGeo, materials.willow);
  chassis.position.set(0, 0.75, 0);
  chassis.castShadow = true;
  group.add(chassis);
  disposables.push(() => chassisGeo.dispose());

  // Engine hood / front housing
  const hoodGeo = new THREE.BoxGeometry(1.0, 0.5, 0.9);
  const hood = new THREE.Mesh(hoodGeo, materials.timber);
  hood.position.set(0, 1.1, 0.45);
  hood.castShadow = true;
  group.add(hood);
  disposables.push(() => hoodGeo.dispose());

  // Driver seat
  const seatGeo = new THREE.BoxGeometry(0.7, 0.15, 0.6);
  const seat = new THREE.Mesh(seatGeo, materials.willow);
  seat.position.set(0, 1.1, -0.6);
  group.add(seat);
  disposables.push(() => seatGeo.dispose());

  // Seat backrest
  const backGeo = new THREE.BoxGeometry(0.7, 0.4, 0.1);
  const backrest = new THREE.Mesh(backGeo, materials.willow);
  backrest.position.set(0, 1.35, -0.85);
  group.add(backrest);
  disposables.push(() => backGeo.dispose());

  // Steering column & wheel
  const colGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
  const column = new THREE.Mesh(colGeo, materials.ink);
  column.position.set(0, 1.3, -0.15);
  column.rotation.x = -Math.PI / 6;
  group.add(column);
  disposables.push(() => colGeo.dispose());

  const wheelGeo = new THREE.TorusGeometry(0.2, 0.03, 8, 16);
  const steeringWheel = new THREE.Mesh(wheelGeo, materials.ink);
  steeringWheel.position.set(0, 1.5, -0.25);
  steeringWheel.rotation.x = Math.PI / 3;
  group.add(steeringWheel);
  disposables.push(() => wheelGeo.dispose());

  // Vertical exhaust pipe with small cap
  const pipeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
  const exhaust = new THREE.Mesh(pipeGeo, materials.ink);
  exhaust.position.set(0.4, 1.5, 0.7);
  group.add(exhaust);
  disposables.push(() => pipeGeo.dispose());

  return {
    group,
    steeringWheel,
    dispose: () => {
      for (const fn of disposables) fn();
    }
  };
}

export function createRollerModel(materials: SharedMaterials): RollerModel {
  const group = new THREE.Group();
  group.name = 'pitch-roller';

  const { frontDrum, rearDrum, dispose: disposeDrums } = createDrums(materials);
  group.add(frontDrum, rearDrum);

  const { group: bodyGroup, steeringWheel, dispose: disposeBody } = createBodyFrame(materials);
  group.add(bodyGroup);

  return {
    group,
    frontDrum,
    rearDrum,
    steeringWheel,
    dispose: () => {
      disposeDrums();
      disposeBody();
    }
  };
}
