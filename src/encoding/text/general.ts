import { Endian } from "../../utils/typed-array.js";
import * as ascii from "./ascii.js";
import { CodecableTextEncoding, TextEncoding } from "./enum.js";
import * as latin1 from "./latin1.js";
import type { TextDecodeOptions, TextEncodeOptions } from "./options.js";
import * as utf16 from "./utf16.js";
import * as utf8 from "./utf8.js";

/**
 * 将字符串编码为字节数据
 */
export function encode(
    text: string,
    encoding: CodecableTextEncoding,
    opts?: TextEncodeOptions,
): Uint8Array {
    switch (encoding) {
        case CodecableTextEncoding.Ascii:
            return ascii.encode(text, opts);
        case CodecableTextEncoding.Utf8:
            return utf8.encode(text, opts);
        case CodecableTextEncoding.Utf16:
            return utf16.encode(text, opts);
        case CodecableTextEncoding.Utf16le:
            return utf16.encode(text, {
                ...opts,
                endian: Endian.Little,
            });
        case CodecableTextEncoding.Utf16be:
            return utf16.encode(text, {
                ...opts,
                endian: Endian.Big,
            });
        case CodecableTextEncoding.Iso8859_1:
            return latin1.encode(text, opts);
        default:
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- checked.
            throw new TypeError(`unsupported encoding: ${encoding}.`);
    }
}

/**
 * 将字节数据解码为字符串
 */
export function decode(
    bytes: BufferSource,
    encoding: CodecableTextEncoding,
    opts?: TextDecodeOptions,
): string {
    switch (encoding) {
        case CodecableTextEncoding.Ascii:
            return ascii.decode(bytes, opts);
        case CodecableTextEncoding.Utf8:
            return utf8.decode(bytes, opts);
        case CodecableTextEncoding.Utf16:
            return utf16.decode(bytes, opts);
        case CodecableTextEncoding.Utf16le:
            return utf16.decode(bytes, {
                ...opts,
                endian: Endian.Little,
            });
        case CodecableTextEncoding.Utf16be:
            return utf16.decode(bytes, {
                ...opts,
                endian: Endian.Big,
            });
        case CodecableTextEncoding.Iso8859_1:
            return latin1.decode(bytes, opts);
        default:
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- checked.
            throw new TypeError(`unsupported encoding: ${encoding}.`);
    }
}

/**
 * @returns 返回该编码是否可进行编解码
 */
export function isCodecable(encoding: TextEncoding) {
    return encoding in CodecableTextEncoding;
}
