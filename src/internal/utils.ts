/**
 * @module
 *
 * @internal
 */

import { isString } from "../predicate.js";
import type { checked } from "../ts.js";
import { asUint8Array } from "../typed-array.js";

function strAt(input: string, index: number) {
    return input.charCodeAt(index);
}

function bufAt(input: Uint8Array, index: number) {
    return input[index];
}

/**
 * 用于解决某些接受多种类型输入时的代码复用问题，这依赖于引擎的内联与逃逸分析机制来消除一切开销。
 */
export function toBufferLike(input: string | BufferSource): {
    data: unknown;
    len: number;
    at: (input: unknown, index: number) => number;
} {
    if (isString(input)) {
        return { data: input, len: input.length, at: strAt as checked };
    } else {
        const data = asUint8Array(input);
        return { data, len: data.length, at: bufAt as checked };
    }
}
