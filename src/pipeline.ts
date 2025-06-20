/**
 * @public
 *
 * @module
 */
import type { uncertain } from "./ts.js";

const noopPipe: Pipe = {
    transform(input, next) {
        next(input);
    },
};

function throwBusyError() {
    throw new Error("do not recursively call methods on the same pipeline.");
}

/**
 * 通用管线
 */
export class Pipeline<In = uncertain, Out = unknown, Final = void> {
    /**
     * 传入值与管道并立即执行
     */
    static run<In, Out, Final>(input: In, a: Pipe<In, Out, Final>): Final;
    static run<In, In2, Out, Final>(
        input: In,
        a: Pipe<In, In2>,
        b: Pipe<In2, Out, Final>,
    ): Final;
    static run<In, In2, In3, Out, Final>(
        input: In,
        a: Pipe<In, In2>,
        b: Pipe<In2, In3>,
        c: Pipe<In3, Out, Final>,
    ): Final;
    static run<In, In2, In3, In4, Out, Final>(
        input: In,
        a: Pipe<In, In2>,
        b: Pipe<In2, In3>,
        c: Pipe<In3, In4>,
        d: Pipe<In4, Out, Final>,
    ): Final;
    static run<In, In2, In3, In4, In5, Out, Final>(
        input: In,
        a: Pipe<In, In2>,
        b: Pipe<In2, In3>,
        c: Pipe<In3, In4>,
        d: Pipe<In4, In5>,
        e: Pipe<In5, Out, Final>,
    ): Final;
    static run<In, In2, In3, In4, In5, In6, Out, Final>(
        input: In,
        a: Pipe<In, In2>,
        b: Pipe<In2, In3>,
        c: Pipe<In3, In4>,
        d: Pipe<In4, In5>,
        e: Pipe<In5, In6>,
        f: Pipe<In6, Out, Final>,
    ): Final;
    static run<In, In2, In3, In4, In5, In6, In7, Out, Final>(
        input: In,
        a: Pipe<In, In2>,
        b: Pipe<In2, In3>,
        c: Pipe<In3, In4>,
        d: Pipe<In4, In5>,
        e: Pipe<In5, In6>,
        f: Pipe<In6, In7>,
        g: Pipe<In7, Out, Final>,
    ): Final;
    static run<In, In2, In3, In4, In5, In6, In7, In8, Out, Final>(
        input: In,
        a: Pipe<In, In2>,
        b: Pipe<In2, In3>,
        c: Pipe<In3, In4>,
        d: Pipe<In4, In5>,
        e: Pipe<In5, In6>,
        f: Pipe<In6, In7>,
        g: Pipe<In7, In8>,
        h: Pipe<In8, Out, Final>,
    ): Final;
    static run<In, In2, In3, In4, In5, In6, In7, In8, In9, Out, Final>(
        input: In,
        a: Pipe<In, In2>,
        b: Pipe<In2, In3>,
        c: Pipe<In3, In4>,
        d: Pipe<In4, In5>,
        e: Pipe<In5, In6>,
        f: Pipe<In6, In7>,
        g: Pipe<In7, In8>,
        h: Pipe<In8, In9>,
        i: Pipe<In9, Out, Final>,
    ): Final;
    static run<In, In2, In3, In4, In5, In6, In7, In8, In9, In10, Out, Final>(
        input: In,
        a: Pipe<In, In2>,
        b: Pipe<In2, In3>,
        c: Pipe<In3, In4>,
        d: Pipe<In4, In5>,
        e: Pipe<In5, In6>,
        f: Pipe<In6, In7>,
        g: Pipe<In7, In8>,
        h: Pipe<In8, In9>,
        i: Pipe<In9, In10>,
        j: Pipe<In10, Out, Final>,
    ): Final;
    static run(input: unknown, ...pipes: Pipe[]): unknown {
        return new Pipeline<unknown, unknown, unknown>(pipes)
            .push(input)
            .flush();
    }

    protected pipes: Pipe[];
    protected next: Next<Out>;
    /**
     * 调用栈索引
     *
     * - `0` 空闲状态
     * - 其它值代表着管线正在执行，因为执行任何管道方法前都会递增索引
     */
    protected i = 0;

    constructor(pipes: Pipe[]) {
        this.pipes = pipes.length === 0 ? [noopPipe] : pipes;
        this.next = this._next.bind(this);
    }

    protected _next(value: unknown) {
        const i = this.i;

        if (i >= this.pipes.length) {
            return;
        }

        this.i++;
        this.pipes[i].transform(value, this.next as Next<unknown>);
        this.i--;
    }

    protected _error(error: unknown): unknown {
        const pipes = this.pipes;
        const errors = [];

        for (let i = 0; i < pipes.length; i++) {
            this.i = i + 1;
            const pipe = pipes[i];
            try {
                const _error = pipe.catch?.(error);
                if (_error !== undefined) {
                    error = _error;
                }
            } catch (err) {
                errors.push(err);
            }
        }

        this.i = 0;

        if (errors.length > 0) {
            errors.push(error);
            return new AggregateError(
                errors,
                "some errors occurred in the pipeline.",
            );
        } else {
            return error;
        }
    }

    /**
     * 输入值到管线中进行处理
     */
    push(value: In) {
        if (this.i > 0) {
            throwBusyError();
        }

        try {
            this._next(value);
        } catch (error) {
            throw this._error(error);
        }

        return this;
    }

    /**
     * 输入多个值到管线中进行处理
     */
    pushMany(values: Iterable<In>) {
        if (this.i > 0) {
            throwBusyError();
        }

        try {
            for (const value of values) {
                this._next(value);
            }
        } catch (error) {
            throw this._error(error);
        }

        return this;
    }

    /**
     * 刷新管线并获取最终输出结果
     */
    flush(): Final {
        if (this.i > 0) {
            throwBusyError();
        }

        const { next, pipes } = this;
        let output: Final = undefined!;

        try {
            for (let i = 0; i < pipes.length; i++) {
                this.i = i + 1;
                const pipe = pipes[i];
                output = pipe.flush?.(next as Next<unknown>) as Final;
            }
            this.i = 0;
        } catch (error) {
            throw this._error(error);
        }

        return output;
    }
}

/**
 * 通用管道
 */
export interface Pipe<In = uncertain, Out = unknown, Final = void> {
    /**
     * 该函数在新值输入管线时回调，可用于转换值
     *
     * @param input 输入值
     * @param next 调用该函数将值传输到下一个管道，仅可在函数执行期间调用，并且可调用任意次数
     */
    transform(input: In, next: Next<Out>): void;

    /**
     * 该函数在管线刷新时回调，可用于清理状态
     *
     * @param next 调用该函数将值传输到下一个管道，仅可在函数执行期间调用，并且可调用任意次数
     * @returns 返回一个值，仅管线中最后一个管道返回的值会作为输出
     */
    flush?(next: Next<Out>): Final;

    /**
     * 该函数在管线发生错误时回调，用于转换错误和清理状态
     *
     * @param error 错误
     * @returns 返回一个错误，该错误将代替 {@link error} 被传递到下一个管道，若这是管线中的最后一个管道，则作为最终被抛出的错误
     */
    catch?(error: unknown): unknown;
}

/**
 * 管道用于传送值的函数
 */
export type Next<Out> = (output: Out) => void;

/**
 * 创建管道
 */
export function pipeline<In, Out, Final>(
    a: Pipe<In, Out, Final>,
): Pipeline<In, Out, Final>;
export function pipeline<In, In2, Out, Final>(
    a: Pipe<In, In2>,
    b: Pipe<In2, Out, Final>,
): Pipeline<In, Out, Final>;
export function pipeline<In, In2, In3, Out, Final>(
    a: Pipe<In, In2>,
    b: Pipe<In2, In3>,
    c: Pipe<In3, Out, Final>,
): Pipeline<In, Out, Final>;
export function pipeline<In, In2, In3, In4, Out, Final>(
    a: Pipe<In, In2>,
    b: Pipe<In2, In3>,
    c: Pipe<In3, In4>,
    d: Pipe<In4, Out, Final>,
): Pipeline<In, Out, Final>;
export function pipeline<In, In2, In3, In4, In5, Out, Final>(
    a: Pipe<In, In2>,
    b: Pipe<In2, In3>,
    c: Pipe<In3, In4>,
    d: Pipe<In4, In5>,
    e: Pipe<In5, Out, Final>,
): Pipeline<In, Out, Final>;
export function pipeline<In, In2, In3, In4, In5, In6, Out, Final>(
    a: Pipe<In, In2>,
    b: Pipe<In2, In3>,
    c: Pipe<In3, In4>,
    d: Pipe<In4, In5>,
    e: Pipe<In5, In6>,
    f: Pipe<In6, Out, Final>,
): Pipeline<In, Out, Final>;
export function pipeline<In, In2, In3, In4, In5, In6, In7, Out, Final>(
    a: Pipe<In, In2>,
    b: Pipe<In2, In3>,
    c: Pipe<In3, In4>,
    d: Pipe<In4, In5>,
    e: Pipe<In5, In6>,
    f: Pipe<In6, In7>,
    g: Pipe<In7, Out, Final>,
): Pipeline<In, Out, Final>;
export function pipeline<In, In2, In3, In4, In5, In6, In7, In8, Out, Final>(
    a: Pipe<In, In2>,
    b: Pipe<In2, In3>,
    c: Pipe<In3, In4>,
    d: Pipe<In4, In5>,
    e: Pipe<In5, In6>,
    f: Pipe<In6, In7>,
    g: Pipe<In7, In8>,
    h: Pipe<In8, Out, Final>,
): Pipeline<In, Out, Final>;
export function pipeline<
    In,
    In2,
    In3,
    In4,
    In5,
    In6,
    In7,
    In8,
    In9,
    Out,
    Final,
>(
    a: Pipe<In, In2>,
    b: Pipe<In2, In3>,
    c: Pipe<In3, In4>,
    d: Pipe<In4, In5>,
    e: Pipe<In5, In6>,
    f: Pipe<In6, In7>,
    g: Pipe<In7, In8>,
    h: Pipe<In8, In9>,
    i: Pipe<In9, Out, Final>,
): Pipeline<In, Out, Final>;
export function pipeline<
    In,
    In2,
    In3,
    In4,
    In5,
    In6,
    In7,
    In8,
    In9,
    In10,
    Out,
    Final,
>(
    a: Pipe<In, In2>,
    b: Pipe<In2, In3>,
    c: Pipe<In3, In4>,
    d: Pipe<In4, In5>,
    e: Pipe<In5, In6>,
    f: Pipe<In6, In7>,
    g: Pipe<In7, In8>,
    h: Pipe<In8, In9>,
    i: Pipe<In9, In10>,
    j: Pipe<In10, Out, Final>,
): Pipeline<In, Out, Final>;
export function pipeline<T extends Pipeline>(...pipes: Pipe[]): T;
export function pipeline(...pipes: Pipe[]): Pipeline {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- checked.
    return new Pipeline(pipes);
}
