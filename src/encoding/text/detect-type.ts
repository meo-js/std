import type { TextEncoding } from "./enum.js";

/**
 * 编码分析结果项
 */
export interface TextEncodingAnalyseResultItem {
    /**
     * 编码格式
     */
    name: TextEncoding;

    /**
     * 置信度，范围 0 - 100
     */
    confidence: number;

    /**
     * 语言
     */
    lang?: string;
}

/**
 * 编码分析结果
 */
export type TextEncodingAnalyseResult = TextEncodingAnalyseResultItem[];
