/**
 * @public
 *
 * @module
 */
import { isFunction } from "./predicate.js";
import type { checked, Covariant, uncertain } from "./ts.js";

// #export * from "!sub-modules"
// #region Generated exports
export * from "./pipe/common.js";
// #endregion

// TODO 文档中提醒：
// 当前 catch 会在错误被抛出时调用，但如果上游管道 try catch 错误不抛出，下游管道抛出错误，中间管道直接躺枪，无法重置状态
// 下游抛出的错误在不清楚的情况下，上游必须继续抛出，否则可能导致管道处于错误的状态
// 每个管道应注明发生错误后是否可以被上游管道 catch 然后继续使用，还是无法 catch
// - 若 next 返回 false，即使是 flush 也不应该再返回数据
const noop = () => true;

/**
 * 管道接口
 */
export interface IPipe<In = uncertain, Out = unknown, Final = void> {
    /**
     * 该函数在值输入管道时回调，可用于处理和转换值
     *
     * @param input 输入值
     * @param next 调用该函数将值传输到下一个管道，可调用任意次数
     * @returns 返回一个布尔值，用于指示上游管道是否应继续传输值
     */
    transform(input: In, next: Next<Out>): void | boolean;

    /**
     * 该函数在管道刷新时回调，可用于清理状态
     *
     * @param next 调用该函数将值传输到下一个管道，可调用任意次数
     * @returns 返回一个值，仅自身是管链中最后一个管道时，返回的值才会作为最终输出，返回 `undefined` 会当作无返回处理
     */
    flush?(next: Next<Out>): Final;

    /**
     * 该函数在管道发生错误时回调，用于转换错误和清理状态
     *
     * @param error 错误
     * @returns 允许返回一个错误，该错误将代替传入的 `error` 被下一个管道捕获，管链中最后一个返回的错误会被抛出，返回 `undefined` 会当作无返回处理
     */
    catch?(error: unknown): unknown;
}

/**
 * 无状态管道函数
 */
export type ISimplePipe<In = uncertain, Out = unknown> = (
    input: In,
    next: Next<Out>,
) => void | boolean;

/**
 * 类管道类型
 */
export type PipeLike<In = uncertain, Out = unknown, Final = void> =
    | IPipe<In, Out, Final>
    | ISimplePipe<In, Out>
    | Pipe<In, Out, Final>;

/**
 * 用于将值传递给下一个管道的函数
 *
 * @returns 返回一个布尔值，用于指示是否应继续传输值
 */
export type Next<Out> = (output: Out) => boolean;

/**
 * 管道
 */
export class Pipe<In = uncertain, Out = unknown, Final = void> {
    /**
     * 传入值与管道并立即执行
     */
    static run<In, Out, Final = void>(
        input: In,
        a: PipeLike<In, Out, Final>,
    ): NoInfer<Final>;
    static run<In, In2, Out, Final = void>(
        input: In,
        a: PipeLike<In, In2>,
        b: PipeLike<In2, Out, Final>,
    ): NoInfer<Final>;
    static run<In, In2, In3, Out, Final = void>(
        input: In,
        a: PipeLike<In, In2>,
        b: PipeLike<In2, In3>,
        c: PipeLike<In3, Out, Final>,
    ): NoInfer<Final>;
    static run<In, In2, In3, In4, Out, Final = void>(
        input: In,
        a: PipeLike<In, In2>,
        b: PipeLike<In2, In3>,
        c: PipeLike<In3, In4>,
        d: PipeLike<In4, Out, Final>,
    ): NoInfer<Final>;
    static run<In, In2, In3, In4, In5, Out, Final = void>(
        input: In,
        a: PipeLike<In, In2>,
        b: PipeLike<In2, In3>,
        c: PipeLike<In3, In4>,
        d: PipeLike<In4, In5>,
        e: PipeLike<In5, Out, Final>,
    ): NoInfer<Final>;
    static run<In, In2, In3, In4, In5, In6, Out, Final = void>(
        input: In,
        a: PipeLike<In, In2>,
        b: PipeLike<In2, In3>,
        c: PipeLike<In3, In4>,
        d: PipeLike<In4, In5>,
        e: PipeLike<In5, In6>,
        f: PipeLike<In6, Out, Final>,
    ): NoInfer<Final>;
    static run<In, In2, In3, In4, In5, In6, In7, Out, Final = void>(
        input: In,
        a: PipeLike<In, In2>,
        b: PipeLike<In2, In3>,
        c: PipeLike<In3, In4>,
        d: PipeLike<In4, In5>,
        e: PipeLike<In5, In6>,
        f: PipeLike<In6, In7>,
        g: PipeLike<In7, Out, Final>,
    ): NoInfer<Final>;
    static run<In, In2, In3, In4, In5, In6, In7, In8, Out, Final = void>(
        input: In,
        a: PipeLike<In, In2>,
        b: PipeLike<In2, In3>,
        c: PipeLike<In3, In4>,
        d: PipeLike<In4, In5>,
        e: PipeLike<In5, In6>,
        f: PipeLike<In6, In7>,
        g: PipeLike<In7, In8>,
        h: PipeLike<In8, Out, Final>,
    ): NoInfer<Final>;
    static run<In, In2, In3, In4, In5, In6, In7, In8, In9, Out, Final = void>(
        input: In,
        a: PipeLike<In, In2>,
        b: PipeLike<In2, In3>,
        c: PipeLike<In3, In4>,
        d: PipeLike<In4, In5>,
        e: PipeLike<In5, In6>,
        f: PipeLike<In6, In7>,
        g: PipeLike<In7, In8>,
        h: PipeLike<In8, In9>,
        i: PipeLike<In9, Out, Final>,
    ): NoInfer<Final>;
    static run<
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
        Final = void,
    >(
        input: In,
        a: PipeLike<In, In2>,
        b: PipeLike<In2, In3>,
        c: PipeLike<In3, In4>,
        d: PipeLike<In4, In5>,
        e: PipeLike<In5, In6>,
        f: PipeLike<In6, In7>,
        g: PipeLike<In7, In8>,
        h: PipeLike<In8, In9>,
        i: PipeLike<In9, In10>,
        j: PipeLike<In10, Out, Final>,
    ): NoInfer<Final>;
    static run(input: unknown, root: PipeLike, ...pipes: PipeLike[]): unknown;
    static run(input: unknown, root: PipeLike, ...pipes: PipeLike[]): unknown {
        const pipe = this.chain(root, ...pipes);
        pipe.push(input);
        return pipe.flush();
    }

    /**
     * 传入值与管道并立即执行
     */
    static chain<In, Out, Final = void>(
        a: PipeLike<In, Out, Final>,
    ): NoInfer<Final>;
    static chain<In, In2, Out, Final = void>(
        a: PipeLike<In, In2>,
        b: PipeLike<In2, Out, Final>,
    ): NoInfer<Final>;
    static chain<In, In2, In3, Out, Final = void>(
        a: PipeLike<In, In2>,
        b: PipeLike<In2, In3>,
        c: PipeLike<In3, Out, Final>,
    ): NoInfer<Final>;
    static chain<In, In2, In3, In4, Out, Final = void>(
        a: PipeLike<In, In2>,
        b: PipeLike<In2, In3>,
        c: PipeLike<In3, In4>,
        d: PipeLike<In4, Out, Final>,
    ): NoInfer<Final>;
    static chain<In, In2, In3, In4, In5, Out, Final = void>(
        a: PipeLike<In, In2>,
        b: PipeLike<In2, In3>,
        c: PipeLike<In3, In4>,
        d: PipeLike<In4, In5>,
        e: PipeLike<In5, Out, Final>,
    ): NoInfer<Final>;
    static chain<In, In2, In3, In4, In5, In6, Out, Final = void>(
        a: PipeLike<In, In2>,
        b: PipeLike<In2, In3>,
        c: PipeLike<In3, In4>,
        d: PipeLike<In4, In5>,
        e: PipeLike<In5, In6>,
        f: PipeLike<In6, Out, Final>,
    ): NoInfer<Final>;
    static chain<In, In2, In3, In4, In5, In6, In7, Out, Final = void>(
        a: PipeLike<In, In2>,
        b: PipeLike<In2, In3>,
        c: PipeLike<In3, In4>,
        d: PipeLike<In4, In5>,
        e: PipeLike<In5, In6>,
        f: PipeLike<In6, In7>,
        g: PipeLike<In7, Out, Final>,
    ): NoInfer<Final>;
    static chain<In, In2, In3, In4, In5, In6, In7, In8, Out, Final = void>(
        a: PipeLike<In, In2>,
        b: PipeLike<In2, In3>,
        c: PipeLike<In3, In4>,
        d: PipeLike<In4, In5>,
        e: PipeLike<In5, In6>,
        f: PipeLike<In6, In7>,
        g: PipeLike<In7, In8>,
        h: PipeLike<In8, Out, Final>,
    ): NoInfer<Final>;
    static chain<In, In2, In3, In4, In5, In6, In7, In8, In9, Out, Final = void>(
        a: PipeLike<In, In2>,
        b: PipeLike<In2, In3>,
        c: PipeLike<In3, In4>,
        d: PipeLike<In4, In5>,
        e: PipeLike<In5, In6>,
        f: PipeLike<In6, In7>,
        g: PipeLike<In7, In8>,
        h: PipeLike<In8, In9>,
        i: PipeLike<In9, Out, Final>,
    ): NoInfer<Final>;
    static chain<
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
        Final = void,
    >(
        a: PipeLike<In, In2>,
        b: PipeLike<In2, In3>,
        c: PipeLike<In3, In4>,
        d: PipeLike<In4, In5>,
        e: PipeLike<In5, In6>,
        f: PipeLike<In6, In7>,
        g: PipeLike<In7, In8>,
        h: PipeLike<In8, In9>,
        i: PipeLike<In9, In10>,
        j: PipeLike<In10, Out, Final>,
    ): NoInfer<Final>;
    static chain(
        first: PipeLike,
        ...pipes: PipeLike[]
    ): Pipe<uncertain, unknown, unknown>;
    static chain(first: PipeLike, ...pipes: PipeLike[]): Pipe {
        const root = pipe(first);
        let prev = root;
        for (const __pipe of pipes) {
            const _pipe = pipe(__pipe);
            prev._pipe(_pipe);
            prev = _pipe;
        }
        return root;
    }

    private nextPipe: Pipe<Out, uncertain> | null = null;
    private next: Covariant<Next<Out>> = noop;
    private selfPush: Next<In> = this._push.bind(this);

    constructor(private handler: IPipe<In, Out, Final>) {}

    private _pipe<NewOut, NewFinal>(
        to: Pipe<Out, NewOut, NewFinal>,
    ): Pipe<In, NewOut, NewFinal> {
        if (this.nextPipe) {
            this.nextPipe._pipe(to);
        } else {
            const next = (this.nextPipe = to);
            this.next = next.selfPush;
        }
        return this as checked;
    }

    /**
     * 将下一个管道连接到当前管链尾部
     *
     * @returns 返回当前管道实例，但类型被更新为新类型
     */
    pipe<NewOut, NewFinal>(
        to: PipeLike<Out, NewOut, NewFinal>,
    ): Pipe<In, NewOut, NewFinal> {
        return this._pipe(pipe(to));
    }

    /**
     * 传输值到管道中进行处理
     *
     * @returns 返回一个布尔值，是下游管道发出是否应继续传输值的指示
     */
    push(value: In) {
        try {
            return this._push(value);
        } catch (error) {
            throw this._error(error);
        }
    }

    private _push(value: In) {
        return !(this.handler.transform(value, this.next) === false);
    }

    /**
     * 抛出错误到管道中，就像管道内部执行中发生了错误一样
     */
    throw(error: unknown): unknown {
        return this._error(error);
    }

    private _error(error: unknown, errors?: unknown[]): unknown {
        const root = !errors;
        errors ??= [];

        const { handler, nextPipe } = this;

        if (handler.catch) {
            try {
                const _error = handler.catch(error);
                if (_error !== undefined) {
                    error = _error;
                }
            } catch (err) {
                errors.push(err);
            }
        }

        error = nextPipe?._error(error, errors);

        if (root) {
            if (errors.length > 0) {
                errors.push(error);
                return new AggregateError(
                    errors,
                    "some errors occurred in the pipeline.",
                );
            } else {
                return error;
            }
        } else {
            return error;
        }
    }

    /**
     * 传输多个值到管道中进行处理
     *
     * 若下游管道返回不应再传输值的指示，那么会停止传输
     *
     * @returns 返回一个布尔值，是下游管道发出是否应继续传输值的指示
     */
    pushMany(values: Iterable<In>) {
        try {
            for (const value of values) {
                if (!this._push(value)) {
                    return false;
                }
            }
            return true;
        } catch (error) {
            throw this._error(error);
        }
    }

    /**
     * 刷新管线并获取最终输出结果
     */
    flush(): Final {
        try {
            return this._flush();
        } catch (error) {
            throw this._error(error);
        }
    }

    private _flush(): Final {
        let output = this.handler.flush?.(this.next) as Final;
        output = this.nextPipe?._flush() as Final;
        return output;
    }
}

/**
 * 创建一个管道
 */
export function pipe<In = uncertain, Out = unknown, Final = void>(
    pipe: PipeLike<In, Out, Final>,
): Pipe<In, Out, Final> {
    return pipe instanceof Pipe
        ? pipe
        : new Pipe(
              isFunction(pipe)
                  ? {
                        transform: pipe,
                    }
                  : pipe,
          );
}
