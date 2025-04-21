import * as base64Url from "./base64-url.js";
import * as base64 from "./base64.js";
import { ByteEncoding } from "./enum.js";
import * as hex from "./hex.js";
import type { ByteDecodeOptions, ByteEncodeOptions } from "./options.js";
import * as unit16 from "./unit16.js";
import * as unit8 from "./unit8.js";

/**
 * 将字节数据编码为字符串
 */
export function encode(
    bytes: string | BufferSource,
    encoding: ByteEncoding,
    opts?: ByteEncodeOptions,
): string {
    switch (encoding) {
        case ByteEncoding.Hex:
            return hex.encode(bytes, opts);
        case ByteEncoding.Base64:
            return base64.encode(bytes, opts);
        case ByteEncoding.Base64Url:
            return base64Url.encode(bytes, opts);
        case ByteEncoding.Unit8:
            return unit8.encode(bytes, opts);
        case ByteEncoding.Unit16:
            return unit16.encode(bytes, opts);
        default:
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- checked.
            throw new TypeError(`unsupported encoding: ${encoding}.`);
    }
}

/**
 * 将字符串解码为字节数据
 */
export function decode(
    text: string,
    encoding: ByteEncoding,
    opts?: ByteDecodeOptions,
): Uint8Array {
    switch (encoding) {
        case ByteEncoding.Hex:
            return hex.decode(text);
        case ByteEncoding.Base64:
            return base64.decode(text);
        case ByteEncoding.Base64Url:
            return base64Url.decode(text);
        case ByteEncoding.Unit8:
            return unit8.decode(text);
        case ByteEncoding.Unit16:
            return unit16.decode(text, opts);
        default:
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- checked.
            throw new TypeError(`unsupported encoding: ${encoding}.`);
    }
}
