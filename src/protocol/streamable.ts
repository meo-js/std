import type { stream } from "./symbols.js";

/**
 * 流类型
 */
export enum StreamType {
    /**
     * 可读流 {@link ReadableStream}
     */
    Read,

    /**
     * 可写流 {@link WritableStream}
     */
    Write,

    /**
     * 转换流 {@link TransformStream}
     */
    Transform,
}

/**
 * 获取流式对象的选项
 */
export interface StreamableOptions {
    /**
     * 流的队列策略
     *
     * 当传入的是 {@link StreamType.Transform} 类型流时请使用 {@link readableStrategy} 和 {@link writableStrategy} 选项。
     */
    strategy?: QueuingStrategy;

    /**
     * 转换流读方向的队列策略
     *
     * 当传入的不是 {@link StreamType.Transform} 类型流时请使用 {@link strategy} 选项。
     */
    readableStrategy?: QueuingStrategy;

    /**
     * 转换流写方向的队列策略
     *
     * 当传入的不是 {@link StreamType.Transform} 类型流时请使用 {@link strategy} 选项。
     */
    writableStrategy?: QueuingStrategy;
}

/**
 * 支持流式操作所实现的接口
 */
export interface Streamable<out I = unknown, out O = I> {
    /**
     * 返回流式对象
     */
    [stream](
        type: StreamType,
        opts?: StreamableOptions,
    ): ReadableStream<O> | WritableStream<I> | TransformStream<I, O>;
}
