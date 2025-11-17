/**
 * @internal
 * @module
 */
import { log } from '../internal/logger.js';

export function reportDuplicatePut() {
  log.error('Do not put the recycled object back into the pool again.');
}
