import { describe, expect, it } from 'vitest';
import { topoSort } from '../../../src/algorithm/graph.js';
import { Graph } from '../../../src/algorithm/graph/graph.js';
import { GraphTraversalSpace } from '../../../src/algorithm/graph/space.js';

describe('topoSort', () => {
  describe('toArray', () => {
    it('should perform topological sort', () => {
      const graph = new Graph();
      const n1 = graph.addNode();
      const n2 = graph.addNode();
      const n3 = graph.addNode();

      graph.addEdge(n1, n2);
      graph.addEdge(n2, n3);

      const sorted = topoSort.toArray(graph);

      expect(sorted[0]).toBe(n1);
      expect(sorted[1]).toBe(n2);
      expect(sorted[2]).toBe(n3);
    });

    it('should detect cycle', () => {
      const graph = new Graph({ allowCycle: true });
      const n1 = graph.addNode();
      const n2 = graph.addNode();

      graph.addEdge(n1, n2);
      graph.addEdge(n2, n1);

      expect(() => topoSort.toArray(graph)).toThrow('Cycle detected');
    });
  });

  describe('iterate', () => {
    it('should iterate in topological order', () => {
      const graph = new Graph();
      const n1 = graph.addNode();
      const n2 = graph.addNode();
      const n3 = graph.addNode();

      graph.addEdge(n1, n2);
      graph.addEdge(n2, n3);

      const result: number[] = [];
      for (const node of topoSort.iterate(graph)) {
        result.push(node);
      }

      expect(result).toEqual([n1, n2, n3]);
    });

    it('should detect cycle', () => {
      const graph = new Graph({ allowCycle: true });
      const n1 = graph.addNode();
      const n2 = graph.addNode();

      graph.addEdge(n1, n2);
      graph.addEdge(n2, n1);

      expect(() => {
        for (const _ of topoSort.iterate(graph)) {
          // consume
        }
      }).toThrow('Cycle detected');
    });
  });

  describe('forEach', () => {
    it('should iterate in topological order', () => {
      const graph = new Graph();
      const n1 = graph.addNode();
      const n2 = graph.addNode();
      const n3 = graph.addNode();

      graph.addEdge(n1, n2);
      graph.addEdge(n2, n3);

      const result: number[] = [];
      topoSort.forEach(graph, node => {
        result.push(node);
      });

      expect(result).toEqual([n1, n2, n3]);
    });

    it('should detect cycle', () => {
      const graph = new Graph({ allowCycle: true });
      const n1 = graph.addNode();
      const n2 = graph.addNode();

      graph.addEdge(n1, n2);
      graph.addEdge(n2, n1);

      expect(() => {
        topoSort.forEach(graph, () => {
          // do nothing
        });
      }).toThrow('Cycle detected');
    });
  });

  describe('toReverseArray', () => {
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

      const sorted = topoSort.toReverseArray(graph);

      const idx1 = sorted.indexOf(n1);
      const idx2 = sorted.indexOf(n2);
      const idx3 = sorted.indexOf(n3);
      const idx4 = sorted.indexOf(n4);

      // Reverse topological order: v before u
      expect(idx2).toBeLessThan(idx1);
      expect(idx4).toBeLessThan(idx1);
      expect(idx3).toBeLessThan(idx2);
    });

    it('should detect cycle', () => {
      const graph = new Graph({ allowCycle: true });
      const n1 = graph.addNode();
      const n2 = graph.addNode();

      graph.addEdge(n1, n2);
      graph.addEdge(n2, n1);

      expect(() => topoSort.toReverseArray(graph)).toThrow('Cycle detected');
    });
  });

  describe('iterateReverse', () => {
    it('should perform topological sort (reverse order)', () => {
      const graph = new Graph();
      const n1 = graph.addNode();
      const n2 = graph.addNode();
      const n3 = graph.addNode();

      graph.addEdge(n1, n2);
      graph.addEdge(n2, n3);

      const result: number[] = [];
      for (const node of topoSort.iterateReverse(graph)) {
        result.push(node);
      }

      // Reverse topological order: n3, n2, n1
      expect(result).toEqual([n3, n2, n1]);
    });

    it('should detect cycle', () => {
      const graph = new Graph({ allowCycle: true });
      const n1 = graph.addNode();
      const n2 = graph.addNode();

      graph.addEdge(n1, n2);
      graph.addEdge(n2, n1);

      expect(() => {
        for (const _ of topoSort.iterateReverse(graph)) {
          // consume
        }
      }).toThrow('Cycle detected');
    });
  });

  describe('forEachReverse', () => {
    it('should perform topological sort (reverse order)', () => {
      const graph = new Graph();
      const n1 = graph.addNode();
      const n2 = graph.addNode();
      const n3 = graph.addNode();

      graph.addEdge(n1, n2);
      graph.addEdge(n2, n3);

      const result: number[] = [];
      topoSort.forEachReverse(graph, node => {
        result.push(node);
      });

      // Reverse topological order: n3, n2, n1
      expect(result).toEqual([n3, n2, n1]);
    });

    it('should detect cycle', () => {
      const graph = new Graph({ allowCycle: true });
      const n1 = graph.addNode();
      const n2 = graph.addNode();

      graph.addEdge(n1, n2);
      graph.addEdge(n2, n1);

      expect(() => {
        topoSort.forEachReverse(graph, () => {
          // do nothing
        });
      }).toThrow('Cycle detected');
    });
  });

  describe('Space Reuse', () => {
    it('should reuse space in toArray', () => {
      const space = new GraphTraversalSpace();
      const graph = new Graph({ space });
      const n1 = graph.addNode();
      const n2 = graph.addNode();
      graph.addEdge(n1, n2);

      const sorted1 = topoSort.toArray(graph);
      expect(sorted1).toEqual([n1, n2]);

      // Reuse space
      const graph2 = new Graph({ space });
      const n3 = graph2.addNode();
      const n4 = graph2.addNode();
      graph2.addEdge(n4, n3);

      const sorted2 = topoSort.toArray(graph2);
      expect(sorted2).toEqual([n4, n3]);
    });

    it('should reuse space in iterate with useSpace=true', () => {
      const space = new GraphTraversalSpace();
      const graph = new Graph({ space });
      const n1 = graph.addNode();
      const n2 = graph.addNode();
      graph.addEdge(n1, n2);

      const result1: number[] = [];
      for (const node of topoSort.iterate(graph, true)) {
        result1.push(node);
      }
      expect(result1).toEqual([n1, n2]);

      // Reuse space
      const graph2 = new Graph({ space });
      const n3 = graph2.addNode();
      const n4 = graph2.addNode();
      graph2.addEdge(n4, n3);

      const result2: number[] = [];
      for (const node of topoSort.iterate(graph2, true)) {
        result2.push(node);
      }
      expect(result2).toEqual([n4, n3]);
    });
  });
});
