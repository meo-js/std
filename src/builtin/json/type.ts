import type * as tf from "type-fest";

/**
 * 将类型转换为允许进行 JSON 序列化的类型
 */
export type Jsonify<T> = tf.Jsonify<T>;

/**
 * 允许进行 JSON 序列化的任何类型
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
