import RAPIER from '@dimforge/rapier3d-compat';
import { createGroundBase } from '../world/ground-base';
import { createLordsPavilion } from '../world/lords-pavilion';
import { createHonoursBoard } from '../world/honours-board';
import { createScoreboard } from '../world/scoreboard';
import { createCrowd } from '../world/crowd';
import { createExitMat } from '../world/exit-mat';
import { PROJECT_FIELD } from '../world/field-shape';
import { createStumps } from '../interactions/stumps';
import { createBoundaryDetector } from '../interactions/boundary';
import { createInfoPost } from '../interactions/info-post';
import { createProjectPanel } from '../ui/project-panel';
import { createSceneBase, yawToward } from './scene-common';
import { HUB, type BuiltScene, type SceneContext } from './scene-types';
import type { GroundData } from '../types';
import type * as THREE from 'three/webgpu';

// docs/06: placement teaches. The roller starts pointed at the info post.
const INFO_POST = { x: 22, y: 0, z: 0 };
const ROLLER_START = { x: 0, z: 6 };
// The way home sits behind the roller's start, where a first look around finds it.
const EXIT = { x: -14, z: 18 };

function addInteractions(
  scene: THREE.Scene,
  world: RAPIER.World,
  ctx: SceneContext,
  ground: GroundData
): { updatables: BuiltScene['updatables']; dispose: () => void } {
  const { sound, banner, materials } = ctx;
  const stumps = createStumps(scene, world, RAPIER, materials, () => {
    sound.playStumpClatter();
    sound.playHowzat();
    banner.show('HOWZAT!');
  });
  const boundary = createBoundaryDetector(() => {
    sound.playSixRoar();
    banner.show('SIX!');
  }, PROJECT_FIELD);
  const projectPanel = createProjectPanel(ground);
  const infoPost = createInfoPost(scene, world, RAPIER, materials, INFO_POST, () => {
    sound.playBell();
    projectPanel.open();
  });
  const honoursBoard = createHonoursBoard(ground, { x: 0, z: -46 });
  const exitMat = createExitMat(
    scene,
    { ...EXIT, yaw: yawToward(EXIT, ROLLER_START) },
    'BACK TO AHMEDABAD',
    () => ctx.travel(HUB)
  );
  return {
    updatables: [
      stumps.update,
      boundary.update,
      infoPost.update,
      honoursBoard.update,
      exitMat.update
    ],
    dispose: () => {
      exitMat.dispose();
      stumps.dispose();
      infoPost.dispose();
      honoursBoard.destroy();
      projectPanel.destroy();
    }
  };
}

/** Lord's, London: mcp-auth-tamarin. The first full-size project ground (M1). */
export function buildLordsScene(ctx: SceneContext): BuiltScene {
  const ground = ctx.grounds.find((g) => g.slug === 'lords');
  if (!ground) throw new Error("grounds has no Lord's entry");

  const base = createSceneBase(PROJECT_FIELD, ctx.materials, {
    ...ROLLER_START,
    yaw: yawToward(ROLLER_START, INFO_POST)
  });
  const { scene, world } = base;
  const groundBase = createGroundBase(scene, world, RAPIER, ctx.materials, {
    hideNorthSightScreen: true,
    field: PROJECT_FIELD
  });
  const pavilion = createLordsPavilion(
    scene,
    world,
    RAPIER,
    ctx.materials,
    { x: 0, y: 0, z: -54 },
    0
  );
  const scoreboard = createScoreboard(
    scene,
    world,
    RAPIER,
    ctx.materials,
    { x: -34, y: 0, z: -10 },
    Math.PI / 4,
    ground
  );
  const crowd = createCrowd(scene, PROJECT_FIELD);
  const interactions = addInteractions(scene, world, ctx, ground);

  return {
    id: 'lords',
    scene,
    world,
    vehicle: base.vehicle,
    updatables: [...base.updatables, scoreboard.update, crowd.update, ...interactions.updatables],
    dispose: () => {
      interactions.dispose();
      crowd.dispose();
      scoreboard.dispose();
      pavilion.dispose();
      groundBase.dispose();
      base.dispose();
    }
  };
}
