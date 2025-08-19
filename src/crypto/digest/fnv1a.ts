import { utf8 } from '../../encoding/text.js';
import { HAS_BIGINT } from '../../env.js';
import { assertBigIntSupported } from '../../internal/error.js';
import { Pipe, type IPipe, type Next } from '../../pipe.js';
import { isString } from '../../predicate.js';
import type { checked } from '../../ts.js';
import { asUint8Array, type AnyBufferSource } from '../../typed-array.js';

const FNV_PRIMES32 = 16777619;
const FNV_PRIMES = HAS_BIGINT
  ? {
      64: BigInt('1099511628211'),
      128: BigInt('309485009821345068724781371'),
      256: BigInt('374144419156711147060143317175368453031918731002211'),
      512: BigInt(
        '35835915874844867368919076489095108449946327955754392558399825615420669938882575126094039892345713852759',
      ),
      1024: BigInt(
        '5016456510113118655434598811035278955030765345404790744303017523831112055108147451509157692220295382716162651878526895249385292291816524375083746691371804094271873160484737966720260389217684476157468082573',
      ),
    }
  : undefined!;

const FNV_OFFSETS32 = 2166136261;
const FNV_OFFSETS = HAS_BIGINT
  ? {
      64: BigInt('14695981039346656037'),
      128: BigInt('144066263297769815596495629667062367629'),
      256: BigInt(
        '100029257958052580907070968620625704837092796014241193945225284501741471925557',
      ),
      512: BigInt(
        '965930312949666949800943540071631046609041874567263789610837432943443462657994582932197716438449813051892206539805784495328239340083876191928701583869517785',
      ),
      1024: BigInt(
        '141977950649476210687220706414032183208806227954419339608784749146178474914617582723252296732303717722150864096521202355549365628174669108571814760471015076148029755969804077320157692458563003215304957150157403644460363550505412711285966361610267868082893823963790439336411086884584107735010676915',
      ),
    }
  : undefined!;

/**
 * FNV-1a 非加密哈希函数
 *
 * @param input 字符串或字节数据，若传入字符串将使用 {@link utf8.encode} 以默认选项编码为 UTF-8 字节数据后计算哈希
 * @param size 指定哈希大小，默认为 `32`
 * @returns 若 {@link size} 为 `32`，则返回 32 位整数，否则返回相应位数的 `bigint`。
 */
export function fnv1a<T extends 32 | 64 | 128 | 256 | 512 | 1024>(
  input: string | AnyBufferSource,
  size: T = 32 as T,
): T extends 32 ? number : bigint {
  const data = isString(input) ? utf8.encode(input) : asUint8Array(input);
  const len = data.length;

  if (size === 32) {
    let hash = FNV_OFFSETS32;
    for (let i = 0; i < len; i++) {
      hash ^= data[i];
      hash = Math.imul(hash, FNV_PRIMES32);
    }
    return (hash >>> 0) as checked;
  } else {
    assertBigIntSupported('fnv1a() with size > 32');

    const fnvPrime = FNV_PRIMES[size as 64];
    let hash = FNV_OFFSETS[size as 64];

    for (let i = 0; i < len; i++) {
      hash ^= BigInt(data[i]);
      hash = BigInt.asUintN(size, hash * fnvPrime);
    }

    return hash as checked;
  }
}

/**
 * 创建一个计算 FNV-1a 哈希的管道
 *
 * @param size 指定哈希大小，默认为 `32`
 * @returns 返回 FNV-1a 哈希管道
 *
 * @see {@link fnv1a}
 */
export function fnv1aPipe<T extends 32 | 64 | 128 | 256 | 512 | 1024>(
  size?: T,
): T extends 32 ? Pipe<number, number, number> : Pipe<number, bigint, bigint> {
  if (size === undefined || size === 32) {
    return Pipe.create(new Fnv1a32Pipe()) as checked;
  } else {
    return Pipe.create(new Fnv1aBigIntPipe(size as 64)) as checked;
  }
}

/**
 * FNV-1a 32位哈希管道实现
 */
class Fnv1a32Pipe implements IPipe<number, number, number> {
  private hash!: number;

  constructor() {
    this.reset();
  }

  transform(input: number, next: Next<number>): boolean {
    this.hash ^= input;
    this.hash = Math.imul(this.hash, FNV_PRIMES32);
    return true;
  }

  flush(next: Next<number>): number {
    const result = this.hash >>> 0;

    this.reset();
    next(result);
    return result;
  }

  catch(error: unknown): void {
    this.reset();
  }

  reset() {
    this.hash = FNV_OFFSETS32;
  }
}

/**
 * FNV-1a BigInt哈希管道实现
 */
class Fnv1aBigIntPipe implements IPipe<number, bigint, bigint> {
  private hash!: bigint;
  private fnvPrime: bigint;
  private size: 64 | 128 | 256 | 512 | 1024;

  constructor(size: 64 | 128 | 256 | 512 | 1024) {
    assertBigIntSupported('fnv1aPipe() with size > 32');
    this.size = size;
    this.fnvPrime = FNV_PRIMES[size];
    this.reset();
  }

  transform(input: number, next: Next<bigint>): boolean {
    this.hash ^= BigInt(input);
    this.hash = BigInt.asUintN(this.size, this.hash * this.fnvPrime);
    return true;
  }

  flush(next: Next<bigint>): bigint {
    const result = this.hash;

    this.reset();
    next(result);
    return result;
  }

  catch(error: unknown): void {
    this.reset();
  }

  reset() {
    this.hash = FNV_OFFSETS[this.size];
  }
}
