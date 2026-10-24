import assert from 'node:assert/strict';
import test from 'node:test';
import { cors, fingerprint, jpeg, readBody, revision, safeError, uuid, WardrobeError } from '../functions/_shared/protocol.ts';

// Minimal structural JPEG; actual decode/visual quality belongs to photo tests.
const bytes=Uint8Array.from([255,216,255,192,0,11,8,0,1,0,1,1,1,17,0,255,218,0,8,1,1,0,0,63,0,0,255,217]);
const base64=(b:Uint8Array)=>Buffer.from(b).toString('base64');
test('upload protocol enforces real bytes, dimensions and metadata',()=>{
  assert.deepEqual(jpeg(base64(bytes),1000000),bytes);
  assert.throws(()=>jpeg(base64(bytes),10),/INVALID_PHOTO/);
  assert.throws(()=>jpeg('a?==',100),/INVALID_PHOTO/);
  const huge=bytes.slice();huge[9]=0x20;
  assert.throws(()=>jpeg(base64(huge),1000),/PHOTO_DIMENSIONS/);
  const exif=Uint8Array.from([...bytes.slice(0,2),255,225,0,2,...bytes.slice(2)]);
  assert.throws(()=>jpeg(base64(exif),1000),/PHOTO_METADATA/);
  const trailing=Uint8Array.from([...bytes,42]);
  assert.throws(()=>jpeg(base64(trailing),1000),/INVALID_PHOTO/);
});
test('identity/revision/request bounds and error redaction',async()=>{
  assert.throws(()=>uuid('../someone-else'),/INVALID_ID/);
  assert.throws(()=>revision(undefined),/INVALID_REVISION/);
  assert.throws(()=>revision(-1),/INVALID_REVISION/);
  assert.equal(revision(0),0);
  assert.deepEqual(safeError(new Error('private backend text')),{code:'INTERNAL',status:500});
  assert.deepEqual(safeError(new WardrobeError('CONFLICT',409)),{code:'CONFLICT',status:409});
  await assert.rejects(readBody(new Request('https://test.invalid',{method:'POST',body:'x'.repeat(1550001)})),/REQUEST_TOO_LARGE/);
  assert.deepEqual(await readBody(new Request('https://test.invalid',{method:'POST',body:'{"action":"bootstrap"}'})),{action:'bootstrap'});
});
test('CORS matches exact origins and hashes bind both variants',async()=>{
  assert.throws(()=>cors(new Request('https://api.invalid',{headers:{origin:'https://evil.invalid'}}),'https://app.invalid'),/ORIGIN_NOT_ALLOWED/);
  assert.equal(cors(new Request('https://api.invalid',{headers:{origin:'https://app.invalid'}}),'https://app.invalid')['Access-Control-Allow-Origin'],'https://app.invalid');
  const first=await fingerprint(bytes,bytes);
  assert.equal(first.length,64);
  assert.equal(await fingerprint(bytes,bytes),first);
  assert.notEqual(await fingerprint(bytes,Uint8Array.from([...bytes,1])),first);
});
