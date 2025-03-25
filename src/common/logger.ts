/**
 * 内部日志记录器接口
 *
 * 默认为 {@link console}
 */
export interface InternalLogger {
    trace(...msgs: any[]): void;
    debug(...msgs: any[]): void;
    info(...msgs: any[]): void;
    warn(...msgs: any[]): void;
    error(...msgs: any[]): void;
}

/**
 * 内部日志记录器
 */
export const log: InternalLogger = console;
