import { flat, Pipe, type IPipe, type Next } from "../../pipe.js";
import {
    concatString,
    flatCharCodes,
    flatCodePoints,
} from "../../pipe/string.js";
import { toUint8Array } from "../../pipe/typed-array.js";
import { isString } from "../../predicate.js";
import { isWhitespaceCodePoint } from "../../string.js";
import { asUint8Array } from "../../typed-array.js";
import { throwInvalidChar, throwInvalidLength } from "../error.js";
import { utf8 } from "../text.js";
import type { HexDecodeOptions, HexEncodeOptions } from "./options.js";
import { _decodeInto } from "./shared.js";

const encodeTable = [
    "00",
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "0a",
    "0b",
    "0c",
    "0d",
    "0e",
    "0f",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "1a",
    "1b",
    "1c",
    "1d",
    "1e",
    "1f",
    "20",
    "21",
    "22",
    "23",
    "24",
    "25",
    "26",
    "27",
    "28",
    "29",
    "2a",
    "2b",
    "2c",
    "2d",
    "2e",
    "2f",
    "30",
    "31",
    "32",
    "33",
    "34",
    "35",
    "36",
    "37",
    "38",
    "39",
    "3a",
    "3b",
    "3c",
    "3d",
    "3e",
    "3f",
    "40",
    "41",
    "42",
    "43",
    "44",
    "45",
    "46",
    "47",
    "48",
    "49",
    "4a",
    "4b",
    "4c",
    "4d",
    "4e",
    "4f",
    "50",
    "51",
    "52",
    "53",
    "54",
    "55",
    "56",
    "57",
    "58",
    "59",
    "5a",
    "5b",
    "5c",
    "5d",
    "5e",
    "5f",
    "60",
    "61",
    "62",
    "63",
    "64",
    "65",
    "66",
    "67",
    "68",
    "69",
    "6a",
    "6b",
    "6c",
    "6d",
    "6e",
    "6f",
    "70",
    "71",
    "72",
    "73",
    "74",
    "75",
    "76",
    "77",
    "78",
    "79",
    "7a",
    "7b",
    "7c",
    "7d",
    "7e",
    "7f",
    "80",
    "81",
    "82",
    "83",
    "84",
    "85",
    "86",
    "87",
    "88",
    "89",
    "8a",
    "8b",
    "8c",
    "8d",
    "8e",
    "8f",
    "90",
    "91",
    "92",
    "93",
    "94",
    "95",
    "96",
    "97",
    "98",
    "99",
    "9a",
    "9b",
    "9c",
    "9d",
    "9e",
    "9f",
    "a0",
    "a1",
    "a2",
    "a3",
    "a4",
    "a5",
    "a6",
    "a7",
    "a8",
    "a9",
    "aa",
    "ab",
    "ac",
    "ad",
    "ae",
    "af",
    "b0",
    "b1",
    "b2",
    "b3",
    "b4",
    "b5",
    "b6",
    "b7",
    "b8",
    "b9",
    "ba",
    "bb",
    "bc",
    "bd",
    "be",
    "bf",
    "c0",
    "c1",
    "c2",
    "c3",
    "c4",
    "c5",
    "c6",
    "c7",
    "c8",
    "c9",
    "ca",
    "cb",
    "cc",
    "cd",
    "ce",
    "cf",
    "d0",
    "d1",
    "d2",
    "d3",
    "d4",
    "d5",
    "d6",
    "d7",
    "d8",
    "d9",
    "da",
    "db",
    "dc",
    "dd",
    "de",
    "df",
    "e0",
    "e1",
    "e2",
    "e3",
    "e4",
    "e5",
    "e6",
    "e7",
    "e8",
    "e9",
    "ea",
    "eb",
    "ec",
    "ed",
    "ee",
    "ef",
    "f0",
    "f1",
    "f2",
    "f3",
    "f4",
    "f5",
    "f6",
    "f7",
    "f8",
    "f9",
    "fa",
    "fb",
    "fc",
    "fd",
    "fe",
    "ff",
];

// 存储的值为对应的十六进制值（0-15），填充 0xFF 表示无效的十六进制字符
const decodeTable = new Uint8Array([
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
]);

const whitespaceRegex = /\s+/gu;
const verifyRegex = /^[0-9a-fA-F]+$/u;

/**
 * 将字节数据编码为 Hex 字符串
 *
 * @param bytes 字节数据
 * @param opts {@link HexEncodeOptions}
 * @returns Hex 编码的字符串
 */
export function encode(
    bytes: string | BufferSource,
    opts?: HexEncodeOptions,
): string {
    const pretty = opts?.pretty ?? false;
    if (isString(bytes)) {
        return Pipe.run(
            bytes,
            flatCodePoints(),
            utf8.encodePipe(opts?.utf8Options),
            encodePipe(opts),
            concatString(),
        );
    } else {
        const data = asUint8Array(bytes);
        return Pipe.run(
            data,
            flat(),
            encodePipe(opts),
            concatString(new Array(measureLength(data, pretty))),
        );
    }
}

/**
 * 将 Hex 字符串解码为字节数据
 *
 * @param text  Hex 字符串
 * @param opts {@link HexDecodeOptions}
 * @returns 字节数据
 */
export function decode(text: string, opts?: HexDecodeOptions): Uint8Array {
    const fatal = opts?.fatal ?? true;
    return Pipe.run(
        text,
        flatCharCodes(),
        decodePipe(opts),
        toUint8Array(fatal ? new Uint8Array(measureSize(text)) : undefined),
    );
}

/**
 * 将 Hex 字符串解码到指定的缓冲区中
 *
 * @param text Hex 字符串
 * @param out 输出缓冲区
 * @param opts {@link HexDecodeOptions}
 * @returns 返回一个对象，包含已读取的字符数量和写入缓冲区的字节数
 */
export function decodeInto(
    text: string,
    out: BufferSource,
    opts?: HexDecodeOptions,
): { read: number; written: number } {
    return _decodeInto(text, out, decodePipe(opts), measureSize(text), 1);
}

/**
 * @param text 字符串
 * @returns 返回是否为有效的 Hex 字符串
 */
export function verify(text: string) {
    text = text.replace(whitespaceRegex, "");

    if (text.length % 2 !== 0) {
        return false;
    }

    return verifyRegex.test(text);
}

/**
 * 计算字节数据编码为 Hex 字符串的精确长度
 */
export function measureLength(bytes: BufferSource, pretty: boolean): number {
    const data = asUint8Array(bytes);
    const baseLength = data.length * 2;
    return pretty ? baseLength + Math.max(0, data.length - 1) : baseLength;
}

/**
 * 计算 Hex 字符串解码为字节数据的精确长度
 *
 * 注意：仅当解码时 `fatal` 为 `true` 且未抛出错误时，该函数计算的长度才绝对准确，否则返回的长度为最大长度。
 */
export function measureSize(text: string): number {
    text = text.replace(whitespaceRegex, "");
    return Math.floor(text.length / 2);
}

/**
 * 创建一个编码字节数据为 Hex 字符串的管道
 */
export function encodePipe(opts?: HexEncodeOptions) {
    return new Pipe(new EncodePipe(opts));
}

/**
 * 创建一个解码 Hex 字符串为字节数据的管道
 */
export function decodePipe(opts?: HexDecodeOptions) {
    return new Pipe(new DecodePipe(opts));
}

/**
 * 创建一个验证 Hex 字符串有效性的管道
 */
export function verifyPipe() {
    return new Pipe(new VerifyPipe());
}

class EncodePipe implements IPipe<number, string> {
    private pretty: boolean;
    private first = true;

    constructor(opts?: HexEncodeOptions) {
        this.pretty = opts?.pretty ?? false;
    }

    transform(byte: number, next: Next<string>): boolean {
        if (this.pretty) {
            if (this.first) {
                this.first = false;
                return next(encodeTable[byte].toUpperCase());
            } else {
                return next(` ${encodeTable[byte].toUpperCase()}`);
            }
        } else {
            return next(encodeTable[byte]);
        }
    }

    flush(next: Next<string>): void {
        this.first = true;
    }

    catch(error: unknown): void {
        this.first = true;
    }
}

/**
 * Hex 解码管道类
 */
class DecodePipe implements IPipe<number, number> {
    private fatal: boolean;
    private prevCode = -1;

    constructor(opts?: HexDecodeOptions) {
        this.fatal = opts?.fatal ?? true;
    }

    transform(codePoint: number, next: Next<number>): boolean {
        if (isWhitespaceCodePoint(codePoint)) {
            return true;
        }

        if (
            // 0-9, A-F, a-f
            (codePoint >= 0x30 && codePoint <= 0x39)
            || (codePoint >= 0x41 && codePoint <= 0x46)
            || (codePoint >= 0x61 && codePoint <= 0x66)
        ) {
            const hex = decodeTable[codePoint];
            if (this.prevCode !== -1) {
                const byte = (this.prevCode << 4) | hex;
                this.prevCode = -1;
                return next(byte);
            } else {
                this.prevCode = hex;
            }
        } else {
            if (this.fatal) {
                throwInvalidChar(codePoint);
            }
        }

        return true;
    }

    flush(next: Next<number>): void {
        const { prevCode } = this;
        this.prevCode = -1;
        if (prevCode !== -1) {
            if (this.fatal) {
                throwInvalidLength(1, 2, true);
            }
        }
    }

    catch(error: unknown): void {
        this.prevCode = -1;
    }
}

/**
 * Hex 验证管道类
 */
class VerifyPipe implements IPipe<number, boolean> {
    private hasPrev = false;
    private result: boolean = true;

    transform(codePoint: number, next: Next<boolean>): boolean {
        if (isWhitespaceCodePoint(codePoint)) {
            return true;
        }

        if (
            // 0-9, A-F, a-f
            (codePoint >= 0x30 && codePoint <= 0x39)
            || (codePoint >= 0x41 && codePoint <= 0x46)
            || (codePoint >= 0x61 && codePoint <= 0x66)
        ) {
            if (this.hasPrev) {
                this.hasPrev = false;
            } else {
                this.hasPrev = true;
            }
            return true;
        } else {
            this.result = false;
            next(false);
            return false;
        }
    }

    flush(next: Next<boolean>): boolean {
        const { hasPrev, result } = this;

        this.reset();

        if (!result) {
            return false;
        }

        if (hasPrev) {
            next(false);
            return false;
        }

        next(true);
        return true;
    }

    catch(error: unknown): void {
        this.reset();
    }

    reset() {
        this.hasPrev = false;
        this.result = true;
    }
}
