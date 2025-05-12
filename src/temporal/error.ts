/**
 * @module
 *
 * @internal
 */

export function throwUnsupported(thing: string, bigint: boolean): never {
    throw new TypeError(
        `${thing} is not supported${bigint ? `, because environment does not support BigInt.` : "."}`,
    );
}
