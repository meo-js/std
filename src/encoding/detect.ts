import chardet, { type EncodingName } from "chardet";
import { asUint8Array } from "../utils/typed-array.js";
import {
    Encoding,
    type AnalyseResult,
    type DetectableEncoding,
} from "./shared.js";

/**
 * 检测输入数据的编码格式
 *
 * @returns 返回置信度最高的编码格式
 */
export function detect(input: BufferSource): DetectableEncoding {
    return toTextEncoding(
        chardet.detect(asUint8Array(input)) as EncodingName | null,
    );
}

/**
 * 检测输入数据的编码格式
 *
 * @returns 返回可能编码格式的完整列表
 */
export function analyse(input: BufferSource): AnalyseResult {
    const result = chardet.analyse(asUint8Array(input));
    for (const item of result) {
        item.name = toTextEncoding(item.name) as never;
    }
    return result as AnalyseResult;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Ascii} 编码数据
 */
export function isAscii(input: BufferSource): boolean {
    return detect(input) === Encoding.Ascii;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Big5} 编码数据
 */
export function isBig5(input: BufferSource): boolean {
    return detect(input) === Encoding.Big5;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Euc_JP} 编码数据
 */
export function isEuc_JP(input: BufferSource): boolean {
    return detect(input) === Encoding.Euc_JP;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Euc_KR} 编码数据
 */
export function isEuc_KR(input: BufferSource): boolean {
    return detect(input) === Encoding.Euc_KR;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Gb18030} 编码数据
 */
export function isGb18030(input: BufferSource): boolean {
    return detect(input) === Encoding.Gb18030;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Iso2022} 编码数据
 */
export function isIso2022(input: BufferSource): boolean {
    return detect(input) === Encoding.Iso2022;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Iso2022_CN} 编码数据
 */
export function isIso2022_CN(input: BufferSource): boolean {
    return detect(input) === Encoding.Iso2022_CN;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Iso2022_JP} 编码数据
 */
export function isIso2022_JP(input: BufferSource): boolean {
    return detect(input) === Encoding.Iso2022_JP;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Iso2022_KR} 编码数据
 */
export function isIso2022_KR(input: BufferSource): boolean {
    return detect(input) === Encoding.Iso2022_KR;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Iso8859_1} 编码数据
 */
export function isIso8859_1(input: BufferSource): boolean {
    return detect(input) === Encoding.Iso8859_1;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Iso8859_2} 编码数据
 */
export function isIso8859_2(input: BufferSource): boolean {
    return detect(input) === Encoding.Iso8859_2;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Iso8859_5} 编码数据
 */
export function isIso8859_5(input: BufferSource): boolean {
    return detect(input) === Encoding.Iso8859_5;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Iso8859_6} 编码数据
 */
export function isIso8859_6(input: BufferSource): boolean {
    return detect(input) === Encoding.Iso8859_6;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Iso8859_7} 编码数据
 */
export function isIso8859_7(input: BufferSource): boolean {
    return detect(input) === Encoding.Iso8859_7;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Iso8859_8} 编码数据
 */
export function isIso8859_8(input: BufferSource): boolean {
    return detect(input) === Encoding.Iso8859_8;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Iso8859_9} 编码数据
 */
export function isIso8859_9(input: BufferSource): boolean {
    return detect(input) === Encoding.Iso8859_9;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Koi8R} 编码数据
 */
export function isKoi8R(input: BufferSource): boolean {
    return detect(input) === Encoding.Koi8R;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Mbcs} 编码数据
 */
export function isMbcs(input: BufferSource): boolean {
    return detect(input) === Encoding.Mbcs;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Sbcs} 编码数据
 */
export function isSbcs(input: BufferSource): boolean {
    return detect(input) === Encoding.Sbcs;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Shift_JIS} 编码数据
 */
export function isShift_JIS(input: BufferSource): boolean {
    return detect(input) === Encoding.Shift_JIS;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Utf16le} 编码数据
 */
export function isUtf16le(input: BufferSource): boolean {
    return detect(input) === Encoding.Utf16le;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Utf16be} 编码数据
 */
export function isUtf16be(input: BufferSource): boolean {
    return detect(input) === Encoding.Utf16be;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Utf16le} 或 {@link Encoding.Utf16be} 编码数据
 */
export function isUtf16(input: BufferSource): boolean {
    const encoding = detect(input);
    return encoding === Encoding.Utf16le || encoding === Encoding.Utf16be;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Utf32} 编码数据
 */
export function isUtf32(input: BufferSource): boolean {
    const encoding = detect(input);
    return encoding === Encoding.Utf32le || encoding === Encoding.Utf32be;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Utf32be} 编码数据
 */
export function isUtf32be(input: BufferSource): boolean {
    return detect(input) === Encoding.Utf32be;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Utf32le} 编码数据
 */
export function isUtf32le(input: BufferSource): boolean {
    return detect(input) === Encoding.Utf32le;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Utf8} 编码数据
 */
export function isUtf8(input: BufferSource): boolean {
    return detect(input) === Encoding.Utf8;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Windows1250} 编码数据
 */
export function isWindows1250(input: BufferSource): boolean {
    return detect(input) === Encoding.Windows1250;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Windows1251} 编码数据
 */
export function isWindows1251(input: BufferSource): boolean {
    return detect(input) === Encoding.Windows1251;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Windows1252} 编码数据
 */
export function isWindows1252(input: BufferSource): boolean {
    return detect(input) === Encoding.Windows1252;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Windows1253} 编码数据
 */
export function isWindows1253(input: BufferSource): boolean {
    return detect(input) === Encoding.Windows1253;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Windows1254} 编码数据
 */
export function isWindows1254(input: BufferSource): boolean {
    return detect(input) === Encoding.Windows1254;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Windows1255} 编码数据
 */
export function isWindows1255(input: BufferSource): boolean {
    return detect(input) === Encoding.Windows1255;
}

/**
 * @param input 输入数据
 * @returns 是否为 {@link Encoding.Windows1256} 编码数据
 */
export function isWindows1256(input: BufferSource): boolean {
    return detect(input) === Encoding.Windows1256;
}

function toTextEncoding(name: EncodingName | null): DetectableEncoding {
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
