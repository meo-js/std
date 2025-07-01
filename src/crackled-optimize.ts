/**
 * @public
 *
 * @module
 */
import type { PlainObject } from "./object.js";

let fastProto: unknown = null;

/**
 * 强制将对象转换为某些 JavaScript 引擎所谓的 “快速对象”
 *
 * @see [to-fast-properties](https://github.com/sindresorhus/to-fast-properties)
 */
export function forceToFastObject<T extends object>(o: T): T {
    return _FastObject(o) as T;
}

function _FastObject(this: void, o: object) {
    if (fastProto !== null) {
        (<{ a: number }>(<unknown>this)).a = 1; // < SotreIC >
        const res = fastProto;
        fastProto = null;
        return res;
    }

    fastProto = _FastObject.prototype = o;

    // @ts-expect-error -- ts7009 checked.
    return new _FastObject() as unknown;
}

/**
 * 强制字符串实例化
 *
 * 即解除某些 JavaScript 引擎的 “分片字符串” 对大字符串的引用。
 *
 * @see [Discussion](https://stackoverflow.com/questions/79478418/how-to-correctly-unref-a-v8-substring-sliced-string-from-its-source-string)
 */
export function forceToUnslicedString(str: string): string {
    const temp: PlainObject = {};
    temp[str] = undefined;
    return str;
}
