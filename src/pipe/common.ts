import { toIterable } from "../iterator.js";
import { Pipe, type IPipe, type Next } from "../pipe.js";
import { isArray } from "../predicate.js";

class Map<In, Out> implements IPipe<In, Out> {
    private index = 0;

    constructor(private callbackFn: (value: In, index: number) => Out) {}

    transform(input: In, next: Next<Out>): boolean {
        return next(this.callbackFn(input, this.index++));
    }

    flush(next: Next<Out>): void {
        this.index = 0;
    }

    catch(error: unknown): void {
        this.index = 0;
    }
}

class Drop<T> implements IPipe<T, T> {
    private count = 0;

    constructor(private limit: number) {}

    transform(input: T, next: Next<T>): boolean {
        if (this.count >= this.limit) {
            return next(input);
        } else {
            this.count++;
            return true;
        }
    }

    flush(next: Next<T>): void {
        this.count = 0;
    }

    catch(error: unknown): void {
        this.count = 0;
    }
}

class Every<T> implements IPipe<T, boolean, boolean> {
    private index = 0;
    private result = true;

    constructor(private predicate: (value: T, index: number) => boolean) {}

    transform(input: T, next: Next<boolean>): boolean {
        if (this.result) {
            if (!this.predicate(input, this.index++)) {
                this.result = false;
                next(false);
                return false;
            } else {
                return true;
            }
        } else {
            return false;
        }
    }

    flush(next: Next<boolean>): boolean {
        const result = this.result;
        this.reset();
        if (result) {
            next(true);
        }
        return result;
    }

    catch(error: unknown): void {
        this.reset();
    }

    reset() {
        this.index = 0;
        this.result = true;
    }
}

class Filter<T> implements IPipe<T, T> {
    private index = 0;

    constructor(private predicate: (value: T, index: number) => boolean) {}

    transform(input: T, next: Next<T>): boolean {
        if (this.predicate(input, this.index++)) {
            return next(input);
        } else {
            return true;
        }
    }

    flush(next: Next<T>): void {
        this.index = 0;
    }

    catch(error: unknown): void {
        this.index = 0;
    }
}

class Find<T> implements IPipe<T, T | undefined, T | undefined> {
    private index = 0;
    private found: T | undefined = undefined;
    private hasFound = false;

    constructor(private predicate: (value: T, index: number) => boolean) {}

    transform(input: T, next: Next<T | undefined>): boolean {
        if (!this.hasFound) {
            if (this.predicate(input, this.index++)) {
                this.found = input;
                this.hasFound = true;
                next(input);
                return false;
            } else {
                return true;
            }
        } else {
            return false;
        }
    }

    flush(next: Next<T | undefined>): T | undefined {
        const { hasFound, found } = this;
        this.reset();
        if (!hasFound) {
            next(undefined);
        }
        return found;
    }

    catch(error: unknown): void {
        this.reset();
    }

    reset() {
        this.index = 0;
        this.found = undefined;
        this.hasFound = false;
    }
}

class Enumerate<T> implements IPipe<Iterable<T>, [index: number, value: T]> {
    private index = 0;

    transform(
        input: Iterable<T>,
        next: Next<[index: number, value: T]>,
    ): boolean {
        for (const item of input) {
            if (!next([this.index++, item])) {
                return false;
            }
        }
        return true;
    }

    flush(next: Next<[index: number, value: T]>): void {
        this.index = 0;
    }

    catch(error: unknown): void {
        this.index = 0;
    }
}

class FlatMap<In, Out> implements IPipe<In, Out> {
    private index = 0;

    constructor(
        private callbackFn: (
            value: In,
            index: number,
        ) =>
            | Iterator<Out, unknown, undefined>
            | Iterable<Out, unknown, undefined>,
    ) {}

    transform(input: In, next: Next<Out>): boolean {
        const iter = toIterable(this.callbackFn(input, this.index++));
        for (const item of iter) {
            if (!next(item)) {
                return false;
            }
        }
        return true;
    }

    flush(next: Next<Out>): void {
        this.index = 0;
    }

    catch(error: unknown): void {
        this.index = 0;
    }
}

class ForEach<T> implements IPipe<T, never, void> {
    private index = 0;

    constructor(
        private callbackFn: (value: T, index: number) => void | boolean,
        private thisArg?: unknown,
    ) {}

    transform(input: T, next: Next<never>): boolean {
        const result = this.callbackFn.call(this.thisArg, input, this.index++);
        return result !== false;
    }

    flush(next: Next<never>): void {
        this.index = 0;
    }

    catch(error: unknown): void {
        this.index = 0;
    }
}

class Reduce<T, U> implements IPipe<T, T | U | undefined, T | U | undefined> {
    private index = 0;
    private accumulator: T | U | undefined;
    private hasInitialValue: boolean;
    private initialValue: U | undefined;
    private hasInitialValueFromConstructor: boolean;

    constructor(
        private callbackFn: (
            accumulator: T | U,
            currentValue: T,
            index: number,
        ) => T | U,
        initialValue?: U,
    ) {
        this.initialValue = initialValue;
        this.hasInitialValueFromConstructor = arguments.length > 1;
        this.accumulator = initialValue;
        this.hasInitialValue = this.hasInitialValueFromConstructor;
    }

    transform(input: T, next: Next<never>): void {
        if (!this.hasInitialValue) {
            this.accumulator = input;
            this.hasInitialValue = true;
        } else {
            this.accumulator = this.callbackFn(
                this.accumulator!,
                input,
                this.index,
            );
        }
        this.index++;
    }

    flush(next: Next<T | U | undefined>): T | U | undefined {
        const { accumulator, hasInitialValue } = this;
        this.reset();
        if (hasInitialValue) {
            next(accumulator);
        }
        return accumulator;
    }

    catch(error: unknown): void {
        this.reset();
    }

    reset() {
        this.index = 0;
        this.accumulator = this.initialValue;
        this.hasInitialValue = this.hasInitialValueFromConstructor;
    }
}

class Some<T> implements IPipe<T, boolean, boolean> {
    private index = 0;
    private result = false;

    constructor(private predicate: (value: T, index: number) => boolean) {}

    transform(input: T, next: Next<boolean>): boolean {
        if (!this.result) {
            if (this.predicate(input, this.index++)) {
                this.result = true;
                next(true);
                return false;
            } else {
                return true;
            }
        } else {
            return false;
        }
    }

    flush(next: Next<boolean>): boolean {
        const { result } = this;
        this.reset();
        if (!result) {
            next(false);
        }
        return result;
    }

    catch(error: unknown): void {
        this.reset();
    }

    reset() {
        this.index = 0;
        this.result = false;
    }
}

class Take<T> implements IPipe<T, T> {
    private count = 0;

    constructor(private limit: number) {}

    transform(input: T, next: Next<T>): boolean {
        const diff = this.limit - this.count;
        if (diff > 0) {
            this.count++;
            return diff <= 1 && next(input);
        } else {
            return false;
        }
    }

    flush(next: Next<T>): void {
        this.count = 0;
    }

    catch(error: unknown): void {
        this.count = 0;
    }
}

class ToArray<T> implements IPipe<T, T[], T[]> {
    private result: T[] = [];

    transform(input: T, next: Next<T[]>): void {
        this.result.push(input);
    }

    flush(next: Next<T[]>): T[] {
        const result = this.result;
        this.result = [];
        next(result);
        return result;
    }

    catch(error: unknown): void {
        this.result = [];
    }
}

class ToArrayWithOut<T> implements IPipe<T, T[], T[]> {
    private index = 0;

    constructor(private out: T[]) {}

    transform(input: T, next: Next<T[]>): void {
        this.out[this.index++] = input;
    }

    flush(next: Next<T[]>): T[] {
        const out = this.out;
        this.index = 0;
        next(out);
        return out;
    }

    catch(error: unknown): void {
        this.index = 0;
    }
}

class ToArrayWithCount<T>
    implements
        IPipe<
            T,
            { buffer: T[]; written: number },
            { buffer: T[]; written: number }
        >
{
    private index = 0;

    constructor(private out: T[]) {}

    transform(input: T, next: Next<{ buffer: T[]; written: number }>): void {
        this.out[this.index++] = input;
    }

    flush(next: Next<{ buffer: T[]; written: number }>): {
        buffer: T[];
        written: number;
    } {
        const { out, index } = this;
        const result = { buffer: out, written: index };
        this.index = 0;
        next(result);
        return result;
    }

    catch(error: unknown): void {
        this.index = 0;
    }
}

// TODO 必须要放在管链尽量前面，因为 index 的原因
class Caught<T> implements IPipe<T, T, void> {
    private index = 0;

    constructor(private catchFn: (error: unknown, index: number) => unknown) {}

    transform(input: T, next: Next<T>): boolean {
        this.index++;
        return next(input);
    }

    flush(next: Next<T>): void {
        this.index = 0;
    }

    catch(error: unknown): unknown {
        const index = this.index - 1;
        this.index = 0;
        return this.catchFn(error, index);
    }
}

const _flat: IPipe<Iterable<unknown>, unknown> = {
    transform(input, next) {
        for (const item of input) {
            if (!next(item)) {
                return false;
            }
        }
        return true;
    },
};

/**
 * 创建对每个值进行转换的管道
 */
export function map<In, Out>(
    callbackFn: (value: In, index: number) => Out,
): Pipe<In, Out> {
    return new Pipe(new Map(callbackFn));
}

/**
 * 创建跳过开头指定数量元素的管道
 */
export function drop<T>(limit: number): Pipe<T, T> {
    return new Pipe(new Drop(limit));
}

/**
 * 创建测试所有元素是否通过测试函数的管道
 */
export function every<T>(
    predicate: (value: T, index: number) => boolean,
): Pipe<T, boolean, boolean> {
    return new Pipe(new Every(predicate));
}

/**
 * 创建过滤元素的管道
 */
export function filter<T>(
    predicate: (value: T, index: number) => boolean,
): Pipe<T, T> {
    return new Pipe(new Filter(predicate));
}

/**
 * 创建查找第一个通过测试函数的元素的管道
 */
export function find<T>(
    predicate: (value: T, index: number) => boolean,
): Pipe<T, T | undefined, T | undefined> {
    return new Pipe(new Find(predicate));
}

/**
 * 创建将输入迭代器扁平化的管道
 */
export function flat<T>(): Pipe<Iterable<T>, T> {
    return new Pipe(_flat as IPipe<Iterable<T>, T>);
}

/**
 * 创建逐个传输输入迭代器值和索引的管道
 */
export function enumerate<T>(): Pipe<Iterable<T>, [index: number, value: T]> {
    return new Pipe(new Enumerate<T>());
}

/**
 * 创建映射并扁平化结果的管道
 */
export function flatMap<In, Out>(
    callbackFn: (value: In, index: number) => Iterable<Out>,
): Pipe<In, Out> {
    return new Pipe(new FlatMap(callbackFn));
}

/**
 * 创建对每个元素执行函数的管道
 */
export function forEach<T>(
    callbackFn: (value: T, index: number) => void | boolean,
    thisArg?: unknown,
): Pipe<T, never, void> {
    return new Pipe(new ForEach(callbackFn, thisArg));
}

/**
 * 创建归约操作的管道
 */
export function reduce<T>(
    callbackFn: (accumulator: T, currentValue: T, index: number) => T,
): Pipe<T, never, T | undefined>;
export function reduce<T, U>(
    callbackFn: (accumulator: U, currentValue: T, index: number) => U,
    initialValue: U,
): Pipe<T, never, U>;
export function reduce<T, U>(
    callbackFn: (accumulator: T | U, currentValue: T, index: number) => T | U,
    initialValue?: U,
): Pipe<T, T | U | undefined, T | U | undefined> {
    return new Pipe(new Reduce(callbackFn, initialValue));
}

/**
 * 创建测试是否至少有一个元素通过测试函数的管道
 */
export function some<T>(
    predicate: (value: T, index: number) => boolean,
): Pipe<T, boolean, boolean> {
    return new Pipe(new Some(predicate));
}

/**
 * 创建获取前指定数量元素的管道
 */
export function take<T>(limit: number): Pipe<T, T> {
    return new Pipe(new Take(limit));
}

/**
 * 创建将元素收集到 {@link Array} 的管道
 */
export function toArray<T>(out?: T[]): Pipe<T, T[], T[]> {
    if (isArray(out)) {
        return new Pipe(new ToArrayWithOut(out));
    } else {
        return new Pipe(new ToArray());
    }
}

/**
 * 创建将元素收集到 {@link Array} 的管道
 */
export function toArrayWithCount<T>(
    out: T[],
): Pipe<T, { buffer: T[]; written: number }, { buffer: T[]; written: number }> {
    return new Pipe(new ToArrayWithCount(out));
}

/**
 * 创建捕获和处理错误的管道
 *
 * @param catchFn 处理错误的回调函数，允许返回一个错误，该错误将代替传入的 `error` 被下一个管道捕获，管链中最后一个返回的错误会被抛出，返回 `undefined` 会当作无返回处理
 */
export function caught<T>(catchFn: (error: unknown, index: number) => unknown) {
    return new Pipe(new Caught<T>(catchFn));
}
