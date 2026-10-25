import { decodeVisualizationPng } from '../_shared/png-codec.ts';
import { createWorkerHandler } from './handler.ts';

declare const EdgeRuntime:{waitUntil(promise:Promise<unknown>):void};
Deno.serve(createWorkerHandler(key=>Deno.env.get(key),task=>EdgeRuntime.waitUntil(task),decodeVisualizationPng));
