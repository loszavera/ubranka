import assert from 'node:assert/strict';
import test from 'node:test';
import { boundedDimensions, inspectPhoto, stripJpegMetadata } from '../src/private/photos.core.ts';
import { PhotoError } from '../src/private/photos.types.ts';

const segment = (marker: number, body: number[]) => [0xff, marker, (body.length + 2) >> 8, (body.length + 2) & 255, ...body];
const jpeg = (...segments: number[][]) => Uint8Array.from([0xff, 0xd8, ...segments.flat(), 0xff, 0xd9]);
const sof = segment(0xc0, [8, 0, 20, 0, 40, 1, 1, 0x11, 0]);
const error = (code: string) => (value: unknown) => value instanceof PhotoError && value.code === code;

test('photo limits keep aspect ratio and reject unsafe decoded allocations', () => {
  assert.deepEqual(boundedDimensions(4000, 3000, 1600), { width: 1600, height: 1200 });
  assert.deepEqual(boundedDimensions(200, 100, 1600), { width: 200, height: 100 });
  assert.throws(() => boundedDimensions(10000, 10000, 1600), error('too_large'));
  assert.throws(() => boundedDimensions(0, 3000, 1600), error('decode_failed'));
});

test('inspection trusts encoded format/dimensions and rejects HEIC/SVG/corrupt data', () => {
  assert.deepEqual(inspectPhoto(jpeg(sof), 'image/jpeg'), { width: 40, height: 20, format: 'jpeg' });
  assert.throws(() => inspectPhoto(jpeg(sof), 'image/heic'), error('unsupported_heic'));
  assert.throws(() => inspectPhoto(new TextEncoder().encode('<svg></svg>'), 'image/jpeg'), error('unsupported_format'));
  assert.throws(() => inspectPhoto(jpeg([0xff, 0xe1, 0xff, 0xff])), error('decode_failed'));
});

test('JPEG sanitization strips EXIF GPS XMP comments and bytes after EOI, preserving encoded pixels', () => {
  const secret = Array.from(new TextEncoder().encode('Exif\0\0GPSLatitude=52.23;owner=Alice'));
  const app = segment(0xe1, secret);
  const comment = segment(0xfe, Array.from(new TextEncoder().encode('private comment')));
  const scan = [...segment(0xda, [1, 1, 0, 0, 63, 0]), 7, 0xff, 0, 8, 0xff, 0xd0, 9];
  const clean = stripJpegMetadata(Uint8Array.from([...jpeg(app, sof, comment, scan), ...secret]));
  assert.deepEqual(clean, jpeg(sof, scan));
  assert.equal(new TextDecoder().decode(clean).includes('GPS'), false);
});

test('metadata stripping handles progressive scans and never accepts missing EOI', () => {
  const scan = [...segment(0xda, [1, 1, 0, 0, 63, 0]), 1, 2, 3];
  const betweenScans = segment(0xe1, [1, 2, 3]);
  assert.deepEqual(stripJpegMetadata(jpeg(sof, scan, betweenScans, scan)), jpeg(sof, scan, scan));
  assert.throws(() => stripJpegMetadata(jpeg(sof).slice(0, -2)), error('decode_failed'));
});
