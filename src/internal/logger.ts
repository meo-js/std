/**
 * @module
 *
 * @internal
 */

/**
 * 内部日志记录器接口
 *
 * 默认为 {@link console}
 */
export interface InternalLogger {
    trace(...msgs: unknown[]): void;
    debug(...msgs: unknown[]): void;
    info(...msgs: unknown[]): void;
    warn(...msgs: unknown[]): void;
    error(...msgs: unknown[]): void;
}

/**
 * 内部日志记录器
 */
export const log: InternalLogger = console;
