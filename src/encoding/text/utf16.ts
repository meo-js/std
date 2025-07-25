import { flat, Pipe, type IPipe, type Next } from "../../pipe.js";
import { concatString, flatCodePoints } from "../../pipe/string.js";
import { toUint8Array } from "../../pipe/typed-array.js";
import {
    hasReplacementChar,
    isHighSurrogate,
    isLowSurrogate,
    isSurrogate,
    needsSurrogatePair,
    toHighSurrogate,
    toLowSurrogate,
    UNICODE_REPLACEMENT_CODE_POINT,
} from "../../string.js";
import { asUint8Array, Endian, normalizeEndian } from "../../typed-array.js";
import {
    catchError,
    throwInvalidByte,
    throwInvalidSurrogate,
    wrapError,
} from "../error.js";
import * as decodeFallback from "./decode-fallback.js";
import type { Utf16DecodeOptions, Utf16EncodeOptions } from "./options.js";
import { _encodeInto, IsWellFormedPipe, VerifyPipe } from "./utf.js";

/**
 * 大端序 UTF-16 BOM
 */
export const BOM = 0xfeff;

/**
 * 小端序 UTF-16 BOM
 */
export const BOM_REVERSE = 0xfffe;

/**
 * 编码字符串为 UTF-16 字节数据
 *
 * @param text 字符串
 * @param opts {@link Utf16EncodeOptions}
 * @returns UTF-16 字节数据
 */
export function encode(text: string, opts?: Utf16EncodeOptions): Uint8Array {
    const addBom = opts?.bom ?? true;
    return Pipe.run(
        text,
        flatCodePoints(),
        catchError(),
        encodePipe(opts),
        toUint8Array(new Uint8Array(measureSize(text, addBom))),
    );
}

/**
 * 编码字符串为 UTF-16 字节数据至指定缓冲区
 *
 * 注意：无论提供的选项如何都不会编码 BOM，如有需要请手动添加。
 *
 * @param text 字符串
 * @param out 输出缓冲区
 * @param opts {@link Utf16EncodeOptions}
 * @returns 返回一个对象，包含已转换的 UTF-16 编码单元数量和写入缓冲区的字节数
 */
export function encodeInto(
    text: string,
    out: BufferSource,
    opts?: Utf16EncodeOptions,
): { read: number; written: number } {
    return _encodeInto(
        text,
        out,
        encodePipe({
            ...opts,
            bom: false,
        }),
        measureSize(text, false),
        4,
    );
}

/**
 * 以 UTF-16 解码字节数据为字符串
 *
 * @param bytes 字节数据
 * @param opts {@link Utf16DecodeOptions}
 * @returns 字符串
 */
export function decode(bytes: BufferSource, opts?: Utf16DecodeOptions): string {
    const data = asUint8Array(bytes);
    return Pipe.run(data, flat(), decodePipe(opts), concatString());
}

/**
 * 检测 UTF-16 字节数据的字节序
 *
 * @returns 字节序，若无法检测则返回 `undefined`
 */
export function sniff(byte1: number, byte2: number): Endian | undefined {
    const bom = (byte1 << 8) | byte2;
    if (bom === BOM) {
        return Endian.Big;
    } else if (bom === BOM_REVERSE) {
        return Endian.Little;
    } else {
        return undefined;
    }
}

/**
 * 验证是否为有效的 UTF-16 字节数据
 *
 * @param bytes 字节数据
 * @param allowReplacementChar 是否允许存在替换字符 `U+001A` 或 `U+FFFD`，默认 `false`
 * @param endian 指定字节序，默认会自动检测，若无法检测且未指定则使用平台字节序，若平台字节序非大端或小端，则使用小端字节序
 * @returns 是否为有效的 UTF-16 编码
 */
export function verify(
    bytes: BufferSource,
    allowReplacementChar?: boolean,
    endian?: Endian,
): boolean {
    const data = asUint8Array(bytes);

    // UTF-16 编码的字节长度必须是偶数
    if (data.byteLength % 2 !== 0) {
        return false;
    }

    return Pipe.run(data, flat(), verifyPipe(allowReplacementChar, endian));
}

/**
 * 判断字符串是否可被编码为完全有效的 UTF-16 字节数据
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
 * 精确测量字符串编码为 UTF-16 所需的字节数
 */
export function measureSize(text: string, bom: boolean = false): number {
    return text.length * 2 + (bom ? 2 : 0);
}

/**
 * 精确测量 UTF-16 字节数据解码为字符串后的长度
 */
export function measureLength(
    bytes: BufferSource,
    opts?: Utf16DecodeOptions,
): number {
    const data = asUint8Array(bytes);
    let len = 0;
    Pipe.run(data, flat(), decodePipe(opts), input => {
        len += input.length;
    });
    return len;
}

/**
 * 精确测量 Unicode 码点编码为 UTF-16 时所需字节数
 *
 * @returns -1 表示无效的代理项，1 表示单字节字符，2 表示双字节字符
 */
export function measureCharSize(codePoint: number, fatal: boolean): -1 | 1 | 2 {
    if (isSurrogate(codePoint)) {
        if (fatal) {
            throwInvalidSurrogate(codePoint);
        } else {
            return -1;
        }
    } else if (needsSurrogatePair(codePoint)) {
        return 2;
    } else {
        return 1;
    }
}

/**
 * 精确测量 UTF-16 起始编码单元解析为 Unicode 码点时的完整序列长度
 *
 * @returns -1 表示无效的代理项，1 表示单字节字符，2 表示双字节字符
 */
export function measureUnitLength(uint16: number, fatal: boolean): -1 | 1 | 2 {
    if (isHighSurrogate(uint16)) {
        return 2;
    } else if (isLowSurrogate(uint16)) {
        if (fatal) {
            throwInvalidSurrogate(uint16);
        } else {
            return -1;
        }
    } else {
        return 1;
    }
}

/**
 * 创建一个编码字符码点为 UTF-16 字节数据的管道
 */
export function encodePipe(opts?: Utf16EncodeOptions) {
    return Pipe.create(new EncodePipe(opts));
}

/**
 * 创建一个解码 UTF-16 字节数据的管道
 */
export function decodePipe(opts?: Utf16DecodeOptions) {
    return Pipe.create(new DecodePipe(opts));
}

/**
 * 创建一个验证字节数据是否为有效 UTF-16 编码的管道
 */
export function verifyPipe(allowReplacementChar?: boolean, endian?: Endian) {
    return Pipe.create(
        new VerifyPipe(
            decodePipe({ fatal: true, endian }),
            allowReplacementChar,
        ),
    );
}

/**
 * 创建一个验证字符串码点是否能编码为 UTF-16 的管道
 */
export function isWellFormedPipe(allowReplacementChar?: boolean) {
    return Pipe.create(new IsWellFormedPipe(allowReplacementChar));
}

function toEndianFlag(endian: Endian, final: boolean): number {
    return endian === Endian.Platform
        ? final
            ? 3
            : 0
        : endian === Endian.Big
          ? final
              ? 5
              : 2
          : final
            ? 4
            : 1;
}

class EncodePipe implements IPipe<number, number> {
    private fatal: boolean;
    private little: boolean;
    private addBom: boolean;
    private needAddBom: boolean;
    private tempBuffer = new DataView(new ArrayBuffer(2));

    constructor(opts?: Utf16EncodeOptions) {
        this.fatal = opts?.fatal ?? false;
        this.little = normalizeEndian(opts?.endian) !== Endian.Big;
        this.addBom = opts?.bom ?? true;
        this.needAddBom = this.addBom;
    }

    transform(codePoint: number, next: Next<number>): boolean {
        if (this.needAddBom) {
            this.needAddBom = false;
            if (!this._next(BOM, next)) {
                return false;
            }
        }

        const size = measureCharSize(codePoint, this.fatal);
        switch (size) {
            case -1:
                return this._next(UNICODE_REPLACEMENT_CODE_POINT, next);

            case 1:
                return this._next(codePoint, next);

            case 2:
                return (
                    this._next(toHighSurrogate(codePoint), next)
                    && this._next(toLowSurrogate(codePoint), next)
                );
        }
    }

    private _next(uint16: number, next: Next<number>) {
        const { tempBuffer, little } = this;
        tempBuffer.setUint16(0, uint16, little);
        return next(tempBuffer.getUint8(0)) && next(tempBuffer.getUint8(1));
    }

    flush(next: Next<number>): void {
        const { needAddBom } = this;
        this.reset();
        if (needAddBom) {
            this._next(BOM, next);
        }
    }

    reset() {
        this.needAddBom = this.addBom;
    }
}

class DecodePipe implements IPipe<number, string> {
    private fatal: boolean;
    private fallback: decodeFallback.DecodeFallback;
    private endian: Endian;
    private buffer = new DataView(new ArrayBuffer(4));
    private bufferSize = 0;
    private totalPosition = 0;
    // 0 1 2 对应初始字节序，3 4 5 对应已最终确认字节序，顺序是平台、小端、大端
    private endianFlag = 0;

    constructor(opts?: Utf16DecodeOptions) {
        this.fatal = opts?.fatal ?? false;
        this.fallback = opts?.fallback ?? decodeFallback.replace;
        this.endian = normalizeEndian(opts?.endian);
        this.endianFlag = toEndianFlag(this.endian, false);
    }

    transform(byte: number, next: Next<string>): boolean {
        this.buffer.setUint8(this.bufferSize++, byte);

        if (this.bufferSize % 2 !== 0) {
            return true;
        }

        // 未确定字节序
        if (this.endianFlag < 3) {
            const endian = sniff(this.buffer.getUint8(0), byte);
            if (endian != null) {
                this.endianFlag = toEndianFlag(endian, true);
                this.consumeBytes(2);
                this.totalPosition += 2;
                return true;
            } else {
                this.endianFlag += 3;
                return this.handleUnit(next);
            }
        } else {
            return this.handleUnit(next);
        }
    }

    flush(next: Next<string>): void {
        const { fallback, fatal, bufferSize, buffer, endianFlag } = this;
        const little = endianFlag !== 5;

        // 上一个字符是高代理项，但没有后续的低代理项
        if (bufferSize >= 2) {
            const surrogate = buffer.getUint16(0, little);
            if (fatal) {
                throwInvalidSurrogate(surrogate);
            } else {
                if (!next(fallback(surrogate, true))) {
                    this.reset();
                    return;
                }
                this.totalPosition += 2;
                this.consumeBytes(2);
            }
        }

        // 存在无法组成 Uint16 的字节
        if (bufferSize > 0) {
            const byte = this.buffer.getUint8(0);
            if (fatal) {
                throwInvalidByte(byte);
            } else {
                next(fallback(byte, true));
            }
        }

        this.reset();
    }

    private handleUnit(next: Next<string>): boolean {
        const { bufferSize, buffer, endianFlag, fatal, fallback } = this;
        const little = endianFlag !== 5;

        const unit = buffer.getUint16(0, little);

        if (isHighSurrogate(unit)) {
            if (bufferSize < 4) {
                // 没有 unit2，等待下一个字节
                return true;
            }

            const unit2 = buffer.getUint16(2, little);
            this.consumeBytes(2);
            if (isLowSurrogate(unit2)) {
                this.consumeBytes(2);
                const cont = next(String.fromCharCode(unit, unit2));
                this.totalPosition += 4;
                return cont;
            } else {
                if (fatal) {
                    throwInvalidSurrogate(unit);
                } else {
                    const cont = next(fallback(unit, true));
                    this.totalPosition += 2;
                    if (!cont) {
                        // 继续处理 unit2
                        return this.handleUnit(next);
                    } else {
                        this.clearBytes();
                        return false;
                    }
                }
            }
        } else if (isLowSurrogate(unit)) {
            this.consumeBytes(2);
            if (fatal) {
                throwInvalidSurrogate(unit);
            } else {
                const cont = next(fallback(unit, true));
                this.totalPosition += 2;
                return cont;
            }
        } else {
            this.consumeBytes(2);
            const cont = next(String.fromCharCode(unit));
            this.totalPosition += 2;
            return cont;
        }
    }

    private consumeBytes(count: number): void {
        const { bufferSize, buffer } = this;
        if (count === bufferSize) {
            this.bufferSize = 0;
        } else {
            const remaining = bufferSize - count;
            for (let i = 0; i < remaining; i++) {
                buffer.setUint8(i, buffer.getUint8(i + count));
            }
            this.bufferSize = remaining;
        }
    }

    private clearBytes(): void {
        this.bufferSize = 0;
    }

    catch(error: unknown): unknown {
        const totalPosition = this.totalPosition;
        this.reset();
        return wrapError(error, totalPosition);
    }

    reset() {
        this.clearBytes();
        this.totalPosition = 0;
        this.endianFlag = toEndianFlag(this.endian, false);
    }
}
