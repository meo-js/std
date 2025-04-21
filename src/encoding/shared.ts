import type { Endian } from "../utils/typed-array.js";

/**
 * 支持编解码的字节序
 */
export type CodecableEndian = Endian.Little | Endian.Big;
