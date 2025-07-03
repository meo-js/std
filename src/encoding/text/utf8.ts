import { flat, Pipe, type IPipe, type Next } from "../../pipe.js";
import { concatString, flatCodePoints } from "../../pipe/string.js";
import { toUint8Array } from "../../pipe/typed-array.js";
import {
    hasReplacementChar,
    isSurrogate,
    needsSurrogatePair,
} from "../../string.js";
import { asUint8Array } from "../../typed-array.js";
import {
    catchError,
    throwInvalidByte,
    throwInvalidSurrogate,
    wrapError,
} from "../error.js";
import * as decodeFallback from "./decode-fallback.js";
import type { Utf8DecodeOptions, Utf8EncodeOptions } from "./options.js";
import { _encodeInto, IsWellFormedPipe, VerifyPipe } from "./utf.js";

/**
 * UTF-8 BOM
 */
export const BOM = new Uint8Array([0xef, 0xbb, 0xbf]);

const REPLACEMENT_CHAR_BYTES = new Uint8Array([0xef, 0xbf, 0xbd]);

class DecodePipe implements IPipe<number, string> {
    private fatal: boolean;
    private fallback: decodeFallback.DecodeFallback;
    private buffer = new Uint8Array(4);
    private bufferSize = 0;
    private totalPosition = 0;
    private bomDetected: 0 | 1 | 2 | 3 = 0;

    constructor(opts?: Utf8DecodeOptions) {
        this.fatal = opts?.fatal ?? false;
        this.fallback = opts?.fallback ?? decodeFallback.replace;
    }

    private consumeBytes(count: number): void {
        const { bufferSize } = this;
        if (count === bufferSize) {
            this.bufferSize = 0;
        } else {
            const remaining = bufferSize - count;
            this.buffer.copyWithin(0, count, bufferSize);
            this.bufferSize = remaining;
        }
    }

    private clearBytes(): void {
        this.bufferSize = 0;
    }

    transform(byte: number, next: Next<string>): boolean {
        this.buffer[this.bufferSize++] = byte;

        if (this.bomDetected === 3) {
            return this.handleUnit(next, false);
        } else {
            switch (this.bomDetected) {
                case 0:
                    if (byte === BOM[0]) {
                        this.bomDetected = 1;
                        return true;
                    } else {
                        this.bomDetected = 3;
                        return this.handleUnit(next, false);
                    }

                case 1:
                    if (byte === BOM[1]) {
                        this.bomDetected = 2;
                        return true;
                    } else {
                        this.bomDetected = 3;
                        return this.handleUnit(next, false);
                    }

                case 2:
                    if (byte === BOM[2]) {
                        this.bomDetected = 3;
                        this.consumeBytes(3);
                        this.totalPosition += 3;
                        return true;
                    } else {
                        this.bomDetected = 3;
                        return this.handleUnit(next, false);
                    }
            }
        }
    }

    private handleUnit(next: Next<string>, flush: boolean): boolean {
        const { buffer, bufferSize, fatal, fallback } = this;

        const byte = buffer[0];
        const len = measureUnitLength(byte, fatal);

        if (len === 1) {
            this.consumeBytes(1);
            const cont = next(String.fromCharCode(byte));
            this.totalPosition += 1;
            return cont;
        }

        if (len === -1) {
            this.consumeBytes(1);
            const cont = next(fallback(byte, true));
            this.totalPosition += 1;
            return cont;
        }

        // 等待更多字节
        if (bufferSize < len) {
            if (flush) {
                if (fatal) {
                    throwInvalidByte(byte);
                } else {
                    this.consumeBytes(1);
                    const cont = next(fallback(byte, true));
                    this.totalPosition += 1;
                    if (cont) {
                        return this.handleUnit(next, flush);
                    } else {
                        return false;
                    }
                }
            } else {
                return true;
            }
        }

        // 组合字节
        let codePoint = 0;
        for (let i = 1; i < len; i++) {
            const _byte = buffer[i];
            if ((_byte & 0xc0) !== 0x80) {
                if (fatal) {
                    throwInvalidByte(byte);
                } else {
                    this.consumeBytes(1);
                    const cont = next(fallback(byte, true));
                    this.totalPosition += 1;
                    if (cont) {
                        return this.handleUnit(next, flush);
                    } else {
                        this.clearBytes();
                        return false;
                    }
                }
            } else {
                codePoint = (codePoint << 6) | (_byte & 0x3f);
            }
        }
        if (len === 2) {
            codePoint = ((byte & 0x1f) << 6) | codePoint;
        } else if (len === 3) {
            codePoint = ((byte & 0x0f) << 12) | codePoint;
        } else {
            codePoint = ((byte & 0x07) << 18) | codePoint;
        }

        this.consumeBytes(len);

        if (isSurrogate(codePoint) || codePoint > 0x10ffff) {
            if (fatal) {
                throwInvalidSurrogate(codePoint);
            } else {
                const cont = next(fallback(codePoint, true));
                this.totalPosition += len;
                return cont;
            }
        }

        const cont = next(String.fromCodePoint(codePoint));
        this.totalPosition += len;
        return cont;
    }

    flush(next: Next<string>): void {
        while (this.bufferSize !== 0) {
            if (!this.handleUnit(next, true)) {
                break;
            }
        }

        this.reset();
    }

    catch(error: unknown): unknown {
        const totalPosition = this.totalPosition;
        this.reset();
        return wrapError(error, totalPosition);
    }

    reset() {
        this.clearBytes();
        this.totalPosition = 0;
        this.bomDetected = 0;
    }
}

class EncodePipe implements IPipe<number, number> {
    private fatal: boolean;
    private addBom: boolean;
    private needAddBom: boolean;

    constructor(opts?: Utf8EncodeOptions) {
        this.fatal = opts?.fatal ?? false;
        this.addBom = opts?.bom ?? false;
        this.needAddBom = this.addBom;
    }

    transform(codePoint: number, next: Next<number>): boolean {
        if (this.needAddBom) {
            this.needAddBom = false;
            if (!(next(BOM[0]) && next(BOM[1]) && next(BOM[2]))) {
                return false;
            }
        }

        if (codePoint <= 0x7f) {
            return next(codePoint);
        } else if (codePoint <= 0x7ff) {
            return (
                next((codePoint >> 6) | 0xc0) && next((codePoint & 0x3f) | 0x80)
            );
        } else if (isSurrogate(codePoint)) {
            if (this.fatal) {
                throwInvalidSurrogate(codePoint);
            } else {
                return (
                    next(REPLACEMENT_CHAR_BYTES[0])
                    && next(REPLACEMENT_CHAR_BYTES[1])
                    && next(REPLACEMENT_CHAR_BYTES[2])
                );
            }
        } else if (codePoint <= 0xffff) {
            return (
                next((codePoint >> 12) | 0xe0)
                && next(((codePoint >> 6) & 0x3f) | 0x80)
                && next((codePoint & 0x3f) | 0x80)
            );
        } else {
            return (
                next((codePoint >> 18) | 0xf0)
                && next(((codePoint >> 12) & 0x3f) | 0x80)
                && next(((codePoint >> 6) & 0x3f) | 0x80)
                && next((codePoint & 0x3f) | 0x80)
            );
        }
    }

    flush(next: Next<number>): void {
        const { needAddBom } = this;
        this.reset();
        if (needAddBom) {
            next(BOM[0]) && next(BOM[1]) && next(BOM[2]);
        }
    }

    reset() {
        this.needAddBom = this.addBom;
    }
}

/**
 * 创建一个解码 UTF-8 字节数据的管道
 */
export function decodePipe(opts?: Utf8DecodeOptions) {
    return new Pipe(new DecodePipe(opts));
}

/**
 * 创建一个编码字符码点为 UTF-8 字节数据的管道
 */
export function encodePipe(opts?: Utf8EncodeOptions) {
    return new Pipe(new EncodePipe(opts));
}

/**
 * 创建一个验证字节数据是否为有效 UTF-8 编码的管道
 */
export function verifyPipe(allowReplacementChar?: boolean) {
    return new Pipe(
        new VerifyPipe(decodePipe({ fatal: true }), allowReplacementChar),
    );
}

/**
 * 创建一个验证字符串码点是否能编码为 UTF-8 的管道
 */
export function isWellFormedPipe(allowReplacementChar?: boolean) {
    return new Pipe(new IsWellFormedPipe(allowReplacementChar));
}

/**
 * 以 UTF-8 解码字节数据为字符串
 *
 * @param bytes 字节数据
 * @param opts {@link Utf8DecodeOptions}
 * @returns 字符串
 */
export function decode(bytes: BufferSource, opts?: Utf8DecodeOptions): string {
    const data = asUint8Array(bytes);
    return Pipe.run(data, flat(), decodePipe(opts), concatString());
}

/**
 * 编码字符串为 UTF-8 字节数据
 *
 * @param text 字符串
 * @param opts {@link Utf8EncodeOptions}
 * @returns UTF-8 字节数据
 */
export function encode(text: string, opts?: Utf8EncodeOptions): Uint8Array {
    return Pipe.run(
        text,
        flatCodePoints(),
        catchError(),
        encodePipe(opts),
        toUint8Array(),
    );
}

/**
 * 编码字符串为 UTF-8 字节数据至指定缓冲区
 *
 * 注意：无论提供的选项如何都不会编码 BOM，如有需要请手动添加。
 *
 * @param text 字符串
 * @param out 输出缓冲区
 * @param opts {@link Utf8EncodeOptions}
 * @returns 返回一个对象，包含已转换的 UTF-16 编码单元数量和写入缓冲区的字节数
 */
export function encodeInto(
    text: string,
    out: BufferSource,
    opts?: Utf8EncodeOptions,
): { read: number; written: number } {
    return _encodeInto(
        text,
        out,
        encodePipe({
            ...opts,
            bom: false,
        }),
        estimateSize(text, false),
        4,
    );
}

/**
 * 检查字节序列开头是否包含 UTF-8 BOM
 *
 * @param bytes 输入的字节序列
 * @returns 如果包含 BOM 返回 `true`，否则返回 `false`
 */
export function hasBom(bytes: Uint8Array): boolean {
    return (
        bytes.length >= 3
        && bytes[0] === BOM[0]
        && bytes[1] === BOM[1]
        && bytes[2] === BOM[2]
    );
}

/**
 * 验证是否为有效的 UTF-8 字节数据
 *
 * @param bytes 字节数据
 * @param allowReplacementChar 是否允许存在替换字符 `U+001A` 或 `U+FFFD`，默认 `false`
 * @returns 是否为有效的 UTF-8 编码
 */
export function verify(
    bytes: BufferSource,
    allowReplacementChar?: boolean,
): boolean {
    const data = asUint8Array(bytes);
    return Pipe.run(data, flat(), verifyPipe(allowReplacementChar));
}

/**
 * 判断字符串是否可被编码为完全有效的 UTF-8 字节数据
 */
export function isWellFormed(
    text: string,
    allowReplacementChar: boolean = false,
): boolean {
    return (
        text.isWellFormed()
        && (allowReplacementChar || !hasReplacementChar(text))
    );
}

/**
 * 估算字符串编码为 UTF-8 时可能的最大字节数
 */
export function estimateSize(text: string, bom: boolean = false): number {
    return text.length * 3 + (bom ? 3 : 0);
}

/**
 * 精确测量字符串编码为 UTF-8 时所需字节数
 */
export function measureSize(text: string, opts?: Utf8EncodeOptions): number {
    const addBom = opts?.bom ?? false;
    const fatal = opts?.fatal ?? false;

    const len = text.length;
    let size = addBom ? 3 : 0;
    let i = 0;

    while (i < len) {
        const code = text.codePointAt(i)!;
        const _size = measureCharSize(code, fatal);

        if (_size === -1) {
            size += REPLACEMENT_CHAR_BYTES.length;
        } else {
            size += _size;
        }

        i += needsSurrogatePair(code) ? 2 : 1;
    }

    return size;
}

/**
 * 精确测量 UTF-8 字节数据解码为字符串后的长度
 */
export function measureLength(
    bytes: BufferSource,
    opts?: Utf8DecodeOptions,
): number {
    const data = asUint8Array(bytes);
    let len = 0;
    Pipe.run(data, flat(), decodePipe(opts), input => {
        len += input.length;
    });
    return len;
}

/**
 * 精确测量 Unicode 码点编码为 UTF-8 时所需字节数
 *
 * @returns -1 表示无效代理对，1 - 4 为完整长度
 */
export function measureCharSize(
    codePoint: number,
    fatal: boolean,
): -1 | 1 | 2 | 3 | 4 {
    if (codePoint <= 0x7f) {
        return 1;
    } else if (codePoint <= 0x7ff) {
        return 2;
    } else if (isSurrogate(codePoint)) {
        if (fatal) {
            throwInvalidSurrogate(codePoint);
        } else {
            return -1;
        }
    } else if (codePoint <= 0xffff) {
        return 3;
    } else {
        return 4;
    }
}

/**
 * 精确测量 UTF-8 起始字节对应 Unicode 码点的完整字节序列长度
 *
 * @returns -1 表示无效字节，1 - 4 为完整长度
 */
export function measureUnitLength(
    byte: number,
    fatal: boolean,
): -1 | 1 | 2 | 3 | 4 {
    if ((byte & 0x80) === 0) {
        return 1;
    } else if ((byte & 0xe0) === 0xc0) {
        return 2;
    } else if ((byte & 0xf0) === 0xe0) {
        return 3;
    } else if ((byte & 0xf8) === 0xf0) {
        return 4;
    } else {
        if (fatal) {
            throwInvalidSurrogate(byte);
        } else {
            return -1;
        }
    }
}
