import { WardrobeError } from './protocol.ts';

type Environment=(key:string)=>string|undefined;
function namedDefault(environment:Environment,name:string):string|undefined {
  try {const value:unknown=JSON.parse(environment(name)??'{}');
    if(value&&typeof value==='object'&&'default' in value&&typeof value.default==='string'&&value.default)return value.default;
  }catch { /* invalid configuration is unavailable, never a caller-controlled fallback */ }
  return undefined;
}
export function serverKey(environment:Environment) {
  return environment('SUPABASE_SERVICE_ROLE_KEY') || namedDefault(environment,'SUPABASE_SECRET_KEYS') || environment('SUPABASE_SECRET_KEY');
}
function publicKey(environment:Environment) {
  const key=environment('SUPABASE_ANON_KEY') || namedDefault(environment,'SUPABASE_PUBLISHABLE_KEYS') || environment('SUPABASE_PUBLISHABLE_KEY');
  // A secret key must never stand in for the public gateway key when checking
  // an untrusted Bearer: gateway key privileges must not authenticate the caller.
  return key?.startsWith('sb_secret_') ? undefined : key;
}
export async function authorizeWorker(request:Request,environment:Environment):Promise<boolean> {
  if(request.method!=='POST')return false;
  const authorization=request.headers.get('authorization')??'',apiKey=request.headers.get('apikey')??'';
  const bearer=authorization.startsWith('Bearer ')?authorization.slice(7):'';
  const candidate=bearer || (apiKey.startsWith('sb_secret_')?apiKey:'');
  if(!candidate||candidate.length>8192)return false;
  const url=environment('SUPABASE_URL');
  if(!url||!serverKey(environment))throw new WardrobeError('SERVICE_UNAVAILABLE',503);
  const headers:Record<string,string>={'Content-Type':'application/json'};
  if(candidate.startsWith('sb_secret_')) {
    // The only use of a caller-provided key is this no-data authorization RPC.
    // The gateway validates it; it never becomes the worker's admin credential.
    headers.apikey=candidate;
  }else {
    const publicGatewayKey=publicKey(environment);
    if(!publicGatewayKey)throw new WardrobeError('SERVICE_UNAVAILABLE',503);
    headers.apikey=publicGatewayKey;headers.Authorization=`Bearer ${candidate}`;
  }
  try {
    const response=await fetch(`${url}/rest/v1/rpc/wardrobe_worker_authorized`,{
      method:'POST',redirect:'error',headers,body:'{}',signal:AbortSignal.timeout(5000),
    });
    if(!response.ok){await response.body?.cancel();return false;}
    // Constant-size boolean response. Never parse roles from an unverified JWT.
    if(Number(response.headers.get('content-length'))>16){await response.body?.cancel();return false;}
    if(!response.body)return false;
    const reader=response.body.getReader();let value='';
    while(true){const part=await reader.read();if(part.done)break;
      if(value.length+part.value.length>16){await reader.cancel();return false;}value+=new TextDecoder().decode(part.value);}
    return value.trim()==='true';
  }catch{return false;}
}
