import assert from "node:assert/strict";
import test from "node:test";
import { codDecision } from "./cod";

test("cash on delivery stays available when every product allows it", () => {
  const result = codDecision([
    { name: "Door wedge", codAllowed: true },
    { name: "Seal strip", codAllowed: true },
  ]);
  assert.equal(result.allowed, true);
  assert.deepEqual(result.blocked, []);
});

test("one prepaid product blocks cash on delivery for the whole order", () => {
  const result = codDecision([
    { name: "Door wedge", codAllowed: true },
    { name: "Tri-Ply Stainless Kadai, 24 cm", codAllowed: false },
  ]);
  assert.equal(result.allowed, false);
  assert.deepEqual(result.blocked, ["Tri-Ply Stainless Kadai, 24 cm"]);
  assert.match(result.message || "", /Tri-Ply Stainless Kadai/);
});
