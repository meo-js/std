import type { checked } from "../ts.js";
import {
    _createDateTimeInfo,
    _toDateTimeInfo,
    toDateTimeInfo,
    type _ToDateTimeInfo,
    type _ToDateTimeInfoInput,
} from "./convert.js";
import type { DateTimeInfo } from "./shared.js";

/**
 * 解析多个输入并合并为 {@link DateTimeInfo}
 *
 * 单个输入将使用与 {@link toDateTimeInfo} 相同的规则解析为 {@link DateTimeInfo}。
 *
 * 然后会像 {@link Object.assign} 函数一样依次将这些对象合并为一个并返回，后面的输入会覆盖前面的输入。
 *
 * 注意：该函数在合并时不会做任何的时区或者日历转换，如果将两个不同时区或者日历的日期与时间合并可能会毫无意义！
 */
export function parse<T extends _ToDateTimeInfoInput[]>(
    ...inputs: T
): { [K in keyof _Parse<T>]: _Parse<T>[K] } {
    const out = _createDateTimeInfo();
    for (const input of inputs) {
        _toDateTimeInfo(input, out);
    }
    return out as checked;
}

/**
 * @internal
 */
type _Parse<T extends _ToDateTimeInfoInput[]> = T extends [
    infer U extends _ToDateTimeInfoInput,
    ...infer R extends _ToDateTimeInfoInput[],
]
    ? _ToDateTimeInfo<U> & _Parse<R>
    : {};
