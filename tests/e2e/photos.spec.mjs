import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import ts from 'typescript';

// Run the actual platform module in the browser without shipping a test-only route.
const transpile = (name) => ts.transpileModule(readFileSync(new URL(`../../src/private/${name}`, import.meta.url), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const moduleUrl = (code) => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const types = moduleUrl(transpile('photos.types.ts'));
const core = moduleUrl(transpile('photos.core.ts').replaceAll('./photos.types.ts', types));
const photoModule = moduleUrl(transpile('photos.web.ts').replaceAll('./photos.types.ts', types).replaceAll('./photos.core.ts', core));

test('photo re-encoding preserves EXIF orientation and removes metadata before any upload', async ({ page }) => {
  const network = [];
  page.on('request', (request) => { if (/^https?:/.test(request.url())) network.push(request.url()); });
  const result = await page.evaluate(async ({ photoModule }) => {
    const { preparePhoto } = await import(photoModule);
    const canvas = document.createElement('canvas');
    canvas.width = 40; canvas.height = 20;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red'; ctx.fillRect(0, 0, 20, 20);
    ctx.fillStyle = 'blue'; ctx.fillRect(20, 0, 20, 20);
    const source = new Uint8Array(await (await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 1))).arrayBuffer());
    const exif = [69, 120, 105, 102, 0, 0, 73, 73, 42, 0, 8, 0, 0, 0, 1, 0, 18, 1, 3, 0, 1, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0];
    const gps = [...new TextEncoder().encode('GPSLatitude=52.23;GPSLongitude=21.01;owner=synthetic')];
    const app1 = [255, 225, 0, exif.length + 2, ...exif];
    const comment = [255, 254, 0, gps.length + 2, ...gps];
    const file = new File([new Uint8Array([255, 216, ...app1, ...comment, ...source.slice(2)])], 'synthetic.jpg', { type: 'image/jpeg' });
    const photo = await preparePhoto(file);
    const originalUnchanged = (await file.arrayBuffer()).byteLength === source.length + app1.length + comment.length;
    const bitmap = await createImageBitmap(new Blob([photo.main.bytes], { type: 'image/jpeg' }));
    canvas.width = bitmap.width; canvas.height = bitmap.height;
    ctx.drawImage(bitmap, 0, 0);
    const top = Array.from(ctx.getImageData(10, 5, 1, 1).data);
    const bottom = Array.from(ctx.getImageData(10, 35, 1, 1).data);
    const output = {
      width: photo.main.width, height: photo.main.height, top, bottom, originalUnchanged,
      metadataRemoved: !/Exif|GPSLatitude|GPSLongitude|owner=/.test(new TextDecoder().decode(photo.main.bytes)),
      size: photo.main.size, thumbnailSize: photo.thumbnail.size,
    };
    const previewUrl = photo.previewUri;
    await fetch(previewUrl);
    photo.dispose();
    output.zeroed = photo.main.bytes.every((value) => value === 0) && photo.thumbnail.bytes.every((value) => value === 0);
    output.revoked = await fetch(previewUrl).then(() => false, () => true);
    bitmap.close();
    return output;
  }, { photoModule });
  expect(result).toMatchObject({ width: 20, height: 40, originalUnchanged: true, metadataRemoved: true, zeroed: true, revoked: true });
  expect(result.top[0]).toBeGreaterThan(230);
  expect(result.bottom[2]).toBeGreaterThan(230);
  expect(result.size).toBeLessThanOrEqual(1_000_000);
  expect(result.thumbnailSize).toBeLessThanOrEqual(100_000);
  expect(network).toEqual([]);
});

test('PNG and WebP get bounded JPEG copies, HEIC is rejected, and cancellation clears picker', async ({ page }) => {
  const result = await page.evaluate(async ({ photoModule }) => {
    const { preparePhoto, pickAndPreparePhoto } = await import(photoModule);
    const canvas = document.createElement('canvas');
    canvas.width = 2400; canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    const pixels = ctx.createImageData(canvas.width, canvas.height);
    let seed = 123;
    for (let index = 0; index < pixels.data.length; index += 4) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      pixels.data[index] = seed & 255; pixels.data[index + 1] = (seed >>> 8) & 255;
      pixels.data[index + 2] = (seed >>> 16) & 255; pixels.data[index + 3] = 255;
    }
    ctx.putImageData(pixels, 0, 0);
    const sizes = [];
    for (const mime of ['image/png', 'image/webp']) {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, 0.95));
      const photo = await preparePhoto(new File([blob], `synthetic.${mime.split('/')[1]}`, { type: mime }));
      sizes.push({ mime: photo.main.mimeType, width: photo.main.width, height: photo.main.height,
        size: photo.main.size, thumbnailSize: photo.thumbnail.size, thumbnailWidth: photo.thumbnail.width });
      photo.dispose();
    }
    const heic = await preparePhoto(new File([new Uint8Array([0, 0, 0, 16, 102, 116, 121, 112, 104, 101, 105, 99])], 'synthetic.heic', { type: 'image/heic' })).then(() => '', (error) => error.code);
    const aborted = new AbortController(); aborted.abort();
    const abortCode = await preparePhoto(new File([], 'empty.jpg'), aborted.signal).then(() => '', (error) => error.code);
    // Prevent an actual OS picker in this deterministic cancellation test.
    const originalClick = HTMLInputElement.prototype.click;
    HTMLInputElement.prototype.click = function () { this.dispatchEvent(new Event('cancel')); };
    const cancelled = await pickAndPreparePhoto('library');
    HTMLInputElement.prototype.click = originalClick;
    return { sizes, heic, abortCode, cancelled, leftoverInputs: document.querySelectorAll('input[type=file]').length };
  }, { photoModule });
  expect(result).toMatchObject({ heic: 'unsupported_heic', abortCode: 'aborted', cancelled: null, leftoverInputs: 0 });
  for (const value of result.sizes) {
    expect(value.mime).toBe('image/jpeg');
    expect(value.width).toBeLessThanOrEqual(1600);
    expect(value.height).toBeLessThanOrEqual(1600);
    expect(value.size).toBeLessThanOrEqual(1_000_000);
    expect(value.thumbnailSize).toBeLessThanOrEqual(100_000);
    expect(value.thumbnailWidth).toBeLessThanOrEqual(320);
  }
});
