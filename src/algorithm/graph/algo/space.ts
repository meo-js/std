/**
 * Temporary memory space for graph traversal algorithms.
 */
export class GraphTraversalSpace {
  /**
   * DFS is used as a token.
   */
  n = 0;

  /**
   * - DFS is used as visited marker.
   * - Topological is used as in-degree counter.
   */
  u32a: Uint32Array;

  /**
   * - DFS is used as stack.
   * - Topological is used as node stack.
   */
  u32a2: Uint32Array;

  /**
   * - DFS is used as edge index tracker.
   */
  u32a3: Uint32Array;

  constructor(initialCapacity: number = 32) {
    this.u32a = new Uint32Array(initialCapacity);
    this.u32a2 = new Uint32Array(initialCapacity);
    this.u32a3 = new Uint32Array(initialCapacity);
  }

  ensureDfsCapacity(capacity: number) {
    if (this.u32a.length < capacity) {
      const cap = Math.max(capacity, this.u32a.length * 2);
      this.u32a = new Uint32Array(cap);
      this.u32a2 = new Uint32Array(cap);
      this.u32a3 = new Uint32Array(cap);
    }
  }

  ensureTopoCapacity(capacity: number) {
    if (this.u32a.length < capacity) {
      const cap = Math.max(capacity, this.u32a.length * 2);
      this.u32a = new Uint32Array(cap);
      this.u32a2 = new Uint32Array(cap);
    }
  }
}
