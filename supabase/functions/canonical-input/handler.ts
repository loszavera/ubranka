import { readBody, safeError, uuid } from '../_shared/protocol.ts';
import { SupabaseRest } from '../_shared/rest.ts';
import { authorizeWorker, serverKey } from '../_shared/service-auth.ts';
import { verifySourceInput, type SourceInput, type Canonicalizer } from '../_shared/canonical-input.ts';
import { base64 } from '../_shared/trial.ts';

export function createCanonicalInputHandler(environment:(key:string)=>string|undefined,canonicalize:Canonicalizer){
 return async(request:Request)=>{
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  try{
   if(!await authorizeWorker(request,environment))return Response.json({error:{code:'UNAUTHENTICATED'}},{status:401,headers});
   const body=await readBody(request),accountId=uuid(body.accountId);
   const admin=new SupabaseRest(environment('SUPABASE_URL')!,serverKey(environment)!,undefined,8_000,AbortSignal.timeout(22_000));
   const source=await verifySourceInput(admin,body.input as SourceInput,accountId);
   const copy=await canonicalize(source);
   return Response.json({jpeg:base64(copy.bytes),canonical:{version:copy.version,sha256:copy.sha256,
    bytes:copy.bytes.length,width:copy.width,height:copy.height}},{headers});
  }catch(error){const e=safeError(error);return Response.json({error:{code:e.code}},{status:e.status,headers});}
 };
}
