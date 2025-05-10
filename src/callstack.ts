/**
 * @public
 *
 * @module
 */

/**
 * 获取当前函数调用栈字符串
 *
 * @param ignore 可提供要忽略栈的函数，仅 `v8` 引擎支持该参数，见 https://v8.dev/docs/stack-trace-api
 * @returns 返回调用栈字符串
 *
 * @example
 * ```ts
 * console.log(captureCallstackText());
 * // will print "at <anonymous>:1:7".
 * ```
 */
export function captureCallstackText(ignore?: Function): string {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions -- captureStackTrace may not exist.
    if (Error.captureStackTrace) {
        const temp = { stack: "" as string | undefined };
        Error.captureStackTrace(temp, ignore);
        return temp.stack?.replace("Error\n    ", "") ?? "";
    } else {
        return (
            new Error("TempStack").stack?.replace("Error: TempStack\n    ", "")
            ?? ""
        );
    }
}
