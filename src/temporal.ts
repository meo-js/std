/**
 * @public
 * @module
 */
// #export * as now from "./temporal/now.js"
// #export * from "!sub-modules"
// #region Generated exports
export * from './temporal/format.js';
export * as now from './temporal/now.js';
// #endregion

// FIXME: 当 Temporal 提案普及后转至 polyfill 中
export { Temporal } from 'temporal-polyfill';
