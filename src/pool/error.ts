/**
 * @module
 *
 * @internal
 */
import { log } from "../internal/logger.js";

export function reportDuplicatePut() {
    log.error("do not put the same object back into the object pool again!");
}
