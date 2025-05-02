/**
 * @public
 *
 * @module
 */
import type { Class } from "./class.js";
import { getEnumMembers } from "./enum.js";
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
 * 创建错误工厂对象
 *
 * @param errorClass 错误类或名称
 * @param errorCodes 错误码枚举
 */
export function createErrorFactory<
    TClass extends Class<BaseError, [code: number, ...args: uncertain]>,
    TEnum extends object,
>(errorClass: TClass, errorCodes: TEnum) {
    const codes = getEnumMembers(errorCodes);
    const obj = {} as {
        [key in keyof TEnum]: (
            ...args: ConstructorParametersWithoutFirst<TClass>
        ) => InstanceType<TClass>;
    };

    for (const [prop, code] of codes) {
        obj[prop] = (...args: ConstructorParametersWithoutFirst<TClass>) => {
            return new errorClass(code, ...args) as InstanceType<TClass>;
        };
    }

    return obj;
}

/**
 * 获取构造函数参数除第一个外的类型
 */
type ConstructorParametersWithoutFirst<T extends Class> =
    T extends Class<object, [code: number, ...args: infer R]> ? R : [];
