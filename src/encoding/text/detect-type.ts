import type { Encoding } from './enum.js';

/**
 * 编码分析结果
 */
export type AnalyseResult = AnalyseResultItem[];

/**
 * 编码分析结果项
 */
export interface AnalyseResultItem {
  /**
   * 编码格式
   */
  name: Encoding;

  /**
   * 置信度，范围 0 - 100
   */
  confidence: number;

  /**
   * 语言
   */
  lang?: string;
}
