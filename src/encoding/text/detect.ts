import chardet, { type EncodingName } from "chardet";
import { asUint8Array } from "../../typed-array.js";
import type { TextEncodingAnalyseResult } from "./detect-type.js";
import { TextEncoding } from "./enum.js";

/**
 * 检测输入数据的编码格式
 *
 * @returns 返回置信度最高的编码格式
 */
export function detect(bytes: BufferSource): TextEncoding {
    return toTextEncoding(
        chardet.detect(asUint8Array(bytes)) as EncodingName | null,
    );
}

/**
 * 检测输入数据的编码格式
 *
 * @returns 返回可能编码格式的完整列表
 */
export function analyse(bytes: BufferSource): TextEncodingAnalyseResult {
    const result = chardet.analyse(asUint8Array(bytes));
    for (const item of result) {
        item.name = toTextEncoding(item.name) as chardet.EncodingName;
    }
    return result as TextEncodingAnalyseResult;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Ascii} 编码数据
 */
export function isAscii(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Ascii;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Big5} 编码数据
 */
export function isBig5(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Big5;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Euc_JP} 编码数据
 */
export function isEuc_JP(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Euc_JP;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Euc_KR} 编码数据
 */
export function isEuc_KR(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Euc_KR;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Gb18030} 编码数据
 */
export function isGb18030(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Gb18030;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Iso2022} 编码数据
 */
export function isIso2022(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Iso2022;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Iso2022_CN} 编码数据
 */
export function isIso2022_CN(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Iso2022_CN;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Iso2022_JP} 编码数据
 */
export function isIso2022_JP(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Iso2022_JP;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Iso2022_KR} 编码数据
 */
export function isIso2022_KR(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Iso2022_KR;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Iso8859_1} 编码数据
 */
export function isIso8859_1(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Iso8859_1;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Iso8859_2} 编码数据
 */
export function isIso8859_2(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Iso8859_2;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Iso8859_5} 编码数据
 */
export function isIso8859_5(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Iso8859_5;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Iso8859_6} 编码数据
 */
export function isIso8859_6(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Iso8859_6;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Iso8859_7} 编码数据
 */
export function isIso8859_7(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Iso8859_7;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Iso8859_8} 编码数据
 */
export function isIso8859_8(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Iso8859_8;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Iso8859_9} 编码数据
 */
export function isIso8859_9(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Iso8859_9;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Koi8R} 编码数据
 */
export function isKoi8R(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Koi8R;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Mbcs} 编码数据
 */
export function isMbcs(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Mbcs;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Sbcs} 编码数据
 */
export function isSbcs(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Sbcs;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Shift_JIS} 编码数据
 */
export function isShift_JIS(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Shift_JIS;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Utf16le} 编码数据
 */
export function isUtf16le(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Utf16le;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Utf16be} 编码数据
 */
export function isUtf16be(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Utf16be;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Utf16le} 或 {@link TextEncoding.Utf16be} 编码数据
 */
export function isUtf16(bytes: BufferSource): boolean {
    const encoding = detect(bytes);
    return (
        encoding === TextEncoding.Utf16le || encoding === TextEncoding.Utf16be
    );
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Utf32} 编码数据
 */
export function isUtf32(bytes: BufferSource): boolean {
    const encoding = detect(bytes);
    return (
        encoding === TextEncoding.Utf32le || encoding === TextEncoding.Utf32be
    );
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Utf32be} 编码数据
 */
export function isUtf32be(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Utf32be;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Utf32le} 编码数据
 */
export function isUtf32le(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Utf32le;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Utf8} 编码数据
 */
export function isUtf8(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Utf8;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Windows1250} 编码数据
 */
export function isWindows1250(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Windows1250;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Windows1251} 编码数据
 */
export function isWindows1251(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Windows1251;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Windows1252} 编码数据
 */
export function isWindows1252(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Windows1252;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Windows1253} 编码数据
 */
export function isWindows1253(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Windows1253;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Windows1254} 编码数据
 */
export function isWindows1254(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Windows1254;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Windows1255} 编码数据
 */
export function isWindows1255(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Windows1255;
}

/**
 * @param bytes 输入数据
 * @returns 是否为 {@link TextEncoding.Windows1256} 编码数据
 */
export function isWindows1256(bytes: BufferSource): boolean {
    return detect(bytes) === TextEncoding.Windows1256;
}

function toTextEncoding(name: EncodingName | null): TextEncoding {
    switch (name) {
        case "ASCII":
            return TextEncoding.Ascii;
        case "Big5":
            return TextEncoding.Big5;
        case "EUC-JP":
            return TextEncoding.Euc_JP;
        case "EUC-KR":
            return TextEncoding.Euc_KR;
        case "GB18030":
            return TextEncoding.Gb18030;
        case "ISO_2022":
            return TextEncoding.Iso2022;
        case "ISO-2022-CN":
            return TextEncoding.Iso2022_CN;
        case "ISO-2022-JP":
            return TextEncoding.Iso2022_JP;
        case "ISO-2022-KR":
            return TextEncoding.Iso2022_KR;
        case "ISO-8859-1":
            return TextEncoding.Iso8859_1;
        case "ISO-8859-2":
            return TextEncoding.Iso8859_2;
        case "ISO-8859-5":
            return TextEncoding.Iso8859_5;
        case "ISO-8859-6":
            return TextEncoding.Iso8859_6;
        case "ISO-8859-7":
            return TextEncoding.Iso8859_7;
        case "ISO-8859-8":
            return TextEncoding.Iso8859_8;
        case "ISO-8859-9":
            return TextEncoding.Iso8859_9;
        case "KOI8-R":
            return TextEncoding.Koi8R;
        case "mbcs":
            return TextEncoding.Mbcs;
        case "sbcs":
            return TextEncoding.Sbcs;
        case "Shift_JIS":
            return TextEncoding.Shift_JIS;
        case "UTF-16BE":
            return TextEncoding.Utf16be;
        case "UTF-16LE":
            return TextEncoding.Utf16le;
        case "UTF-32":
            // 看过 chardet 的代码，并不会返回这个结果
            return TextEncoding.Unknown;
        case "UTF-32BE":
            return TextEncoding.Utf32be;
        case "UTF-32LE":
            return TextEncoding.Utf32le;
        case "UTF-8":
            return TextEncoding.Utf8;
        case "windows-1250":
            return TextEncoding.Windows1250;
        case "windows-1251":
            return TextEncoding.Windows1251;
        case "windows-1252":
            return TextEncoding.Windows1252;
        case "windows-1253":
            return TextEncoding.Windows1253;
        case "windows-1254":
            return TextEncoding.Windows1254;
        case "windows-1255":
            return TextEncoding.Windows1255;
        case "windows-1256":
            return TextEncoding.Windows1256;
        default:
            return TextEncoding.Unknown;
    }
}
