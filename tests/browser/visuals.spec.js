import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';

test('ritual visual detail, trace reveal, quiet modes and repeated cleanup', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' || /action failed|shader error/i.test(m.text())) errors.push(m.text()); });
  await page.goto('./'); await page.waitForFunction(() => !!window.VR?.ready); await page.evaluate(() => VR.ready);
  await page.evaluate(() => {
    VR.renderer.setAnimationLoop(null);
    VR.settings.sound = false; VR.settings.narration = false;
    document.querySelectorAll('.screen').forEach(s => s.classList.add('off'));
    VR.loadWorld('room');
    VR.camera.position.set(0, 1.9, -.2); VR.camera.lookAt(0, 1.7, -3.2);
    VR.camera.getWorldPosition(VR.EYE);
    VR.fx.run([{ do: 'pentagram', quarter: 'east', type: 'banishing-earth', color: '#4cc3ff' }], { face: 90 });
    VR.finishTweens(); VR.fx.update(.016, 3.5);
    VR.renderer.render(VR.scene, VR.camera);
  });
  await page.screenshot({ path: testInfo.outputPath('flaming-pentagram.png') });
  const reveal = await page.evaluate(() => {
    const p = VR.fx.state.pents['90'];
    p.tr.userData.set(.5); p.fl.userData.update(1, .5);
    const ranges = p.tr.children.filter(o => o.isMesh).map(o => o.geometry.drawRange.count);
    return { ranges, reveal: p.fl.userData.uniforms.uReveal.value };
  });
  expect(reveal).toEqual({ ranges: [4320, 5760], reveal: .5 });
  const quiet = await page.evaluate(() => {
    const flame = VR.fx.state.pents['90'].fl;
    VR.settings.intensity = 'low'; VR.fx.update(.1, 50);
    const low = !flame.visible && flame.userData.uniforms.uMotion.value === 0;
    VR.settings.intensity = 'full'; VR.reducedMotion = true; VR.fx.update(.1, 60);
    const reduced = !flame.visible;
    VR.reducedMotion = false; VR.settings.simplified = true; VR.fx.update(.1, 70);
    const simple = !flame.visible;
    VR.settings.simplified = false;
    return { low, reduced, simple };
  });
  expect(quiet).toEqual({ low: true, reduced: true, simple: true });
  await page.evaluate(() => {
    VR.fx.reset();
    VR.fx.run([{ do: 'guardian', quarter: 'east', name: 'Raphael', colors: ['#ffd84a', '#b67cff'], attribute: 'wand' }], { face: 90 });
    VR.finishTweens(); VR.fx.update(.016, 3);
    VR.camera.position.set(0, 3.6, 1); VR.camera.lookAt(0, 3.4, -6.8);
    VR.camera.getWorldPosition(VR.EYE); VR.renderer.render(VR.scene, VR.camera);
  });
  await page.screenshot({ path: testInfo.outputPath('guardian-raphael.png') });
  const resources = await page.evaluate(() => {
    const render = () => VR.renderer.render(VR.scene, VR.camera);
    const ctx = { face: 90 };
    VR.fx.reset(); render(); const warm = VR.resourceSnapshot();
    let featherCount = 0;
    for (let i = 0; i < 5; i++) {
      VR.fx.run([{ do: 'guardian', quarter: 'east', attribute: 'sword' }, { do: 'pentagram', quarter: 'east' }], ctx);
      VR.finishTweens(); VR.fx.update(.016, 3); render();
      VR.fx.state.guardians['90'].traverse(o => { if (o.isInstancedMesh) featherCount += o.count; });
      VR.fx.reset(); render();
    }
    return { warm, end: VR.resourceSnapshot(), featherCount };
  });
  expect(resources.featherCount).toBe(320);
  expect(resources.end.geometries).toBe(resources.warm.geometries);
  expect(resources.end.textures).toBe(resources.warm.textures);
  writeFileSync(testInfo.outputPath('visual-resource-counters.json'), JSON.stringify(resources, null, 2));
  expect(errors).toEqual([]);
});
