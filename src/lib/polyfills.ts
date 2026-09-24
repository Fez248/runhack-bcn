/**
 * Hermes ships a TextDecoder that only understands UTF-8. h3-js's Emscripten
 * runtime eagerly constructs `new TextDecoder('utf-16le')`, which throws on
 * Hermes, so we wrap the global decoder and handle UTF-16LE in JS.
 */
type DecoderLike = { decode(input?: ArrayBufferView | ArrayBuffer): string; readonly encoding: string };

const NativeTextDecoder = globalThis.TextDecoder;

function isUtf16le(label?: string): boolean {
  const normalized = (label ?? 'utf-8').trim().toLowerCase();
  return normalized === 'utf-16le' || normalized === 'utf-16' || normalized === 'ucs-2';
}

class Utf16leDecoder implements DecoderLike {
  readonly encoding = 'utf-16le';

  decode(input?: ArrayBufferView | ArrayBuffer): string {
    if (!input) return '';
    const bytes =
      input instanceof ArrayBuffer
        ? new Uint8Array(input)
        : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    const units = bytes.length >> 1;
    let out = '';
    const CHUNK = 4096;
    for (let start = 0; start < units; start += CHUNK) {
      const end = Math.min(start + CHUNK, units);
      const codes = new Array<number>(end - start);
      for (let u = start; u < end; u++) {
        codes[u - start] = bytes[u * 2] | (bytes[u * 2 + 1] << 8);
      }
      out += String.fromCharCode(...codes);
    }
    return out;
  }
}

function supportsUtf16le(): boolean {
  if (typeof NativeTextDecoder === 'undefined') return false;
  try {
    new NativeTextDecoder('utf-16le');
    return true;
  } catch {
    return false;
  }
}

if (typeof NativeTextDecoder !== 'undefined' && !supportsUtf16le()) {
  const Patched = function TextDecoder(this: unknown, label?: string, options?: TextDecoderOptions) {
    if (isUtf16le(label)) return new Utf16leDecoder();
    return new NativeTextDecoder(label, options);
  } as unknown as typeof globalThis.TextDecoder;
  Patched.prototype = NativeTextDecoder.prototype;
  globalThis.TextDecoder = Patched;
}

export {};
