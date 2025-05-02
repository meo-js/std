import { isString } from "../../guard.js";
import { asUint8Array } from "../../typed-array.js";
import { unit8 } from "../byte.js";
import { throwInvalidChar, throwInvalidLength } from "../error.js";
import { textEncoding } from "../text.js";
import type { HexDecodeOptions, HexEncodeOptions } from "./options.js";

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
 * 将字节数据编码为十六进制字符串
 *
 * @param bytes 字节数据
 * @param opts {@link HexEncodeOptions}
 * @returns 十六进制编码的字符串
 */
export function encode(
    bytes: string | BufferSource,
    opts?: HexEncodeOptions,
): string {
    if (isString(bytes)) {
        const encoding = opts?.encoding;
        if (encoding != null) {
            return encode(
                textEncoding.encode(bytes, encoding, opts?.encodingOptions),
                opts,
            );
        } else {
            return encode(unit8.decode(bytes, opts), opts);
        }
    } else {
        const data = asUint8Array(bytes);

        const len = data.length;
        const strs = new Array<string>(len);

        for (let i = 0; i < len; i++) {
            strs[i] = encodeTable[data[i]];
        }

        return opts?.pretty ? format(strs) : strs.join("");
    }
}

function format(strs: string[]): string {
    return strs.join(" ").toUpperCase();
}

/**
 * 将十六进制字符串解码为字节数据
 *
 * @param text 十六进制字符串
 * @param opts {@link HexDecodeOptions}
 * @returns 字节数据
 */
export function decode(text: string, opts?: HexDecodeOptions): Uint8Array {
    text = text.replace(whitespaceRegex, "");

    const fatal = opts?.fatal ?? true;
    let len = text.length;

    if (len % 2 !== 0) {
        if (fatal) {
            throwInvalidLength(len, "even");
        } else {
            len -= 1;
        }
    }

    const bytes = new Uint8Array(len / 2);
    for (let i = 0, j = 0; i < len; i += 2, j++) {
        const highChar = text.charCodeAt(i);
        const lowChar = text.charCodeAt(i + 1);

        if (
            !(
                (highChar >= 0x30 && highChar <= 0x39)
                || (highChar >= 0x61 && highChar <= 0x66)
                || (highChar >= 0x41 && highChar <= 0x46)
            )
            || !(
                (lowChar >= 0x30 && lowChar <= 0x39)
                || (lowChar >= 0x61 && lowChar <= 0x66)
                || (lowChar >= 0x41 && lowChar <= 0x46)
            )
        ) {
            if (fatal) {
                throwInvalidChar(text.slice(i, i + 2), i);
            } else {
                bytes[j] = 0x00;
            }
        } else {
            const high = decodeTable[highChar];
            const low = decodeTable[lowChar];
            bytes[j] = (high << 4) | low;
        }
    }

    return bytes;
}

/**
 * @param text 字符串
 * @returns 返回是否为有效的十六进制字符串
 */
export function verify(text: string) {
    text = text.replace(whitespaceRegex, "");

    if (text.length === 0 || text.length % 2 !== 0) {
        return false;
    }

    return verifyRegex.test(text);
}
