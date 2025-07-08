/**
 * 返回流式对象的属性
 */
export const stream = Symbol.for("stream");

/**
 * 返回自定义相等判定函数的属性
 */
export const equal = Symbol.for("equal");

/**
 * 复用对象时回调函数的属性
 */
export const reuse = Symbol.for("reuse");

/**
 * 回收对象时回调函数的属性
 */
export const recycle = Symbol.for("recycle");
