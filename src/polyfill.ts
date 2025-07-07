/**
 * 对一些特定的 JavaScript 特性进行 polyfill
 *
 * 这些特性都是我们认为应立即开始使用但当前还未被普遍支持的。
 *
 * @public
 *
 * @module
 */
// --- ECMAScript 2020 ---
import "core-js/proposals/global-this.js";
import "core-js/proposals/promise-all-settled.js";
import "core-js/proposals/string-match-all.js";
// --- ECMAScript 2021 ---
import "core-js/proposals/promise-any.js";
import "core-js/proposals/string-replace-all-stage-4.js";
// --- ECMAScript 2022 ---
import "core-js/proposals/accessible-object-hasownproperty.js";
import "core-js/proposals/error-cause.js";
import "core-js/proposals/relative-indexing-method.js";
// --- ECMAScript 2023 ---
import "core-js/proposals/array-find-from-last.js";
import "core-js/proposals/change-array-by-copy-stage-4.js";
// --- ECMAScript 2024 ---
import "core-js/proposals/array-grouping-v2.js";
import "core-js/proposals/promise-with-resolvers.js";
import "core-js/proposals/well-formed-unicode-strings.js";
// --- ECMAScript 2025 ---
import "core-js/proposals/iterator-helpers-stage-3-2.js";
import "core-js/proposals/promise-try.js";
import "core-js/proposals/regexp-escaping.js";
import "core-js/proposals/set-methods-v2.js";
declare global {
    interface RegExpConstructor {
        escape(str: string): string;
    }
}
// --- ECMAScript Next ---
import "core-js/proposals/decorator-metadata-v2.js";
import "core-js/proposals/explicit-resource-management.js";
// --- Web API ---
import "core-js/web/queue-microtask.js";
import "core-js/web/structured-clone.js";
import "./polyfill/observable.js";
import "./polyfill/web-streams.js";
export * from "./polyfill/observable.js";
// TODO web streams polyfill needs abortcontroller polyfill
// but https://www.npmjs.com/package/abort-controller is not lastest version
