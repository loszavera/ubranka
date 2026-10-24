import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

// Deliberately opt-in. Run only against the separate synthetic TEST project.
// Tokens are provided in an ignored env file, never command-line arguments.
if(process.env.WARDROBE_TEST_SYNTHETIC!=='true')throw new Error('Synthetic test project confirmation required');
const {SUPABASE_URL:url,SUPABASE_ANON_KEY:key,WARDROBE_TEST_TOKEN_A:a,WARDROBE_TEST_TOKEN_B:b,WARDROBE_TEST_PHOTO:photoPath}=process.env;
if(!url||!key||!a||!b||!photoPath)throw new Error('Missing local test configuration');
const main=await readFile(photoPath);
if(main.length>100000)throw new Error('Use a synthetic JPEG under 100 kB (also used as thumbnail)');
let checks=0;
async function call(token,action,body={},expected=200){
  const response=await fetch(`${url}/functions/v1/wardrobe`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({action,...body})});
  assert.equal(response.status,expected,`${action}: unexpected status`);
  const result=await response.json();
  checks++;
  return expected===200?result.data:result.error;
}
async function storage(token,path,expected){
  const response=await fetch(`${url}/storage/v1/object/authenticated/wardrobe-private/${path}`,{headers:{apikey:key,Authorization:`Bearer ${token}`}});
  assert.equal(response.ok,expected,'private Storage access');checks++;
}
const itemId=randomUUID();
const fields={name:'Synthetic integration fixture',category:'top',color:'blue',occasions:['casual'],size:'M',photoKind:'garment'};
const original=await call(a,'bootstrap');
const other=await call(b,'bootstrap');
assert.notEqual(original.accountId,other.accountId);
let item;
try{
  item=await call(a,'createItem',{itemId,...fields});
  const repeated=await call(a,'createItem',{itemId,...fields});assert.equal(item.id,repeated.id);
  await call(b,'updateItem',{itemId,expectedRevision:item.revision,...fields},404);
  assert.equal((await call(b,'bootstrap')).items.some(i=>i.id===itemId),false);
  const race=await Promise.all([1,2].map(()=>fetch(`${url}/functions/v1/wardrobe`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${a}`,'Content-Type':'application/json'},body:JSON.stringify({action:'updateItem',itemId,expectedRevision:item.revision,...fields})})));
  assert.deepEqual(race.map(r=>r.status).sort(),[200,409],'two same-revision writes: exactly one succeeds');checks++;
  item=(await call(a,'bootstrap')).items.find(i=>i.id===itemId);
  const uploaded=await call(a,'uploadPhoto',{itemId,expectedRevision:item.revision,operationId:randomUUID(),mimeType:'image/jpeg',mainBase64:main.toString('base64'),thumbBase64:main.toString('base64')});
  item=uploaded;
  await storage(a,item.photo.mainPath,true);
  await storage(b,item.photo.mainPath,false);
  await call(a,'updateItem',{itemId,expectedRevision:item.revision-1,...fields},409);
  const exported=await call(a,'export');assert.ok(exported.items.some(i=>i.id===itemId));
  const saved=await call(a,'saveState',{expectedRevision:original.state.revision,data:original.state.data,importId:randomUUID()});
  assert.equal(saved.revision,original.state.revision+1);
  await call(a,'saveState',{expectedRevision:original.state.revision,data:original.state.data},409);
  const deletion=await call(a,'deleteItem',{itemId,expectedRevision:item.revision});
  assert.ok(['deleted','pending'].includes(deletion.status));
  await storage(a,item.photo.mainPath,false);
  item=null;
  console.log(JSON.stringify({passed:true,checks,scope:'hosted test project, two accounts, Storage owner isolation, revision conflicts, export, immediate deletion access block',physicalDeletion:'verify cleanup after the five-minute upload lease and ten-minute worker'}));
}finally{
  if(item){
    const snapshot=await call(a,'bootstrap');
    const current=snapshot.items.find(i=>i.id===itemId);
    if(current)await call(a,'deleteItem',{itemId,expectedRevision:current.revision});
  }
}
