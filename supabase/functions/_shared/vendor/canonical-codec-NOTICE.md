# Canonical JPEG decoder provenance

The gzip/base64 decoder payload in `canonical-wasm.ts` is the unchanged
`codec/dec/mozjpeg_dec.wasm` from the public npm package `@jsquash/jpeg@1.6.0`.
Its SHA-256 before compression is
`a7c4b12169817e779ff4af137981393ae924944e167ad1bd95747c9199162d3e`.

Source: https://github.com/jamsinclair/jSquash/tree/main/packages/jpeg
Package: https://registry.npmjs.org/@jsquash/jpeg/-/jpeg-1.6.0.tgz

The package's Apache license and codec notices are preserved in
`jsquash-LICENSE.txt` and `mozjpeg-LICENSE.md`. JavaScript glue comes from the
same pinned npm package and is integrity-locked in `deno.lock`.

Embedding the compressed public binary supports Supabase API deployment
without static assets. Production compiles those local bytes; no code or WASM
is fetched from a CDN at runtime. Source images never leave Supabase during
preparation.

`bounded-jpeg-encoder.js` derives from `jpeg-js@0.4.4/lib/encoder.js` (upstream
SHA-256 `00bde8df2517eca556669ab6fc27b414e9ba3fc52a0a71e1e37ec7c5f19c3d34`).
Its Adobe BSD license remains at the top of the file. Changes are limited to
ES module export, removal of browser helpers/unreachable code, reuse of the
encoder's lookup tables and a fixed 1,000,018-byte output buffer. Overflow
throws `JPEG_OUTPUT_LIMIT` instead of growing a JavaScript number array.
The 18-byte JFIF header is subsequently stripped. Pixel/DCT/Huffman algorithms
and encoded bytes are unchanged; tests compare bytes with the upstream encoder.
