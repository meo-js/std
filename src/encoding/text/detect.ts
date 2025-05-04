import chardet, { type EncodingName } from "chardet";
import { asUint8Array } from "../../typed-array.js";
import type { AnalyseResult } from "./detect-type.js";
import { Encoding } from "./enum.js";

/**
 * 检测输入数据的编码格式
 *
 * @returns 返回置信度最高的编码格式
 */
export function detect(bytes: BufferSource): Encoding {
    return toTextEncoding(
        chardet.detect(asUint8Array(bytes)) as EncodingName | null,
    );
}

/**
 * 检测输入数据的编码格式
 *
 * @returns 返回可能编码格式的完整列表
 */
export function analyse(bytes: BufferSource): AnalyseResult {
    const result = chardet.analyse(asUint8Array(bytes));
    for (const item of result) {
        item.name = toTextEncoding(item.name) as chardet.EncodingName;
    }
    return result as AnalyseResult;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Ascii} 编码数据
 */
export function isAscii(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Ascii;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Big5} 编码数据
 */
export function isBig5(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Big5;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Euc_JP} 编码数据
 */
export function isEuc_JP(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Euc_JP;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Euc_KR} 编码数据
 */
export function isEuc_KR(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Euc_KR;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Gb18030} 编码数据
 */
export function isGb18030(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Gb18030;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Iso2022} 编码数据
 */
export function isIso2022(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Iso2022;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Iso2022_CN} 编码数据
 */
export function isIso2022_CN(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Iso2022_CN;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Iso2022_JP} 编码数据
 */
export function isIso2022_JP(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Iso2022_JP;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Iso2022_KR} 编码数据
 */
export function isIso2022_KR(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Iso2022_KR;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Iso8859_1} 编码数据
 */
export function isIso8859_1(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Iso8859_1;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Iso8859_2} 编码数据
 */
export function isIso8859_2(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Iso8859_2;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Iso8859_5} 编码数据
 */
export function isIso8859_5(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Iso8859_5;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Iso8859_6} 编码数据
 */
export function isIso8859_6(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Iso8859_6;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Iso8859_7} 编码数据
 */
export function isIso8859_7(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Iso8859_7;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Iso8859_8} 编码数据
 */
export function isIso8859_8(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Iso8859_8;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Iso8859_9} 编码数据
 */
export function isIso8859_9(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Iso8859_9;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Koi8R} 编码数据
 */
export function isKoi8R(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Koi8R;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Mbcs} 编码数据
 */
export function isMbcs(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Mbcs;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Sbcs} 编码数据
 */
export function isSbcs(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Sbcs;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Shift_JIS} 编码数据
 */
export function isShift_JIS(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Shift_JIS;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Utf16le} 编码数据
 */
export function isUtf16le(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Utf16le;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Utf16be} 编码数据
 */
export function isUtf16be(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Utf16be;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Utf16le} 或 {@link Encoding.Utf16be} 编码数据
 */
export function isUtf16(bytes: BufferSource): boolean {
    const encoding = detect(bytes);
    return encoding === Encoding.Utf16le || encoding === Encoding.Utf16be;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Utf32} 编码数据
 */
export function isUtf32(bytes: BufferSource): boolean {
    const encoding = detect(bytes);
    return encoding === Encoding.Utf32le || encoding === Encoding.Utf32be;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Utf32be} 编码数据
 */
export function isUtf32be(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Utf32be;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Utf32le} 编码数据
 */
export function isUtf32le(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Utf32le;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Utf8} 编码数据
 */
export function isUtf8(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Utf8;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Windows1250} 编码数据
 */
export function isWindows1250(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Windows1250;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Windows1251} 编码数据
 */
export function isWindows1251(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Windows1251;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Windows1252} 编码数据
 */
export function isWindows1252(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Windows1252;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Windows1253} 编码数据
 */
export function isWindows1253(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Windows1253;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Windows1254} 编码数据
 */
export function isWindows1254(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Windows1254;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Windows1255} 编码数据
 */
export function isWindows1255(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Windows1255;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link Encoding.Windows1256} 编码数据
 */
export function isWindows1256(bytes: BufferSource): boolean {
    return detect(bytes) === Encoding.Windows1256;
}

function toTextEncoding(name: EncodingName | null): Encoding {
    switch (name) {
        case "ASCII":
            return Encoding.Ascii;
        case "Big5":
            return Encoding.Big5;
        case "EUC-JP":
            return Encoding.Euc_JP;
        case "EUC-KR":
            return Encoding.Euc_KR;
        case "GB18030":
            return Encoding.Gb18030;
        case "ISO_2022":
            return Encoding.Iso2022;
        case "ISO-2022-CN":
            return Encoding.Iso2022_CN;
        case "ISO-2022-JP":
            return Encoding.Iso2022_JP;
        case "ISO-2022-KR":
            return Encoding.Iso2022_KR;
        case "ISO-8859-1":
            return Encoding.Iso8859_1;
        case "ISO-8859-2":
            return Encoding.Iso8859_2;
        case "ISO-8859-5":
            return Encoding.Iso8859_5;
        case "ISO-8859-6":
            return Encoding.Iso8859_6;
        case "ISO-8859-7":
            return Encoding.Iso8859_7;
        case "ISO-8859-8":
            return Encoding.Iso8859_8;
        case "ISO-8859-9":
            return Encoding.Iso8859_9;
        case "KOI8-R":
            return Encoding.Koi8R;
        case "mbcs":
            return Encoding.Mbcs;
        case "sbcs":
            return Encoding.Sbcs;
        case "Shift_JIS":
            return Encoding.Shift_JIS;
        case "UTF-16BE":
            return Encoding.Utf16be;
        case "UTF-16LE":
            return Encoding.Utf16le;
        case "UTF-32":
            // 看过 chardet 的代码，并不会返回这个结果
            return Encoding.Unknown;
        case "UTF-32BE":
            return Encoding.Utf32be;
        case "UTF-32LE":
            return Encoding.Utf32le;
        case "UTF-8":
            return Encoding.Utf8;
        case "windows-1250":
            return Encoding.Windows1250;
        case "windows-1251":
            return Encoding.Windows1251;
        case "windows-1252":
            return Encoding.Windows1252;
        case "windows-1253":
            return Encoding.Windows1253;
        case "windows-1254":
            return Encoding.Windows1254;
        case "windows-1255":
            return Encoding.Windows1255;
        case "windows-1256":
            return Encoding.Windows1256;
        default:
            return Encoding.Unknown;
    }
}
