import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';

test('desktop libraries, rituals, replay, session resume and resource stability', async ({ page }, testInfo) => {
  test.setTimeout(180000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => {
    if (msg.type() === 'error' || /action failed|world failed|unknown action|shader error/i.test(msg.text())) errors.push(msg.text());
  });
  await page.goto('./');
  await page.waitForFunction(() => !!window.VR?.ready); await page.evaluate(() => VR.ready);
  await expect(page.locator('#riteList button')).toHaveCount(4);
  await expect(page.locator('#worldList button')).toHaveCount(5);
  await page.evaluate(() => { VR.settings.sound = false; VR.settings.narration = false; });
  const diagnostics = await page.evaluate(async () => {
    const frame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const result = [];
    for (const simplified of [false, true]) for (const id of VR.worldOrder) {
      VR.settings.simplified = simplified;
      VR.loadWorld(id, true);
      await frame();
      result.push({ id, simplified, ...VR.resourceSnapshot() });
    }
    VR.settings.simplified = false;
    for (const ritual of VR.app.state.rituals) {
      const p = VR.player;
      p.guided = false;
      p.load(ritual, { ritual: { id: ritual.id, title: ritual.title }, ritualFile: ritual.file,
        world: 'room', worldName: 'Practice Room', mode: 'practice', energy: 'full',
        sigil: VR.sigil.make('It is my will to test'), marks: [], draws: [] });
      p.start();
      for (let i = 0; i < p.steps.length; i++) {
        p.go(i); VR.finishTweens(); await frame();
        p.repeat(); VR.finishTweens(); await frame();
      }
      p.leave(true);
      const saved = VR.store.get('progress');
      if (saved.si !== p.si || saved.ritualFile !== ritual.file) throw new Error('Progress was not saved');
      p.load(ritual, saved.session); p.start(saved.si); p.next(); VR.finishTweens();
      if (p.si !== saved.si) throw new Error('Resume index mismatch');
      p.leave(false); VR.fx.reset();
    }
    VR.loadWorld('room'); VR.fx.reset(); await frame();
    const warm = VR.resourceSnapshot();
    for (let i = 0; i < 6; i++) {
      VR.loadWorld('grove'); VR.fx.reset(); await frame();
      VR.loadWorld('room'); VR.fx.reset(); await frame();
    }
    const end = VR.resourceSnapshot();
    if (end.geometries > warm.geometries || end.textures > warm.textures) throw new Error('Resources grew across world/reset cycles');
    return { worlds: result, warm, end };
  });
  await testInfo.attach('GPU resource counters', { body: JSON.stringify(diagnostics, null, 2), contentType: 'application/json' });
  writeFileSync(testInfo.outputPath('resource-counters.json'), JSON.stringify(diagnostics, null, 2));
  await page.locator('#riteList button').first().click();
  await page.locator('#toIntent').click();
  await page.locator('[data-mode="practice"]').click();
  await page.locator('#beginBtn').click();
  await expect(page.locator('#stage')).toBeVisible();
  await page.locator('#nextBtn').click();
  await page.locator('#repeatBtn').click();
  await page.locator('[data-cam="fp"]').click();
  await page.locator('[data-cam="witness"]').click();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: testInfo.outputPath('desktop-rite.png'), fullPage: true });
  await page.locator('#condBtn').click();
  await page.locator('#saveLeaveBtn').click();
  await page.reload(); await page.waitForFunction(() => !!window.VR?.ready); await page.evaluate(() => VR.ready);
  await page.locator('[data-a="resume"]').click();
  await expect(page.locator('#stage')).toBeVisible();
  expect(errors).toEqual([]);
});

test('disposal ownership, journal and accessibility storage', async ({ page }) => {
  await page.goto('./'); await page.waitForFunction(() => !!window.VR?.ready); await page.evaluate(() => VR.ready);
  const result = await page.evaluate(() => {
    const card = VR.tarot.mesh(VR.tarot.deck[0]);
    const second = VR.tarot.mesh(VR.tarot.deck[1]);
    const back = card.userData.mats[1].map;
    let backDisposed = 0, frontDisposed = 0, geoDisposed = 0;
    back.addEventListener('dispose', () => backDisposed++);
    card.userData.mats[0].map.addEventListener('dispose', () => frontDisposed++);
    const geo = card.userData.inner.children.find(o => o.isMesh).geometry;
    geo.addEventListener('dispose', () => geoDisposed++);
    const child = card.children[0];
    VR.disposeGroup(card);
    const detached = child.parent === null;
    VR.disposeGroup(second);
    VR.fx.run([{ do: 'guardian', quarter: 'east', name: 'Test' }], { face: 90, skip: true });
    VR.finishTweens();
    let wingsDisposed = 0;
    const wing = [...VR.sharedTextures].find(t => t !== VR.GLOW && t !== back);
    if (!wing) throw new Error('Guardian cache not registered');
    wing.addEventListener('dispose', () => wingsDisposed++);
    VR.fx.reset();
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(), new THREE.MeshBasicMaterial());
    let rootDisposed = false;
    mesh.material.addEventListener('dispose', () => rootDisposed = true);
    VR.disposeGroup(mesh);
    const keys = Object.keys(VR.settings);
    VR.settings.intensity = 'low'; VR.settings.simplified = true; VR.saveSettings();
    const preserved = VR.store.get('settings');
    const session = { id: 'journal-test', ritual: { id: 'test', title: 'Test' }, marks: [], draws: [], createdAt: new Date().toISOString() };
    VR.journal.save(session);
    return { backDisposed, wingsDisposed, frontDisposed, geoDisposed, detached, rootDisposed,
      settings: keys.every(k => Object.hasOwn(preserved, k)), journal: VR.journal.all()[0].id };
  });
  expect(result).toEqual({ backDisposed: 0, wingsDisposed: 0, frontDisposed: 1, geoDisposed: 1, detached: true,
    rootDisposed: true, settings: true, journal: 'journal-test' });
  await page.reload(); await page.waitForFunction(() => !!window.VR?.ready); await page.evaluate(() => VR.ready);
  expect(await page.evaluate(() => [VR.settings.intensity, VR.settings.simplified, VR.journal.all()[0].id]))
    .toEqual(['low', true, 'journal-test']);
});

test('Grove prototype stays clear, batches resources and provides quiet fallbacks', async ({ page }, testInfo) => {
  await page.goto('./'); await page.waitForFunction(() => !!window.VR?.ready); await page.evaluate(() => VR.ready);
  const metrics = await page.evaluate(async () => {
    const frame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    VR.settings.grovePrototype = false; VR.loadWorld('grove', true); await frame();
    const original = VR.resourceSnapshot();
    VR.settings.grovePrototype = true; VR.loadWorld('grove', true); await frame();
    const prototype = VR.resourceSnapshot();
    const caps = VR.worldGroup.children.find(o => o.isInstancedMesh);
    const matrix = new THREE.Matrix4(), p = new THREE.Vector3(); let minRadius = Infinity;
    for (let i = 0; i < caps.count; i++) { caps.getMatrixAt(i, matrix); p.setFromMatrixPosition(matrix); minRadius = Math.min(minRadius, Math.hypot(p.x, p.z)); }
    VR.settings.intensity = 'low'; VR.settings.simplified = true;
    VR.loadWorld('grove', true); await frame();
    let lights = 0; VR.worldGroup.traverse(o => { if (o.isPointLight) lights++; });
    const quiet = { lights, count: VR.worldGroup.children.find(o => o.isInstancedMesh).count };
    VR.settings.intensity = 'full'; VR.settings.simplified = false; VR.loadWorld('grove', true);
    await frame(); const warm = VR.resourceSnapshot();
    for (let i = 0; i < 4; i++) { VR.loadWorld('grove', true); await frame(); }
    return { original, prototype, minRadius, quiet, warm, end: VR.resourceSnapshot() };
  });
  expect(metrics.prototype.calls).toBeLessThan(metrics.original.calls);
  expect(metrics.minRadius).toBeGreaterThan(12);
  expect(metrics.quiet).toEqual({ lights: 0, count: 12 });
  expect(metrics.end.geometries).toBe(metrics.warm.geometries);
  expect(metrics.end.textures).toBe(metrics.warm.textures);
  writeFileSync(testInfo.outputPath('grove-counters.json'), JSON.stringify(metrics, null, 2));
  await testInfo.attach('Grove counters', { body: JSON.stringify(metrics, null, 2), contentType: 'application/json' });
  // Let the desktop camera settle before capturing.
  await page.waitForTimeout(1800);
  await page.evaluate(() => document.querySelectorAll('.screen').forEach(s => s.classList.add('off')));
  await page.screenshot({ path: testInfo.outputPath('grove-prototype.png'), fullPage: true });
});

test('WebGL2 startup failure displays an accessible notice', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type === 'webgl2' ? null : original.call(this, type, ...args);
    };
  });
  await page.goto('./');
  await expect(page.locator('#notices[role="alert"]')).toContainText('requires WebGL2');
  await expect(page.locator('#toIntent')).toBeDisabled();
});

test('malformed ritual is excluded while other rituals load', async ({ page }) => {
  await page.route('**/rituals/lbrp.json', route => route.fulfill({
    json: { format: 'virtual-rites/1', id: 'broken', title: 'Broken', steps: [{ use: 'missing' }] }
  }));
  await page.goto('./'); await page.waitForFunction(() => !!window.VR?.ready); await page.evaluate(() => VR.ready);
  await expect(page.locator('#riteList button')).toHaveCount(3);
  await expect(page.locator('#toast')).toContainText('lbrp.json');
});
