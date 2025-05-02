/**
 * 对一些特定的 JavaScript 特性进行 polyfill，这些特性是我们认为应立即广泛开始使用但是当前运行环境未普遍支持的。
 *
 * @public
 *
 * @module
 */
// Promise.withResolvers() not widely popular
import "core-js/proposals/promise-with-resolvers.js";
// at() not widely popular
import "core-js/proposals/relative-indexing-method.js";
// error.cause not widely popular
import "core-js/proposals/error-cause.js";
// using/dispose not widely popular
import "core-js/proposals/explicit-resource-management.js";
// hasOwn() not widely popular
import "core-js/proposals/accessible-object-hasownproperty.js";
// decorator metadata not widely popular
import "core-js/proposals/decorator-metadata-v2.js";
// Promise.try() not widely popular
import "core-js/proposals/promise-try.js";
// queueMicrotask() not widely popular
if (typeof globalThis.queueMicrotask !== "function") {
    globalThis.queueMicrotask = function (callback) {
        setTimeout(callback);
    };
}
// Promise.withResolvers() not widely popular
import "core-js/proposals/promise-with-resolvers.js";
