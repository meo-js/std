/**
 * @public
 * @module
 */
/* eslint-disable prefer-regex-literals -- If a regular expression literal that is not supported by the environment is used, it will directly cause a compilation error and the exception cannot be caught. */
import { Endian } from './typed-array.js';

/**
 * 最大调用栈大小
 */
export const MAX_CALLSTACK = 1024 * 4;

/**
 * 平台字节序
 */
export const PLATFORM_ENDIAN: Endian = (function () {
  if (typeof Uint32Array === 'function' && typeof Uint8Array === 'function') {
    const uInt32 = new Uint32Array([0x11223344]);
    const uInt8 = new Uint8Array(uInt32.buffer);
    if (uInt8[0] === 0x44) {
      return Endian.Little;
    } else if (uInt8[0] === 0x11) {
      return Endian.Big;
    }
  }
  return Endian.Platform;
})();

/**
 * 当前环境支持的 Unicode 版本
 *
 * 反映了 [正则表达式 Unicode 属性](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape) 的支持程度。
 *
 * - -1 不支持
 * - 0 基础支持
 */
export const UNICODE_VERSION: -1 | 0 | 11 | 12 | 13 | 14 | 15 | 16 =
  (function () {
    // unicode 16
    try {
      if (
        new RegExp('\\p{Script=Todhri}', 'u').test('\u{105c0}')
        && new RegExp('\\p{Emoji}', 'u').test('🫩')
      ) {
        return 16;
      }
    } catch {
      // do nothings.
    }

    // unicode 15 & 15.1
    try {
      if (
        // eslint-disable-next-line n/no-unsupported-features/es-syntax -- checked.
        new RegExp('\\p{Script=Kawi}', 'u').test('\u{11f00}')
        && new RegExp('\\p{Unified_Ideograph}', 'u').test('\u{2ebf0}')
        && new RegExp('\\p{Emoji}', 'u').test('🫨')
      ) {
        return 15;
      }
    } catch {
      // do nothings.
    }

    // unicode 14
    try {
      if (
        new RegExp('\\p{Script=Vithkuqi}', 'u').test('\u{10570}')
        && new RegExp('\\p{Emoji}', 'u').test('🫠')
      ) {
        return 14;
      }
    } catch {
      // do nothings.
    }

    // unicode 13
    try {
      if (
        new RegExp('\\p{Script=Chorasmian}', 'u').test('\u{10fb0}')
        && new RegExp('\\p{Emoji}', 'u').test('🥲')
      ) {
        return 13;
      }
    } catch {
      // do nothings.
    }

    // unicode 12 & 12.1
    try {
      if (
        new RegExp('\\p{Script=Elymaic}', 'u').test('\u{10fe0}')
        && new RegExp('\\p{Other_Symbol}', 'u').test('\u32FF')
        && new RegExp('\\p{Emoji}', 'u').test('🥱')
      ) {
        return 12;
      }
    } catch {
      // do nothings.
    }

    // unicode 11
    try {
      if (
        new RegExp('\\p{Extended_Pictographic}', 'u').test('\xA9')
        && new RegExp('\\p{Emoji}', 'u').test('🥰')
      ) {
        return 11;
      }
    } catch {
      // do nothings.
    }

    // basic
    try {
      const greek = new RegExp('\\p{Script=Greek}', 'u');
      const letter = new RegExp('\\p{L}', 'u');
      if (greek.test('π') && letter.test('好')) {
        return 0;
      }
    } catch {
      // do nothings.
    }

    return -1;
  })();

/**
 * 当前环境是否支持 {@link SharedArrayBuffer}
 */
// by ECMAScript 2017
export const HAS_SHARED_ARRAYBUFFER = typeof SharedArrayBuffer === 'function';

/**
 * 当前环境是否支持 {@link Atomics}
 */
// by ECMAScript 2017
export const HAS_ATOMICS = typeof Atomics === 'object';

/**
 * 当前环境是否支持完善的[正则表达式 Unicode 属性](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape)
 */
// by ECMAScript 2018
export const HAS_REGEXP_UNICODE_PROPERTY = UNICODE_VERSION >= 0;

/**
 * 当前环境是否支持 {@link BigInt}
 */
// by ECMAScript 2020
export const HAS_BIGINT = typeof BigInt === 'function';

/**
 * 当前环境是否支持 {@link WeakRef}
 */
// by ECMAScript 2021
export const HAS_WEAKREF = typeof WeakRef === 'function';

/**
 * 当前环境是否支持[正则表达式 `d` 标志](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/hasIndices)
 */
// by ECMAScript 2022
export const HAS_REGEXP_D_FLAG = (function () {
  try {
    return new RegExp('a', 'du').hasIndices;
  } catch {
    return false;
  }
})();

/**
 * 当前环境是否支持将 {@link Symbol} 作为 {@link WeakMap} 的键
 */
// by ECMAScript 2023
export const HAS_SYMBOL_AS_WEAKKEY = (function () {
  try {
    const map = new WeakMap();
    const key = Symbol();
    map.set(key, 1);
    return map.get(key) === 1;
  } catch {
    return false;
  }
})();

/**
 * 当前环境是否支持[正则表达式 `v` 标志](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicodeSets)
 */
// by ECMAScript 2024
export const HAS_REGEXP_V_FLAG = (function () {
  try {
    return new RegExp('[\\p{Lowercase}&&\\p{Script=Greek}]', 'v').unicodeSets;
  } catch {
    return false;
  }
})();

/**
 * 当前环境是否支持 {@link ArrayBuffer.transfer}
 */
// by ECMAScript 2024
export const HAS_ARRAYBUFFER_TRANSFER =
  typeof ArrayBuffer.prototype.transfer === 'function';

/**
 * 当前环境是否支持 {@link ArrayBuffer.resize}
 */
// by ECMAScript 2024
export const HAS_RESIZABLE_ARRAYBUFFER =
  typeof ArrayBuffer.prototype.resize === 'function';

/**
 * 当前环境是否支持 {@link Atomics.waitAsync}
 */
// by ECMAScript 2024
export const HAS_ATOMICS_WAIT_ASYNC =
  HAS_ATOMICS && typeof Atomics.waitAsync === 'function';

/**
 * 当前环境是否支持[正则表达式内联修饰符](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Modifier)
 */
// by ECMAScript 2025
export const HAS_REGEXP_MODIFIERS = (function () {
  try {
    return new RegExp('(?i:Hello) world', 'u').test('hello world');
  } catch {
    return false;
  }
})();

/**
 * 当前环境是否支持[正则表达式重复命名组](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Named_capturing_group)
 */
// by ECMAScript 2025
export const HAS_REGEXP_DUPLICATE_NAMED_GROUPS = (function () {
  try {
    return new RegExp(
      '(?<year>\\d{4})-\\d{2}|\\d{2}-(?<year>\\d{4})',
      'u',
    ).test('05-2025');
  } catch {
    return false;
  }
})();

/**
 * 当前环境是否有对 `float16` 类型的完善支持
 */
// by ECMAScript 2025
export const HAS_FLOAT16 =
  typeof Float16Array === 'function'
  && typeof DataView.prototype.getFloat16 === 'function'
  && typeof Math.f16round === 'function';
