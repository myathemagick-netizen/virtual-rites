import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = path => readFileSync(new URL('../'+path, import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

test('all illustrated cards have public-domain provenance and unchanged bytes', () => {
  const deck=JSON.parse(read('assets/tarot/provenance.json'));
  assert.equal(deck.cards.length,78);
  assert.equal(new Set(deck.cards.map(c=>c.id)).size,78);
  for (const card of deck.cards) {
    assert.equal(card.license,'Public domain');
    assert.equal(card.metadata.Copyrighted.value.toLowerCase(),'false');
    assert.equal(hash(read('assets/tarot/'+card.file)),card.sha256);
    assert.deepEqual(card.size,[512,884]);
  }
});

test('hero oak matches its static validation receipt and embeds its resources', () => {
  const receipt=JSON.parse(read('assets/models/grove-oak/validation.json'));
  const bytes=read('assets/models/grove-oak/tree.glb');
  assert.equal(hash(bytes),receipt.sha256);
  assert.equal(bytes.readUInt32LE(0),0x46546c67);
  assert.equal(bytes.readUInt32LE(4),2);
  assert.equal(bytes.readUInt32LE(8),bytes.length);
  const doc=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  assert.ok(doc.buffers.every(b=>!b.uri)); assert.ok(doc.images.every(i=>!i.uri));
  assert.ok(receipt.passed); assert.ok(receipt.triangles<=25000);
  assert.ok(receipt.textures.every(size=>Math.max(...size)<=2048));
});
