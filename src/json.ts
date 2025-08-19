/**
 * @public
 * @module
 */
import type * as tf from 'type-fest';

/**
 * 经过 Json 序列化后的类型
 */
export type Jsonify<T> = tf.Jsonify<T>;

/**
 * 能够进行 Json 序列化的类型
 */
export type Jsonifiable = tf.Jsonifiable;

/**
 * Json 对象
 */
export type JsonObject = tf.JsonObject;

/**
 * Json 数组
 */
export type JsonArray = tf.JsonArray;

/**
 * Json 键
 */
export type JsonKey = string;

/**
 * Json 值
 */
export type JsonValue = tf.JsonValue;

/**
 * Json 原始值
 */
export type JsonPrimitive = tf.JsonPrimitive;
