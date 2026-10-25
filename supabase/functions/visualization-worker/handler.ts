import { readBody, uuid } from '../_shared/protocol.ts';
import { runVisualizationWorker, type ImageDecoder } from './worker.ts';
import { parseImageResponse } from '../_shared/openai-images.ts';
import { authorizeWorker } from '../_shared/service-auth.ts';

export function createWorkerHandler(environment:(key:string)=>string|undefined,waitUntil:(task:Promise<unknown>)=>void,decode:ImageDecoder) {
  return async(request:Request)=>{
    const headers={'Cache-Control':'no-store'};
    try {
      if(!await authorizeWorker(request,environment))return Response.json({error:{code:'UNAUTHENTICATED'}},{status:401,headers});
    }catch{return Response.json({error:{code:'SERVICE_UNAVAILABLE'}},{status:503,headers});}
    try {
      if(request.headers.get('x-ubranka-probe')==='json') {
        const started=performance.now();
        if(request.headers.get('content-type')!=='application/json')throw new Error();
        const parsed=await parseImageResponse(new Response(request.body,{headers:request.headers}));
        if(!parsed.png||!parsed.usage)throw new Error();
        const parseMs=performance.now()-started,image=await decode(parsed.png);
        return Response.json({width:image.width,height:image.height,bytes:image.main.length,thumbBytes:image.thumbnail.length,parseMs,totalMs:performance.now()-started,metrics:image.metrics},{headers});
      }
      if(request.headers.get('x-ubranka-probe')==='png') {
        // Pure decoder preflight: no key lookup, job, persistence or provider.
        if(request.headers.get('content-type')!=='image/png'||Number(request.headers.get('content-length'))>8_000_000||!request.body)throw new Error();
        const reader=request.body.getReader(),chunks:Uint8Array[]=[];let length=0;
        while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;
          if(length>8_000_000){await reader.cancel();throw new Error();}chunks.push(part.value);}
        const bytes=new Uint8Array(length);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
        const image=await decode(bytes);
        return Response.json({width:image.width,height:image.height,bytes:image.main.length,thumbBytes:image.thumbnail.length,metrics:image.metrics},{headers});
      }
      const body=await readBody(request),account=uuid(body.accountId),job=uuid(body.jobId);
      if(Object.keys(body).some(key=>!['accountId','jobId'].includes(key)))throw new Error();
      waitUntil(runVisualizationWorker(environment,account,job,decode));
      return Response.json({accepted:true},{status:202,headers});
    }catch{return Response.json({error:{code:'INVALID_REQUEST'}},{status:400,headers});}
  };
}
