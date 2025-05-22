/**
 * @module
 *
 * @internal
 */
import type { DateTimeInfo, TemporalTextFormatter } from "../shared.js";

/**
 * 0 是 Literal, 其它是 Field，高 8 位存储字母代码，低 24 位存储字母的个数
 */
type Field = number;

export function createTemplate(template: string): TemporalTextFormatter {
    // UTS #35 无效模式处理
    // 对于有效字符但无效长度：
    // - 格式化：为无效字段发出 U+FFFD 替换字符。
    // - 解析：字段可按有效长度进行解析。
    // 对于无效字符：
    // 抛出异常。
    const { fields, values } = preprocess(template);
    return {
        format(input: Partial<DateTimeInfo>) {
            let str = "";
            let valueIndex = 0;
            for (let i = 0; i < fields.length; i++) {
                const field = fields[i];
                if (field === 0) {
                    const value = values[valueIndex++];
                    str += value;
                } else {
                    const fieldCode = field >> 24;
                    const fieldLength = field & 0x00ffffff;
                    str += generate(input, template, fieldCode, fieldLength);
                }
            }
            return str;
        },
        parse(text: string): Partial<DateTimeInfo> {
            // TODO
            return null!;
        },
    };
}

/**
 * 预处理模板字符串
 */
function preprocess(template: string) {
    // UTS #35 模板
    // Pattern fields: a-z, A-Z
    // Literal text: 除了字母意外的所有字符；单引号之间的字符；两个单引号转义为一个单引号

    const fields: Field[] = [];
    const values: string[] = [];

    // -1 None, 0 in '' Literal, 1 Literal, 2 Field
    let type: -1 | 0 | 1 | 2 = -1;
    let prevField = "";
    let fieldStart = 0;
    for (let i = 0; i < template.length; i++) {
        const char = template[i];
        if ((char >= "a" && char <= "z") || (char >= "A" && char <= "Z")) {
            // 处理字母
            switch (type) {
                case -1:
                    type = 2;
                    prevField = char;
                    fieldStart = i;
                    break;

                case 2:
                    if (char !== prevField) {
                        fields.push(
                            (prevField.charCodeAt(0) << 24) | (i - fieldStart),
                        );
                        type = 2;
                        prevField = char;
                        fieldStart = i;
                    } else {
                        // 同样的 field 字母，不做任何处理
                    }
                    break;

                case 1:
                    fields.push(0);
                    values.push(
                        template.slice(fieldStart, i).replace("''", "'"),
                    );
                    type = 2;
                    prevField = char;
                    fieldStart = i;
                    break;

                case 0:
                    // 在单引号字面量中，不做任何处理
                    break;
            }
        } else if (char === "'") {
            if (template[i + 1] === "'") {
                // 处理转义 ' 字符
                switch (type) {
                    case -1:
                        type = 1;
                        fieldStart = i;
                        break;

                    case 2:
                        fields.push(
                            (prevField.charCodeAt(0) << 24) | (i - fieldStart),
                        );
                        type = 1;
                        fieldStart = i;
                        break;

                    default:
                        // 转义单引号
                        break;
                }
                i++;
            } else {
                // 处理 ' 字符
                switch (type) {
                    case -1:
                        type = 0;
                        fieldStart = i;
                        break;

                    case 0:
                        fields.push(0);
                        values.push(
                            template.slice(fieldStart, i).replace("''", "'"),
                        );
                        type = -1;
                        break;

                    case 1:
                        fields.push(0);
                        values.push(
                            template.slice(fieldStart, i).replace("''", "'"),
                        );
                        type = 0;
                        fieldStart = i;
                        break;

                    case 2:
                        fields.push(
                            (prevField.charCodeAt(0) << 24) | (i - fieldStart),
                        );
                        type = 0;
                        fieldStart = i;
                        break;
                }
            }
        } else {
            // 处理其他字符
            switch (type) {
                case -1:
                    type = 1;
                    fieldStart = i;
                    break;

                case 2:
                    fields.push(
                        (prevField.charCodeAt(0) << 24) | (i - fieldStart),
                    );
                    type = 1;
                    fieldStart = i;
                    break;

                default:
                    // 在任何字面量中，不做任何处理
                    break;
            }
        }
    }

    // 处理字符串结束
    switch (type) {
        case 0:
            throw new RangeError(
                `unterminated literal: "${template}", if you want to use a single quote, please use two single quotes to escape it.`,
            );

        case 1:
            fields.push(0);
            values.push(template.slice(fieldStart).replace("''", "'"));
            break;

        case 2:
            fields.push(
                (prevField.charCodeAt(0) << 24)
                    | (template.length - fieldStart),
            );
            break;

        default:
            // 空字符串
            break;
    }

    return { fields, values };
}

function generate(
    input: Partial<DateTimeInfo>,
    template: string,
    code: number,
    len: number,
): string {
    switch (code) {
        // y: year
        case 0x79:
            return num(code, input.year, "year", len);

        // M: month
        case 0x4d:
            if (len <= 2) {
                return num(code, input.month, "month", len);
            } else {
                // TODO
            }
            break;

        // L: month
        case 0x4c:
            if (len <= 2) {
                return num(code, input.month, "month", len);
            } else {
                // TODO
            }
            break;

        // l: month
        case 0x6c:
            // 规范定义的忽略字符
            return "";

        // d: day
        case 0x64:
            return num(code, input.day, "day", len, 2);

        // H: hour
        case 0x48:
            return num(code, input.hour, "hour", len, 2);

        // m: minute
        case 0x6d:
            return num(code, input.minute, "minute", len, 2);

        // s: second
        case 0x73:
            return num(code, input.second, "second", len, 2);

        default:
            // 无效字符
            break;
    }

    throw new RangeError(
        `unsupported date field symbol: "${String.fromCharCode(code)}", template: "${template}".`,
    );
}

function compile(fields: Field[], values: string[]) {
    let regexpStr = "";
    let valueIndex = 0;
    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        if (field === 0) {
            const value = values[valueIndex++];
            regexpStr += RegExp.escape(value);
        } else {
            const fieldCode = field >> 24;
            const fieldLength = field & 0x00ffffff;
            // switch (key) {
            //     case value:
            //         break;

            //     default:
            //         break;
            // }
            // TODO
        }
    }
    return regexpStr;
}

function num(
    code: number,
    value: number | undefined,
    text: string,
    len: number,
    limit: number = len,
): string {
    value = rejectNull(code, value, text);

    const targetLen = Math.min(len, limit);

    let str = "";

    if (len !== limit) {
        str = value
            .toString()
            .padStart(Math.min(len, limit), "0")
            .padEnd(len, "\uFFFD");
    } else {
        str = value.toString().padStart(len, "0");
    }

    if (str.length > targetLen) {
        str = str.slice(-targetLen);
    }

    return str;
}

function rejectNull<T>(code: number, value: T, text: string): NonNullable<T> {
    if (value == null) {
        throw new RangeError(
            `template has date field symbol: "${String.fromCharCode(code)}", but no corresponding input: "${text}".`,
        );
    }
    return value;
}
