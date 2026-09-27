import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';
import { createNatureActivity } from '../components/vr/natureActivities.ts';

function create(kind, id) {
  const scene = new THREE.Scene();
  const group = new THREE.Group(); scene.add(group);
  const target = new THREE.Vector3(0, 1.2, -2.8);
  const activity = createNatureActivity(kind, id, group, scene, target, '#398267');
  return { scene, group, target, activity };
}

test('same observation interval produces wet-warm > wet-cold > dry seed growth', () => {
  const samples = [0, 1, 2].map(id => create('seed', id));
  for (const { activity } of samples) {
    assert.equal(activity.update(0), false);
    assert.equal(activity.update(6), false);
    assert.equal(activity.update(7), true);
  }
  const growth = samples.map(({ group }) => group.children.find(child => child.isGroup));
  assert.equal(growth[0].scale.x, 1);
  assert.equal(growth[1].visible, false);
  assert.equal(growth[2].scale.x, 0.12);
});

test('dyed water changes petals while the clear-water control stays white', () => {
  for (const id of [0, 1, 2]) {
    const { group, activity } = create('plant', id);
    const petals = group.children.filter(child => child.isMesh && child.geometry.type === 'SphereGeometry' && child.position.y > 0.9 && child.scale.y === 1.55);
    assert.equal(petals.length, 10);
    const original = petals[0].material.color.clone();
    assert.equal(activity.update(0), false);
    assert.equal(activity.update(7), true);
    assert.equal(petals[0].material.color.equals(original), id === 2);
    assert.ok(petals.every(petal => petal.material.color.equals(petals[0].material.color)));
  }
});

test('paint pairs finish with distinct representative pigment colors and hide pouring tools', () => {
  for (const [id, color] of ['#eb892e', '#55a568', '#9868ac'].entries()) {
    const { scene, group, activity } = create('color', id);
    assert.equal(activity.update(1), false);
    assert.equal(group.visible, true);
    assert.equal(activity.update(5.5), true);
    assert.equal(group.visible, false);
    const paint = scene.children.find(child => child.isMesh && child.geometry.parameters?.height === 0.025);
    assert.equal(paint.visible, true);
    assert.equal(paint.material.color.getHexString(), new THREE.Color(color).getHexString());
  }
});

test('all nine trials keep finite geometry and transforms throughout their animations', () => {
  for (const kind of ['seed', 'plant', 'color']) for (let id = 0; id < 3; id++) {
    const { scene, activity, target } = create(kind, id);
    assert.ok(target.y >= 1 && target.y < 2);
    for (const seconds of [0, 0.5, 1.7, 3.5, 7, 10]) {
      activity.update(seconds);
      scene.updateMatrixWorld(true);
      scene.traverse(object => {
        assert.ok(object.matrixWorld.elements.every(Number.isFinite));
        if (object.isMesh) assert.ok(Array.from(object.geometry.attributes.position.array).every(Number.isFinite));
      });
    }
    scene.traverse(object => {
      if (object.isMesh) { object.geometry.dispose(); object.material.dispose(); }
    });
  }
});
