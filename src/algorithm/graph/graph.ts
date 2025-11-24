import { GraphTraversalSpace } from './space.js';

/**
 * Options for constructing the {@link Graph}.
 */
export interface Options {
  /**
   * Whether to allow loops (Cyclic graph).
   *
   * This applies only to directed graphs, the undirected graph should remain set to `false`.
   *
   * @default false
   */
  allowCycle?: boolean;

  /**
   * Optional memory space for graph algorithms to avoid allocations.
   *
   * @default undefined
   */
  space?: GraphTraversalSpace;
}

/**
 * Array-based Graph structure implementation.
 *
 * Features:
 * - Uses arrays to store edges.
 * - Supports directed and undirected edges with weights.
 * - Optional cycle detection to maintain a DAG (Directed Acyclic Graph).
 */
export class Graph {
  /**
   * Gets the node count.
   *
   * **Time Complexity**: O(1)
   */
  get nodeCount() {
    return this.edges.length;
  }

  /**
   * @internal
   */
  edges: number[][] = [];
  /**
   * @internal
   */
  weights: number[][] = [];

  /**
   * @internal
   */
  allowCycle: boolean;
  /**
   * @internal
   */
  space: GraphTraversalSpace | undefined;

  constructor(options?: Options) {
    this.allowCycle = options?.allowCycle ?? false;
    this.space = options?.space;
  }

  /**
   * Adds a new node to the graph.
   *
   * **Time Complexity**: O(1)
   *
   * @returns The index of the newly added node.
   */
  addNode(): number {
    const i = this.edges.length;
    this.edges.push([]);
    this.weights.push([]);
    return i;
  }

  /**
   * Removes a node from the graph.
   *
   * **Important:** This method uses the swap-remove strategy. The last node is moved
   * to the position of the removed node to fill the gap.
   * Therefore, you must update external references to point to this new position.
   *
   * **Time Complexity**: O(V + E) - Requires scanning all edges to remove incoming edges
   * to the deleted node and update references to the moved node.
   *
   * @param node The index of the node to remove.
   * @returns The index of the node that was moved to replace the removed node.
   */
  removeNode(node: number): number {
    const index = node;

    const last = this.edges.length - 1;

    if (index !== last) {
      this.edges[index] = this.edges[last];
      this.weights[index] = this.weights[last];
    }

    this.edges.pop();
    this.weights.pop();

    for (let i = 0; i < this.edges.length; ++i) {
      const neighbors = this.edges[i];
      const weights = this.weights[i];

      for (let j = neighbors.length - 1; j >= 0; --j) {
        const neighbor = neighbors[j];

        if (neighbor === index) {
          const last = neighbors.length - 1;
          if (j !== last) {
            neighbors[j] = neighbors[last];
            weights[j] = weights[last];
          }
          neighbors.pop();
          weights.pop();
        } else if (index !== last && neighbor === last) {
          neighbors[j] = index;
        }
      }
    }

    return last;
  }

  /**
   * Adds a directed edge between two nodes.
   *
   * **Time Complexity**:
   * - O(1) if {@link Options.allowCycle allowCycle} is true.
   * - O(V + E) if {@link Options.allowCycle allowCycle} is false (due to cycle detection).
   *
   * @param u The index of the source node.
   * @param v The index of the target node.
   * @param weight The weight of the edge.
   */
  addEdge(u: number, v: number, weight: number = 1): void {
    if (!this.allowCycle) {
      if (u === v) {
        throw new Error('Cycle detected: Self-loop is not allowed.');
      }
      if (this.hasPath(v, u)) {
        throw new Error(
          'Cycle detected: Adding this edge would create a cycle.',
        );
      }
    }

    this.edges[u].push(v);
    this.weights[u].push(weight);
  }

  /**
   * Checks if there is an edge between two nodes.
   *
   * **Time Complexity**: O(deg(u)) - Linear search in the adjacency list of {@link u}.
   *
   * @param u The index of the source node.
   * @param v The index of the target node.
   * @param weight The optional weight to match.
   * @returns True if the edge exists, false otherwise.
   */
  hasEdge(u: number, v: number, weight?: number): boolean {
    return this.findEdgeIndex(u, v, weight) !== -1;
  }

  /**
   * Updates the weight of an edge between two nodes, or adds the edge if it doesn't exist.
   *
   * **Time Complexity**: O(deg(u)) + (Complexity of {@link addEdge})
   *
   * @param u The index of the source node.
   * @param v The index of the target node.
   * @param weight The new weight of the edge.
   * @param oldWeight The optional old weight to identify the specific edge to update (useful for parallel edges).
   */
  updateEdge(u: number, v: number, weight: number, oldWeight?: number): void {
    const idx = this.findEdgeIndex(u, v, oldWeight);
    if (idx !== -1) {
      this.weights[u][idx] = weight;
      return;
    }

    this.addEdge(u, v, weight);
  }

  /**
   * Removes a directed edge between two nodes.
   *
   * If the edge does not exist, this operation has no effect.
   *
   * **Time Complexity**: O(deg(u))
   *
   * @param u The index of the source node.
   * @param v The index of the target node.
   */
  removeEdge(u: number, v: number): void {
    const neighbors = this.edges[u];
    const weights = this.weights[u];

    const index = neighbors.indexOf(v);
    if (index !== -1) {
      const last = neighbors.length - 1;
      if (index !== last) {
        neighbors[index] = neighbors[last];
        weights[index] = weights[last];
      }
      neighbors.pop();
      weights.pop();
    }
  }

  /**
   * Adds an undirected edge between two nodes.
   *
   * Internally, this adds two directed edges: (u, v) and (v, u).
   *
   * **Time Complexity**: Same as {@link addEdge} (called twice).
   *
   * @param u The index of the first node.
   * @param v The index of the second node.
   * @param weight The weight of the edge.
   */
  addUndirectedEdge(u: number, v: number, weight: number = 1): void {
    this.edges[u].push(v);
    this.weights[u].push(weight);

    if (u !== v) {
      this.edges[v].push(u);
      this.weights[v].push(weight);
    }
  }

  /**
   * Checks if there is an undirected edge between two nodes.
   *
   * **Time Complexity**: O(deg(u) + deg(v))
   *
   * @param u The index of the first node.
   * @param v The index of the second node.
   * @param weight The optional weight to match.
   * @returns True if the undirected edge exists, false otherwise.
   */
  hasUndirectedEdge(u: number, v: number, weight?: number): boolean {
    return this.hasEdge(u, v, weight) && this.hasEdge(v, u, weight);
  }

  /**
   * Updates the weight of an undirected edge between two nodes, or adds the edge if it doesn't exist.
   *
   * **Time Complexity**: O(deg(u) + deg(v)) + (Complexity of {@link addUndirectedEdge})
   *
   * @param u The index of the first node.
   * @param v The index of the second node.
   * @param weight The new weight of the edge.
   * @param oldWeight The optional old weight to identify the specific edge to update (useful for parallel edges).
   */
  updateUndirectedEdge(
    u: number,
    v: number,
    weight: number,
    oldWeight?: number,
  ): void {
    let found = false;

    const ue = this.findEdgeIndex(u, v, oldWeight);
    if (ue !== -1) {
      this.weights[u][ue] = weight;
      found = true;
    }

    if (u !== v) {
      const ve = this.findEdgeIndex(v, u, oldWeight);
      if (ve !== -1) {
        this.weights[v][ve] = weight;
      }
    }

    if (!found) {
      this.addUndirectedEdge(u, v, weight);
    }
  }

  /**
   * Removes an undirected edge between two nodes.
   *
   * Internally, this removes two directed edges: (u, v) and (v, u).
   *
   * If the edge does not exist, this operation has no effect.
   *
   * **Time Complexity**: O(deg(u) + deg(v))
   *
   * @param u The index of the first node.
   * @param v The index of the second node.
   */
  removeUndirectedEdge(u: number, v: number): void {
    this.removeEdge(u, v);
    if (u !== v) {
      this.removeEdge(v, u);
    }
  }

  private findEdgeIndex(ui: number, vi: number, weight?: number): number {
    const neighbors = this.edges[ui];
    const weights = this.weights[ui];
    for (let i = 0; i < neighbors.length; ++i) {
      if (neighbors[i] === vi) {
        if (weight === undefined || weights[i] === weight) {
          return i;
        }
      }
    }
    return -1;
  }

  /**
   * Checks if there is a path from the {@link u} node to the {@link v} node.
   *
   * **Time Complexity**: O(V + E) - Depth First Search.
   *
   * @param u The index of the starting node.
   * @param v The index of the target node.
   * @returns True if a path exists, false otherwise.
   */
  hasPath(u: number, v: number): boolean {
    if (u === v) return true;

    const nodeCount = this.nodeCount;
    const space = this.space;
    const isAllocated = space?.lockWithDfs(nodeCount) ?? false;
    const visited = isAllocated ? space!.u32a4 : new Uint32Array(nodeCount);
    const stack = isAllocated ? space!.u32a2 : new Uint32Array(nodeCount);
    const token = isAllocated ? ++space!.n : 1;

    let top = 0;
    stack[top++] = u;
    visited[u] = token;

    while (top > 0) {
      const u = stack[--top];

      if (u === v) {
        if (isAllocated) {
          space!.unlock();
        }
        return true;
      }

      const neighbors = this.edges[u];
      const len = neighbors.length;
      for (let i = 0; i < len; ++i) {
        const v = neighbors[i];
        // eslint-disable-next-line security/detect-possible-timing-attacks -- false alert, this is not security-sensitive.
        if (visited[v] !== token) {
          visited[v] = token;
          stack[top++] = v;
        }
      }
    }

    if (isAllocated) {
      space!.unlock();
    }

    return false;
  }

  /**
   * Clears all edges from the graph, keeping the nodes.
   *
   * **Time Complexity**: O(V)
   */
  clearEdges(): void {
    for (let i = 0; i < this.edges.length; i++) {
      this.edges[i] = [];
      this.weights[i] = [];
    }
  }

  /**
   * Clears all nodes and edges from the graph.
   *
   * **Time Complexity**: O(1)
   */
  clear(): void {
    this.edges = [];
    this.weights = [];
  }
}

export { type Options as GraphOptions };
