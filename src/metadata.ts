/**
 * 用于管理 {@link Symbol.metadata metadata} 的模块
 *
 * [proposal-decorator-metadata](https://github.com/tc39/proposal-decorator-metadata) 提案暂未普及和确定，该模块提供方法以更简单、更符合预期的方式访问元数据，推荐统一使用该模块访问元数据。
 *
 * 使用该模块相对直接读写元数据有以下优势：
 *
 * - 对于 [issue#15](https://github.com/tc39/proposal-decorator-metadata/issues/15)，该模块在访问前永远会先确保元数据具有继承链（不存在则创建）
 * - 提供明确的读取、写入本身或继承链元数据的方法
 *
 * @public
 *
 * @module
 *
 * @experimental
 */
// #export * as metadata from "!sub-modules"
// #region Generated exports
export * as metadata from "./_/_metadata$metadata.js";
// #endregion
