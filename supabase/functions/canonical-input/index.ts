import { canonicalizeJpeg } from '../_shared/canonical-jpeg.ts';
import { createCanonicalInputHandler } from './handler.ts';
Deno.serve(createCanonicalInputHandler(key=>Deno.env.get(key),canonicalizeJpeg));
