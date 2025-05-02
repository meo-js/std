/**
 * @public
 *
 * @module
 */
import type * as tf from "type-fest";

/**
 * 经过 JSON 序列化后的类型
 */
export type Jsonify<T> = tf.Jsonify<T>;

/**
 * 能够进行 JSON 序列化的类型
 */
export type Jsonifiable = tf.Jsonifiable;

/**
 * JSON 对象
 */
export type JsonObject = tf.JsonObject;

/**
 *  JSON 数组
 */
export type JsonArray = tf.JsonArray;

/**
 * JSON 键
 */
export type JsonKey = string;

/**
 * JSON 值
 */
export type JsonValue = tf.JsonValue;

/**
 * JSON 原始值
 */
export type JsonPrimitive = tf.JsonPrimitive;
