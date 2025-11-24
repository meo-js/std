import type { Graph } from './graph.js';
import type { GraphTraversalSpace } from './space.js';

function init(
  graph: Graph,
  nodeCount: number,
  inDegree: Uint32Array<ArrayBufferLike>,
  stack: Uint32Array<ArrayBufferLike>,
) {
  // Compute in-degrees
  const edges = graph.edges;
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
  return top;
}

function processNeighbors(
  edges: number[][],
  u: number,
  inDegree: Uint32Array<ArrayBufferLike>,
  stack: Uint32Array<ArrayBufferLike>,
  top: number,
) {
  const neighbors = edges[u];
  const len = neighbors.length;
  for (let i = 0; i < len; ++i) {
    const v = neighbors[i];
    inDegree[v]--;
    if (inDegree[v] === 0) {
      stack[top++] = v;
    }
  }
  return top;
}

function finalize(
  count: number,
  nodeCount: number,
  isAllocated: boolean,
  inDegree: Uint32Array<ArrayBufferLike>,
  space: GraphTraversalSpace | undefined,
) {
  if (count < nodeCount) {
    if (isAllocated) {
      inDegree.fill(0, 0, nodeCount);
      space!.unlock();
    }
    throw new Error('Cycle detected: The graph is not a DAG.');
  } else {
    if (isAllocated) {
      space!.unlock();
    }
  }
}

/**
 * Performs a topological sort and returns the result as an array.
 *
 * **Time Complexity**: O(V + E).
 *
 * @returns A sorted array of node indices.
 * @throws Error if a cycle is detected.
 */
export function toArray(graph: Graph): number[] {
  const { nodeCount, space, edges } = graph;
  const isAllocated = space?.lockWithKahn(nodeCount) ?? false;
  const inDegree = isAllocated ? space!.u32a : new Uint32Array(nodeCount);
  const stack = isAllocated ? space!.u32a2 : new Uint32Array(nodeCount);

  let top = init(graph, nodeCount, inDegree, stack);
  let count = 0;

  const result = new Array<number>(graph.nodeCount);

  while (top > 0) {
    const u = stack[--top];
    result[count++] = u;
    top = processNeighbors(edges, u, inDegree, stack, top);
  }

  finalize(count, nodeCount, isAllocated, inDegree, space);
  return result;
}

/**
 * Performs a topological sort and yields nodes one by one.
 *
 * By default, {@link Graph}'s space will not be used, because the iterator may never be exhausted.
 *
 * **Time Complexity**: O(V + E).
 *
 * @param useSpace Whether to use the graph's space, please ensure that
 * you properly exhaust the iterator when set to `true`. Default is `false`.
 * @throws Error if a cycle is detected.
 */
export function* iterate(graph: Graph, useSpace: boolean = false) {
  const { nodeCount, edges, space } = graph;
  const isAllocated = useSpace && (space?.lockWithKahn(nodeCount) ?? false);
  const inDegree = isAllocated ? space!.u32a : new Uint32Array(nodeCount);
  const stack = isAllocated ? space!.u32a2 : new Uint32Array(nodeCount);

  let top = init(graph, nodeCount, inDegree, stack);
  let count = 0;
  let interrupted = true;

  try {
    while (top > 0) {
      const u = stack[--top];
      yield u;
      count++;
      top = processNeighbors(edges, u, inDegree, stack, top);
    }
    interrupted = false;
    finalize(count, nodeCount, isAllocated, inDegree, space);
  } catch (e) {
    if (isAllocated) {
      inDegree.fill(0, 0, nodeCount);
      space!.unlock();
    }
    throw e;
  } finally {
    if (interrupted && isAllocated) {
      inDegree.fill(0, 0, nodeCount);
      space!.unlock();
    }
  }
}

/**
 * Performs a topological sort and executes a callback for each node.
 *
 * **Time Complexity**: O(V + E).
 *
 * @throws Error if a cycle is detected.
 */
export function forEach(
  graph: Graph,
  callback: (node: number, index: number) => void,
  thisArg?: unknown,
): void {
  const { nodeCount, space, edges } = graph;
  const isAllocated = space?.lockWithKahn(nodeCount) ?? false;
  const inDegree = isAllocated ? space!.u32a : new Uint32Array(nodeCount);
  const stack = isAllocated ? space!.u32a2 : new Uint32Array(nodeCount);

  let top = init(graph, nodeCount, inDegree, stack);
  let count = 0;

  try {
    while (top > 0) {
      const u = stack[--top];
      callback.call(thisArg, u, count);
      count++;
      top = processNeighbors(edges, u, inDegree, stack, top);
    }
    finalize(count, nodeCount, isAllocated, inDegree, space);
  } catch (e) {
    if (isAllocated) {
      inDegree.fill(0, 0, nodeCount);
      space!.unlock();
    }
    throw e;
  }
}

/**
 * Performs a reverse topological sort and returns the result as an array.
 *
 * **Time Complexity**: O(V + E).
 *
 * @returns A sorted array of node indices.
 * @throws Error if a cycle is detected.
 */
export function toReverseArray(graph: Graph): number[] {
  const { nodeCount, space, edges } = graph;
  const isAllocated = space?.lockWithDfs(nodeCount) ?? false;
  const visited = isAllocated ? space!.u32a4 : new Uint32Array(nodeCount);
  const stack = isAllocated ? space!.u32a2 : new Uint32Array(nodeCount);
  const edgeIndex = isAllocated ? space!.u32a3 : new Uint32Array(nodeCount);
  const VISITING = isAllocated ? ++space!.n : 1;
  const VISITED = isAllocated ? ++space!.n : 2;

  const result: number[] = [];
  let stackTop = 0;

  try {
    for (let i = 0; i < nodeCount; ++i) {
      if (visited[i] !== VISITED && visited[i] !== VISITING) {
        visited[i] = VISITING;
        edgeIndex[i] = 0;
        stack[stackTop++] = i;

        while (stackTop > 0) {
          const u = stack[stackTop - 1];
          const neighbors = edges[u];
          const idx = edgeIndex[u];

          if (idx < neighbors.length) {
            const v = neighbors[idx];
            edgeIndex[u]++;

            if (visited[v] !== VISITED && visited[v] !== VISITING) {
              visited[v] = VISITING;
              edgeIndex[v] = 0;
              stack[stackTop++] = v;
            } else if (visited[v] === VISITING) {
              throw new Error('Cycle detected: The graph is not a DAG.');
            }
          } else {
            visited[u] = VISITED;
            stackTop--;
            result.push(u);
          }
        }
      }
    }
  } finally {
    if (isAllocated) {
      space!.unlock();
    }
  }

  return result;
}

/**
 * Performs a reverse topological sort and yields nodes one by one.
 *
 * By default, {@link Graph}'s space will not be used, because the iterator may never be exhausted.
 *
 * **Time Complexity**: O(V + E).
 *
 * @param useSpace Whether to use the graph's space, please ensure that
 * you properly exhaust the iterator when set to `true`. Default is `false`.
 * @throws Error if a cycle is detected.
 */
export function* iterateReverse(graph: Graph, useSpace: boolean = false) {
  const { nodeCount, space, edges } = graph;
  const isAllocated = useSpace && (space?.lockWithDfs(nodeCount) ?? false);
  const visited = isAllocated ? space!.u32a4 : new Uint32Array(nodeCount);
  const stack = isAllocated ? space!.u32a2 : new Uint32Array(nodeCount);
  const edgeIndex = isAllocated ? space!.u32a3 : new Uint32Array(nodeCount);
  const VISITING = isAllocated ? ++space!.n : 1;
  const VISITED = isAllocated ? ++space!.n : 2;

  let stackTop = 0;

  try {
    for (let i = 0; i < nodeCount; ++i) {
      if (visited[i] !== VISITED && visited[i] !== VISITING) {
        visited[i] = VISITING;
        edgeIndex[i] = 0;
        stack[stackTop++] = i;

        while (stackTop > 0) {
          const u = stack[stackTop - 1];
          const neighbors = edges[u];
          const idx = edgeIndex[u];

          if (idx < neighbors.length) {
            const v = neighbors[idx];
            edgeIndex[u]++;

            if (visited[v] !== VISITED && visited[v] !== VISITING) {
              visited[v] = VISITING;
              edgeIndex[v] = 0;
              stack[stackTop++] = v;
            } else if (visited[v] === VISITING) {
              throw new Error('Cycle detected: The graph is not a DAG.');
            }
          } else {
            visited[u] = VISITED;
            stackTop--;
            yield u;
          }
        }
      }
    }
  } finally {
    if (isAllocated) {
      space!.unlock();
    }
  }
}

/**
 * Performs a reverse topological sort and executes a callback for each node.
 *
 * **Time Complexity**: O(V + E).
 *
 * @throws Error if a cycle is detected.
 */
export function forEachReverse(
  graph: Graph,
  callback: (node: number, index: number) => void,
  thisArg?: unknown,
): void {
  const { nodeCount, space, edges } = graph;
  const isAllocated = space?.lockWithDfs(nodeCount) ?? false;
  const visited = isAllocated ? space!.u32a4 : new Uint32Array(nodeCount);
  const stack = isAllocated ? space!.u32a2 : new Uint32Array(nodeCount);
  const edgeIndex = isAllocated ? space!.u32a3 : new Uint32Array(nodeCount);
  const VISITING = isAllocated ? ++space!.n : 1;
  const VISITED = isAllocated ? ++space!.n : 2;

  let stackTop = 0;
  let count = 0;

  try {
    for (let i = 0; i < nodeCount; ++i) {
      if (visited[i] !== VISITED && visited[i] !== VISITING) {
        visited[i] = VISITING;
        edgeIndex[i] = 0;
        stack[stackTop++] = i;

        while (stackTop > 0) {
          const u = stack[stackTop - 1];
          const neighbors = edges[u];
          const idx = edgeIndex[u];

          if (idx < neighbors.length) {
            const v = neighbors[idx];
            edgeIndex[u]++;

            if (visited[v] !== VISITED && visited[v] !== VISITING) {
              visited[v] = VISITING;
              edgeIndex[v] = 0;
              stack[stackTop++] = v;
            } else if (visited[v] === VISITING) {
              throw new Error('Cycle detected: The graph is not a DAG.');
            }
          } else {
            visited[u] = VISITED;
            stackTop--;
            callback.call(thisArg, u, count++);
          }
        }
      }
    }
  } finally {
    if (isAllocated) {
      space!.unlock();
    }
  }
}
