/**
 * 对一些特定的 JavaScript 特性进行 polyfill，这些特性是我们认为应立即广泛开始使用但是当前运行环境未普遍支持的。
 *
 * @public
 *
 * @module
 */

// Promise.withResolvers() is need Node.js
import "core-js/proposals/promise-with-resolvers.js";
