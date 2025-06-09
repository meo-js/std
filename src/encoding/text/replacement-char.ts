/**
 * @module
 *
 * @internal
 */

export const asciiReplacementChar = "\u001A";
export const asciiReplacementCharCode = asciiReplacementChar.charCodeAt(0);
export const asciiReplacementCharBytes = new Uint8Array([0x1a]);
export const unicodeReplacementChar = "\uFFFD";
export const unicodeReplacementCharCode = unicodeReplacementChar.charCodeAt(0);
export const unicodeReplacementCharBytes = new Uint8Array([0xef, 0xbf, 0xbd]);
