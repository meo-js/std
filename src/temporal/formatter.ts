/**
 * @public
 * @module
 */
import type { Temporal } from 'temporal-polyfill';
import { isString } from '../predicate.js';
import {
  toDate,
  toDateTime,
  toDuration,
  toInstant,
  toTime,
  toZonedDateTime,
} from './convert.js';
import { createTemplate } from './impl/tr35.js';
import {
  createTemporalInfo,
  resetTemporalInfo,
  type AssignmentOptions,
  type TemporalInfo,
  type TemporalObject,
  type TemporalTemplate,
  type ZonedAssignmentOptions,
} from './shared.js';
import { toSingleTemporalInfo } from './subtle.js';

/**
 * 持续时间格式化器
 */
export interface DurationFormatter<
  FormatArguments extends readonly unknown[] = [],
  ParseArguments extends readonly unknown[] = [],
> extends DurationFormatter.Format<FormatArguments>,
    DurationFormatter.Parse<ParseArguments> {}

/**
 * 持续时间格式化器
 */
export namespace DurationFormatter {
  export interface Format<Arguments extends readonly unknown[] = []> {
    /**
     * 格式化 {@link Temporal.Duration} 为字符串。
     *
     * @param input 输入数据
     */
    format(this: void, input: Temporal.Duration, ...args: Arguments): string;
  }
  export interface Parse<Arguments extends readonly unknown[] = []> {
    /**
     * 解析字符串为 {@link Temporal.Duration}
     *
     * @param input 输入字符串
     */
    toDuration(
      this: void,
      input: string,
      ...args: Arguments
    ): Temporal.Duration;
  }
}

/**
 * 日期格式化器
 */
export interface DateFormatter
  extends DateFormatter.Format,
    DateFormatter.Parse {}

export namespace DateFormatter {
  export interface Format<Arguments extends readonly unknown[] = []> {
    /**
     * 格式化 {@link Temporal.PlainDate} 为字符串。
     *
     * @param input 输入数据
     */
    format(this: void, input: Temporal.PlainDate, ...args: Arguments): string;
  }
  export interface Parse<Arguments extends readonly unknown[] = []> {
    /**
     * 解析字符串为 {@link Temporal.PlainDate}
     *
     * @param input 输入字符串
     */
    toDate(this: void, input: string, ...args: Arguments): Temporal.PlainDate;
  }
}

/**
 * 时间格式化器
 */
export interface TimeFormatter
  extends TimeFormatter.Format,
    TimeFormatter.Parse {}

export namespace TimeFormatter {
  export interface Format<Arguments extends readonly unknown[] = []> {
    /**
     * 格式化 {@link Temporal.PlainTime} 为字符串。
     *
     * @param input 输入数据
     */
    format(this: void, input: Temporal.PlainTime, ...args: Arguments): string;
  }
  export interface Parse<Arguments extends readonly unknown[] = []> {
    /**
     * 解析字符串为 {@link Temporal.PlainTime}
     *
     * @param input 输入字符串
     */
    toTime(this: void, input: string, ...args: Arguments): Temporal.PlainTime;
  }
}

/**
 * 日期时间格式化器
 */
export interface DateTimeFormatter
  extends DateTimeFormatter.Format,
    DateTimeFormatter.Parse {}

export namespace DateTimeFormatter {
  export interface Format<Arguments extends readonly unknown[] = []> {
    /**
     * 格式化 {@link Temporal.PlainDateTime} 为字符串。
     *
     * @param input 输入数据
     */
    format(
      this: void,
      input: Temporal.PlainDateTime,
      ...args: Arguments
    ): string;
  }
  export interface Parse<Arguments extends readonly unknown[] = []> {
    /**
     * 解析字符串为 {@link Temporal.PlainDateTime}
     *
     * @param input 输入字符串
     */
    toDateTime(
      this: void,
      input: string,
      ...args: Arguments
    ): Temporal.PlainDateTime;
  }
}

/**
 * 瞬时时间格式化器
 */
export interface InstantFormatter
  extends InstantFormatter.Format,
    InstantFormatter.Parse {}

export namespace InstantFormatter {
  export interface Format<Arguments extends readonly unknown[] = []> {
    /**
     * 格式化 {@link Temporal.Instant} 为字符串。
     *
     * @param input 输入数据
     */
    format(this: void, input: Temporal.Instant, ...args: Arguments): string;
  }
  export interface Parse<Arguments extends readonly unknown[] = []> {
    /**
     * 解析字符串为 {@link Temporal.Instant}
     *
     * @param input 输入字符串
     */
    toInstant(this: void, input: string, ...args: Arguments): Temporal.Instant;
  }
}

/**
 * 时区日期时间格式化器
 */
export interface ZonedDateTimeFormatter
  extends ZonedDateTimeFormatter.Format,
    ZonedDateTimeFormatter.Parse {}

export namespace ZonedDateTimeFormatter {
  export interface Format<Arguments extends readonly unknown[] = []> {
    /**
     * 格式化 {@link Temporal.ZonedDateTime} 为字符串。
     *
     * @param input 输入数据
     */
    format(
      this: void,
      input: Temporal.ZonedDateTime,
      ...args: Arguments
    ): string;
  }
  export interface Parse<Arguments extends readonly unknown[] = []> {
    /**
     * 解析字符串为 {@link Temporal.ZonedDateTime}
     *
     * @param input 输入字符串
     */
    toZonedDateTime(
      this: void,
      input: string,
      ...args: Arguments
    ): Temporal.ZonedDateTime;
  }
}

/**
 * 基础格式化器
 */
export interface BaseFormatter<Arguments extends readonly unknown[] = []> {
  /**
   * 解析字符串为 {@link TemporalInfo}。
   */
  parse(this: void, input: string, ...args: Arguments): Partial<TemporalInfo>;
}

/**
 * 通用格式化器
 */
export type UniversalFormatter = BaseFormatter
  & DateFormatter
  & TimeFormatter
  & DateTimeFormatter
  & InstantFormatter
  & DurationFormatter
  & ZonedDateTimeFormatter;

/**
 * 格式化器处理程序
 */
export interface FormatterHandler {
  /**
   * 解析字符串至指定的 {@link TemporalInfo} 对象。
   *
   * 你应该更新 {@link out} 对象的字段并返回它，但也可以直接返回一个新对象。
   *
   * @param input 输入字符串
   * @param args 额外参数
   * @param out 输出对象，在该类实例中被复用以减少内存分配
   */
  parse(
    input: string,
    args: readonly unknown[],
    out: FormatterParseOutput,
  ): FormatterParseOutput;

  /**
   * 格式化 {@link TemporalObject} 为字符串。
   *
   * 如果 {@link input} 是不支持的时态类型，则应抛出一个 {@link Error}。
   *
   * @param input 输入数据
   */
  format(input: TemporalObject, args: readonly unknown[]): string;
}

/**
 * 格式化器解析输出
 */
export interface FormatterParseOutput {
  /**
   * 解析后的 {@link TemporalInfo} 对象。
   */
  info: Partial<TemporalInfo>;

  /**
   * 将 {@link TemporalInfo} 转为 {@link TemporalObject} 时的选项。
   */
  opts?: AssignmentOptions | ZonedAssignmentOptions;
}

/**
 * 创建一个格式化器。
 */
export function createFormatter<T extends object = BaseFormatter>(
  handler: FormatterHandler,
): T;
export function createFormatter<T extends object = BaseFormatter>(
  template: TemporalTemplate,
): T;
export function createFormatter<T extends object = BaseFormatter>(
  arg: FormatterHandler | TemporalTemplate,
): T {
  const tempInfo = createTemporalInfo();

  if (isString(arg)) {
    const impl = createTemplate(arg);
    return createFormatter({
      format(input) {
        const info = toSingleTemporalInfo(input, resetTemporalInfo(tempInfo));
        return impl.format(info);
      },
      parse(input, args, out) {
        out.info = impl.parse(input, out.info);
        return out;
      },
    });
  } else {
    return {
      parse: parseImpl.bind(arg),
      format: formatImpl.bind(arg),
      toDate: toDateImpl.bind(arg, tempInfo),
      toTime: toTimeImpl.bind(arg, tempInfo),
      toDuration: toDurationImpl.bind(arg, tempInfo),
      toDateTime: toDateTimeImpl.bind(arg, tempInfo),
      toInstant: toInstantImpl.bind(arg, tempInfo),
      toZonedDateTime: toZonedDateTimeImpl.bind(arg, tempInfo),
    } as T;
  }
}

function parseImpl(
  this: FormatterHandler,
  input: string,
  ...args: readonly unknown[]
): Partial<TemporalInfo> {
  return this.parse(input, args, { info: createTemporalInfo() }).info;
}

function formatImpl(
  this: FormatterHandler,
  input: TemporalObject,
  ...args: readonly unknown[]
): string {
  return this.format(input, args);
}

function toDateImpl(
  this: FormatterHandler,
  tempInfo: Partial<TemporalInfo>,
  input: string,
  ...args: readonly unknown[]
): Temporal.PlainDate {
  const output = this.parse(input, args, { info: resetTemporalInfo(tempInfo) });
  return toDate(output.info as TemporalInfo, output.opts);
}

function toTimeImpl(
  this: FormatterHandler,
  tempInfo: Partial<TemporalInfo>,
  input: string,
  ...args: readonly unknown[]
): Temporal.PlainTime {
  const output = this.parse(input, args, { info: resetTemporalInfo(tempInfo) });
  return toTime(output.info as TemporalInfo, output.opts);
}

function toDurationImpl(
  this: FormatterHandler,
  tempInfo: Partial<TemporalInfo>,
  input: string,
  ...args: readonly unknown[]
): Temporal.Duration {
  const output = this.parse(input, args, { info: resetTemporalInfo(tempInfo) });
  return toDuration(output.info as TemporalInfo);
}

function toDateTimeImpl(
  this: FormatterHandler,
  tempInfo: Partial<TemporalInfo>,
  input: string,
  ...args: readonly unknown[]
): Temporal.PlainDateTime {
  const output = this.parse(input, args, { info: resetTemporalInfo(tempInfo) });
  return toDateTime(output.info as TemporalInfo, output.opts);
}

function toInstantImpl(
  this: FormatterHandler,
  tempInfo: Partial<TemporalInfo>,
  input: string,
  ...args: readonly unknown[]
): Temporal.Instant {
  const output = this.parse(input, args, { info: resetTemporalInfo(tempInfo) });
  return toInstant(output.info as TemporalInfo);
}

function toZonedDateTimeImpl(
  this: FormatterHandler,
  tempInfo: Partial<TemporalInfo>,
  input: string,
  ...args: readonly unknown[]
): Temporal.ZonedDateTime {
  const output = this.parse(input, args, { info: resetTemporalInfo(tempInfo) });
  return toZonedDateTime(output.info as TemporalInfo, output.opts);
}
