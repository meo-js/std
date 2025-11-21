import { describe, expect, it } from 'vitest';
import { GraphTraversalSpace } from '../../../../src/algorithm/graph/algo/space.js';
import { Graph } from '../../../../src/algorithm/graph/struct/graph.js';

describe('Graph', () => {
  it('should remove a node correctly', () => {
    const graph = new Graph();
    const node1 = graph.addNode();
    const node2 = graph.addNode();
    const node3 = graph.addNode();

    // Verify we can remove the shifted node
    graph.removeNode(node3);
    expect(graph.nodeCount).toBe(2);
  });

  it('should check if an edge exists', () => {
    const graph = new Graph();
    const n1 = graph.addNode();
    const n2 = graph.addNode();

    graph.addEdge(n1, n2, 10);

    expect(graph.hasEdge(n1, n2)).toBe(true);
    expect(graph.hasEdge(n1, n2, 10)).toBe(true);
    expect(graph.hasEdge(n1, n2, 5)).toBe(false);
    expect(graph.hasEdge(n2, n1)).toBe(false);
  });

  it('should update an edge', () => {
    const graph = new Graph();
    const n1 = graph.addNode();
    const n2 = graph.addNode();

    // Add new edge via update
    graph.updateEdge(n1, n2, 10);
    expect(graph.hasEdge(n1, n2, 10)).toBe(true);

    // Update existing edge
    graph.updateEdge(n1, n2, 20);
    expect(graph.hasEdge(n1, n2, 20)).toBe(true);
    expect(graph.hasEdge(n1, n2, 10)).toBe(false);
  });

  it('should update an edge with oldWeight', () => {
    const graph = new Graph();
    const n1 = graph.addNode();
    const n2 = graph.addNode();

    graph.addEdge(n1, n2, 10);
    graph.addEdge(n1, n2, 20); // Parallel edge

    // Update specific edge
    graph.updateEdge(n1, n2, 15, 10);
    expect(graph.hasEdge(n1, n2, 15)).toBe(true);
    expect(graph.hasEdge(n1, n2, 20)).toBe(true);
    expect(graph.hasEdge(n1, n2, 10)).toBe(false);

    // If oldWeight not found, add new edge
    graph.updateEdge(n1, n2, 30, 100);
    expect(graph.hasEdge(n1, n2, 30)).toBe(true);
  });

  it('should update an undirected edge', () => {
    const graph = new Graph();
    const n1 = graph.addNode();
    const n2 = graph.addNode();

    // Add new undirected edge via update
    graph.updateUndirectedEdge(n1, n2, 10);
    expect(graph.hasEdge(n1, n2, 10)).toBe(true);
    expect(graph.hasEdge(n2, n1, 10)).toBe(true);

    // Update existing undirected edge
    graph.updateUndirectedEdge(n1, n2, 20);
    expect(graph.hasEdge(n1, n2, 20)).toBe(true);
    expect(graph.hasEdge(n2, n1, 20)).toBe(true);
  });

  it('should perform topological sort (reverse order)', () => {
    const graph = new Graph();
    const n1 = graph.addNode();
    const n2 = graph.addNode();
    const n3 = graph.addNode();
    const n4 = graph.addNode();

    // n1 -> n2 -> n3
    // n1 -> n4
    graph.addEdge(n1, n2);
    graph.addEdge(n2, n3);
    graph.addEdge(n1, n4);

    const sorted = graph.topologicalSort(true);

    const idx1 = sorted.indexOf(n1);
    const idx2 = sorted.indexOf(n2);
    const idx3 = sorted.indexOf(n3);
    const idx4 = sorted.indexOf(n4);

    // Reverse topological order: v before u
    expect(idx2).toBeLessThan(idx1);
    expect(idx4).toBeLessThan(idx1);
    expect(idx3).toBeLessThan(idx2);
  });

  it('should perform topological sort', () => {
    const graph = new Graph();
    const n1 = graph.addNode();
    const n2 = graph.addNode();
    const n3 = graph.addNode();

    graph.addEdge(n1, n2);
    graph.addEdge(n2, n3);

    const sorted = graph.topologicalSort();

    expect(sorted[0]).toBe(n1);
    expect(sorted[1]).toBe(n2);
    expect(sorted[2]).toBe(n3);
  });

  it('should detect cycle in topological sort', () => {
    const graph = new Graph({ allowCycle: true });
    const n1 = graph.addNode();
    const n2 = graph.addNode();

    graph.addEdge(n1, n2);
    graph.addEdge(n2, n1);

    expect(() => graph.topologicalSort()).toThrow('Cycle detected');
  });

  it('should reuse traversal space correctly', () => {
    const space = new GraphTraversalSpace();

    // Graph 1
    const g1 = new Graph({ space });
    const n1a = g1.addNode();
    const n1b = g1.addNode();
    const n1c = g1.addNode();
    g1.addEdge(n1a, n1b);
    g1.addEdge(n1b, n1c);

    expect(g1.hasPath(n1a, n1c)).toBe(true);
    expect(g1.hasPath(n1c, n1a)).toBe(false);

    // Graph 2 (reuse space)
    const g2 = new Graph({ space });
    const n2a = g2.addNode();
    const n2b = g2.addNode();
    g2.addEdge(n2a, n2b);

    expect(g2.hasPath(n2a, n2b)).toBe(true);
    expect(g2.hasPath(n2b, n2a)).toBe(false);

    // Verify Graph 1 still works
    expect(g1.hasPath(n1a, n1c)).toBe(true);
  });

  it('should clear all nodes and edges', () => {
    const graph = new Graph();
    const n1 = graph.addNode();
    const n2 = graph.addNode();
    graph.addEdge(n1, n2);

    expect(graph.nodeCount).toBe(2);
    expect(graph.hasEdge(n1, n2)).toBe(true);

    graph.clear();

    expect(graph.nodeCount).toBe(0);
  });

  it('should clear all edges but keep nodes', () => {
    const graph = new Graph();
    const n1 = graph.addNode();
    const n2 = graph.addNode();
    graph.addEdge(n1, n2);

    expect(graph.nodeCount).toBe(2);
    expect(graph.hasEdge(n1, n2)).toBe(true);

    graph.clearEdges();

    expect(graph.nodeCount).toBe(2);
    expect(graph.hasEdge(n1, n2)).toBe(false);
  });
});
