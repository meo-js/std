import type { uncertain } from "../ts.js";
import type { recycle, reuse } from "./symbols.js";

/**
 * 支持对象池复用的接口
 */
export interface Poolable<out T extends readonly unknown[] = uncertain> {
    /**
     * 复用对象时回调该接口
     */
    [reuse]?(...args: T): void;

    /**
     * 回收该对象时回调该接口
     */
    [recycle]?(): void;
}
