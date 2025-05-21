import { isString } from "../predicate.js";
import type { checked } from "../ts.js";
import { createRfc9557ParseResult, parseDateTime } from "./parser/temporal.js";
import type { DateTimeInfo, TemporalTextInput } from "./shared.js";

/**
 * 解析或者格式化为 RFC 9557 规范日期时间字符串
 *
 * @returns 传入 `string` 时解析为 {@link DateTimeInfo} 对象，传入 {@link DateTimeInfo} 对象时格式化为字符串。
 */
export function rfc9557(input: string): TemporalTextInput;
export function rfc9557(input: DateTimeInfo): TemporalTextInput;
export function rfc9557(input: string | DateTimeInfo): TemporalTextInput {
    if (isString(input)) {
        return {
            text: input,
            formatter: rfc9557,
        };
    } else {
        // TODO
        return null!;
    }
}

export namespace rfc9557 {
    export function parse(input: string): DateTimeInfo {
        // HACK: 为了能够在各个函数中使用，所以强行 as DateTimeInfo，虽然这并不安全
        return parseDateTime(input, createRfc9557ParseResult()) as checked;
    }
    export function format(input: DateTimeInfo): string {
        // TODO
        return "";
    }
}

/**
 * 解析或者格式化为 ISO 8601 规范持续时间字符串
 *
 * @returns 传入 `string` 时解析为 {@link DateTimeInfo} 对象，传入 {@link DateTimeInfo} 对象时格式化为字符串。
 */
export function iso8601(input: string): TemporalTextInput;
export function iso8601(input: DateTimeInfo): TemporalTextInput;
export function iso8601(input: string | DateTimeInfo): TemporalTextInput {
    if (isString(input)) {
        return {
            text: input,
            formatter: iso8601,
        };
    } else {
        // TODO
        return null!;
    }
}

export namespace iso8601 {
    export function parse(input: string): DateTimeInfo {
        // HACK: 为了能够在各个函数中使用，所以强行 as DateTimeInfo，虽然这并不安全
        return parseDateTime(input, createRfc9557ParseResult()) as checked;
    }
    export function format(input: DateTimeInfo): string {
        // TODO
        return "";
    }
}
