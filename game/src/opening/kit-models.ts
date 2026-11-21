import type * as THREE from 'three/webgpu';
import {
  createBatPadMaterials,
  createBatPadGeometries,
  buildBatObject,
  buildPadObject,
  buildGloveObject
} from './kit-models-bat-pad';
import {
  createHeadStumpsMaterials,
  createHeadStumpsGeometries,
  buildHelmetObject,
  buildCapObject,
  buildStumpsObject,
  buildSmallBallObject
} from './kit-models-head-stumps';

export interface KitPiece {
  kind: string;
  object: THREE.Group;
  dispose: () => void;
}

/** Generates ~26 miniature cricket equipment pieces floating in the sky. */
export function createKitPieces(): KitPiece[] {
  const batPadMat = createBatPadMaterials();
  const batPadGeo = createBatPadGeometries();
  const headStumpsMat = createHeadStumpsMaterials();
  const headStumpsGeo = createHeadStumpsGeometries();

  let disposedCount = 0;
  const totalPieces = 26;

  const disposeShared = (): void => {
    disposedCount++;
    if (disposedCount >= totalPieces) {
      batPadMat.dispose();
      batPadGeo.dispose();
      headStumpsMat.dispose();
      headStumpsGeo.dispose();
    }
  };

  const pieces: KitPiece[] = [];

  const addPieces = (count: number, kind: string, builder: () => THREE.Group): void => {
    for (let i = 0; i < count; i++) {
      const object = builder();
      pieces.push({
        kind,
        object,
        dispose: () => {
          object.parent?.remove(object);
          disposeShared();
        }
      });
    }
  };

  // 4 bats, 5 pads, 5 gloves, 2 helmets, 2 caps, 2 stump sets, 6 small balls = 26 pieces
  addPieces(4, 'bat', () => buildBatObject(batPadGeo, batPadMat));
  addPieces(5, 'pad', () => buildPadObject(batPadGeo, batPadMat));
  addPieces(5, 'glove', () => buildGloveObject(batPadGeo, batPadMat));
  addPieces(2, 'helmet', () => buildHelmetObject(headStumpsGeo, headStumpsMat));
  addPieces(2, 'cap', () => buildCapObject(headStumpsGeo, headStumpsMat));
  addPieces(2, 'stumps', () => buildStumpsObject(headStumpsGeo, headStumpsMat));
  addPieces(6, 'ball', () => buildSmallBallObject(headStumpsGeo, headStumpsMat));

  return pieces;
}
