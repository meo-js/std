/**
 * @module
 *
 * @internal
 */

import { HAS_BIGINT } from "../env.js";
import type { Numeric } from "../math.js";
import { isBigInt } from "../predicate.js";

export function assertBigIntSupported(method: string) {
    if (HAS_BIGINT) {
        return;
    }
    throw new Error(
        `Can't use \`${method}\`, because BigInt is not supported in this environment.`,
    );
}

export function assertPositive(value: Numeric, throwZero: boolean) {
    if (throwZero ? value > 0 : value >= 0) {
        return;
    }
    throw new RangeError(
        `\`value\` must be non-negative${throwZero ? " and non-zero" : ""}, not ${value}.`,
    );
}

export function assertInteger(value: Numeric) {
    if (isBigInt(value) || Number.isInteger(value)) {
        return;
    }
    throw new TypeError(`\`value\` must be an integer, not ${value}.`);
}
