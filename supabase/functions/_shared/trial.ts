import { jpeg, uuid, WardrobeError } from './protocol.ts';
import type { SupabaseRest } from './rest.ts';

export const TRIAL_PARAMS = Object.freeze({ model: 'gpt-image-2.5-flare-2026-09-08', n: 1,
  quality: 'medium', size: '1024x1536', output_format: 'png', background: 'opaque', moderation: 'auto' });
export type TrialPlan = {caseId: string; prompt: string; promptSha256: string; params: Record<string, unknown>;
  inputHashes: string[]; inputs: {path: string; bytes: number}[]};
export async function sha256(bytes: Uint8Array): Promise<string> {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(bytes).buffer))].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export function caseId(value: unknown): string {
  if (typeof value !== 'string' || !/^B0[1-6]$/.test(value)) throw new WardrobeError('INVALID_MANIFEST');
  return value;
}
export function base64(bytes: Uint8Array): string {
  let out=''; for(let at=0;at<bytes.length;at+=32768)out+=String.fromCharCode(...bytes.subarray(at,at+32768));
  return btoa(out);
}
export async function verifiedInputs(admin: SupabaseRest, plan: TrialPlan, account: string): Promise<Uint8Array[]> {
  caseId(plan.caseId);
  if (typeof plan.prompt!=='string' || plan.prompt.length<1 || plan.prompt.length>2500 ||
    !plan.params || Object.keys(plan.params).length!==Object.keys(TRIAL_PARAMS).length ||
    Object.entries(TRIAL_PARAMS).some(([key,value])=>plan.params[key]!==value) ||
    !Array.isArray(plan.inputs) || plan.inputs.length<3 || plan.inputs.length>4 ||
    !Array.isArray(plan.inputHashes) || plan.inputHashes.length!==plan.inputs.length ||
    await sha256(new TextEncoder().encode(plan.prompt))!==plan.promptSha256) throw new WardrobeError('MANIFEST_MISMATCH');
  const inputs: Uint8Array[]=[];
  for(let n=0;n<plan.inputs.length;n++) {
    const p=plan.inputs[n],parts=p.path.split('/');
    if(parts.length!==4 || parts[0]!==account || parts[3]!=='main.jpg' ||
      !Number.isSafeInteger(p.bytes) || p.bytes<1 || p.bytes>1_000_000 || !/^[a-f0-9]{64}$/.test(plan.inputHashes[n])) throw new WardrobeError('MANIFEST_MISMATCH');
    uuid(parts[0]);uuid(parts[1]);uuid(parts[2]);
    const bytes=await admin.binary(`/storage/v1/object/wardrobe-private/${p.path}`,p.bytes);
    if(await sha256(bytes)!==plan.inputHashes[n]) throw new WardrobeError('MANIFEST_MISMATCH');
    // Reuse the canonical JPEG parser, including EXIF/size rejection. Actual
    // bytes, not user-supplied URLs/metadata, are passed to the provider.
    jpeg(base64(bytes),1_000_000);
    for(let at=2;at+4<bytes.length;) {
      if(bytes[at++]!==255)break;while(bytes[at]===255)at++;
      const marker=bytes[at++],length=(bytes[at]<<8)|bytes[at+1];
      if([192,193,194].includes(marker)) {
        if(((bytes[at+3]<<8)|bytes[at+4])>1536||((bytes[at+5]<<8)|bytes[at+6])>1024)throw new WardrobeError('MANIFEST_MISMATCH');
        break;
      }
      at+=length;
    }
    inputs.push(bytes);
  }
  return inputs;
}
