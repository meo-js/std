/**
 * Provide parsing and formatting for the Internet Email Date/Time Format.
 *
 * Supports parsing of date-time formats defined in the specification,
 * including those from obsolete versions, while ensuring that all output
 * strictly conforms to the latest version of the specification.
 *
 * @module
 * @see [RFC822(obsoletes)](https://datatracker.ietf.org/doc/html/rfc822)
 * @see [RFC1123(obsoletes)](https://datatracker.ietf.org/doc/html/rfc1123)
 * @see [RFC2822(obsoletes)](https://datatracker.ietf.org/doc/html/rfc2822)
 * @see [RFC5322](https://datatracker.ietf.org/doc/html/rfc5322)
 */
import { isInstant } from '../../predicate.js';
import { getStringTag } from '../../primitive.js';
import { createFormatter } from '../formatter.js';

createFormatter({
  format(input, args) {
    if (isInstant(input)) {
      throw new Error(`Unsupported temporal type: ${getStringTag(input)}.`);
    }
    // TODO
    return '';
  },
  parse(input, args, out) {
    // TODO
    return out;
  },
});

// TODO: Implement email date/time format parsing and formatting by createFormatter
// | Temporal 类型               | 从 Email → Temporal | 从 Temporal → Email   | 往返是否无损                                          | 关键说明                                                                                                                                                                            |
// | ------------------------- | ------------------ | -------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
// | `Temporal.Instant`        | ✅      | ✅                  | ❌ **有损**（丢失毫微秒；也丢失原始偏移）                         | Email 提供本地时分秒 + 数字偏移 ⇒ 可唯一确定 UTC 瞬时点；但 RFC 5322 不支持小数秒，格式化会四舍五入到秒，并且不会保留原始偏移选择策略。                                                                                            |
// | `Temporal.ZonedDateTime`  | ✅（用“**固定偏移时区**”） | ✅                  | ⚠️ **条件无损**：仅当其 `timeZone` 本来就是固定偏移（如 `+02:00`） | Email 只有 **数字偏移**，没有 IANA 时区 ID（如 `Europe/Paris`）。从 Email 解析时可构造 `ZonedDateTime`（`timeZone` 设为对应的 `+HH:MM`）；从 `ZonedDateTime` 格式化时输出该瞬时的 **数值偏移**。若原本是 IANA 时区，往返会 **丢失时区 ID**。 |
// | `Temporal.PlainDateTime`  | ✅（**丢偏移**）       | ⚠️ 不建议/不可判定（缺少偏移/时区） | ❌ 有损                                            | Email 含偏移，可直接取其本地日期时间部分得到 `PlainDateTime`；但从 `PlainDateTime` 生成 Email 需**人工假定**偏移/时区，因此不视为可逆的标准转换。                                                                              |
// | `Temporal.PlainDate`      | ✅（取日期部分）         | ❌ 不足以生成              | ❌ 有损                                            | Email → 取 `YYYY-MM-DD` 即可；反向不行，因为缺时间与偏移。                                                                                                                                        |
// | `Temporal.PlainTime`      | ✅（取时间部分到秒）       | ❌ 不足以生成              | ❌ 有损                                            | Email → 取 `HH:mm[:ss]` 即可；反向不行，因为缺日期与偏移。                                                                                                                                        |
// | `Temporal.Duration`       | ❌                  | ❌                    | —                                               | 邮件格式不表示“时长”。                                                                                                                                                                    |
// 以上是其他人输出的参考表格，我们则尽最大可能兼容转换，例如：
// - 任何转换都将毫微秒四舍五入到秒。
// - 任何转换若没有时区信息，则默认为 UTC。
// - 允许 PlainDate，Time 部分直接使用 Temporal 默认值。
// - 不允许 Duration。
