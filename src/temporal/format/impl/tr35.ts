/**
 * @internal
 * @module
 */
import type { TemporalInfo, TemporalTemplate } from '../../shared.js';

/**
 * 0 是 Literal, 其它是 Field，高 8 位存储字母代码，低 24 位存储字母的个数
 */
type Field = number;

type Redirect = (matched: string, out: Partial<TemporalInfo>) => void;

const cache = new Map<
  string,
  {
    format(input: Partial<TemporalInfo>): string;
    parse(text: string, out: Partial<TemporalInfo>): Partial<TemporalInfo>;
    // TODO: verify
  }
>();

export function getTemplate(template: TemporalTemplate) {
  let formatter = cache.get(template);
  if (!formatter) {
    cache.set(template, (formatter = createTemplate(template)));
    // 确保缓存占用不会过多
    if (cache.size > 100) {
      let i = 0;
      for (const key of cache.keys()) {
        cache.delete(key);
        if (++i > 30) break;
      }
    }
  }
  return formatter;
}

export function createTemplate(template: TemporalTemplate) {
  // tr35 无效模式处理方式：
  // - 对于有效字符但无效长度：
  //   - 格式化：为无效字段发出 U+FFFD 替换字符。
  //   - 解析：字段可按有效长度进行解析。
  // - 对于无效字符：
  //   - 抛出异常。

  const { fields, values } = preprocess(template);
  const { regexp, redirects } = compile(template, fields, values);

  return {
    format(input: Partial<TemporalInfo>) {
      const parts: string[] = [];
      let valueIndex = 0;
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        if (field === 0) {
          const value = values[valueIndex++];
          parts.push(value);
        } else {
          const fieldCode = field >> 24;
          const fieldLength = field & 0x00ffffff;
          parts.push(generate(input, template, fieldCode, fieldLength));
        }
      }
      return parts.join('');
    },
    parse(text: string, out: Partial<TemporalInfo>): Partial<TemporalInfo> {
      const arr = text.match(regexp);
      if (!arr) {
        throw new RangeError(`Invalid ${template} string: ${text}.`);
      }
      for (let i = 1; i < arr.length; i++) {
        const matched = arr[i];
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checked.
        if (matched == null) {
          continue;
        }
        const redirect = redirects[i - 1];
        redirect(matched, out);
      }
      return out;
    },
  };
}

/**
 * 预处理模板字符串
 */
function preprocess(template: string) {
  // tr35 模板
  // Pattern fields: a-z, A-Z
  // Literal text: 除了字母意外的所有字符；单引号之间的字符；两个单引号转义为一个单引号

  // alt. [field, value][]
  const fields: Field[] = [];
  const values: string[] = [];

  // -1 None, 0 in '' Literal, 1 Literal, 2 Field
  let type: -1 | 0 | 1 | 2 = -1;
  let prevField = '';
  let fieldStart = 0;
  for (let i = 0; i < template.length; i++) {
    const char = template[i];
    if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')) {
      // 处理字母
      switch (type) {
        case -1:
          type = 2;
          prevField = char;
          fieldStart = i;
          break;

        case 2:
          if (char !== prevField) {
            fields.push((prevField.charCodeAt(0) << 24) | (i - fieldStart));
            type = 2;
            prevField = char;
            fieldStart = i;
          } else {
            // 同样的 field 字母，不做任何处理
          }
          break;

        case 1:
          fields.push(0);
          values.push(template.slice(fieldStart, i).replace("''", "'"));
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
            fields.push((prevField.charCodeAt(0) << 24) | (i - fieldStart));
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
            values.push(template.slice(fieldStart, i).replace("''", "'"));
            type = -1;
            break;

          case 1:
            fields.push(0);
            values.push(template.slice(fieldStart, i).replace("''", "'"));
            type = 0;
            fieldStart = i;
            break;

          case 2:
            fields.push((prevField.charCodeAt(0) << 24) | (i - fieldStart));
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
          fields.push((prevField.charCodeAt(0) << 24) | (i - fieldStart));
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
        `Unterminated literal: "${template}", if you want to use a single quote, please use two single quotes to escape it.`,
      );

    case 1:
      fields.push(0);
      values.push(template.slice(fieldStart).replace("''", "'"));
      break;

    case 2:
      fields.push(
        (prevField.charCodeAt(0) << 24) | (template.length - fieldStart),
      );
      break;

    default:
      // 空字符串
      break;
  }

  return { fields, values };
}

function generate(
  input: Partial<TemporalInfo>,
  template: string,
  code: number,
  len: number,
): string {
  switch (code) {
    // y: year
    case 0x79:
      return num(code, input.year, 'year', len);

    // M: month
    case 0x4d:
      if (len <= 2) {
        return num(code, input.month, 'month', len);
      } else {
        // TODO
      }
      break;

    // L: month
    case 0x4c:
      if (len <= 2) {
        return num(code, input.month, 'month', len);
      } else {
        // TODO
      }
      break;

    // l: month
    case 0x6c:
      // 规范定义的忽略字符
      return '';

    // d: day
    case 0x64:
      return num(code, input.day, 'day', len, 2);

    // H: hour
    case 0x48:
      return num(code, input.hour, 'hour', len, 2);

    // m: minute
    case 0x6d:
      return num(code, input.minute, 'minute', len, 2);

    // s: second
    case 0x73:
      return num(code, input.second, 'second', len, 2);

    default:
      // 无效字符
      break;
  }

  throwSymbolError(code, template);
}

/**
 * {@link limit} 是 tr35 规范中定义的最大长度，如果超过需使用替换字符填充
 */
function num(
  code: number,
  value: number | undefined,
  text: string,
  len: number,
  limit: number = len,
): string {
  value = rejectNull(code, value, text);

  const targetLen = Math.min(len, limit);

  let str = '';

  if (len !== limit) {
    str = value
      .toString()
      .padStart(Math.min(len, limit), '0')
      .padEnd(len, '\uFFFD');
  } else {
    str = value.toString().padStart(len, '0');
  }

  if (str.length > targetLen) {
    str = str.slice(-targetLen);
  }

  return str;
}

function compile(template: string, fields: Field[], values: string[]) {
  const regexpParts: string[] = ['^'];
  const redirects: Redirect[] = [];
  let valueIndex = 0;
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    if (field === 0) {
      const value = values[valueIndex++];
      regexpParts.push(RegExp.escape(value));
    } else {
      const fieldCode = field >> 24;
      const fieldLength = field & 0x00ffffff;
      const result = _compile(template, fieldCode, fieldLength);
      if (result) {
        regexpParts.push(result.regexp);
        redirects.push(result.redirect);
      }
    }
  }
  regexpParts.push('$');
  return { regexp: new RegExp(regexpParts.join(''), 'u'), redirects };
}

function _compile(template: string, code: number, len: number) {
  switch (code) {
    // y: year
    case 0x79:
      return regd(year, len);

    // M: month
    case 0x4d:
      if (len <= 2) {
        return regd(month, len);
      } else {
        // TODO
      }
      break;

    // L: month
    case 0x4c:
      if (len <= 2) {
        return regd(month, len);
      } else {
        // TODO
      }
      break;

    // l: month
    case 0x6c:
      // 规范定义的忽略字符
      return null;

    // d: day
    case 0x64:
      return regd(day, len, 2);

    // H: hour
    case 0x48:
      return regd(hour, len, 2);

    // m: minute
    case 0x6d:
      return regd(minute, len, 2);

    // s: second
    case 0x73:
      return regd(second, len, 2);

    default:
      // 无效字符
      break;
  }

  throwSymbolError(code, template);
}

function year(matched: string, out: Partial<TemporalInfo>) {
  out.year = Number(matched);
  out.era = undefined;
  out.eraYear = undefined;
}

function month(matched: string, out: Partial<TemporalInfo>) {
  out.month = Number(matched);
  out.monthCode = undefined;
}

function day(matched: string, out: Partial<TemporalInfo>) {
  out.day = Number(matched);
}

function hour(matched: string, out: Partial<TemporalInfo>) {
  out.hour = Number(matched);
}

function minute(matched: string, out: Partial<TemporalInfo>) {
  out.minute = Number(matched);
}

function second(matched: string, out: Partial<TemporalInfo>) {
  out.second = Number(matched);
}

function regd(redirect: Redirect, len: number, limit: number = len) {
  if (len > limit) {
    return {
      regexp: `(\\d{${limit}})(?:\\uFFFD{${len - limit}})`,
      redirect,
    };
  } else {
    return {
      regexp: `(\\d{${len}})`,
      redirect,
    };
  }
}

function rejectNull<T>(code: number, value: T, text: string): NonNullable<T> {
  if (value == null) {
    throw new RangeError(
      `Template has date field symbol: "${String.fromCharCode(code)}", but no corresponding input: "${text}".`,
    );
  }
  return value;
}

function throwSymbolError(code: number, template: string): never {
  throw new RangeError(
    `Unsupported date field symbol: "${String.fromCharCode(code)}", template: "${template}".`,
  );
}
