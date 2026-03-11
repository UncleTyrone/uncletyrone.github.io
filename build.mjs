import { readFile, writeFile, readdir, mkdir, cp, stat } from "fs/promises";
import { dirname, join } from "path";
import { createHash } from "crypto";

import { rollup } from "rollup";
import esbuild from "rollup-plugin-esbuild";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import swc from "@swc/core";

const extensions = [".js", ".jsx", ".mjs", ".ts", ".tsx", ".cts", ".mts"];
const OUTPUT_DIR = "./public/plugins";

/** @type import("rollup").InputPluginOption */
const plugins = [
    nodeResolve(),
    commonjs(),
    {
        name: "swc",
        async transform(code, id) {
            const ext = id.slice(id.lastIndexOf("."));
            if (!extensions.includes(ext)) return null;

            const ts = ext.includes("ts");
            const tsx = ts ? ext.endsWith("x") : undefined;
            const jsx = !ts ? ext.endsWith("x") : undefined;

            const result = await swc.transform(code, {
                filename: id,
                jsc: {
                    externalHelpers: true,
                    parser: {
                        syntax: ts ? "typescript" : "ecmascript",
                        tsx,
                        jsx,
                    },
                },
                env: {
                    targets: "fully supports es6",
                    include: [
                        "transform-block-scoping",
                        "transform-classes",
                        "transform-async-to-generator",
                        "transform-async-generator-functions"
                    ],
                    exclude: [
                        "transform-parameters",
                        "transform-template-literals",
                        "transform-exponentiation-operator",
                        "transform-named-capturing-groups-regex",
                        "transform-nullish-coalescing-operator",
                        "transform-object-rest-spread",
                        "transform-optional-chaining",
                        "transform-logical-assignment-operators"
                    ]
                },
            });
            return result.code;
        },
    },
    esbuild({ minify: true }),
];

for (let plug of await readdir("./plugins")) {
    const plugPath = `./plugins/${plug}`;
    if (!(await stat(plugPath)).isDirectory()) continue;
    const manifest = JSON.parse(await readFile(`${plugPath}/manifest.json`, "utf-8"));
    const outPath = `${OUTPUT_DIR}/${plug}/index.js`;

    try {
        await mkdir(dirname(outPath), { recursive: true });

        const bundle = await rollup({
            input: `./plugins/${plug}/${manifest.main}`,
            onwarn: () => {},
            plugins,
        });
    
        await bundle.write({
            file: outPath,
            globals(id) {
                if (id.startsWith("@vendetta")) return id.substring(1).replace(/\//g, ".");
                const map = {
                    react: "window.React",
                };
                return map[id] || null;
            },
            format: "iife",
            compact: true,
            exports: "named",
        });
        await bundle.close();
    
        const toHash = await readFile(outPath);
        manifest.hash = createHash("sha256").update(toHash).digest("hex");
        manifest.main = "index.js";
        await writeFile(`${OUTPUT_DIR}/${plug}/manifest.json`, JSON.stringify(manifest));

        const logosSrc = join("./plugins", plug, "logos");
        try {
            const logosDir = await readdir(logosSrc);
            if (logosDir.length > 0) {
                const logosDest = `${OUTPUT_DIR}/${plug}/logos`;
                await mkdir(logosDest, { recursive: true });
                await cp(logosSrc, logosDest, { recursive: true });
            }
        } catch (_) {
            // No logos folder, skip
        }
    
        console.log(`Successfully built ${manifest.name}!`);
    } catch (e) {
        console.error("Failed to build plugin...", e);
        process.exit(1);
    }
}
