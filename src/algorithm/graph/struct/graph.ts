import type { Tagged } from '../../../ts.js';
import { GraphTraversalSpace } from '../algo/space.js';

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
 * Used to identify unique nodes in graph data structures.
 */
type NodeHandle = Tagged<[loc: number], typeof nodeHandleTag>;

declare const nodeHandleTag: unique symbol;

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
    return this.nodes.length;
  }

  private nodes: NodeHandle[] = [];
  private edges: number[][] = [];
  private weights: number[][] = [];

  private allowCycle: boolean;
  private space: GraphTraversalSpace | undefined;

  constructor(options?: Options) {
    this.allowCycle = options?.allowCycle ?? false;
    this.space = options?.space;
  }

  /**
   * Adds a new node to the graph.
   *
   * **Time Complexity**: O(1)
   *
   * @returns The handle of the newly created node.
   */
  addNode(): NodeHandle {
    const i = this.nodes.length;
    const node = [i] as NodeHandle;
    this.nodes.push(node);
    this.edges.push([]);
    this.weights.push([]);
    return node;
  }

  /**
   * Removes a node from the graph.
   *
   * **Time Complexity**: O(V + E) - Requires scanning all edges to remove incoming edges
   * to the deleted node and update references to the moved node.
   *
   * @param node The handle of the node to remove.
   */
  removeNode(node: NodeHandle): void {
    const index = node[0];

    const last = this.nodes.length - 1;

    if (index !== last) {
      const lastNode = this.nodes[last];
      this.nodes[index] = lastNode;
      this.edges[index] = this.edges[last];
      this.weights[index] = this.weights[last];
      lastNode[0] = index;
    }

    this.nodes.pop();
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
  }

  /**
   * Adds a directed edge between two nodes.
   *
   * **Time Complexity**:
   * - O(1) if {@link Options.allowCycle allowCycle} is true.
   * - O(V + E) if {@link Options.allowCycle allowCycle} is false (due to cycle detection).
   *
   * @param u The handle of the source node.
   * @param v The handle of the target node.
   * @param weight The weight of the edge.
   */
  addEdge(u: NodeHandle, v: NodeHandle, weight: number = 1): void {
    const ui = u[0];
    const vi = v[0];

    if (!this.allowCycle) {
      if (ui === vi) {
        throw new Error('Cycle detected: Self-loop is not allowed.');
      }
      if (this.hasPath(v, u)) {
        throw new Error(
          'Cycle detected: Adding this edge would create a cycle.',
        );
      }
    }

    this.edges[ui].push(vi);
    this.weights[ui].push(weight);
  }

  /**
   * Checks if there is an edge between two nodes.
   *
   * **Time Complexity**: O(deg(u)) - Linear search in the adjacency list of {@link u}.
   *
   * @param u The handle of the source node.
   * @param v The handle of the target node.
   * @param weight The optional weight to match.
   * @returns True if the edge exists, false otherwise.
   */
  hasEdge(u: NodeHandle, v: NodeHandle, weight?: number): boolean {
    return this.findEdgeIndex(u[0], v[0], weight) !== -1;
  }

  /**
   * Updates the weight of an edge between two nodes, or adds the edge if it doesn't exist.
   *
   * **Time Complexity**: O(deg(u)) + (Complexity of {@link addEdge})
   *
   * @param u The handle of the source node.
   * @param v The handle of the target node.
   * @param weight The new weight of the edge.
   * @param oldWeight The optional old weight to identify the specific edge to update (useful for parallel edges).
   */
  updateEdge(
    u: NodeHandle,
    v: NodeHandle,
    weight: number,
    oldWeight?: number,
  ): void {
    const ui = u[0];
    const vi = v[0];
    const idx = this.findEdgeIndex(ui, vi, oldWeight);
    if (idx !== -1) {
      this.weights[ui][idx] = weight;
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
   * @param u The handle of the source node.
   * @param v The handle of the target node.
   */
  removeEdge(u: NodeHandle, v: NodeHandle): void {
    const ui = u[0];
    const vi = v[0];
    const neighbors = this.edges[ui];
    const weights = this.weights[ui];

    const index = neighbors.indexOf(vi);
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
   * @param u The handle of the first node.
   * @param v The handle of the second node.
   * @param weight The weight of the edge.
   */
  addUndirectedEdge(u: NodeHandle, v: NodeHandle, weight: number = 1): void {
    const ui = u[0];
    const vi = v[0];

    this.edges[ui].push(vi);
    this.weights[ui].push(weight);

    if (ui !== vi) {
      this.edges[vi].push(ui);
      this.weights[vi].push(weight);
    }
  }

  /**
   * Checks if there is an undirected edge between two nodes.
   *
   * **Time Complexity**: O(deg(u) + deg(v))
   *
   * @param u The handle of the first node.
   * @param v The handle of the second node.
   * @param weight The optional weight to match.
   * @returns True if the undirected edge exists, false otherwise.
   */
  hasUndirectedEdge(u: NodeHandle, v: NodeHandle, weight?: number): boolean {
    return this.hasEdge(u, v, weight) && this.hasEdge(v, u, weight);
  }

  /**
   * Updates the weight of an undirected edge between two nodes, or adds the edge if it doesn't exist.
   *
   * **Time Complexity**: O(deg(u) + deg(v)) + (Complexity of {@link addUndirectedEdge})
   *
   * @param u The handle of the first node.
   * @param v The handle of the second node.
   * @param weight The new weight of the edge.
   * @param oldWeight The optional old weight to identify the specific edge to update (useful for parallel edges).
   */
  updateUndirectedEdge(
    u: NodeHandle,
    v: NodeHandle,
    weight: number,
    oldWeight?: number,
  ): void {
    const ui = u[0];
    const vi = v[0];
    let found = false;

    const ue = this.findEdgeIndex(ui, vi, oldWeight);
    if (ue !== -1) {
      this.weights[ui][ue] = weight;
      found = true;
    }

    if (ui !== vi) {
      const ve = this.findEdgeIndex(vi, ui, oldWeight);
      if (ve !== -1) {
        this.weights[vi][ve] = weight;
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
   * @param u The handle of the first node.
   * @param v The handle of the second node.
   */
  removeUndirectedEdge(u: NodeHandle, v: NodeHandle): void {
    this.removeEdge(u, v);
    if (u[0] !== v[0]) {
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
   * Performs a topological sort on the graph using Kahn's algorithm.
   *
   * When `reverse` is `true`, the result is in reverse topological order so every edge
   * `u -> v` appears with `v` before `u`. When `reverse` is `false`, the result is in
   * forward topological order.
   *
   * If `allowCycle` is `false`, the method throws when a cycle is detected. If
   * `allowCycle` is `true`, the method will continue to output the nodes in the
   * order of their minimum in-degree even if there are loops.
   *
   * **Time Complexity**:
   * - O(V + E) for DAGs.
   * - O(V^2 + E) in the worst case if `allowCycle` is true and the graph is cyclic.
   *
   * @param reverse Whether to return the nodes in reverse topological order. Defaults to `false`.
   * @param allowCycle Whether to continue ordering nodes inside cycles. Defaults to `false`.
   * @returns An array of node handles sorted according to the selected ordering.
   * @throws Error if a cycle is detected while `allowCycle` is `false`.
   */
  topologicalSort(
    reverse: boolean = false,
    allowCycle: boolean = false,
  ): NodeHandle[] {
    const nodeCount = this.nodes.length;
    const space = this.space;
    const inDegree = space ? space.u32a : new Uint32Array(nodeCount);
    const stack = space ? space.u32a2 : new Uint32Array(nodeCount);
    space?.ensureTopoCapacity(nodeCount);

    // Compute in-degrees
    const edges = this.edges;
    for (let i = 0; i < nodeCount; ++i) {
      const neighbors = edges[i];
      const len = neighbors.length;
      for (let j = 0; j < len; ++j) {
        inDegree[neighbors[j]]++;
      }
    }

    let top = 0;
    // Initialize stack with nodes having 0 in-degree
    for (let i = 0; i < nodeCount; ++i) {
      if (inDegree[i] === 0) {
        stack[top++] = i;
      }
    }

    const result = new Array<NodeHandle>(nodeCount);
    let count = 0;

    while (count < nodeCount) {
      if (top === 0) {
        if (!allowCycle) {
          inDegree.fill(0, 0, nodeCount);
          throw new Error('Cycle detected: The graph is not a DAG.');
        }

        // Handle cycles: find node with minimum in-degree
        let minDegree = Number.MAX_SAFE_INTEGER;
        let minNode = -1;

        for (let i = 0; i < nodeCount; ++i) {
          const d = inDegree[i];
          if (d > 0) {
            if (d < minDegree) {
              minDegree = d;
              minNode = i;
              if (d === 1) break;
            }
          }
        }

        inDegree[minNode] = 0;
        stack[top++] = minNode;
      }

      // Process stack
      while (top > 0) {
        const u = stack[--top];
        result[count++] = this.nodes[u];

        const neighbors = edges[u];
        const len = neighbors.length;
        for (let i = 0; i < len; ++i) {
          const v = neighbors[i];
          if (inDegree[v] > 0) {
            inDegree[v]--;
            if (inDegree[v] === 0) {
              stack[top++] = v;
            }
          }
        }
      }
    }

    if (reverse) {
      result.reverse();
    }

    return result;
  }

  /**
   * Checks if there is a path from the {@link u} node to the {@link v} node.
   *
   * **Time Complexity**: O(V + E) - Depth First Search.
   *
   * @param u The handle of the starting node.
   * @param v The handle of the target node.
   * @returns True if a path exists, false otherwise.
   */
  hasPath(u: NodeHandle, v: NodeHandle): boolean {
    const ui = u[0];
    const vi = v[0];

    if (ui === vi) return true;

    const nodeCount = this.nodes.length;
    const space = this.space;
    const visited = space ? space.u32a : new Uint32Array(nodeCount);
    const stack = space ? space.u32a2 : new Uint32Array(nodeCount);
    const token = space ? ++space.n >>> 0 : 1;
    space?.ensureDfsCapacity(nodeCount);

    let top = 0;
    stack[top++] = ui;
    visited[ui] = token;

    while (top > 0) {
      const u = stack[--top];

      if (u === vi) return true;

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
    return false;
  }
}

export { type NodeHandle as GraphNodeHandle, type Options as GraphOptions };
