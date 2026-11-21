import RAPIER from '@dimforge/rapier3d-compat';
import { createGroundBase } from '../world/ground-base';
import { createAhmedabadBowl } from '../world/ahmedabad-bowl';
import { createGroundModels, type GroundStand } from '../world/ground-models';
import { createScoreboard } from '../world/scoreboard';
import { createCrowd } from '../world/crowd';
import { HUB_FIELD } from '../world/field-shape';
import { createBoundaryDetector } from '../interactions/boundary';
import { createSceneBase, yawToward, type Spawn } from './scene-common';
import { HUB, type BuiltScene, type Portal, type SceneContext } from './scene-types';

const START = { x: 0, z: 14 };
// The hub's scoreboard stands behind the far sight screen side of the square, facing it.
const SCOREBOARD = { x: 0, y: 0, z: -50 };

function spawnFor(from: string | undefined, stands: GroundStand[]): Spawn {
  const back = stands.find((s) => s.slug === from);
  if (back) return back.returnSpawn;
  // A first arrival faces Lord's, the one ground already open.
  const lords = stands.find((s) => s.slug === 'lords');
  return { ...START, yaw: lords ? yawToward(START, lords.mat) : Math.PI };
}

function toPortal(stand: GroundStand): Portal {
  return {
    slug: stand.slug,
    model: stand.model,
    size: stand.size,
    returnSpawn: stand.returnSpawn
  };
}

/** Narendra Modi Stadium, Ahmedabad: the hub, with a model of every project ground. */
export function buildHubScene(ctx: SceneContext, from?: string): BuiltScene {
  const home = ctx.grounds.find((g) => g.slug === 'ahmedabad');
  if (!home) throw new Error('grounds has no Ahmedabad entry');
  const projects = ctx.grounds.filter((g) => g.slug !== 'ahmedabad');

  // Where the roller appears depends on the ground models (coming back from one puts it in
  // front of that model), so it is moved into place once they exist.
  const base = createSceneBase(
    HUB_FIELD,
    ctx.materials,
    { ...START, yaw: Math.PI },
    // The roof ring's inner lip, where the bowl hangs its floodlight panels.
    { radius: HUB_FIELD.rx + 17, height: 26 }
  );
  const { scene, world, vehicle } = base;
  const groundBase = createGroundBase(scene, world, RAPIER, ctx.materials, {
    field: HUB_FIELD,
    stands: false
  });
  const bowl = createAhmedabadBowl(scene, world, RAPIER, ctx.materials, HUB_FIELD);
  const models = createGroundModels(
    scene,
    world,
    RAPIER,
    ctx.materials,
    projects,
    HUB_FIELD,
    (slug) => ctx.travel(slug)
  );
  placeVehicle(vehicle, spawnFor(from, models.stands));

  const scoreboard = createScoreboard(scene, world, RAPIER, ctx.materials, SCOREBOARD, 0, home);
  const crowd = createCrowd(scene, HUB_FIELD, { tiers: bowl.seatRings });
  const boundary = createBoundaryDetector(() => {
    ctx.sound.playSixRoar();
    ctx.banner.show('SIX!');
  }, HUB_FIELD);

  return {
    id: HUB,
    scene,
    world,
    vehicle,
    portals: models.stands.map(toPortal),
    updatables: [
      ...base.updatables,
      models.update,
      scoreboard.update,
      crowd.update,
      boundary.update
    ],
    dispose: () => {
      crowd.dispose();
      scoreboard.dispose();
      models.dispose();
      bowl.dispose();
      groundBase.dispose();
      base.dispose();
    }
  };
}

function placeVehicle(vehicle: BuiltScene['vehicle'], spawn: Spawn): void {
  const half = spawn.yaw / 2;
  const rot = { x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) };
  const y = vehicle.body.translation().y;
  vehicle.body.setTranslation({ x: spawn.x, y, z: spawn.z }, true);
  vehicle.body.setRotation(rot, true);
  vehicle.currentPosition.set(spawn.x, y, spawn.z);
  vehicle.previousPosition.copy(vehicle.currentPosition);
  vehicle.currentRotation.set(rot.x, rot.y, rot.z, rot.w);
  vehicle.previousRotation.copy(vehicle.currentRotation);
  vehicle.model.group.position.copy(vehicle.currentPosition);
  vehicle.model.group.quaternion.copy(vehicle.currentRotation);
}
