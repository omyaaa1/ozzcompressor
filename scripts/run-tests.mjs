import assert from "node:assert/strict";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toleranceFactor(pct) {
  return 1 + clamp(pct, 0, 10) / 100;
}

function qualityFloor(pct) {
  return clamp(pct, 10, 95) / 100;
}

assert.equal(clamp(5, 0, 10), 5);
assert.equal(clamp(-2, 0, 10), 0);
assert.equal(clamp(20, 0, 10), 10);

assert.equal(toleranceFactor(2), 1.02);
assert.equal(toleranceFactor(-10), 1);
assert.equal(toleranceFactor(20), 1.1);

assert.equal(qualityFloor(35), 0.35);
assert.equal(qualityFloor(5), 0.1);
assert.equal(qualityFloor(200), 0.95);

console.log("All tests passed.");
