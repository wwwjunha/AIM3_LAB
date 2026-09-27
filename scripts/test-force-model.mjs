import assert from 'node:assert/strict';
import test from 'node:test';
import { travelDistance } from '../lib/forceModel.ts';

test('the same conditions always produce the same distance', () => {
  assert.equal(travelDistance('light', 70), 59);
  assert.equal(travelDistance('heavy', 70), 36);
  assert.equal(travelDistance('light', 70), travelDistance('light', 70));
});

test('changing only mass or force changes distance in the expected direction', () => {
  for (const force of [20, 35, 55, 70, 90]) {
    assert.ok(travelDistance('light', force) > travelDistance('heavy', force));
  }
  for (const mass of ['light', 'heavy']) {
    const distances = [20, 35, 55, 70, 90].map((force) => travelDistance(mass, force));
    assert.deepEqual(distances, distances.toSorted((a, b) => a - b));
    assert.ok(distances.every((distance) => Number.isInteger(distance) && distance >= 0 && distance <= 80));
  }
});

test('all three challenge targets can be reached without exact force values', () => {
  for (const target of [20, 35, 48]) {
    for (const mass of ['light', 'heavy']) {
      assert.ok(Array.from({ length: 71 }, (_, index) => index + 20).some((force) => Math.abs(travelDistance(mass, force) - target) <= 3), `${mass} can reach ${target}`);
    }
  }
});
