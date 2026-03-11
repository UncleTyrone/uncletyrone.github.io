// bunny-plugin-EXAMPLE/src/index.tsx

import { storage } from "@vendetta/plugin";
import { before } from "@vendetta/patcher";
import { ReactNative } from "@vendetta/metro/common";
import Prism from "prismjs";

import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";

import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
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

const processColor: (color: string) => number =
  ReactNative.processColor?.bind(ReactNative) ??
  ((_: string) => 0);

// Prism theme (from original HighlightCode)
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

const LOGOS_BASE =
  "https://uncletyrone.github.io/plugins/BetterCode/logos";

let unpatch: (() => void) | undefined;

// ---- highlighting + embed logic (from HighlightCode) ------------------------

function highlightText(text: string, lang: string): unknown[] {
  if (storage.show_line_num === true) {
    text = text
      .split("\n")
      .map(
        (code, idx) => `${(idx + 1).toString().padStart(3)}  ${code}`,
      )
      .join("\n");
  }

  // Use Prism.highlight like original HighlightCode
  const grammar = Prism.languages[lang] ?? Prism.languages[langList[lang]?.[0]?.toLowerCase()];
  if (!grammar) {
    return [{ type: "text", content: text }];
  }

  const res = Prism.highlight(text, grammar, lang) as any;

  const contents: unknown[] = [];

  // In Prism 1.x, highlight returns a string; in the original plugin
  // the custom Prism build returned a token array. We mirror their
  // object-vs-string handling but fall back to plain text if needed.
  if (typeof res === "string") {
    contents.push({ type: "text", content: res });
    return contents;
  }

  for (const part of res) {
    if (typeof part === "object" && part !== null) {
      const style = (part.alias ?? part.type) as string;
      const content = part.content;

      if (theme[style]) {
        const color = theme[style];
        contents.push({
          content: [{ type: "text", content }],
          target: "usernameOnClick",
          context: {
            username: 1,
            usernameOnClick: {
              linkColor: processColor(color),
            },
            medium: true,
          },
          type: "link",
        });
      } else if (decorator[style]) {
        contents.push({ type: decorator[style], content });
      } else {
        contents.push({ type: "text", content });
      }
    } else {
      contents.push({ type: "text", content: part });
    }
  }

  return contents;
}

function walkContent(content: any[]): [any[], any[]] {
  const embeds: any[] = [];
  const nodes = content;

  for (const obj of nodes) {
    if (typeof obj.content === "object" && Array.isArray(obj.content)) {
      const [nestedContent, nestedEmbeds] = walkContent(obj.content);
      obj.content = nestedContent;
      embeds.push(...nestedEmbeds);
    }

    if (
      obj.type === "codeBlock" &&
      obj.lang &&
      (Prism.languages[obj.lang] ?? Prism.languages[langList[obj.lang]?.[0]?.toLowerCase()])
    ) {
      const langMeta =
        obj.lang in langList && langList[obj.lang][1]
          ? langList[obj.lang][0]
          : obj.lang;
      const iconURL = `${LOGOS_BASE}/${langMeta}.png`;

      const rawContent: any[] = [
        {
          content: highlightText(obj.content, obj.lang),
          type: "paragraph",
        },
        {
          content: "-- BetterCode",
          type: "text",
        },
      ];

      const embed = {
        type: "rich",
        description: rawContent,
        author: {
          name: langMeta,
          iconURL,
          iconProxyURL: iconURL,
        },
        borderLeftColor: processColor("#e0e0ff"),
        providerColor: processColor("#e0e0ff"),
        headerTextColor: 0xffffffff,
        bodyTextColor: 0xffe0e0ff,
      };

      embeds.push(embed);
      obj.type = "text";
      obj.content = "";
    }
  }

  return [nodes, embeds];
}

// ---- Vendetta/Bunny plugin exports -----------------------------------------

export const onLoad = () => {
  storage.show_line_num ??= false;

  const { DCDChatManager } =
    ((ReactNative as unknown as { NativeModules?: { DCDChatManager?: any } })
      .NativeModules) ?? {};

  if (!DCDChatManager || typeof DCDChatManager.updateRows !== "function") {
    console.error("[BetterCode] DCDChatManager.updateRows not found; aborting");
    return;
  }

  unpatch = before(
    DCDChatManager,
    "updateRows",
    (args: [unknown, string]) => {
      try {
        const json = args[1];
        if (typeof json !== "string") return;

        const rows = JSON.parse(json);
        if (!Array.isArray(rows)) return;

        for (const row of rows) {
          if (row?.message?.content && Array.isArray(row.message.content)) {
            const [newContent, newEmbeds] = walkContent(
              row.message.content,
            );
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
    },
  );
};

export const onUnload = () => {
  unpatch?.();
};

export const settings = Settings;