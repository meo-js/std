import { Endian } from "../../typed-array.js";
import { throwUnsupportedEncoding } from "../error.js";
import * as ascii from "./ascii.js";
import { CodecableEncoding, Encoding } from "./enum.js";
import * as latin1 from "./latin1.js";
import type { DecodeOptions, EncodeOptions } from "./options.js";
import * as utf16 from "./utf16.js";
import * as utf8 from "./utf8.js";

/**
 * 将字符串编码为字节数据
 */
export function encode(
    text: string,
    encoding: CodecableEncoding,
    opts?: EncodeOptions,
): Uint8Array {
    switch (encoding) {
        case CodecableEncoding.Ascii:
            return ascii.encode(text, opts);
        case CodecableEncoding.Utf8:
            return utf8.encode(text, opts);
        case CodecableEncoding.Utf16:
            return utf16.encode(text, opts);
        case CodecableEncoding.Utf16le:
            return utf16.encode(text, {
                ...opts,
                endian: Endian.Little,
            });
        case CodecableEncoding.Utf16be:
            return utf16.encode(text, {
                ...opts,
                endian: Endian.Big,
            });
        case CodecableEncoding.Iso8859_1:
            return latin1.encode(text, opts);
        default:
            throwUnsupportedEncoding(encoding);
    }
}

/**
 * 将字节数据解码为字符串
 */
export function decode(
    bytes: BufferSource,
    encoding: CodecableEncoding,
    opts?: DecodeOptions,
): string {
    switch (encoding) {
        case CodecableEncoding.Ascii:
            return ascii.decode(bytes, opts);
        case CodecableEncoding.Utf8:
            return utf8.decode(bytes, opts);
        case CodecableEncoding.Utf16:
            return utf16.decode(bytes, opts);
        case CodecableEncoding.Utf16le:
            return utf16.decode(bytes, {
                ...opts,
                endian: Endian.Little,
            });
        case CodecableEncoding.Utf16be:
            return utf16.decode(bytes, {
                ...opts,
                endian: Endian.Big,
            });
        case CodecableEncoding.Iso8859_1:
            return latin1.decode(bytes, opts);
        default:
            throwUnsupportedEncoding(encoding);
    }
}

/**
 * @returns 返回该编码是否可进行编解码
 */
export function isCodecable(encoding: Encoding) {
    return encoding in CodecableEncoding;
}
