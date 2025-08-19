/**
 * @public
 * @module
 */
import * as sts from 'string-ts';
import { MAX_CALLSTACK } from './env.js';
import { isArray, isFunction, isObject, type IsNever } from './predicate.js';
import type { Rng } from './protocol.js';
import type { checked } from './ts.js';
import type { If } from './ts/logical.js';
import type { TypedArray } from './typed-array.js';

/**
 * 获取字符串指定位置的字符
 */
export type CharAt<T extends string, I extends number> = sts.CharAt<T, I>;

/**
 * 拼接字符串
 */
export type Concat<T extends string[]> = sts.Concat<T>;

/**
 * 判断字符串是否以指定字符串开头
 */
export type StartsWith<T extends string, S extends string> = sts.StartsWith<
  T,
  S
>;

/**
 * 判断字符串是否以指定字符串结尾
 */
export type EndsWith<T extends string, S extends string> = sts.EndsWith<T, S>;

/**
 * 判断字符串是否包含指定字符串
 */
export type Includes<T extends string, S extends string> = sts.Includes<T, S>;

/**
 * 填充指定的一定次数的字符串到字符串头部
 */
export type PadStart<
  T extends string,
  Times extends number,
  Pad extends string = ' ',
> = sts.PadStart<T, Times, Pad>;

/**
 * 填充指定的一定次数的字符串到字符串尾部
 */
export type PadEnd<
  T extends string,
  Times extends number,
  Pad extends string = ' ',
> = sts.PadEnd<T, Times, Pad>;

/**
 * 重复指定字符串
 */
export type Repeat<T extends string, Times extends number> = sts.Repeat<
  T,
  Times
>;

/**
 * 替换指定字符串一次
 */
export type Replace<
  T extends string,
  From extends string,
  To extends string,
> = sts.Replace<T, From, To>;

/**
 * 替换所有指定的字符串
 */
export type ReplaceAll<
  T extends string,
  From extends string,
  To extends string,
> = sts.ReplaceAll<T, From, To>;

/**
 * 反转字符串
 */
export type Reverse<T extends string> = sts.Reverse<T>;

/**
 * 返回字符串指定范围的切片
 */
export type Slice<
  T extends string,
  Start extends number = 0,
  End extends number = never,
> = sts.Slice<T, Start, If<IsNever<End>, undefined, End>>;

/**
 * 以指定字符串分割为字符串数组
 */
export type Split<T extends string, Delimiter extends string> = sts.Split<
  T,
  Delimiter
>;

/**
 * 去除字符串中的首尾空格
 */
export type Trim<T extends string> = sts.Trim<T>;

/**
 * 去除字符串中的头部空格
 */
export type TrimStart<T extends string> = sts.TrimStart<T>;

/**
 * 去除字符串中的尾部空格
 */
export type TrimEnd<T extends string> = sts.TrimEnd<T>;

/**
 * 截断字符串到指定长度
 */
export type Truncate<
  T extends string,
  Len extends number,
  Suffix extends string = '...',
> = sts.Truncate<T, Len, Suffix>;

/**
 * 将字符串分割为单词数组
 */
export type WordsOf<T extends string> = sts.Words<T>;

/**
 * 返回字符串长度
 */
export type LengthOf<T extends string> = sts.Length<T>;

/**
 * 将字符串转换为驼峰命名格式（camelCase）
 */
export type ToCamelCase<T extends string> = sts.CamelCase<T>;

/**
 * 将字符串转换为常量命名格式（CONSTANT_CASE）
 */
export type ToConstantCase<T extends string> = sts.ConstantCase<T>;

/**
 * 将字符串按指定分隔符分隔
 */
export type ToDelimiterCase<
  T extends string,
  Delimiter extends string,
> = sts.DelimiterCase<T, Delimiter>;

/**
 * 将字符串转换为烤串命名格式（kebab-case）
 */
export type ToKebabCase<T extends string> = sts.KebabCase<T>;

/**
 * 将字符串转换为帕斯卡命名格式（PascalCase）
 */
export type ToPascalCase<T extends string> = sts.PascalCase<T>;

/**
 * 将字符串转换为蛇形命名格式（snake_case）
 */
export type ToSnakeCase<T extends string> = sts.SnakeCase<T>;

/**
 * 将字符串转换为标题命名格式（每个单词首字母大写）
 */
export type ToTitleCase<T extends string> = sts.TitleCase<T>;

/**
 * Ascii 替换字符 `U+001A`
 */
export const ASCII_REPLACEMENT_CHAR = '\u001A';

/**
 * Ascii 替换字符 `U+001A` 码点
 */
export const ASCII_REPLACEMENT_CODE_POINT =
  ASCII_REPLACEMENT_CHAR.charCodeAt(0);

/**
 * Unicode 替换字符 `U+FFFD`
 */
export const UNICODE_REPLACEMENT_CHAR = '\uFFFD';

/**
 * Unicode 替换字符 `U+FFFD` 码点
 */
export const UNICODE_REPLACEMENT_CODE_POINT =
  UNICODE_REPLACEMENT_CHAR.charCodeAt(0);

// from https://github.com/ai/nanoid
const urlAlphabet =
  'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';

const replacementCharRegex =
  // eslint-disable-next-line no-control-regex -- checked.
  /[\uFFFD\u001A]/gu;

/**
 * 与 {@link String.fromCharCode} 作用完全一致，但采用性能最佳的实现方式
 */
export function fromCharCodes(arr: number[] | TypedArray) {
  if (isArray(arr)) {
    if (arr.length > MAX_CALLSTACK) {
      // 只能单个进行转换，否则分块必须 slice 数组，这可能很昂贵
      const parts: string[] = [];
      for (let i = 0; i < arr.length; i++) {
        parts.push(String.fromCharCode(arr[i]));
      }
      return parts.join('');
    } else {
      return String.fromCharCode.apply(undefined, arr);
    }
  } else {
    if (arr.length > MAX_CALLSTACK) {
      // 分块进行转换
      const parts: string[] = [];
      for (let i = 0; i < arr.length; i += MAX_CALLSTACK) {
        const chunk = arr.subarray(i, i + MAX_CALLSTACK);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any -- checked.
        parts.push(String.fromCharCode.apply(undefined, chunk as any));
      }
      return parts.join('');
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any -- checked.
      return String.fromCharCode.apply(undefined, arr as any);
    }
  }
}

/**
 * 与 {@link String.fromCodePoint} 作用完全一致，但采用性能最佳的实现方式
 */
export function fromCodePoints(arr: number[] | TypedArray) {
  if (isArray(arr)) {
    if (arr.length > MAX_CALLSTACK) {
      // 只能单个进行转换，否则分块必须 slice 数组，这可能很昂贵
      const parts: string[] = [];
      for (let i = 0; i < arr.length; i++) {
        parts.push(String.fromCodePoint(arr[i]));
      }
      return parts.join('');
    } else {
      return String.fromCodePoint.apply(undefined, arr);
    }
  } else {
    if (arr.length > MAX_CALLSTACK) {
      // 分块进行转换
      const parts: string[] = [];
      for (let i = 0; i < arr.length; i += MAX_CALLSTACK) {
        const chunk = arr.subarray(i, i + MAX_CALLSTACK);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any -- checked.
        parts.push(String.fromCodePoint.apply(undefined, chunk as any));
      }
      return parts.join('');
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any -- checked.
      return String.fromCodePoint.apply(undefined, arr as any);
    }
  }
}

/**
 * 确保字符串有指定前缀
 *
 * @example
 * ```ts
 * prefix("world", "wo"); // "world"
 * prefix("world", "hello"); // "helloworld"
 * ```
 */
export function ensurePrefix(str: string, prefix: string) {
  if (!str.startsWith(prefix)) return prefix + str;
  return str;
}

/**
 * 确保字符串有指定后缀
 *
 * @example
 * ```ts
 * suffix("hello", "lo"); // "hello"
 * suffix("hello", "world"); // "helloworld"
 * ```
 */
export function ensureSuffix(str: string, suffix: string) {
  if (!str.endsWith(suffix)) return str + suffix;
  return str;
}

/**
 * 解析传入字符串中的 `{...}` 模板并返回解析后的结果
 *
 * @example 以索引作为变量
 * ```ts
 * const result = template(
 *     "Hello {0}, My Name is {1}.",
 *     "June",
 *     "Anthony"
 * );
 * // Hello June, My Name is Anthony.
 * ```
 * @example 以标签作为变量
 * ```ts
 * const result = template(
 *     "{greet}! My name is {name}.",
 *     { greet: "Hello", name: "Anthony" }
 * );
 * // Hello! My name is Anthony.
 * ```
 *
 * 以标签作为变量时，可以设置回退值：
 *
 * ```ts
 * const result = template(
 *     "{greet}! My name is {name}.",
 *     { greet: "Hello" },
 *     key => `[unknwon ${key}]`,
 * );
 * // Hello! My name is [unknwon name].
 * ```
 */
export function template(
  str: string,
  object: Record<string | number, string>,
  fallback?: string | ((key: string) => string),
): string;
export function template(str: string, ...args: string[]): string;
export function template(str: string, ...args: unknown[]): string {
  const [arg, fallback] = args;

  if (isObject(arg)) {
    const vars = arg as Record<string | number, string | undefined>;
    return str.replace(/\{(\w+)\}/gu, (_, key: string) => {
      const value =
        vars[key]
        ?? (isFunction<(key: string) => string>(fallback)
          ? fallback(key)
          : (fallback as string | undefined));

      return value ?? key;
    });
  } else {
    return str.replace(/\{(\d+)\}/gu, (_, key: string) => {
      const index = Number(key);
      if (Number.isSafeInteger(index)) {
        return String(args[index]);
      } else {
        return key;
      }
    });
  }
}

/**
 * 截断字符串
 */
export function truncate(
  str: string,
  len: number,
  suffix: string = '...',
  opts?: { unicode?: boolean },
) {
  // TODO
}

/**
 * 翻转字符串
 */
export function reverse(str: string, opts?: { unicode?: boolean }) {
  // TODO
}

export function getWords(str: string, opts?: { unicode?: boolean }) {
  // TODO 单词？字？
}

/**
 * 生成随机字符串
 *
 * @param len 长度
 * @param opts {@link opts}
 * @param opts.dict {@inheritdoc opts.dict}
 * @param opts.rng {@inheritdoc opts.rng}
 */
export function randomText(
  len: number = 16,
  opts?: {
    /**
     * 随机字符串的字符集
     *
     * @default "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict"
     */
    dict?: string;
    /**
     * 随机数生成函数
     *
     * @default {@link Math.random}
     */
    rng?: Rng;
  },
) {
  const { dict = urlAlphabet, rng = Math.random } = opts ?? {};
  let id = '';
  let i = len;
  const _len = dict.length;
  while (i--) id += dict[(rng() * _len) | 0];
  return id;
}

/**
 * 将字符串的首字母转换为大写
 *
 * @example
 * capitalize("hello") // "Hello"
 * capitalize("world") // "World"
 */
export function capitalize(str: string): string {
  return sts.capitalize(str);
}

/**
 * 将字符串的首字母转换为小写
 *
 * @example
 * uncapitalize("Hello") // "hello"
 * uncapitalize("World") // "world"
 */
export function uncapitalize(str: string): string {
  return sts.uncapitalize(str);
}

/**
 * 将字符串转换为驼峰命名格式（camelCase）
 *
 * @example
 * toCamelCase("hello world") // "helloWorld"
 * toCamelCase("foo_bar-baz") // "fooBarBaz"
 */
export function toCamelCase(str: string): string {
  return sts.camelCase(str);
}

/**
 * 将字符串转换为常量命名格式（CONSTANT_CASE）
 *
 * @example
 * toConstantCase("hello world") // "HELLO_WORLD"
 * toConstantCase("fooBar") // "FOO_BAR"
 */
export function toConstantCase(str: string): string {
  return sts.constantCase(str);
}

/**
 * 将字符串按指定分隔符分隔
 *
 * @param str 字符串
 * @param delimiter 分隔符
 *
 * @example
 * toDelimiterCase("hello world", "-") // "hello-world"
 * toDelimiterCase("fooBar", "_") // "foo_Bar"
 */
export function toDelimiterCase(str: string, delimiter: string): string {
  return sts.delimiterCase(str, delimiter);
}

/**
 * 将字符串转换为烤串命名格式（kebab-case）
 *
 * @example
 * toKebabCase("hello world") // "hello-world"
 * toKebabCase("fooBar") // "foo-bar"
 */
export function toKebabCase(str: string): string {
  return sts.kebabCase(str);
}

/**
 * 将字符串转换为帕斯卡命名格式（PascalCase）
 *
 * @example
 * toPascalCase("hello world") // "HelloWorld"
 * toPascalCase("foo_bar") // "FooBar"
 */
export function toPascalCase(str: string): string {
  return sts.pascalCase(str);
}

/**
 * 将字符串转换为蛇形命名格式（snake_case）
 *
 * @example
 * toSnakeCase("hello world") // "hello_world"
 * toSnakeCase("fooBar") // "foo_bar"
 */
export function toSnakeCase(str: string): string {
  return sts.snakeCase(str);
}

/**
 * 将字符串转换为标题命名格式（每个单词首字母大写）
 *
 * @example
 * toTitleCase("hello world") // "Hello World"
 * toTitleCase("foo_bar") // "Foo Bar"
 */
export function toTitleCase(str: string): string {
  return sts.titleCase(str);
}

/**
 * 将字符串转换为 UTF-16 编码单元数组
 */
export function toCharCodes<T extends number[] | TypedArray>(
  str: string,
  out: T = [] as checked,
): number {
  for (let i = 0; i < str.length; i++) {
    out[i] = str.charCodeAt(i);
  }
  return str.length;
}

/**
 * 将字符串转换为 Unicode 码点数组
 */
export function toCodePoints<T extends number[] | TypedArray>(
  str: string,
  out: T = [] as checked,
): number {
  const len = str.length;
  let i = 0;
  let index = 0;
  while (i < len) {
    const code = str.codePointAt(i)!;
    out[index++] = code;
    i += needsSurrogatePair(code) ? 2 : 1;
  }
  return index;
}

/**
 * 将一个有效的 UTF-16 代理对转换为 Unicode 码点
 *
 * @returns 返回对应的 Unicode 码点，如果 {@link high} 并非有效的高代理，则直接返回 {@link high} 的值。
 */
export function toCodePoint(high: number, low: number): number {
  if (!isHighSurrogate(high)) {
    return high;
  } else {
    return (high - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000;
  }
}

/**
 * 将一个有效的 Unicode 码点转换为 UTF-16 编码单元
 *
 * @returns 一个包含高位和低位编码单元的数组，如果码点小于等于 `0xffff`，则低位为 `0`。
 */
export function toCodeUnit(
  codePoint: number,
  out: [high: number, low: number] = [0, 0],
): [high: number, low: number] {
  if (needsSurrogatePair(codePoint)) {
    out[0] = toHighSurrogate(codePoint);
    out[1] = toLowSurrogate(codePoint);
    return out;
  } else {
    out[0] = codePoint;
    out[1] = 0;
    return out;
  }
}

/**
 * 将一个有效的 Unicode 码点转换为 UTF-16 高代理编码单元
 *
 * 请确保该码点需要使用代理对编码，否则会返回错误的结果。
 */
export function toHighSurrogate(codePoint: number): number {
  return ((codePoint - 0x10000) >> 10) + 0xd800;
}

/**
 * 将一个有效的 Unicode 码点转换为 UTF-16 低代理编码单元
 *
 * 请确保该码点需要使用代理对编码，否则会返回错误的结果。
 */
export function toLowSurrogate(codePoint: number): number {
  return ((codePoint - 0x10000) & 0x3ff) + 0xdc00;
}

/**
 * 判断 UTF-16 编码单元是否为高/低代理对
 */
export function isSurrogate(charCode: number): boolean {
  return isHighSurrogate(charCode) || isLowSurrogate(charCode);
}

/**
 * 判断 UTF-16 编码单元是否为高代理对
 */
export function isHighSurrogate(charCode: number): boolean {
  return charCode >= 0xd800 && charCode <= 0xdbff;
}

/**
 * 判断 UTF-16 编码单元是否为低代理对
 */
export function isLowSurrogate(charCode: number): boolean {
  return charCode >= 0xdc00 && charCode <= 0xdfff;
}

/**
 * 判断 Unicode 码点是否为替换字符 `U+001A` 或 `U+FFFD`
 */
export function isReplacementCodePoint(codePoint: number): boolean {
  return (
    isAsciiReplacementCodePoint(codePoint)
    || isUnicodeReplacementCodePoint(codePoint)
  );
}

/**
 * 判断 Unicode 码点是否为空白字符
 *
 * 包括：制表符 `U+0009`、换行符 `U+000A`、回车符 `U+000D`、换页符 `U+000C` 和空格 `U+0020`
 */
export function isWhitespaceCodePoint(codePoint: number): boolean {
  return (
    codePoint === 0x09
    || codePoint === 0x0a
    || codePoint === 0x0c
    || codePoint === 0x0d
    || codePoint === 0x20
  );
}

/**
 * 判断 Unicode 码点是否为 Ascii 替换字符 `U+001A`
 */
export function isAsciiReplacementCodePoint(codePoint: number): boolean {
  return codePoint === ASCII_REPLACEMENT_CODE_POINT;
}

/**
 * 判断 Unicode 码点是否为 Unicode 替换字符 `U+FFFD`
 */
export function isUnicodeReplacementCodePoint(codePoint: number): boolean {
  return codePoint === UNICODE_REPLACEMENT_CODE_POINT;
}

/**
 * 判断一个有效的 Unicode 码点是否需要使用代理对编码
 */
export function needsSurrogatePair(codePoint: number): boolean {
  return codePoint > 0xffff;
}

/**
 * 判断字符串是否存在替换字符 `U+001A` 或 `U+FFFD`
 */
export function hasReplacementChar(text: string) {
  return replacementCharRegex.test(text);
}
