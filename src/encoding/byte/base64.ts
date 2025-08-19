import { flat, Pipe, type IPipe, type Next } from '../../pipe.js';
import {
  concatString,
  flatCharCodes,
  flatCodePoints,
} from '../../pipe/string.js';
import { toUint8Array } from '../../pipe/typed-array.js';
import { isString } from '../../predicate.js';
import { asUint8Array, type AnyBufferSource } from '../../typed-array.js';
import { throwInvalidChar, throwInvalidLength } from '../error.js';
import { utf8 } from '../text.js';
import type { Base64DecodeOptions, Base64EncodeOptions } from './options.js';
import { _decodeInto } from './shared.js';

const encodeTable =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const encodeUrlTable =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

// 存储的值为对应的 Base64 索引值（0-63），填充 0xFF 表示无效的 Base64 字符
const decodeTable = new Uint8Array([
  255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
  255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
  255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 62, 255, 62,
  255, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 255, 255, 255, 255, 255, 255,
  255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 255, 255, 255, 255, 63, 255, 26, 27, 28, 29, 30, 31, 32,
  33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51,
  255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
  255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
  255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
  255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
  255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
  255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
  255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
  255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
  255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
]);

// 任意填充，不支持变体
const verifyRegex =
  /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}(==)?|[A-Za-z0-9+/]{3}(=)?)?$/u;
// 任意填充，支持变体
const verifyAnyRegex =
  /^([A-Za-z0-9+/\-_]{4})*([A-Za-z0-9+/\-_]{2}(==)?|[A-Za-z0-9+/\-_]{3}(=)?)?$/u;

// 必须填充，不支持变体
const verifyPadRegex =
  /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u;

// 必须填充，支持变体
const verifyAnyAndPadRegex =
  /^([A-Za-z0-9+/\-_]{4})*([A-Za-z0-9+/\-_]{2}==|[A-Za-z0-9+/\-_]{3}=)?$/u;

// 禁止填充，不支持变体
const verifyNoPadRegex =
  /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}|[A-Za-z0-9+/]{3})?$/u;
// 禁止填充，支持变体
const verifyAnyAndNoPadRegex =
  /^([A-Za-z0-9+/\-_]{4})*([A-Za-z0-9+/\-_]{2}|[A-Za-z0-9+/\-_]{3})?$/u;

/**
 * 将字节数据编码为 Base64 字符串
 *
 * @param bytes 字节数据
 * @param opts {@link Base64EncodeOptions}
 * @returns Base64 字符串
 */
export function encode(
  bytes: string | AnyBufferSource,
  opts?: Base64EncodeOptions,
): string {
  return _encode(bytes, false, opts);
}

/**
 * 将 Base64 字符串解码为字节数据
 *
 * @param text Base64 字符串
 * @param opts {@link Base64DecodeOptions}
 * @returns 字节数据
 */
export function decode(text: string, opts?: Base64DecodeOptions): Uint8Array {
  const fatal = opts?.fatal ?? true;
  return Pipe.run(
    text,
    flatCharCodes(),
    Pipe.create(new DecodePipe(opts)),
    toUint8Array(fatal ? new Uint8Array(measureSize(text)) : undefined),
  );
}

/**
 * 将 Base64 字符串解码到指定的缓冲区中
 *
 * @param text Base64 字符串
 * @param out 输出缓冲区
 * @param opts {@link Base64DecodeOptions}
 * @returns 返回一个对象，包含已读取的字符数量和写入缓冲区的字节数
 */
export function decodeInto(
  text: string,
  out: AnyBufferSource,
  opts?: Base64DecodeOptions,
): { read: number; written: number } {
  return _decodeInto(text, out, decodePipe(opts), measureSize(text), 3);
}

/**
 * @param text 字符串
 * @param allowVariant 是否允许变体，默认为 `true`
 * @param padding 是否检查填充符，默认为 `undefined`，表示不检查，`true` 则强制必要的填充符，`false` 则强制禁止填充符
 * @returns 返回是否为有效的 Base64 字符串
 */
export function verify(
  text: string,
  allowVariant: boolean = true,
  padding?: boolean,
): boolean {
  if (allowVariant) {
    if (padding === true) {
      return verifyAnyAndPadRegex.test(text);
    } else if (padding === false) {
      return verifyAnyAndNoPadRegex.test(text);
    } else {
      return verifyAnyRegex.test(text);
    }
  } else {
    if (padding === true) {
      return verifyPadRegex.test(text);
    } else if (padding === false) {
      return verifyNoPadRegex.test(text);
    } else {
      return verifyRegex.test(text);
    }
  }
}

/**
 * 计算字节数据编码为 Base64 字符串的精确长度
 */
export function measureLength(
  bytes: AnyBufferSource,
  padding: boolean,
): number {
  const byteLength = asUint8Array(bytes).length;
  if (padding) {
    return Math.ceil(byteLength / 3) * 4;
  } else {
    const groupCount = Math.floor(byteLength / 3);
    const remainder = byteLength % 3;
    return groupCount * 4 + (remainder > 0 ? remainder + 1 : 0);
  }
}

/**
 * 计算 Base64 字符串解码为字节数据的精确长度
 *
 * 注意：仅当解码时 `fatal` 为 `true` 且未抛出错误时，该函数计算的长度才绝对准确，否则返回的长度为最大长度。
 */
export function measureSize(text: string): number {
  const len = text.length;
  if (len === 0) return 0;

  let paddingCount = 0;
  if (text.endsWith('==')) {
    paddingCount = 2;
  } else if (text.endsWith('=')) {
    paddingCount = 1;
  }

  const base64Len = len - paddingCount;
  const groupCount = Math.floor(base64Len / 4);
  const remainder = base64Len % 4;

  let result = groupCount * 3;

  if (remainder === 2) {
    result += 1;
  } else if (remainder === 3) {
    result += 2;
  }

  return result;
}

/**
 * 创建一个编码字节数据为 Base64 字符串的管道
 */
export function encodePipe(opts?: Base64EncodeOptions) {
  return Pipe.create(new EncodePipe(false, opts));
}

/**
 * 创建一个解码 Base64 字符串为字节数据的管道
 */
export function decodePipe(opts?: Base64DecodeOptions) {
  return Pipe.create(new DecodePipe(opts));
}

/**
 * 创建一个验证 Base64 字符串有效性的管道
 */
export function verifyPipe(allowVariant: boolean = true, padding?: boolean) {
  return Pipe.create(new VerifyPipe(allowVariant, padding));
}

/**
 * @internal
 */
export class EncodePipe implements IPipe<number, string> {
  private table: string;
  private padding: boolean;
  private buffer = new Uint8Array(3);
  private bufferPosition: number = 0;
  private tempStrs = ['', '', '', ''];

  constructor(urlSafe: boolean = false, opts?: Base64EncodeOptions) {
    this.table = urlSafe ? encodeUrlTable : encodeTable;
    this.padding = opts?.padding ?? true;
  }

  transform(byte: number, next: Next<string>): boolean {
    const { buffer, tempStrs, table } = this;
    buffer[this.bufferPosition++] = byte;

    // 当缓冲区有 3 个字节时进行编码
    if (this.bufferPosition === 3) {
      this.bufferPosition = 0;
      const n = (buffer[0] << 16) | (buffer[1] << 8) | buffer[2];
      tempStrs[0] = table[(n >> 18) & 63];
      tempStrs[1] = table[(n >> 12) & 63];
      tempStrs[2] = table[(n >> 6) & 63];
      tempStrs[3] = table[n & 63];
      return next(tempStrs.join(''));
    }

    return true;
  }

  flush(next: Next<string>): void {
    const { bufferPosition, buffer, tempStrs, table } = this;
    if (bufferPosition > 0) {
      if (bufferPosition === 1) {
        const n = buffer[0] << 16;
        tempStrs[0] = table[(n >> 18) & 63];
        tempStrs[1] = table[(n >> 12) & 63];
        if (this.padding) {
          tempStrs[2] = '=';
          tempStrs[3] = '=';
        } else {
          tempStrs[2] = tempStrs[3] = '';
        }
      } else if (bufferPosition === 2) {
        const n = (buffer[0] << 16) | (buffer[1] << 8);
        tempStrs[0] = table[(n >> 18) & 63];
        tempStrs[1] = table[(n >> 12) & 63];
        tempStrs[2] = table[(n >> 6) & 63];
        if (this.padding) {
          tempStrs[3] = '=';
        } else {
          tempStrs[3] = '';
        }
      }
      this.bufferPosition = 0;
      next(tempStrs.join(''));
    }
  }

  catch(error: unknown): void {
    this.bufferPosition = 0;
  }
}

/**
 * Base64 解码管道类
 */
class DecodePipe implements IPipe<number, number> {
  private fatal: boolean;
  private buffer = new Uint8Array(4);
  private bufferPosition = 0;
  private padded = false;

  constructor(opts?: Base64DecodeOptions) {
    this.fatal = opts?.fatal ?? true;
  }

  transform(codePoint: number, next: Next<number>): boolean {
    const { buffer, fatal } = this;

    // '='
    if (codePoint === 61) {
      this.padded = true;
      return true;
    }

    // padding 之后不应该有其他字符
    if (this.padded) {
      if (fatal) {
        throwInvalidChar(codePoint);
      }
    }

    // codePoint 可能超出 255
    const value = decodeTable[codePoint] ?? 0xff;

    if (value === 0xff) {
      if (fatal) {
        throwInvalidChar(codePoint);
      } else {
        return true;
      }
    }

    buffer[this.bufferPosition++] = value;

    // 处理完整的 4 字符组
    if (this.bufferPosition === 4) {
      const n =
        (buffer[0] << 18) | (buffer[1] << 12) | (buffer[2] << 6) | buffer[3];
      this.bufferPosition = 0;
      return next((n >> 16) & 0xff) && next((n >> 8) & 0xff) && next(n & 0xff);
    }

    return true;
  }

  flush(next: Next<number>): void {
    const { bufferPosition, buffer, fatal } = this;
    this.reset();
    if (bufferPosition > 0) {
      if (bufferPosition < 2) {
        if (fatal) {
          throwInvalidLength(1, 2, true);
        }
        return;
      }

      const n = (buffer[0] << 18) | (buffer[1] << 12);

      if (bufferPosition > 2) {
        const n2 = n | (buffer[2] << 6);
        next((n >> 16) & 0xff) && next((n2 >> 8) & 0xff);
      } else {
        next((n >> 16) & 0xff);
      }
    }
  }

  catch(error: unknown): void {
    this.reset();
  }

  reset() {
    this.bufferPosition = 0;
    this.padded = false;
  }
}

/**
 * Base64 验证管道类
 */
class VerifyPipe implements IPipe<number, boolean> {
  private allowVariant: boolean;
  private padding: boolean | undefined;
  private position: number = 0;
  private padCount: number = 0;
  private result: boolean = true;

  constructor(allowVariant: boolean = true, padding?: boolean) {
    this.allowVariant = allowVariant;
    this.padding = padding;
  }

  transform(codePoint: number, next: Next<boolean>): boolean {
    // 检查是否为填充字符 '='
    if (codePoint === 61) {
      this.padCount++;

      // 最多只能有2个填充字符
      if (this.padCount > 2) {
        this.result = false;
        next(false);
        return false;
      }

      this.position++;
      return true;
    }

    // 如果已经遇到填充字符，后面不应该再有其他字符
    if (this.padCount > 0) {
      this.result = false;
      next(false);
      return false;
    }

    // 检查字符是否为有效的 Base64 字符
    if (!this.isValidChar(codePoint)) {
      this.result = false;
      next(false);
      return false;
    }

    this.position++;
    return true;
  }

  private isValidChar(codePoint: number): boolean {
    if (
      (codePoint >= 65 && codePoint <= 90) // A-Z
      || (codePoint >= 97 && codePoint <= 122) // a-z
      || (codePoint >= 48 && codePoint <= 57) // 0-9
      || codePoint === 43 // +
      || codePoint === 47 // /
    ) {
      return true;
    }

    if (this.allowVariant) {
      return (
        codePoint === 45 // -
        || codePoint === 95 // _
      );
    } else {
      return false;
    }
  }

  flush(next: Next<boolean>): boolean {
    const { result, position, padding, padCount } = this;
    this.reset();

    if (!result) {
      return false;
    }

    const remainder = position % 4;

    if (remainder === 1) {
      // Base64 不能有单独的一个字符
      next(false);
      return false;
    } else if (remainder > 1) {
      // 如果有余数，检查填充要求
      if (padding === true) {
        // 强制要求填充，但没有填充字符
        if (padCount === 0) {
          next(false);
          return false;
        } else {
          // 检查填充字符数量是否正确
          const expectedPadding = 4 - remainder;
          if (padCount !== expectedPadding) {
            next(false);
            return false;
          }
        }
      } else if (padding === false) {
        // 强制禁止填充，但有填充字符
        if (padCount > 0) {
          next(false);
          return false;
        }
      } else {
        // padding === undefined 不检查填充
      }
    }

    next(true);
    return true;
  }

  catch(error: unknown): void {
    this.reset();
  }

  reset() {
    this.position = 0;
    this.padCount = 0;
    this.result = true;
  }
}

/**
 * @internal
 */
export function _encode(
  bytes: string | AnyBufferSource,
  urlSafe: boolean,
  opts?: Base64EncodeOptions,
): string {
  const padding = opts?.padding ?? true;
  if (isString(bytes)) {
    return Pipe.run(
      bytes,
      flatCodePoints(),
      utf8.encodePipe(opts?.utf8Options),
      Pipe.create(new EncodePipe(urlSafe, opts)),
      concatString(),
    );
  } else {
    const data = asUint8Array(bytes);
    return Pipe.run(
      data,
      flat(),
      Pipe.create(new EncodePipe(urlSafe, opts)),
      concatString(new Array(measureLength(data, padding))),
    );
  }
}
