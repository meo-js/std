/**
 * 返回流式对象的属性
 */
export const stream = Symbol.for("@meojs/stream");

/**
 * 返回自定义相等判定函数的属性
 */
export const equal = Symbol.for("@meojs/equal");

/**
 * 复用对象时回调函数的属性
 */
export const reuse = Symbol.for("@meojs/reuse");

/**
 * 回收对象时回调函数的属性
 */
export const recycle = Symbol.for("@meojs/recycle");
