import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';
import { createPushModel, createFoundationActivity } from '../components/vr/foundationActivities.ts';

function create(kind, id) {
  const scene = new THREE.Scene(), group = new THREE.Group(); scene.add(group);
  const target = new THREE.Vector3(0, 1.23, -2.8);
  return { scene, group, target, activity: createFoundationActivity(kind, id, group, scene, target, '#388c9b') };
}

test('equal force moves the lighter box farther and frame cadence does not change the result', () => {
  const light = createPushModel(1).update(6), heavy = createPushModel(3).update(6);
  assert.ok(light > heavy && heavy > 0);
  assert.ok(light < 2.4);
  for (const fps of [30, 60, 90]) {
    const model = createPushModel(1);
    for (let n = 0; n <= fps * 6; n++) model.update(n / fps);
    assert.ok(Math.abs(model.update(6) - light) < 1e-10);
  }
});

test('water retains equal volume in tall and wide vessels, with lower height in the wide bowl', () => {
  const volumes = [], heights = [];
  for (const id of [0, 1]) {
    const { scene, activity, group } = create('matter', id);
    assert.equal(activity.update(0), false);
    const source = group.children.find(item => item.geometry?.parameters?.height === 0.72);
    const originalVolume = Math.PI * source.geometry.parameters.radiusTop ** 2 * 0.72;
    activity.update(1.8);
    const midway = scene.children.find(item => item.userData.volume);
    assert.ok(Math.abs(originalVolume * source.scale.y + midway.userData.volume * midway.scale.y - originalVolume) < 1e-10);
    assert.equal(activity.update(4), true);
    const water = scene.children.find(item => item.userData.volume);
    const { radiusTop, height } = water.geometry.parameters;
    volumes.push(Math.PI * radiusTop ** 2 * height * water.scale.y);
    heights.push(height); assert.equal(group.visible, false);
  }
  assert.ok(Math.abs(volumes[0] - volumes[1]) < 1e-10);
  assert.ok(heights[0] > heights[1]);
});

test('moving a stone between containers changes its position but not its shape or scale', () => {
  const rocks = [];
  for (const id of [2, 3]) {
    const { group, activity } = create('matter', id);
    const rock = group.children[0], before = Array.from(rock.geometry.attributes.position.array);
    activity.update(0.5); assert.equal(activity.update(2), true);
    assert.deepEqual(Array.from(rock.geometry.attributes.position.array), before);
    assert.deepEqual(group.scale.toArray(), [1, 1, 1]); rocks.push(before);
  }
  assert.deepEqual(rocks[0], rocks[1]);
});

test('equal rain completes both slopes while the steep model transports more sediment', () => {
  const moved = [0, 1].map(id => {
    const { group, activity } = create('earth', id);
    assert.equal(activity.update(5.5), false);
    assert.equal(activity.update(6), true);
    return group.userData.movedGrains;
  });
  assert.ok(moved[1] > moved[0] && moved[0] > 0);
});

test('all foundation trial geometries and animated transforms remain finite', () => {
  for (const kind of ['force', 'matter', 'earth']) for (let id = 0; id < (kind === 'matter' ? 4 : 2); id++) {
    const { scene, activity } = create(kind, id);
    for (const t of [0, 0.4, 1, 3, 6, 10]) {
      activity.update(t); scene.updateMatrixWorld(true);
      scene.traverse(object => {
        assert.ok(object.matrixWorld.elements.every(Number.isFinite));
        if (object.isMesh) assert.ok(Array.from(object.geometry.attributes.position.array).every(Number.isFinite));
      });
    }
    scene.traverse(object => { if (object.isMesh) { object.geometry.dispose(); object.material.dispose(); } });
  }
});
