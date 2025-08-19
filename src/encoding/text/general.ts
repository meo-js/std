import { Endian, type AnyBufferSource } from '../../typed-array.js';
import { throwUnsupportedEncoding } from '../error.js';
import * as ascii from './ascii.js';
import { CodecableEncoding, Encoding } from './enum.js';
import * as latin1 from './latin1.js';
import type {
  DecodeOptions,
  EncodeOptions,
  IsWellFormedOptions,
  VerifyOptions,
} from './options.js';
import * as utf16 from './utf16.js';
import * as utf8 from './utf8.js';

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
 * 将字符串编码到指定缓冲区
 */
export function encodeInto(
  text: string,
  out: AnyBufferSource,
  encoding: CodecableEncoding,
  opts?: EncodeOptions,
): { read: number; written: number } {
  switch (encoding) {
    case CodecableEncoding.Ascii:
      return ascii.encodeInto(text, out, opts);
    case CodecableEncoding.Utf8:
      return utf8.encodeInto(text, out, opts);
    case CodecableEncoding.Utf16:
      return utf16.encodeInto(text, out, opts);
    case CodecableEncoding.Utf16le:
      return utf16.encodeInto(text, out, {
        ...opts,
        endian: Endian.Little,
      });
    case CodecableEncoding.Utf16be:
      return utf16.encodeInto(text, out, {
        ...opts,
        endian: Endian.Big,
      });
    case CodecableEncoding.Iso8859_1:
      return latin1.encodeInto(text, out, opts);
    default:
      throwUnsupportedEncoding(encoding);
  }
}

/**
 * 将字节数据解码为字符串
 */
export function decode(
  bytes: AnyBufferSource,
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
 * 验证字节数据是否为指定编码的有效数据
 */
export function verify(
  bytes: AnyBufferSource,
  encoding: CodecableEncoding,
  opts?: VerifyOptions,
): boolean {
  switch (encoding) {
    case CodecableEncoding.Ascii:
      return ascii.verify(bytes, opts?.allowReplacementChar);
    case CodecableEncoding.Utf8:
      return utf8.verify(bytes, opts?.allowReplacementChar);
    case CodecableEncoding.Utf16:
      return utf16.verify(bytes, opts?.allowReplacementChar, opts?.endian);
    case CodecableEncoding.Utf16le:
      return utf16.verify(bytes, opts?.allowReplacementChar, Endian.Little);
    case CodecableEncoding.Utf16be:
      return utf16.verify(bytes, opts?.allowReplacementChar, Endian.Big);
    case CodecableEncoding.Iso8859_1:
      return latin1.verify(bytes, opts?.allowReplacementChar);
    default:
      throwUnsupportedEncoding(encoding);
  }
}

/**
 * 验证字符串是否可以被指定编码正确编码
 */
export function isWellFormed(
  text: string,
  encoding: CodecableEncoding,
  opts?: IsWellFormedOptions,
): boolean {
  switch (encoding) {
    case CodecableEncoding.Ascii:
      return ascii.isWellFormed(text, opts?.allowReplacementChar);
    case CodecableEncoding.Utf8:
      return utf8.isWellFormed(text, opts?.allowReplacementChar);
    case CodecableEncoding.Utf16:
    case CodecableEncoding.Utf16le:
    case CodecableEncoding.Utf16be:
      return utf16.isWellFormed(text, opts?.allowReplacementChar);
    case CodecableEncoding.Iso8859_1:
      return latin1.isWellFormed(text, opts?.allowReplacementChar);
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

/**
 * 创建一个将字符串编码为字节数据的管道
 */
export function encodePipe(encoding: CodecableEncoding, opts?: EncodeOptions) {
  switch (encoding) {
    case CodecableEncoding.Ascii:
      return ascii.encodePipe(opts);
    case CodecableEncoding.Utf8:
      return utf8.encodePipe(opts);
    case CodecableEncoding.Utf16:
      return utf16.encodePipe(opts);
    case CodecableEncoding.Utf16le:
      return utf16.encodePipe({
        ...opts,
        endian: Endian.Little,
      });
    case CodecableEncoding.Utf16be:
      return utf16.encodePipe({
        ...opts,
        endian: Endian.Big,
      });
    case CodecableEncoding.Iso8859_1:
      return latin1.encodePipe(opts);
    default:
      throwUnsupportedEncoding(encoding);
  }
}

/**
 * 创建一个将字节数据解码为字符串的管道
 */
export function decodePipe(encoding: CodecableEncoding, opts?: DecodeOptions) {
  switch (encoding) {
    case CodecableEncoding.Ascii:
      return ascii.decodePipe(opts);
    case CodecableEncoding.Utf8:
      return utf8.decodePipe(opts);
    case CodecableEncoding.Utf16:
      return utf16.decodePipe(opts);
    case CodecableEncoding.Utf16le:
      return utf16.decodePipe({
        ...opts,
        endian: Endian.Little,
      });
    case CodecableEncoding.Utf16be:
      return utf16.decodePipe({
        ...opts,
        endian: Endian.Big,
      });
    case CodecableEncoding.Iso8859_1:
      return latin1.decodePipe(opts);
    default:
      throwUnsupportedEncoding(encoding);
  }
}

/**
 * 创建一个验证字节数据是否为指定编码有效数据的管道
 */
export function verifyPipe(encoding: CodecableEncoding, opts?: VerifyOptions) {
  switch (encoding) {
    case CodecableEncoding.Ascii:
      return ascii.verifyPipe(opts?.allowReplacementChar);
    case CodecableEncoding.Utf8:
      return utf8.verifyPipe(opts?.allowReplacementChar);
    case CodecableEncoding.Utf16:
      return utf16.verifyPipe(opts?.allowReplacementChar, opts?.endian);
    case CodecableEncoding.Utf16le:
      return utf16.verifyPipe(opts?.allowReplacementChar, Endian.Little);
    case CodecableEncoding.Utf16be:
      return utf16.verifyPipe(opts?.allowReplacementChar, Endian.Big);
    case CodecableEncoding.Iso8859_1:
      return latin1.verifyPipe(opts?.allowReplacementChar);
    default:
      throwUnsupportedEncoding(encoding);
  }
}

/**
 * 创建一个验证字符串是否可以被指定编码正确编码的管道
 */
export function isWellFormedPipe(
  encoding: CodecableEncoding,
  opts?: IsWellFormedOptions,
) {
  switch (encoding) {
    case CodecableEncoding.Ascii:
      return ascii.isWellFormedPipe(opts?.allowReplacementChar);
    case CodecableEncoding.Utf8:
      return utf8.isWellFormedPipe(opts?.allowReplacementChar);
    case CodecableEncoding.Utf16:
    case CodecableEncoding.Utf16le:
    case CodecableEncoding.Utf16be:
      return utf16.isWellFormedPipe(opts?.allowReplacementChar);
    case CodecableEncoding.Iso8859_1:
      return latin1.isWellFormedPipe(opts?.allowReplacementChar);
    default:
      throwUnsupportedEncoding(encoding);
  }
}
