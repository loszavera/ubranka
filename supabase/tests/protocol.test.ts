import assert from 'node:assert/strict';
import test from 'node:test';
import { cors, fingerprint, jpeg, readBody, revision, safeError, uuid, WardrobeError } from '../functions/_shared/protocol.ts';
import { privatePhotoResponse } from '../functions/_shared/photo-read.ts';
import { SupabaseRest } from '../functions/_shared/rest.ts';

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

test('photo proxy authorizes every read before privileged bytes and never returns a reusable Storage URL',async()=>{
  const path='00000000-0000-4000-8000-000000000001/10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000001/main.jpg';
  const photo={main_path:path,thumb_path:path.replace('main.jpg','thumb.jpg'),bytes:bytes.length,thumb_bytes:bytes.length,mime_type:'image/jpeg'};
  let permitted=true;let checks=0;let downloads=0;
  const caller={request:async(url:string)=>{checks++;assert.ok(url.startsWith('/rest/v1/wardrobe_photos?'));return permitted?[photo]:[];}} as unknown as SupabaseRest;
  const admin={binary:async(url:string,expected:number)=>{downloads++;assert.equal(url,`/storage/v1/object/wardrobe-private/${path}`);assert.equal(expected,bytes.length);return bytes;}} as unknown as SupabaseRest;
  const response=await privatePhotoResponse(caller,admin,path,{});
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()),bytes);
  assert.equal(response.headers.get('content-type'),'image/jpeg');
  assert.equal(response.headers.get('cache-control'),'private, no-store, max-age=0');
  assert.equal(response.headers.get('cdn-cache-control'),'no-store');
  permitted=false;
  await assert.rejects(privatePhotoResponse(caller,admin,path,{}),/NOT_FOUND/);
  assert.equal(checks,3,'same path is authorized before/after I/O and again after revocation/deletion');
  assert.equal(downloads,1,'denied requests cannot retrieve cached privileged bytes');
  await assert.rejects(privatePhotoResponse(caller,admin,path+'?nonce=1',{}),/INVALID_PHOTO/);
  await assert.rejects(privatePhotoResponse(caller,admin,path.replace('main.jpg','../../main.jpg'),{}),/INVALID_PHOTO/);
  assert.equal(checks,3,'malformed paths do not reach PostgREST');
});

test('privileged photo download rejects mismatched bytes and non-image responses',async()=>{
  const originalFetch=globalThis.fetch;
  const admin=new SupabaseRest('https://fixture.invalid','synthetic-server-key');
  try {
    globalThis.fetch=async()=>new Response(bytes,{headers:{'Content-Type':'image/jpeg'}});
    assert.deepEqual(await admin.binary('/synthetic',bytes.length),bytes);
    await assert.rejects(admin.binary('/synthetic',bytes.length-1),/PHOTO_UNAVAILABLE/);
    await assert.rejects(admin.binary('/synthetic',bytes.length+1),/PHOTO_UNAVAILABLE/);
    globalThis.fetch=async()=>new Response('{}',{headers:{'Content-Type':'application/json'}});
    await assert.rejects(admin.binary('/synthetic',2),/PHOTO_UNAVAILABLE/);
  }finally{globalThis.fetch=originalFetch;}
});
