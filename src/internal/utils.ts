/**
 * @module
 *
 * @internal
 */

import { isString } from "../predicate.js";
import { asUint8Array } from "../typed-array.js";

function strAt(input: string, index: number) {
    return input.charCodeAt(index);
}

function bufAt(input: Uint8Array, index: number) {
    return input[index];
}

/**
 * 用于解决某些接受多种类型输入时的代码复用问题，这依赖于引擎的内联机制来消除调用开销。
 */
export function toBufferLike(input: string | BufferSource) {
    if (isString(input)) {
        return { data: input, len: input.length, at: strAt };
    } else {
        const data = asUint8Array(input);
        return { data, len: data.length, at: bufAt };
    }
}
