import { MAX_SMI } from '../../math.js';

/**
 * Temporary memory space for graph traversal algorithms.
 */
export class GraphTraversalSpace {
  /**
   * DFS is used as a token.
   *
   * @internal
   */
  n = 0;

  /**
   * - Kahn is used as in-degree counter, which must be reset to zero after each use.
   *
   * @internal
   */
  u32a: Uint32Array;

  /**
   * - DFS is used as stack.
   * - Kahn is used as node stack.
   *
   * @internal
   */
  u32a2: Uint32Array;

  /**
   * - DFS is used as edge index tracker.
   *
   * @internal
   */
  u32a3: Uint32Array;

  /**
   * - DFS is used as visited marker.
   *
   * @internal
   */
  u32a4: Uint32Array;

  /**
   * @internal
   */
  locked = false;

  constructor(initialCapacity: number = 32) {
    this.u32a = new Uint32Array(initialCapacity);
    this.u32a2 = new Uint32Array(initialCapacity);
    this.u32a3 = new Uint32Array(initialCapacity);
    this.u32a4 = new Uint32Array(initialCapacity);
  }

  /**
   * @internal
   */
  lockWithDfs(capacity: number) {
    if (this.locked) {
      return false;
    }
    if (this.u32a2.length < capacity) {
      const cap = Math.max(capacity, this.u32a2.length * 2);
      this.u32a2 = new Uint32Array(cap);
    }
    if (this.u32a3.length < capacity) {
      const cap = Math.max(capacity, this.u32a3.length * 2);
      this.u32a3 = new Uint32Array(cap);
    }
    if (this.u32a4.length < capacity) {
      const cap = Math.max(capacity, this.u32a4.length * 2);
      this.u32a4 = new Uint32Array(cap);
    }
    if (this.n >= MAX_SMI - 5) {
      this.n = 0;
      this.u32a4.fill(0, 0, capacity);
    }
    this.locked = true;
    return true;
  }

  /**
   * @internal
   */
  lockWithKahn(capacity: number) {
    if (this.locked) {
      return false;
    }
    if (this.u32a.length < capacity) {
      const cap = Math.max(capacity, this.u32a.length * 2);
      this.u32a = new Uint32Array(cap);
    }
    if (this.u32a2.length < capacity) {
      const cap = Math.max(capacity, this.u32a2.length * 2);
      this.u32a2 = new Uint32Array(cap);
    }
    this.locked = true;
    return true;
  }

  /**
   * @internal
   */
  unlock() {
    this.locked = false;
  }
}
