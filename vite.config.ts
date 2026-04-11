import { resolve } from "path"
import { defineConfig, loadEnv } from "vite"
import { viteStaticCopy } from "vite-plugin-static-copy"
import livereload from "rollup-plugin-livereload"
import zipPack from "vite-plugin-zip-pack";
import fg from 'fast-glob';
import vue from '@vitejs/plugin-vue';

const env = process.env;
const isDev = env.NODE_ENV === 'development';

const outputDir = isDev ? "dev" : "dist";

const baseStaticCopyTargets = [
    { src: "./README*.md", dest: "./" },
    { src: "./plugin.json", dest: "./" },
    { src: "./preview.png", dest: "./" },
    { src: "./icon.png", dest: "./" },
    { src: "./CHANGELOG_zh_CN.md", dest: "./" },
    { src: "./CHANGELOG_en_US.md", dest: "./" },
    { src: "./asset/**/*", dest: "./" },
];

const devOnlyStaticCopyTargets = [
    { src: "./CHANGELOG.md", dest: "./" },
    { src: "./LICENSE", dest: "./" },
];

console.log("isDev=>", isDev);
console.log("outputDir=>", outputDir);

export default defineConfig({
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
            "@libs": resolve(__dirname, "src/libs"),
            "@components": resolve(__dirname, "src/components"),
            "@stores": resolve(__dirname, "src/stores"),
            "@types": resolve(__dirname, "src/types"),
        }
    },

    plugins: [
        vue({
            template: {
                compilerOptions: {
                    comments: false
                }
            }
        }),
        viteStaticCopy({
            targets: [
                ...baseStaticCopyTargets,
                ...(isDev ? devOnlyStaticCopyTargets : []),
            ],
            structured: true,
        }),

    ],

    define: {
        "process.env.DEV_MODE": JSON.stringify(isDev),
        "process.env.NODE_ENV": JSON.stringify(env.NODE_ENV)
    },

    optimizeDeps: {
        exclude: ['mermaid'] // 排除 mermaid 的预构建
    },

    build: {
        outDir: outputDir,
        emptyOutDir: true,
        minify: isDev ? false : "terser",
        terserOptions: isDev ? undefined : {
            compress: {
                drop_console: true, // 删除console.log
                drop_debugger: true, // 删除debugger
            },
            mangle: true, // 混淆变量名
        },
        sourcemap: false,

        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            fileName: "index",
            formats: ["cjs"],
        },
        rollupOptions: {
            plugins: [
                ...(isDev ? [
                    livereload(outputDir),
                    {
                        name: 'watch-external',
                        async buildStart() {
                            const files = await fg([
                                'public/i18n/**',
                                './README*.md',
                                './plugin.json'
                            ]);
                            for (let file of files) {
                                this.addWatchFile(file);
                            }
                        }
                    }
                ] : [
                    // Clean up unnecessary files under dist dir
                    cleanupDistFiles({
                        patterns: ['i18n/*.yaml', 'i18n/*.md', 'asset/**/*.{png,jpg,jpeg,gif,webp,svg,avif}'],
                        distDir: outputDir
                    }),
                    zipPack({
                        inDir: './dist',
                        outDir: './',
                        outFileName: 'package.zip'
                    })
                ])
            ],

            external: ["siyuan", "process"],

            output: {
                entryFileNames: "[name].js",
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name === "style.css") {
                        return "index.css"
                    }
                    return assetInfo.name
                },
            },
        },
    },

    css: {
        preprocessorOptions: {
            scss: { 
              
            },
        }
    }
});


/**
 * Clean up some dist files after compiled
 * @author frostime
 * @param options:
 * @returns 
 */
function cleanupDistFiles(options: { patterns: string[], distDir: string }) {
    const {
        patterns,
        distDir
    } = options;

    return {
        name: 'rollup-plugin-cleanup',
        enforce: 'post',
        writeBundle: {
            sequential: true,
            order: 'post' as 'post',
            async handler() {
                const fg = await import('fast-glob');
                const fs = await import('fs');
                // const path = await import('path');

                // 使用 glob 语法，确保能匹配到文件
                const distPatterns = patterns.map(pat => `${distDir}/${pat}`);
                console.debug('Cleanup searching patterns:', distPatterns);

                const files = await fg.default(distPatterns, {
                    dot: true,
                    absolute: true,
                    onlyFiles: false
                });

                // console.info('Files to be cleaned up:', files);

                for (const file of files) {
                    try {
                        if (fs.default.existsSync(file)) {
                            const stat = fs.default.statSync(file);
                            if (stat.isDirectory()) {
                                fs.default.rmSync(file, { recursive: true });
                            } else {
                                fs.default.unlinkSync(file);
                            }
                            console.log(`Cleaned up: ${file}`);
                        }
                    } catch (error) {
                        console.error(`Failed to clean up ${file}:`, error);
                    }
                }
            }
        }
    };
}
