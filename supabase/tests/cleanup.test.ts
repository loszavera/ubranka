import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanup, type SupabaseRest } from '../functions/_shared/rest.ts';

test('failed oldest deletes yield to healthy rows on the next worker run', async () => {
  const rows=Array.from({length:8},(_,n)=>({id:String(n),account_id:'owner',item_id:'item',status:'deleting',main_path:`${n}/main`,thumb_path:`${n}/thumb`,cleanup_attempts:0,attempted:null as string|null}));
  const attempted:string[]=[];
  const mock={
    async rpc(name:string,args:Record<string,unknown>={}) {
      if(name==='wardrobe_finish_photo_delete')rows.splice(rows.findIndex(r=>r.id===args.p_id),1);
      return null;
    },
    async request(path:string,init:RequestInit={}) {
      if(path.startsWith('/rest/v1/wardrobe_visualization_files'))return [];
      if(path.startsWith('/rest/v1/wardrobe_accounts'))return [];
      if(path==='/storage/v1/object/wardrobe-private'){
        const id=JSON.parse(String(init.body)).prefixes[0].split('/')[0];attempted.push(id);
        if(Number(id)<3)throw new Error('persistent Storage failure');
        return [];
      }
      if(init.method==='PATCH'){
        const id=path.split('eq.')[1];const row=rows.find(r=>r.id===id)!;
        const update=JSON.parse(String(init.body));row.cleanup_attempts=update.cleanup_attempts;row.attempted=update.cleanup_attempted_at;
        return null;
      }
      if(path.includes('order=')){
        const order=new URL(`https://fixture.invalid${path}`).searchParams.get('order');
        const selected=[...rows];
        if(order?.startsWith('cleanup_attempted_at.asc.nullsfirst'))selected.sort((a,b)=>Number(!!a.attempted)-Number(!!b.attempted));
        return selected.slice(0,25).map(r=>({...r}));
      }
      return rows.slice(0,1);
    },
  } as unknown as SupabaseRest;
  const first=await cleanup(mock);
  assert.equal(first.failed,3);
  assert.deepEqual(attempted,['0','1','2']);
  const second=await cleanup(mock);
  assert.equal(second.failed,3);
  assert.deepEqual(rows.map(r=>r.id),['0','1','2'],'five healthy photos completed despite poisoned older rows');
});
