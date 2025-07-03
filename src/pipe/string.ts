/**
 * @public
 *
 * @module
 */
import { Pipe, type IPipe, type Next } from "../pipe.js";
import { isArray } from "../predicate.js";
import { needsSurrogatePair } from "../string.js";

const _flatCharCodes: IPipe<string, number> = {
    transform(input, next) {
        for (let i = 0; i < input.length; i++) {
            if (!next(input.charCodeAt(i))) {
                return false;
            }
        }
        return true;
    },
};

const _flatCodePoints: IPipe<string, number> = {
    transform(input, next) {
        const len = input.length;
        let i = 0;
        while (i < len) {
            const code = input.codePointAt(i)!;
            i += needsSurrogatePair(code) ? 2 : 1;
            if (!next(code)) {
                return false;
            }
        }
        return true;
    },
};

const _charCodeToString: IPipe<number, string> = {
    transform(input, next) {
        return next(String.fromCharCode(input));
    },
};

const _codePointToString: IPipe<number, string> = {
    transform(input, next) {
        return next(String.fromCodePoint(input));
    },
};

class EnumerateCharCodes
    implements IPipe<string, [index: number, value: number]>
{
    private index = 0;

    transform(
        input: string,
        next: Next<[index: number, value: number]>,
    ): boolean {
        for (let i = 0; i < input.length; i++) {
            if (!next([this.index++, input.charCodeAt(i)])) {
                return false;
            }
        }
        return true;
    }

    flush(next: Next<[index: number, value: number]>): void {
        this.index = 0;
    }

    catch(error: unknown): void {
        this.index = 0;
    }
}

class EnumerateCodePoints
    implements IPipe<string, [index: number, value: number]>
{
    private index = 0;

    transform(
        input: string,
        next: Next<[index: number, value: number]>,
    ): boolean {
        const len = input.length;
        let i = 0;
        while (i < len) {
            const code = input.codePointAt(i)!;
            i += needsSurrogatePair(code) ? 2 : 1;
            if (!next([this.index++, code])) {
                return false;
            }
        }
        return true;
    }

    flush(next: Next<[index: number, value: number]>): void {
        this.index = 0;
    }

    catch(error: unknown): void {
        this.index = 0;
    }
}

class ConcatString implements IPipe<string, string, string> {
    private strs: string[] = [];

    transform(input: string, next: Next<string>): boolean {
        this.strs.push(input);
        return true;
    }

    flush(next: Next<string>): string {
        const str = this.strs.join("");
        this.strs = [];
        next(str);
        return str;
    }

    catch(): void {
        this.strs = [];
    }
}

class ConcatStringWithOut implements IPipe<string, string, string> {
    private index = 0;

    constructor(private out: string[]) {}

    transform(input: string, next: Next<string>): boolean {
        this.out[this.index++] = input;
        return true;
    }

    flush(next: Next<string>): string {
        const str = this.out.join("");
        this.index = 0;
        next(str);
        return str;
    }

    catch(): void {
        this.index = 0;
    }
}

class JoinString implements IPipe<string[], string, string> {
    private str = "";

    constructor(private separator?: string) {}

    transform(input: string[], next: Next<string>): void {
        this.str += input.join(this.separator);
    }

    flush(next: Next<string>): string {
        const str = this.str;
        this.str = "";
        next(str);
        return str;
    }

    catch(): void {
        this.str = "";
    }
}

/**
 * 创建将字符串的字符逐个转换为 UTF-16 编码单元值的管道
 */
export function flatCharCodes() {
    return new Pipe(_flatCharCodes);
}

/**
 * 创建将字符串的字符逐个转换为 Unicode 码点值的管道
 */
export function flatCodePoints() {
    return new Pipe(_flatCodePoints);
}

/**
 * 创建将字符串的字符逐个转换为带索引的 UTF-16 编码单元值的管道
 */
export function enumerateCharCodes() {
    return new Pipe(new EnumerateCharCodes());
}

/**
 * 创建将字符串的字符逐个转换为带索引的 Unicode 码点值的管道
 */
export function enumerateCodePoints() {
    return new Pipe(new EnumerateCodePoints());
}

/**
 * 创建将UTF-16 编码单元值转换为字符串的管道
 */
export function charCodeToString() {
    return new Pipe(_charCodeToString);
}

/**
 * 创建将 Unicode 码点值转换为字符串的管道
 */
export function codePointToString() {
    return new Pipe(_codePointToString);
}

/**
 * 创建将每个字符串连接为一个字符串的管道
 */
export function concatString(out?: string[]): Pipe<string, string, string> {
    if (isArray(out)) {
        return new Pipe(new ConcatStringWithOut(out));
    } else {
        return new Pipe(new ConcatString());
    }
}

/**
 * 创建将每个数组连接成字符串的管道
 */
export function joinString(separator?: string) {
    return new Pipe(new JoinString(separator));
}
