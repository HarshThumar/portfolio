import { RenderPipeline } from 'three/webgpu';
import type { Camera, Node, Scene, WebGPURenderer } from 'three/webgpu';
import {
  float,
  mix,
  mrt,
  normalView,
  pass,
  renderOutput,
  saturation,
  smoothstep,
  uv,
  vec2,
  vec3,
  vec4
} from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import type BloomNode from 'three/addons/tsl/display/BloomNode.js';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import type GTAONode from 'three/addons/tsl/display/GTAONode.js';
import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import type GaussianBlurNode from 'three/addons/tsl/display/GaussianBlurNode.js';
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';

export interface PostEffects {
  render: (scene: Scene, camera: Camera) => void;
  dispose: () => void;
}

interface ChainResult {
  pipeline: RenderPipeline;
  scenePass: ReturnType<typeof pass>;
  aoPass?: GTAONode;
  bloomNode: BloomNode;
  blurNode: GaussianBlurNode;
}

function buildTiltShiftMask(): Node<'float'> {
  const y = uv().y;
  const dist = y.sub(0.5).abs();
  return smoothstep(float(0.225), float(0.45), dist);
}

function buildTiltShift(colorNode: Node<'vec4'>, blurredNode: Node<'vec4'>): Node<'vec4'> {
  const mask = buildTiltShiftMask();
  return mix(colorNode, blurredNode, mask);
}

function buildWarmGrade(colorNode: Node<'vec4'>): Node<'vec4'> {
  const sat = saturation(colorNode.rgb, 1.08);
  const lum = sat.dot(vec3(0.2126, 0.7152, 0.0722));
  const shadow = float(1.0).sub(lum.clamp(0.0, 1.0));
  const r = sat.r.add(float(0.012).mul(shadow));
  const g = sat.g.add(float(0.006).mul(shadow));
  return vec4(r, g, sat.b, colorNode.a);
}

function buildVignette(colorNode: Node<'vec4'>): Node<'vec4'> {
  const uvC = uv().sub(0.5).mul(2.0);
  const dist = uvC.length().clamp(0.0, 1.0);
  const vig = float(1.0).sub(dist.mul(float(0.25)));
  return vec4(colorNode.rgb.mul(vig), colorNode.a);
}

function buildHighQualityChain(
  renderer: WebGPURenderer,
  scene: Scene,
  camera: Camera
): ChainResult {
  const scenePass = pass(scene, camera);
  scenePass.setMRT(
    mrt({
      output: scenePass.getTextureNode('output'),
      normal: normalView
    })
  );

  const sceneColor = scenePass.getTextureNode('output');
  const sceneDepth = scenePass.getTextureNode('depth');
  const sceneNormal = scenePass.getTextureNode('normal');

  const aoPass = ao(sceneDepth, sceneNormal, camera);
  aoPass.radius.value = 1.5;
  aoPass.scale.value = 0.6;
  aoPass.samples.value = 12;

  const aoTex = aoPass.getTextureNode();
  const aoColor = vec4(sceneColor.rgb.mul(aoTex.r), sceneColor.a);

  const bloomNode = bloom(aoColor, 0.4, 0.3, 0.85);
  const withBloom = vec4(aoColor.rgb.add(bloomNode.rgb), aoColor.a);

  const blurNode = gaussianBlur(withBloom, vec2(1, 1), 3);
  const tiltShifted = buildTiltShift(withBloom, blurNode);

  const graded = buildWarmGrade(tiltShifted);
  const vignetted = buildVignette(graded);

  const tonemapped = renderOutput(vignetted);
  const antialiased = fxaa(tonemapped);

  const pipeline = new RenderPipeline(renderer, antialiased);
  pipeline.outputColorTransform = false;

  return { pipeline, scenePass, aoPass, bloomNode, blurNode };
}

function buildLowQualityChain(renderer: WebGPURenderer, scene: Scene, camera: Camera): ChainResult {
  const scenePass = pass(scene, camera);
  const sceneColor = scenePass.getTextureNode('output');

  const bloomNode = bloom(sceneColor, 0.3, 0.3, 0.85);
  bloomNode.setResolutionScale(0.5);

  const withBloom = vec4(sceneColor.rgb.add(bloomNode.rgb), sceneColor.a);

  const blurNode = gaussianBlur(withBloom, vec2(0, 1), 2, { resolutionScale: 0.5 });
  const tiltShifted = buildTiltShift(withBloom, blurNode);

  const graded = buildWarmGrade(tiltShifted);
  const vignetted = buildVignette(graded);

  const tonemapped = renderOutput(vignetted);

  const pipeline = new RenderPipeline(renderer, tonemapped);
  pipeline.outputColorTransform = false;

  return { pipeline, scenePass, bloomNode, blurNode };
}

function disposeChain(chain: ChainResult | null): void {
  if (!chain) return;
  chain.aoPass?.dispose();
  chain.bloomNode.dispose();
  chain.blurNode.dispose();
  chain.scenePass.dispose();
  chain.pipeline.dispose();
}

export function createPostEffects(renderer: WebGPURenderer, quality: 'high' | 'low'): PostEffects {
  let chain: ChainResult | null = null;
  let currentScene: Scene | null = null;
  let currentCamera: Camera | null = null;

  return {
    render(scene: Scene, camera: Camera): void {
      if (!chain) {
        chain =
          quality === 'high'
            ? buildHighQualityChain(renderer, scene, camera)
            : buildLowQualityChain(renderer, scene, camera);
        currentScene = scene;
        currentCamera = camera;
      } else {
        if (scene !== currentScene) {
          chain.scenePass.scene = scene;
          currentScene = scene;
        }
        if (camera !== currentCamera) {
          chain.scenePass.camera = camera;
          currentCamera = camera;
        }
      }
      chain.pipeline.render();
    },
    dispose(): void {
      disposeChain(chain);
      chain = null;
      currentScene = null;
      currentCamera = null;
    }
  };
}
