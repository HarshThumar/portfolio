"""Bakes the opening's kit assembly with Blender's rigid-body physics.

The 26 kit pieces start scattered round the camera's view, are let go one after another and
are pulled into the centre by a damped spring field. They collide, tumble and pile up into a
cluster the size of the giant ball. Every piece's transform is written per frame to
game/src/opening/kit-flight.json, which the game plays back.

Run: node scripts/bake-opening.mjs   (or: blender -b --python assets-src/opening/kit_flight.py)

Axes: there is no gravity and the field is radial, so the scene is built directly in the
game's axes (three.js, Y up). Positions and quaternions are copied across unchanged.
"""

import json
import math
import os
import random

import bpy
from mathutils import Euler, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
BOUNDS = os.path.join(HERE, "kit-bounds.json")
OUT = os.path.join(ROOT, "game", "src", "opening", "kit-flight.json")

SCALE = 2.0  # the kit is drawn bigger than life so each piece reads at a glance
FPS = 30
SECONDS = 2.8
FRAMES = int(FPS * SECONDS) + 1
# The camera's first position relative to the ball (orbitCamera at t = 0 in opening-pose.ts).
CAMERA = Vector((math.sin(0.4) * 17, 2.5, math.cos(0.4) * 17))
SEED = 7


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.fps = FPS
    scene.frame_start = 1
    scene.frame_end = FRAMES
    bpy.ops.rigidbody.world_add()
    world = scene.rigidbody_world
    world.substeps_per_frame = 10
    world.solver_iterations = 30
    world.point_cache.frame_start = 1
    world.point_cache.frame_end = FRAMES
    scene.gravity = (0.0, 0.0, 0.0)
    return scene


def pick_start(rng):
    cam_dir = CAMERA.normalized()
    for _ in range(60):
        u = rng.uniform(-1, 1)
        a = rng.uniform(0, math.tau)
        s = math.sqrt(1 - u * u)
        d = Vector((math.cos(a) * s, u * 0.7, math.sin(a) * s)).normalized()
        if d.dot(cam_dir) > 0.35:
            continue
        p = d * rng.uniform(16, 28)
        if (p - CAMERA).length > 12:
            return p
    return Vector((0, 0, -24))


def add_piece(info, index, turn, rng):
    sx, sy, sz = (v * SCALE for v in info["size"])
    if info["kind"] == "ball":
        bpy.ops.mesh.primitive_uv_sphere_add(radius=sx / 2, segments=16, ring_count=8)
        shape = "SPHERE"
    else:
        bpy.ops.mesh.primitive_cube_add(size=1)
        obj = bpy.context.active_object
        obj.scale = (sx, sy, sz)
        bpy.ops.object.transform_apply(scale=True)
        shape = "BOX"
    obj = bpy.context.active_object
    obj.name = f"{index:02d}_{info['kind']}"
    obj.rotation_mode = "QUATERNION"
    obj.location = pick_start(rng)
    obj.rotation_quaternion = Euler([rng.uniform(0, math.tau) for _ in range(3)]).to_quaternion()

    bpy.ops.rigidbody.object_add(type="ACTIVE")
    rb = obj.rigid_body
    rb.collision_shape = shape
    rb.mass = 1.0
    rb.friction = 0.7
    rb.restitution = 0.2
    rb.linear_damping = 0.35
    rb.angular_damping = 0.35
    rb.collision_margin = 0.02

    # Held still (kinematic) and drifting gently inward until its release, so the pieces set
    # off one after another instead of all at once.
    release = 1 + int(FPS * (0.05 + turn * 0.028 + rng.random() * 0.1))
    rb.kinematic = True
    obj.keyframe_insert("location", frame=1)
    obj.keyframe_insert("rotation_quaternion", frame=1)
    rb.keyframe_insert("kinematic", frame=1)
    obj.location = obj.location * 0.93
    obj.keyframe_insert("location", frame=release)
    rb.keyframe_insert("kinematic", frame=release)
    rb.kinematic = False
    rb.keyframe_insert("kinematic", frame=release + 1)
    return obj


def add_pull():
    # A damped spring towards the centre: far pieces rush in, then everything slows and packs.
    bpy.ops.object.effector_add(type="HARMONIC", location=(0, 0, 0))
    field = bpy.context.active_object.field
    field.strength = 400.0
    field.harmonic_damping = 0.2
    field.shape = "POINT"


def bake(scene, objects):
    frames = []
    for f in range(1, FRAMES + 1):
        scene.frame_set(f)
        row = []
        for obj in objects:
            m = obj.matrix_world
            loc = m.to_translation()
            q = m.to_quaternion()
            row.append([round(v, 3) for v in (loc.x, loc.y, loc.z)] + [round(v, 4) for v in (q.x, q.y, q.z, q.w)])
        frames.append(row)
    return frames


def main():
    with open(BOUNDS, encoding="utf-8") as fh:
        infos = json.load(fh)["pieces"]
    scene = reset_scene()
    rng = random.Random(SEED)
    # Let go in a shuffled order, so bats, pads and balls arrive mixed together.
    turns = list(range(len(infos)))
    rng.shuffle(turns)
    objects = [add_piece(info, i, turns[i], rng) for i, info in enumerate(infos)]
    add_pull()
    frames = bake(scene, objects)
    # Centre the settled pile on the ball: shift every frame by the pile's final centroid.
    n = len(objects)
    cx, cy, cz = (sum(p[k] for p in frames[-1]) / n for k in range(3))
    for row in frames:
        for p in row:
            p[0], p[1], p[2] = round(p[0] - cx, 3), round(p[1] - cy, 3), round(p[2] - cz, 3)

    last = frames[-1]
    reach = max(Vector(p[:3]).length for p in last)
    print(f"[kit-flight] {len(objects)} pieces, {len(frames)} frames, final reach {reach:.2f} m")

    data = {
        "note": "Generated by assets-src/opening/kit_flight.py. Do not edit by hand.",
        "fps": FPS,
        "scale": SCALE,
        "kinds": [info["kind"] for info in infos],
        "centres": [info["centre"] for info in infos],
        # frames[f][piece] = [x, y, z, qx, qy, qz, qw] of the piece's bounding-box centre.
        "frames": frames,
    }
    with open(OUT, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(data, fh, separators=(",", ":"))
        fh.write("\n")
    print(f"[kit-flight] wrote {OUT}")


main()
