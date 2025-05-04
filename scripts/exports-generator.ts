import { readdirSync, statSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");
const SRC_DIR = join(ROOT_DIR, "src");
const PACKAGE_JSON_PATH = join(ROOT_DIR, "package.json");

// 匹配模块注释的正则表达式
const MODULE_COMMENT_REGEX =
    /\/\*\*\s*\n\s*\*\s*@public\s*\n\s*\*\s*\n\s*\*\s*@module\s*\n\s*\*\//u;

/**
 * 递归获取目录中所有的 TypeScript 文件
 */
function getAllTsFiles(dir: string): string[] {
    const files: string[] = [];

    for (const file of readdirSync(dir, {
        encoding: "utf-8",
    })) {
        const filePath = join(dir, file);
        const stat = statSync(filePath);

        if (stat.isDirectory()) {
            files.push(...getAllTsFiles(filePath));
        } else if (file.endsWith(".ts") && !file.endsWith(".d.ts")) {
            files.push(filePath);
        }
    }

    return files;
}

/**
 * 检查文件是否包含模块注释
 */
async function hasModuleComment(filePath: string): Promise<boolean> {
    try {
        const content = await readFile(filePath, "utf-8");
        return MODULE_COMMENT_REGEX.test(content);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return false;
    }
}

/**
 * 获取导出路径 (去掉 src/ 前缀和 .ts 扩展名)
 */
function getExportPath(filePath: string): string {
    const relativePath = relative(SRC_DIR, filePath);
    return `./${relativePath.replace(/\.ts$/u, "")}`;
}

/**
 * 构建导出配置
 */
function buildExportConfig(exportPath: string): Record<string, unknown> {
    if (exportPath === ".") {
        return {
            import: "./dist/index.mjs",
            require: "./dist/index.cjs",
            types: "./dist/index.d.ts",
        };
    }
    const distPath = exportPath.replace(/^\.\//u, "./dist/");
    return {
        import: `${distPath}.mjs`,
        require: `${distPath}.cjs`,
        types: `${distPath}.d.ts`,
    };
}

/**
 * 获取导出键名
 *
 * 例如：
 * ./encoding/byte.ts -> ./encoding
 * ./index.ts -> ./
 * ./macro.ts -> ./macro
 */
function getExportKey(filePath: string): string {
    const relativePath = relative(SRC_DIR, filePath);
    const parts = relativePath.split("/");

    if (parts.length === 1) {
        // 顶级文件，例如 macro.ts
        if (parts[0] === "index.ts") {
            return "./";
        }
        return `./${parts[0].replace(/\.ts$/u, "")}`;
    } else {
        // 次级目录文件，例如 encoding/byte.ts
        return `./${relativePath.replace(/\.ts$/u, "")}`;
    }
}

/**
 * 主函数
 */
async function main() {
    try {
        // 1. 获取所有 TypeScript 文件
        const tsFiles = getAllTsFiles(SRC_DIR);

        // 2. 过滤出带有模块注释的文件并按导出键分组
        const moduleFilesByKey: Record<string, string[] | undefined> = {};

        for (const filePath of tsFiles) {
            if (await hasModuleComment(filePath)) {
                const exportKey = getExportKey(filePath);
                if (!moduleFilesByKey[exportKey]) {
                    moduleFilesByKey[exportKey] = [];
                }
                moduleFilesByKey[exportKey].push(filePath);
            }
        }

        // 3. 读取现有的 package.json
        const packageJsonContent = await readFile(PACKAGE_JSON_PATH, "utf-8");
        const packageJson = JSON.parse(packageJsonContent) as Record<
            string,
            unknown
        > & { exports?: Record<string, unknown> };

        // 如果没有 exports 字段，创建一个空对象
        packageJson.exports = {};

        // 4. 更新 exports 对象
        // 获取并排序导出键
        const sortedExportKeys = Object.keys(moduleFilesByKey).sort();

        for (const exportKey of sortedExportKeys) {
            const key = exportKey === "./" ? "." : exportKey;
            packageJson.exports[key] = buildExportConfig(key);
        }

        // 5. 写回 package.json
        await writeFile(
            PACKAGE_JSON_PATH,
            `${JSON.stringify(packageJson, null, 4)}\n`,
            "utf-8",
        );

        console.log("Successfully updated package.json exports!");
        console.log(
            "Found module files in these entry points:",
            Object.keys(moduleFilesByKey),
        );
        console.log(
            "Generated/updated",
            Object.keys(moduleFilesByKey).length,
            "export entries",
        );
    } catch (error) {
        console.error("Error updating package.json:", error);
        throw error;
    }
}

main().catch(console.error);
