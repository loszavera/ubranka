/** Offline only. Exact six public synthetic B originals, plus generated opaque noise.
 * deno run --allow-read --allow-write --allow-run --config supabase/functions/deno.json
 *   supabase/tests/png-codec-benchmark.deno.ts --sources-root <primary checkout>
 *   --output artifacts/p33c1-codec
 * No network permission, credentials, service calls, private inputs or AI.
 */
import { strict as assert } from 'node:assert';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cpuUsage, resourceUsage } from 'node:process';
import { decode, encode } from 'npm:fast-png@8.0.0';
import { decodeVisualizationPng } from '../functions/_shared/png-codec.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const arg = (name: string) => Deno.args[Deno.args.indexOf(name) + 1];
if (!Deno.args.includes('--sources-root') || !Deno.args.includes('--output')) {
  throw new Error('Explicit --sources-root and --output required');
}
const sourcesRoot = resolve(arg('--sources-root')), output = resolve(arg('--output'));
const caseId = Deno.args.includes('--case') ? arg('--case') : null;
const manifest = JSON.parse(await Deno.readTextFile(resolve(root, 'docs/p33b/results.json')));
const ids = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'entropy'];
const hash = async (data: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data as Uint8Array<ArrayBuffer>)))
  .map(x => x.toString(16).padStart(2, '0')).join('');

// Exact P3.3B resize, for a reproducible before/after; not the new fallback algorithm.
function legacyThumbnail(bytes: Uint8Array) {
  const image = decode(bytes, { checkCrc: true }), data = new Uint8Array(120 * 180 * 4);
  for (let y = 0; y < 180; y++) for (let x = 0; x < 120; x++) {
    const x0 = Math.floor(x * 1024 / 120), x1 = Math.floor((x + 1) * 1024 / 120);
    const y0 = Math.floor(y * 1536 / 180), y1 = Math.floor((y + 1) * 1536 / 180);
    const sums = [0, 0, 0, 0];
    for (let sy = y0; sy < y1; sy++) for (let sx = x0; sx < x1; sx++) {
      const p = (sy * 1024 + sx) * image.channels;
      for (let c = 0; c < 3; c++) sums[c] += image.data[p + c];
      sums[3] += image.channels === 4 ? image.data[p + 3] : 255;
    }
    for (let c = 0; c < 4; c++) data[(y * 120 + x) * 4 + c] = Math.round(sums[c] / ((x1 - x0) * (y1 - y0)));
  }
  return encode({ width: 120, height: 180, depth: 8, channels: 4, data });
}

if (caseId) {
  assert.ok(ids.includes(caseId));
  const path = caseId === 'entropy' ? resolve(output, 'entropy-source.png')
    : resolve(sourcesRoot, `artifacts/p33b-results/${caseId}-main.png`);
  const bytes = await Deno.readFile(path), sourceSha256 = await hash(bytes);
  if (caseId !== 'entropy') assert.equal(sourceSha256, manifest.cases.find((c: {id: string}) => c.id === caseId).originalOutput.sha256);
  const samples = [];
  let saved: ReturnType<typeof decodeVisualizationPng> | undefined;
  for (let iteration = 0; iteration < 3; iteration++) {
    const memoryBefore = Deno.memoryUsage(), beforeCpu = cpuUsage();
    const result = decodeVisualizationPng(bytes);
    const cpu = cpuUsage(beforeCpu), memoryAfter = Deno.memoryUsage(), peakRssBytes = resourceUsage().maxRSS * 1024;
    assert.equal(result.main, bytes);
    assert.ok(result.thumbnail.length <= 100_000);
    assert.ok(result.metrics.jpegAttempts <= 3);
    if (!saved) saved = result;
    else assert.equal(await hash(saved.thumbnail), await hash(result.thumbnail));
    samples.push({ iteration, cold: iteration === 0, ...result.metrics, cpuMs: (cpu.user + cpu.system) / 1000,
      memoryBefore, memoryAfter, processPeakRssBytes: peakRssBytes });
  }
  const result = saved!;
  const thumbnailFile = `${caseId}-thumb.${result.thumbnailMimeType === 'image/jpeg' ? 'jpg' : 'png'}`;
  const legacyFile = `${caseId}-old120.png`, legacy = legacyThumbnail(bytes);
  await Deno.writeFile(resolve(output, thumbnailFile), result.thumbnail);
  await Deno.writeFile(resolve(output, legacyFile), legacy);
  console.log(JSON.stringify({ id: caseId, sourceSha256, sourceBytes: bytes.length, mainByteIdentity: true,
    thumbnail: { file: thumbnailFile, mimeType: result.thumbnailMimeType, width: result.thumbnailWidth,
      height: result.thumbnailHeight, bytes: result.thumbnail.length, sha256: await hash(result.thumbnail) },
    legacy: { file: legacyFile, mimeType: 'image/png', width: 120, height: 180, bytes: legacy.length, sha256: await hash(legacy) }, samples }));
} else {
  await Deno.mkdir(output, { recursive: true });
  const pixels = new Uint8Array(1024 * 1536 * 4); let seed = 19;
  for (let i = 0; i < pixels.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    pixels[i] = i % 4 === 3 ? 255 : seed >>> 24;
  }
  await Deno.writeFile(resolve(output, 'entropy-source.png'), encode({ width: 1024, height: 1536, depth: 8, channels: 4, data: pixels }));
  const cases = [];
  for (const id of ids) {
    const child = await new Deno.Command(Deno.execPath(), { args: ['run', '--cached-only', '--allow-read', '--allow-write',
      '--config', resolve(root, 'supabase/functions/deno.json'), fileURLToPath(import.meta.url),
      '--sources-root', sourcesRoot, '--output', output, '--case', id], stdout: 'piped', stderr: 'piped' }).output();
    if (!child.success) throw new Error(new TextDecoder().decode(child.stderr));
    const report = JSON.parse(new TextDecoder().decode(child.stdout)); cases.push(report);
    console.log(`${id}: ${report.thumbnail.width}x${report.thumbnail.height} ${report.thumbnail.bytes} B; ${Math.max(...report.samples.map((s: {cpuMs:number}) => s.cpuMs))} ms CPU`);
  }
  const report = { version: '1.0', createdAt: new Date().toISOString(), runtime: Deno.version, platform: Deno.build,
    scope: 'Offline synthetic only; zero AI/provider/cloud requests',
    method: 'One fresh process per input, three sequential decode calls. CPU uses process.cpuUsage; RSS is the whole local Deno process, not a hosted Edge isolate. Source creation and old thumbnail comparison occur outside timed calls.',
    limitations: ['Local Windows Deno measurements do not qualify hosted Edge CPU/memory.',
      'Includes module/runtime memory in RSS; garbage collection is not forced. No physical iOS/Android verification.'], cases };
  await Deno.writeTextFile(resolve(output, 'benchmark.json'), JSON.stringify(report, null, 2) + '\n');
}
