import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateRitual, validateLibrary } from '../js/validation.js';
test('all published rituals validate without changing their format', () => {
  for (const f of JSON.parse(readFileSync('rituals/index.json'))) {
    const r = JSON.parse(readFileSync('rituals/' + f));
    assert.equal(validateRitual(r), r);
  }
});
test('reject malformed, cyclic, missing, unsafe and unbounded input', () => {
  const make = steps => ({ format: 'virtual-rites/1', id: 'test', title: 'Test', steps });
  for (const r of [null, {}, make([]), make([null]), make([{ duration: -1 }]), make([{ actions: {} }]), make([{ use: 'missing' }]),
    { ...make([{ use: 'loop' }]), sequences: { loop: [{ use: 'loop' }] } },
    make([{ actions: [JSON.parse('{"do":"circle","__proto__":{}}')] }]), make(Array(4097).fill({})),
    make([{ actions: [{ do: 'line', degrees: 1e9 }] }]), make([{ actions: [{ do: 'burst', colors: [] }] }]),
    { ...make([{ use: 'empty' }]), sequences: { empty: [] } }]) {
    assert.throws(() => validateRitual(r));
  }
  assert.throws(() => validateRitual(make([{ actions: [{ do: 'unknown' }] }]), { circle() {} }));
  assert.throws(() => validateLibrary(['../bad.json'], 'json'));
  assert.deepEqual(validateLibrary(['daily-draw.json'], 'json'), ['daily-draw.json']);
});
