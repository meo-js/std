/**
 * @public
 *
 * @module
 */
import type { Class } from "./class.js";
import { getMembers } from "./enum.js";
import type { uncertain } from "./ts/semantic.js";

/**
 * 基础错误类
 */
export class BaseError<T extends number = number> extends Error {
    /**
     * 错误码
     */
    code = 0 as T;

    constructor(code: T, message?: string, opts?: ErrorOptions) {
        super(message, opts);
        // HACK: https://github.com/microsoft/TypeScript/wiki/FAQ#why-doesnt-extending-built-ins-like-error-array-and-map-work
        Object.setPrototypeOf(this, new.target.prototype);
        // Maintains proper stack trace for where our error was thrown.
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions -- captureStackTrace may not exist.
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
        this.code = code;
    }
}

BaseError.prototype.name = "Error";

/**
 * 创建定义了一系列返回错误实例的函数的对象
 *
 * @param errorClass 错误类
 * @param errorCodes 错误码枚举
 */
export function defineErrors<
    T extends Class<BaseError, [code: number, ...args: uncertain]>,
    Enum extends object,
>(errorClass: T, errorCodes: Enum): ErrorBuilder<T, Enum> {
    const codes = getMembers(errorCodes);
    const obj = {} as ErrorBuilder<T, Enum>;

    for (const [prop, code] of codes) {
        obj[prop] = (...args: ArgumentsWithoutCode<T>) => {
            return new errorClass(code, ...args) as InstanceType<T>;
        };
    }

    return obj;
}

/**
 * 错误构造器
 *
 * 由 {@link defineErrors} 返回的对象类型
 */
export type ErrorBuilder<
    T extends Class<BaseError, [code: number, ...args: uncertain]>,
    Enum extends object,
> = {
    [key in keyof Enum]: (...args: ArgumentsWithoutCode<T>) => InstanceType<T>;
};

type ArgumentsWithoutCode<T extends Class> =
    T extends Class<object, [code: number, ...args: infer R]> ? R : [];
