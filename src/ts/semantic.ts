/**
 * 类型 `null | undefined` 的简写形式
 */
export type none = null | undefined;

/**
 * 类型 `never` 的别名
 *
 * 由于该 [issue#55667](https://github.com/microsoft/TypeScript/issues/55667)，一些内置的类型在参数声明为 `never` 时无法正常工作，所以暂时指向 `any`，之后进行统一替换。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- checked.
export type uncertain = any;
