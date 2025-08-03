/**
 * @public
 *
 * @module
 */
import type { Temporal } from "temporal-polyfill";
import {
    toDate,
    toDateTime,
    toDuration,
    toSingleTemporalInfo,
    toTime,
    toZonedDateTime,
} from "./format.js";
import { createTemplate } from "./format/impl/tr35.js";
import {
    createTemporalInfo,
    resetTemporalInfo,
    type AssignmentOptions,
    type TemporalInfo,
    type TemporalObject,
    type TemporalTemplate,
    type ZonedAssignmentOptions,
} from "./shared.js";

/**
 * 时态文本格式化器
 */
export abstract class Formatter {
    /**
     * 从时态文本模板创建一个格式化器。
     */
    static from(template: TemporalTemplate): Formatter {
        const impl = createTemplate(template);
        return new (class extends Formatter {
            parseInto(input: string, out: Partial<TemporalInfo>) {
                return impl.parse(input, out);
            }

            format(input: TemporalObject) {
                const info = toSingleTemporalInfo(input, this._temp);
                return impl.format(info);
            }
        })();
    }

    private _temp = createTemporalInfo();

    /**
     * 解析字符串至指定的 {@link TemporalInfo} 对象。
     *
     * 传入的 {@link out} 对象有可能是在该类实例中被复用的对象，
     * 因此需注意如果解析过程中可能需要调用该对象其它任何方法，则
     * 需忽略 {@link out} 参数，直接返回一个新对象。
     */
    protected abstract parseInto(
        input: string,
        out: Partial<TemporalInfo>,
    ): Partial<TemporalInfo>;

    /**
     * 格式化时态输入为字符串。
     *
     * @param input 输入数据
     */
    abstract format(input: TemporalObject): string;

    /**
     * 解析字符串为 {@link TemporalInfo}。
     */
    parse(input: string): Partial<TemporalInfo> {
        return this.parseInto(input, createTemporalInfo());
    }

    /**
     * 解析字符串为 {@link Temporal.PlainDate}
     *
     * @param input 输入字符串
     * @param opts {@link AssignmentOptions}
     */
    toDate(input: string, opts?: AssignmentOptions): Temporal.PlainDate {
        return toDate(
            this.parseInto(
                input,
                resetTemporalInfo(this._temp),
            ) as TemporalInfo,
            opts,
        );
    }

    /**
     * 解析字符串为 {@link Temporal.PlainTime}
     *
     * @param input 输入字符串
     * @param opts {@link AssignmentOptions}
     */
    toTime(input: string, opts?: AssignmentOptions): Temporal.PlainTime {
        return toTime(
            this.parseInto(
                input,
                resetTemporalInfo(this._temp),
            ) as TemporalInfo,
            opts,
        );
    }

    /**
     * 解析字符串为 {@link Temporal.Duration}
     *
     * @param input 输入字符串
     */
    toDuration(input: string): Temporal.Duration {
        return toDuration(
            this.parseInto(
                input,
                resetTemporalInfo(this._temp),
            ) as TemporalInfo,
        );
    }

    /**
     * 解析字符串为 {@link Temporal.PlainDateTime}
     *
     * @param input 输入字符串
     * @param opts {@link AssignmentOptions}
     */
    toDateTime(
        input: string,
        opts?: AssignmentOptions,
    ): Temporal.PlainDateTime {
        return toDateTime(
            this.parseInto(
                input,
                resetTemporalInfo(this._temp),
            ) as TemporalInfo,
            opts,
        );
    }

    /**
     * 解析字符串为 {@link Temporal.ZonedDateTime}
     *
     * @param input 输入字符串
     * @param opts {@link ZonedAssignmentOptions}
     */
    toZonedDateTime(
        input: string,
        opts?: ZonedAssignmentOptions,
    ): Temporal.ZonedDateTime {
        return toZonedDateTime(
            this.parseInto(
                input,
                resetTemporalInfo(this._temp),
            ) as TemporalInfo,
            opts,
        );
    }
}
