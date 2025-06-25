/**
 * @public
 *
 * @module
 */
import { Pipe, pipe, type IPipe, type Next } from "../pipe.js";
import { isArray, isFunction } from "../predicate.js";
import { needsSurrogatePair } from "../string.js";

const _flatToCharCode = pipe<string, number>((input, next) => {
    for (let i = 0; i < input.length; i++) {
        if (!next(input.charCodeAt(i))) {
            return false;
        }
    }
    return true;
});

const _flatToCodePoint = pipe<string, number>((input, next) => {
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
});

const _charCodeToString = pipe<number, string>((input, next) => {
    return next(String.fromCharCode(input));
});

const _codePointToString = pipe<number, string>((input, next) => {
    return next(String.fromCodePoint(input));
});

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

class ConcatStringWithCallback implements IPipe<string, string, string> {
    private out!: string[];
    private index = 0;

    constructor(private initialize: () => string[]) {
        this.reset();
    }

    transform(input: string, next: Next<string>): boolean {
        this.out[this.index++] = input;
        return true;
    }

    flush(next: Next<string>): string {
        const str = this.out.join("");
        this.reset();
        next(str);
        return str;
    }

    catch(): void {
        this.reset();
    }

    reset() {
        this.index = 0;
        this.out = this.initialize();
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
export function flatToCharCode() {
    return _flatToCharCode;
}

/**
 * 创建将字符串的字符逐个转换为 Unicode 码点值的管道
 */
export function flatToCodePoint() {
    return _flatToCodePoint;
}

/**
 * 创建将UTF-16 编码单元值转换为字符串的管道
 */
export function charCodeToString() {
    return _charCodeToString;
}

/**
 * 创建将 Unicode 码点值转换为字符串的管道
 */
export function codePointToString() {
    return _codePointToString;
}

/**
 * 创建将每个字符串连接为一个字符串的管道
 */
export function concatString(
    out?: string[] | (() => string[]),
): Pipe<string, string, string> {
    if (isArray(out)) {
        return new Pipe(new ConcatStringWithOut(out));
    } else if (isFunction(out)) {
        return new Pipe(new ConcatStringWithCallback(out));
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
