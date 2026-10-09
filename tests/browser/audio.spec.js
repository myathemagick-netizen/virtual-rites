import { test, expect } from '@playwright/test';

test('exit closes drone, notes and reverb; resume starts fresh audio', async ({ page }) => {
  await page.goto('./');
  await page.waitForFunction(() => !!window.VR?.ready); await page.evaluate(() => VR.ready);
  await page.evaluate(() => { VR.settings.sound = true; VR.settings.narration = false; });
  await page.locator('#toIntent').click();
  await page.locator('[data-mode="practice"]').click();
  await page.locator('#beginBtn').click();
  await expect.poll(() => page.evaluate(() => VR.audio.ctx?.state)).toBe('running');
  await page.evaluate(() => {
    window.exitedAudio = VR.audio.ctx;
    VR.audio.chord([220, 330, 440], 10);
    VR.audio.vibrate(110, 8);
    VR.audio.tone(196, 12);
  });
  await page.locator('#condBtn').click();
  await page.locator('#saveLeaveBtn').click();
  await expect(page.locator('#home')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.exitedAudio.state)).toBe('closed');
  expect(await page.evaluate(() => [VR.audio.active, VR.audio.ctx])).toEqual([false, null]);
  // Neither changing sound nor a delayed effect should start audio on the menu.
  expect(await page.evaluate(() => {
    VR.audio.init(); VR.audio.setOn(); VR.audio.bell(440); VR.audio.duck(false);
    return VR.audio.ctx;
  })).toBeNull();
  await page.locator('[data-a="resume"]').click();
  await expect.poll(() => page.evaluate(() => VR.audio.ctx?.state)).toBe('running');
  expect(await page.evaluate(() => VR.audio.ctx !== window.exitedAudio)).toBe(true);
  await page.evaluate(() => { window.finishedAudio = VR.audio.ctx; VR.audio.chord([220, 330], 10); });
  await page.locator('#condBtn').click();
  await page.locator('#endBtn').click();
  await expect(page.locator('#after')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.finishedAudio.state)).toBe('closed');
  await page.locator('#discardEntry').click();
  await expect(page.locator('#home')).toBeVisible();
  expect(await page.evaluate(() => [VR.audio.active, VR.audio.ctx])).toEqual([false, null]);
  await page.locator('#openSettings').click();
  await page.locator('#set-sound').uncheck();
  await page.locator('#set-sound').check();
  expect(await page.evaluate(() => VR.audio.ctx)).toBeNull();
  await page.locator('#settings [data-home]').click();
  await page.locator('#toIntent').click();
  await page.locator('#beginBtn').click();
  await expect.poll(() => page.evaluate(() => VR.audio.ctx?.state)).toBe('running');
});
