import type { VisualizationPorts } from '../../functions/_shared/visualization.ts';

// Deliberately outside functions/: no production route can use this adapter.
// A structural PNG fixture, not a rendered picture or provider response.
function png(): Uint8Array {
  const bytes=new Uint8Array(58);bytes.set([137,80,78,71,13,10,26,10]);const view=new DataView(bytes.buffer);
  view.setUint32(8,13);bytes.set([73,72,68,82],12);view.setUint32(16,1024);view.setUint32(20,1536);bytes[24]=8;bytes[25]=2;
  view.setUint32(33,1);bytes.set([73,68,65,84],37);view.setUint32(46,0);bytes.set([73,69,78,68],50);
  return bytes;
}
export function syntheticVisualization() {
  const events:string[]=[];let claimed=false;let calls=0;
  const ports:VisualizationPorts={
    async claimOnce(){if(claimed)return false;claimed=true;events.push('sent');return true;},
    async generateOnce(){calls++;return{bytes:png(),thumbnail:new Uint8Array([1]),usage:{textInputTokens:230,imageInputTokens:3072,imageOutputTokens:343}};},
    async inputsCurrent(){return true;},
    async stageManifest(){events.push('manifest');return 'synthetic-manifest';},
    async putFile(_id,variant){events.push(`put-${variant}`);},
    async publish(){events.push('publish');return true;},
    async deleteLater(){events.push('delete-later');},
    async settle(outcome){events.push(`settle-${outcome}`);},
    async unknown(){events.push('unknown');},
  };
  return{events,ports,providerCalls:()=>calls};
}
