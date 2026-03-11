/// <reference path="../vendetta.d.ts" />
import { storage } from "@vendetta/plugin";
import { before } from "@vendetta/patcher";
import { findByProps } from "@vendetta/metro";
import { ReactNative } from "@vendetta/metro/common";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-c";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-go";
import "prismjs/components/prism-json";
import "prismjs/components/prism-swift";
import "prismjs/components/prism-perl";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-php";
import "prismjs/components/prism-java";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-lua";
import "prismjs/components/prism-kotlin";
import "prismjs/components/prism-objectivec";
import Settings from "./Settings";

const theme: Record<string, string> = {
  punctuation: "#959da5",
  "class-name": "#fb8532",
  keyword: "#ff7b72",
  boolean: "#ff7b72",
  parameter: "#f6f8fa",
  function: "#b392f0",
  property: "#b392f0",
  comment: "#8b949e",
  operator: "#79c0ff",
  constant: "#79c0ff",
  number: "#79c0ff",
  string: "#79b8ff",
  selector: "#79b8ff",
  builtin: "#79b8ff",
};

const decorator: Record<string, string> = {
  bold: "strong",
  important: "strong",
  italic: "em",
};

const supportedLangs = Object.keys(Prism.languages);
const langList: Record<string, [string, boolean]> = {
  html: ["html", true],
  css: ["CSS", true],
  javascript: ["JavaScript", true],
  js: ["JavaScript", true],
  python: ["Python", true],
  py: ["Python", true],
  bash: ["bash", true],
  sh: ["bash", true],
  shell: ["bash", true],
  typescript: ["TypeScript", true],
  ts: ["TypeScript", true],
  tsx: ["React TSX", false],
  c: ["c", true],
  markdown: ["markdown", true],
  md: ["markdown", true],
  go: ["Go", true],
  json: ["JSON", true],
  swift: ["Swift", true],
  perl: ["Perl", false],
  ruby: ["Ruby", true],
  rb: ["Ruby", true],
  php: ["PHP", true],
  java: ["Java", true],
  jsx: ["React JSX", false],
  lua: ["Lua", true],
  kt: ["Kotlin", true],
  kts: ["Kotlin", true],
  objc: ["Objective-C", false],
  objectivec: ["Objective-C", false],
};

const LOGOS_BASE = "https://uncletyrone.github.io/plugins/BetterCode/logos";

function hexToColorInt(hex: string): number {
  const match = hex.replace(/^#/, "").match(/.{2}/g);
  if (!match || match.length < 3) return 0xffe0e0ff;
  const r = parseInt(match[0], 16);
  const g = parseInt(match[1], 16);
  const b = parseInt(match[2], 16);
  return 0xff000000 | (r << 16) | (g << 8) | b;
}

let unpatch: (() => void) | undefined;

const BetterCode = {
  onLoad: () => {
    try {
      // Defaults
      storage.show_line_num ??= false;
      storage.show_footer ??= true;
      storage.footer_text ??= "BetterCode";
      storage.embed_theme ??= "soft";
      storage.gap_fix ??= true;

      const View = findByProps("View");
      if (!View?.NativeModules?.DCDChatManager) {
        console.error("[BetterCode] Could not find DCDChatManager. View:", !!View, "NativeModules:", !!View?.NativeModules);
        return;
      }
      if (typeof ReactNative?.processColor !== "function") {
        console.error("[BetterCode] ReactNative.processColor not found");
        return;
      }
      const { DCDChatManager } = View.NativeModules;
      if (typeof DCDChatManager?.updateRows !== "function") {
        console.error("[BetterCode] DCDChatManager.updateRows is not a function");
        return;
      }

    function highlightText(text: string, lang: string): unknown[] {
      try {
        if (storage.show_line_num) {
          text = text
            .split("\n")
            .map((code, idx) => `${(idx + 1).toString().padStart(3)}  ${code}`)
            .join("\n");
        }
        const grammar = Prism.languages[lang] ?? Prism.languages.plain ?? {};
        if (typeof Prism.tokenize !== "function") {
          return [{ type: "text" as const, content: text }];
        }
        const res = Prism.tokenize(text, grammar) as (string | { type?: string; alias?: string | string[]; content?: unknown })[];
        if (!Array.isArray(res)) {
          return [{ type: "text" as const, content: text }];
        }
        const contents: unknown[] = [];
        for (const part of res) {
        if (typeof part === "object" && part !== null && "type" in part) {
          const p = part as { type?: string; alias?: string | string[]; content?: unknown };
          const style = (Array.isArray(p.alias) ? p.alias[0] : p.alias) ?? p.type ?? "";
          const textContent = typeof p.content === "string"
            ? p.content
            : Array.isArray(p.content)
              ? (p.content as unknown[]).map((c: unknown) => typeof c === "string" ? c : (c as { content?: unknown })?.content ?? "").join("")
              : String(p.content ?? "");
          if (theme[style]) {
            const color = theme[style];
            const processColor = ReactNative?.processColor;
            const linkColor = typeof processColor === "function" ? processColor(color) : hexToColorInt(color);
            contents.push({
              content: [{ type: "text", content: textContent }],
              target: "usernameOnClick",
              context: {
                username: 1,
                usernameOnClick: { linkColor },
                medium: true,
              },
              type: "link",
            });
          } else if (decorator[style]) {
            contents.push({ type: decorator[style], content: textContent });
          } else {
            contents.push({ type: "text", content: textContent });
          }
        } else {
          contents.push({ type: "text", content: part });
        }
      }
        return contents;
      } catch (e) {
        console.warn("[BetterCode] highlightText failed, using plain:", e);
        return [{ type: "text" as const, content: text }];
      }
    }

    function fixCodeblockGap(content: unknown[]): unknown[] {
      if (storage.gap_fix === false) return content;
      const nodes = content as { type?: string; content?: unknown; lang?: string }[];
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node?.type === "codeBlock" && typeof node.content === "string") {
          // Trim trailing newlines from the code block content
          node.content = node.content.replace(/\n+$/g, "");

          // If there's an immediately following blank text node, remove it
          const next = nodes[i + 1];
          if (
            next &&
            next.type === "text" &&
            (next.content === "" ||
              (typeof next.content === "string" && /^\s*$/.test(next.content)))
          ) {
            nodes.splice(i + 1, 1);
            i--;
          }
        }
      }
      return nodes;
    }

    function getEmbedColors(): { border: string; provider: string } {
      const key =
        typeof storage.embed_theme === "string" && storage.embed_theme.length > 0
          ? storage.embed_theme
          : "soft";
      switch (key) {
        case "vibrant":
          return { border: "#ff8f8f", provider: "#ffb3b3" };
        case "mono":
          return { border: "#444c56", provider: "#373e47" };
        default:
          return { border: "#e0e0ff", provider: "#e0e0ff" };
      }
    }

    function walkContent(content: unknown[]): [unknown[], unknown[]] {
      const embeds: unknown[] = [];
      const nodes = content as { type?: string; content?: unknown; lang?: string }[];

      for (const o of nodes) {
        if (o?.type === "codeBlock" && o.lang && supportedLangs.includes(o.lang) && typeof o.content === "string") {
          const codeText = o.content;
          const meta = langList[o.lang]?.[1] ? langList[o.lang][0] : o.lang;
          const iconURL = `${LOGOS_BASE}/${meta}.png`;

          const rawContent: unknown[] = [
            {
              content: highlightText(codeText, o.lang),
              type: "paragraph",
            },
          ];

          const footerLabel =
            typeof storage.footer_text === "string" && storage.footer_text.trim().length
              ? storage.footer_text.trim()
              : "BetterCode";

          if (storage.show_footer !== false) {
            rawContent.push({ content: `-- ${footerLabel}`, type: "text" });
          }

          const { border, provider } = getEmbedColors();
          const processColor = ReactNative?.processColor;
          const borderColor = typeof processColor === "function" ? processColor(border) : hexToColorInt(border);
          const providerColorVal = typeof processColor === "function" ? processColor(provider) : hexToColorInt(provider);

          const embed = {
            type: "rich",
            description: rawContent,
            author: {
              name: meta,
              iconURL,
              iconProxyURL: iconURL,
            },
            borderLeftColor: borderColor,
            providerColor: providerColorVal,
            headerTextColor: 0xffffffff,
            bodyTextColor: 0xffe0e0ff,
          };

          embeds.push(embed);
        }
      }

      // Do not touch original content; only append embeds.
      return [content, embeds];
    }

      // Rain: before(methodName, parent, callback); Vendetta: before(parent, methodName, callback)
      unpatch = (before as (a: unknown, b: unknown, c: (...args: unknown[]) => void) => () => void)(
        "updateRows",
        DCDChatManager,
        (args: [unknown, string]) => {
          try {
            if (typeof args[1] !== "string") {
              console.warn("[BetterCode] updateRows arg[1] is not a string, got:", typeof args[1]);
              return;
            }
            const rows = JSON.parse(args[1]);
            if (!Array.isArray(rows)) {
              console.warn("[BetterCode] updateRows parsed rows is not an array");
              return;
            }
            for (const row of rows) {
              if (row?.message?.content && Array.isArray(row.message.content)) {
                const originalEmbeds = row.message.embeds ?? [];
                const [newContent, newEmbeds] = walkContent(row.message.content);
                console.log("[BetterCode] Original embeds:", JSON.stringify(originalEmbeds));
                console.log("[BetterCode] New embeds:", JSON.stringify(newEmbeds));
                row.message.content = newContent;
                if (row.message.embeds) {
                  row.message.embeds.push(...newEmbeds);
                } else {
                  row.message.embeds = newEmbeds;
                }
              }
            }
            args[1] = JSON.stringify(rows);
          } catch (e) {
            console.error("[BetterCode] updateRows error:", e);
          }
        }
      );

      console.log("[BetterCode] Loaded!");
    } catch (err) {
      console.error("[BetterCode] Load error:", err);
      throw err;
    }
  },
  onUnload: () => {
    unpatch?.();
    console.log("[BetterCode] Unloaded!");
  },
  settings: Settings,
};

export default BetterCode;
