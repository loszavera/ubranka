import { createWardrobeHandler } from './handler.ts';

Deno.serve(createWardrobeHandler((key) => Deno.env.get(key)));
