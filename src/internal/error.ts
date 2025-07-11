/**
 * @module
 *
 * @internal
 */

export function throwBigIntNotSupported(method: string): never {
    throw new Error(
        `can't use ${method}, because BigInt is not supported in this environment.`,
    );
}

export function throwUnsignedWithNegative(method: string) {
    throw new RangeError(`value must be non-negative for ${method}.`);
}
