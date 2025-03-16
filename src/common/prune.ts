import { isArray, isMap, isObject, isSet } from "./guard.js";

/**
 * 返回经过修剪的对象
 *
 * 传入 {@link Object}/{@link Array}/{@link Set} 会修剪值为 `undefined` 的属性，传入 {@link Map} 则只会修剪键为 `undefined` 的键值对。
 */
export function prune<T>(
    v: T,
    opts?: {
        /**
         * 是否深度修剪
         *
         * @default false
         */
        deep?: boolean;

        /**
         * 是否修剪 `null` 的属性或成员
         *
         * @default false
         */
        nulls?: boolean;

        /**
         * 是否修剪原对象
         *
         * @default false
         */
        update?: boolean;
    },
): T {
    if (!isObject(v)) {
        return v;
    }

    const deep = opts?.deep ?? false;
    const nulls = opts?.nulls ?? false;
    const update = opts?.update ?? false;
    const valid = nulls ? _check_null : _check_undefined;

    if (!update) {
        return _prune_new(v, deep, valid, opts);
    } else {
        return _prune_update(v, deep, valid, opts);
    }
}

function _check_null(v: unknown) {
    return v != null;
}

function _check_undefined(v: unknown) {
    return v !== undefined;
}

function _prune_new<T extends object>(
    v: T,
    deep: boolean,
    valid: (v: unknown) => boolean,
    opts: object | undefined,
) {
    if (isArray(v)) {
        return (
            deep
                ? v.filter(value => valid(value))
                : v
                      .filter(value => valid(value))
                      .map(value => prune(value, opts) as never)
        ) as T;
    } else if (isSet(v)) {
        return new Set(prune(Array.from(v), opts)) as T;
    } else if (isMap(v)) {
        return new Map(
            deep
                ? Array.from(v)
                      .filter(([key]) => valid(key))
                      .map(value => [value[0], prune(value[1], opts)] as never)
                : Array.from(v).filter(([key]) => valid(key)),
        ) as T;
    } else {
        return Object.fromEntries(
            deep
                ? Object.entries(v)
                      .filter(([, value]) => valid(value))
                      .map(([key, value]) => [key, prune(value, opts)] as never)
                : Object.entries(v).filter(([, value]) => valid(value)),
        ) as T;
    }
}

function _prune_update<T extends object>(
    v: T,
    deep: boolean,
    valid: (v: unknown) => boolean,
    opts: object | undefined,
) {
    if (isArray(v)) {
        for (let i = v.length - 1; i >= 0; i--) {
            if (!valid(v[i])) {
                v.splice(i, 1);
            } else if (deep) {
                v[i] = prune(v[i] as unknown, opts);
            }
        }
        return v;
    } else if (isSet(v)) {
        for (const value of Array.from(v)) {
            if (!valid(value)) {
                v.delete(value);
            } else if (deep) {
                const temp = prune(value as unknown, opts);
                if (temp !== value) {
                    v.delete(value);
                    v.add(temp);
                }
            }
        }
        return v;
    } else if (isMap(v)) {
        for (const [key, value] of v) {
            if (!valid(key)) {
                v.delete(key);
            } else if (deep) {
                const temp = prune(value as unknown, opts);
                if (temp !== value) {
                    v.set(key, temp);
                }
            }
        }
        return v;
    } else {
        for (const key in v) {
            if (Object.hasOwn(v, key)) {
                if (!valid(v[key])) {
                    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- checked.
                    delete v[key];
                } else if (deep) {
                    v[key] = prune(v[key], opts);
                }
            }
        }
        return v;
    }
}
