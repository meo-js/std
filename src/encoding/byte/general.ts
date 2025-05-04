import { throwUnsupportedEncoding } from "../error.js";
import * as base64Url from "./base64-url.js";
import * as base64 from "./base64.js";
import { Encoding } from "./enum.js";
import * as hex from "./hex.js";
import type { DecodeOptions, EncodeOptions } from "./options.js";
import * as unit16 from "./unit16.js";
import * as unit8 from "./unit8.js";

/**
 * 将字节数据编码为字符串
 */
export function encode(
    bytes: string | BufferSource,
    encoding: Encoding,
    opts?: EncodeOptions,
): string {
    switch (encoding) {
        case Encoding.Hex:
            return hex.encode(bytes, opts);
        case Encoding.Base64:
            return base64.encode(bytes, opts);
        case Encoding.Base64Url:
            return base64Url.encode(bytes, opts);
        case Encoding.Unit8:
            return unit8.encode(bytes, opts);
        case Encoding.Unit16:
            return unit16.encode(bytes, opts);
        default:
            throwUnsupportedEncoding(encoding);
    }
}

/**
 * 将字符串解码为字节数据
 */
export function decode(
    text: string,
    encoding: Encoding,
    opts?: DecodeOptions,
): Uint8Array {
    switch (encoding) {
        case Encoding.Hex:
            return hex.decode(text);
        case Encoding.Base64:
            return base64.decode(text);
        case Encoding.Base64Url:
            return base64Url.decode(text);
        case Encoding.Unit8:
            return unit8.decode(text);
        case Encoding.Unit16:
            return unit16.decode(text, opts);
        default:
            throwUnsupportedEncoding(encoding);
    }
}
