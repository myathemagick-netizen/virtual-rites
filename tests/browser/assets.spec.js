import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';

async function start(page) {
  await page.goto('./'); await page.waitForFunction(() => !!window.VR?.ready); await page.evaluate(() => VR.ready);
  await page.evaluate(() => {
    VR.renderer.setAnimationLoop(null);
    VR.settings.sound = false;
    document.querySelectorAll('.screen').forEach(s => s.classList.add('off'));
  });
}

test('illustrated deck loads every face, preserves reversals and releases GPU resources', async ({ page }, info) => {
  test.setTimeout(90000); await start(page);
  const faces = await page.evaluate(async () => {
    await VR.tarot.loadDeckInfo();
    return Promise.all(VR.tarot.deck.map(async card => {
      const image = new Image(); image.src = VR.assetURL(`assets/tarot/${card.id}.webp`); await image.decode();
      return { id: card.id, width: image.naturalWidth, height: image.naturalHeight };
    }));
  });
  expect(faces).toHaveLength(78); expect(faces.every(f => f.width === 512 && f.height === 884)).toBe(true);
  await page.evaluate(() => {
    VR.loadWorld('room'); VR.fx.reset();
    VR.camera.position.set(0, 2.6, 2); VR.camera.lookAt(0, 2, -2);
    window.artCards = [0, 1, 17, 22, 36, 50, 64].map((index, i) => {
      const card = VR.tarot.mesh({ ...VR.tarot.deck[index], reversed: i === 6 });
      card.position.set((i-3)*.76, 2, -2); VR.fx.state.root.add(card); return card;
    });
  });
  await page.waitForFunction(() => artCards.every(c => c.userData.mats[0].userData.illustrated));
  expect(await page.evaluate(() => artCards[6].userData.inner.rotation.z)).toBe(Math.PI);
  await page.evaluate(() => VR.renderer.render(VR.scene, VR.camera));
  await page.screenshot({ path: info.outputPath('illustrated-tarot.png') });
  const resources = await page.evaluate(async () => {
    const render = () => VR.renderer.render(VR.scene, VR.camera);
    artCards.forEach(c => { VR.disposeGroup(c); c.removeFromParent(); }); render();
    const warm = VR.resourceSnapshot();
    for (let i=0; i<5; i++) {
      const card = VR.tarot.mesh(VR.tarot.deck[i]); VR.fx.state.root.add(card);
      while (!card.userData.mats[0].userData.illustrated) await new Promise(r => setTimeout(r, 20));
      render(); VR.disposeGroup(card); card.removeFromParent(); render();
    }
    return { warm, end: VR.resourceSnapshot() };
  });
  expect(resources.end.textures).toBe(resources.warm.textures);
  expect(resources.end.geometries).toBe(resources.warm.geometries);
});

test('Grove GLB renders, stays outside the clearing, tears down and has simplified fallback', async ({ page }, info) => {
  await start(page);
  const result = await page.evaluate(async () => {
    VR.settings.grovePrototype = true; VR.loadWorld('grove', true);
    const hero = VR.world.inst.heroTree; await hero.userData.ready;
    let clearance=Infinity, count=0; const matrix=new THREE.Matrix4();
    hero.traverse(o=>{if(!o.isInstancedMesh)return;count+=o.count;o.geometry.computeBoundingBox();
      for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);const box=o.geometry.boundingBox.clone().applyMatrix4(matrix);
        clearance=Math.min(clearance,Math.hypot(Math.max(box.min.x,Math.min(0,box.max.x)),Math.max(box.min.z,Math.min(0,box.max.z))));}});
    let triangles=0, meshes=0;
    hero.traverse(o => { if (o.isMesh) { meshes++; triangles += (o.geometry.index?.count || o.geometry.attributes.position.count)/3; } });
    const focus=VR.dir(185).multiplyScalar(18.5); VR.camera.position.copy(VR.dir(185).multiplyScalar(5)).setY(4); VR.camera.lookAt(focus.x,5.5,focus.z);
    VR.renderer.render(VR.scene, VR.camera);
    return { status: hero.userData.status, clearance, height: hero.userData.height, triangles, meshes, count, resources: VR.resourceSnapshot() };
  });
  expect(result.status).toBe('ready'); expect(result.clearance).toBeGreaterThan(12.5);
  expect(result.triangles).toBeLessThanOrEqual(25000);
  expect(result.count).toBe(18);
  await page.screenshot({ path: info.outputPath('grove-hero-oak.png') });
  const cleanup = await page.evaluate(async () => {
    const render = () => VR.renderer.render(VR.scene, VR.camera);
    VR.loadWorld('room'); render(); const warm=VR.resourceSnapshot();
    for (let i=0;i<3;i++) {
      VR.loadWorld('grove'); await VR.world.inst.heroTree.userData.ready; render();
      VR.loadWorld('room'); render();
    }
    const end=VR.resourceSnapshot(); VR.settings.simplified=true; VR.loadWorld('grove');
    return { warm, end, simplified: VR.world.inst.heroTree === null };
  });
  expect(cleanup.end.textures).toBe(cleanup.warm.textures);
  expect(cleanup.end.geometries).toBe(cleanup.warm.geometries);
  expect(cleanup.simplified).toBe(true);
  writeFileSync(info.outputPath('asset-resources.json'), JSON.stringify({result,cleanup},null,2));
});

test('late tree load is discarded after leaving its world', async ({ page }) => {
  await start(page);
  await page.route('**/tree.glb', async route => {
    const response = await route.fetch(); await new Promise(r => setTimeout(r, 300)); await route.fulfill({response});
  });
  const late = await page.evaluate(async () => {
    VR.loadWorld('grove', true); const hero=VR.world.inst.heroTree;
    VR.loadWorld('room'); await hero.userData.ready;
    return { detached: hero.parent === null, empty: hero.children.length === 0, world: VR.world.def.id };
  });
  expect(late).toEqual({detached:true,empty:true,world:'room'});
});

test('unavailable card and model assets retain procedural fallbacks', async ({ page }) => {
  await page.route('**/tree.glb', route => route.fulfill({status:404,body:'Unavailable'}));
  await page.route('**/major-00.webp', route => route.fulfill({status:404,body:'Unavailable'}));
  await start(page);
  const fallback = await page.evaluate(async () => {
    VR.loadWorld('grove', true); const hero=VR.world.inst.heroTree;
    await hero.userData.ready;
    const card=VR.tarot.mesh(VR.tarot.deck[0]); VR.scene.add(card);
    await new Promise(r => setTimeout(r, 200));
    VR.renderer.render(VR.scene,VR.camera);
    const result={tree:hero.userData.status,proceduralTree:hero.userData.fallback.visible,
      proceduralFace:card.userData.mats[0].map.image instanceof HTMLCanvasElement};
    VR.disposeGroup(card); card.removeFromParent(); return result;
  });
  expect(fallback).toEqual({tree:'fallback',proceduralTree:true,proceduralFace:true});
});
