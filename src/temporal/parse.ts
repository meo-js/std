import type { checked } from "../ts.js";
import {
    _createTemporalInfo,
    _toTemporalInfo,
    toTemporalInfo,
} from "./convert.js";
import type {
    MergeToTemporalInfo,
    TemporalInfo,
    TemporalInfoInput,
} from "./shared.js";

/**
 * 解析多个输入并合并为 {@link TemporalInfo}
 *
 * 单个输入将使用与 {@link toTemporalInfo} 相同的规则解析为 {@link TemporalInfo}。
 *
 * 然后会像 {@link Object.assign} 函数一样依次将这些对象合并为一个并返回，后面的输入会覆盖前面的输入。
 *
 * 注意：该函数在合并时不会做任何的时区或者日历转换，如果将两个不同时区或者日历的日期与时间合并可能会毫无意义！
 */
export function parse<T extends TemporalInfoInput[]>(
    ...inputs: T
): { [K in keyof MergeToTemporalInfo<T>]: MergeToTemporalInfo<T>[K] } {
    const out = _createTemporalInfo();
    for (const input of inputs) {
        _toTemporalInfo(input, out);
    }
    return out as checked;
}
