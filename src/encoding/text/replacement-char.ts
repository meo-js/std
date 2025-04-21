/**
 * @module
 *
 * @internal
 */

export const replacementCharRegex =
    // eslint-disable-next-line no-control-regex -- checked.
    /[\uFFFD\u001A]/gu;
export const asciiReplacementChar = "\u001A";
export const asciiReplacementCharCode = asciiReplacementChar.charCodeAt(0);
export const unicodeReplacementChar = "\uFFFD";
export const unicodeReplacementCharCode = unicodeReplacementChar.charCodeAt(0);
