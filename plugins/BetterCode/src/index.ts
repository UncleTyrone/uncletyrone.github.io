// BetterCode plugin - Fixed version with correct Vendetta patcher usage
import { storage } from "@vendetta/plugin";
import { instead } from "@vendetta/patcher";
import { ReactNative } from "@vendetta/metro/common";
import { findByProps } from "@vendetta/metro";
import Prism from "prismjs";

// Import all Prism language grammars
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

// Import settings
import Settings from "./Settings";

type Message = {
  content: any[];
  embeds?: any[];
};

type Row = {
  message: Message;
};

// Safety check for processColor
const processColor: (color: string) => number =
  ReactNative.processColor?.bind(ReactNative) ??
  ((_: string) => 0);

// Prism theme
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

const LOGOS_BASE = "https://uncletyrone.github.io/plugins/BetterCode/logos";

let unpatch: (() => void) | undefined;

// Check if Prism is loaded properly
console.log("[BetterCode] Prism loaded, languages:", Object.keys(Prism.languages));

function highlightText(text: string, lang: string): unknown[] {
  try {
    if (storage.show_line_num === true && typeof text === "string") {
      text = text
        .split("\n")
        .map((code, idx) => `${(idx + 1).toString().padStart(3)}  ${code}`)
        .join("\n");
    }

    // Get the grammar - first check direct language, then mapped language
    const grammar = Prism.languages[lang] ?? Prism.languages[langList[lang]?.[0]?.toLowerCase()];
    if (!grammar) {
      console.warn(`[BetterCode] No grammar found for language: ${lang}`);
      return [{ type: "text", content: text }];
    }

    // Try using tokenize directly first
    try {
      const tokens = Prism.tokenize(text, grammar);
      const contents: unknown[] = [];
      
      // Process tokens recursively
      function processToken(token: any): any {
        if (typeof token === "string") {
          return { type: "text", content: token };
        } else if (Array.isArray(token)) {
          return token.map(processToken);
        } else if (token && typeof token === "object") {
          if (token.content && typeof token.content !== "string") {
            return {
              type: token.type,
              content: processToken(token.content),
            };
          }
          
          const style = (token.alias ?? token.type) as string;
          
          if (theme[style]) {
            const color = theme[style];
            return {
              content: [{ type: "text", content: token.content }],
              target: "usernameOnClick",
              context: {
                username: 1,
                usernameOnClick: {
                  linkColor: processColor(color),
                },
                medium: true,
              },
              type: "link",
            };
          } else if (decorator[style]) {
            return { type: decorator[style], content: token.content };
          } else {
            return { type: "text", content: token.content };
          }
        }
        return { type: "text", content: String(token) };
      }
      
      const processedTokens = processToken(tokens);
      if (Array.isArray(processedTokens)) {
        return processedTokens as unknown[];
      } else {
        contents.push(processedTokens);
        return contents;
      }
    } catch (tokenizeError) {
      console.error("[BetterCode] Tokenize error, falling back to simple highlighting:", tokenizeError);
      // Fall back to Prism.highlight
      try {
        const res = Prism.highlight(text, grammar, lang) as any;
        const contents: unknown[] = [];

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
      } catch (highlightError) {
        console.error("[BetterCode] Highlight error:", highlightError);
        return [{ type: "text", content: text }];
      }
    }
  } catch (error) {
    console.error("[BetterCode] highlightText error:", error);
    return [{ type: "text", content: text }];
  }
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

    if (obj.type === "codeBlock" && obj.lang) {
      // Normalize language to lowercase for lookup
      const langLower = obj.lang.toLowerCase();
      
      // First check if we have this language directly in Prism
      if (Prism.languages[langLower]) {
        try {
          const langMeta = langList[langLower]?.[0] || obj.lang;
          const iconURL = `${LOGOS_BASE}/${langMeta}.png`;

          const rawContent: any[] = [
            {
              content: highlightText(obj.content, langLower),
              type: "paragraph",
            },
            {
              content: "-- BetterCode",
              type: "text",
            },
          ];

          const embed = {
            type: "rich" as const,
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
        } catch (error) {
          console.error("[BetterCode] Code block processing error:", error);
        }
      } 
      // Then check mapped languages
      else if (langList[langLower]) {
        const targetLang = langList[langLower][0].toLowerCase();
        if (Prism.languages[targetLang]) {
          try {
            const langMeta = langList[langLower][0];
            const iconURL = `${LOGOS_BASE}/${langMeta}.png`;

            const rawContent: any[] = [
              {
                content: highlightText(obj.content, targetLang),
                type: "paragraph",
              },
              {
                content: "-- BetterCode",
                type: "text",
              },
            ];

            const embed = {
              type: "rich" as const,
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
          } catch (error) {
            console.error("[BetterCode] Code block processing error:", error);
          }
        }
      }
    }
  }

  return [nodes, embeds];
}

export default {
  onLoad: () => {
    console.log("[BetterCode] Loading...");
    storage.show_line_num ??= false;

    try {
      const DCDChatManager = findByProps("updateRows");
      
      if (!DCDChatManager) {
        console.error("[BetterCode] DCDChatManager not found");
        return;
      }

      console.log("[BetterCode] DCDChatManager found");

            // Use correct signature: instead(funcName, parent, callback)
      unpatch = instead(
        "updateRows",     // func - method name as string (first parameter)
        DCDChatManager,   // parent - the parent object (second parameter)
        ((args: [unknown, { rows: Row[], isLoadingAtTop?: boolean }], origFunc: Function) => {
          console.log("[BetterCode] instead() called");
          
          if (!args[1] || !Array.isArray(args[1].rows)) {
            console.warn("[BetterCode] Invalid args format");
            return origFunc.apply(DCDChatManager, args);
          }

          const rows = args[1].rows;
          
          for (const row of rows) {
            if (row?.message?.content && Array.isArray(row.message.content)) {
              const [newContent, newEmbeds] = walkContent(row.message.content);
              row.message.content = newContent;
              if (row.message.embeds) {
                row.message.embeds.push(...newEmbeds);
              } else {
                row.message.embeds = newEmbeds;
              }
            }
          }

          console.log("[BetterCode] Successfully processed rows");
          return origFunc.apply(DCDChatManager, args);
        }) as any
      );
      
      console.log("[BetterCode] Plugin loaded! Patching active. unpatch:", typeof unpatch);
    } catch (error) {
      console.error("[BetterCode] onLoad error:", error);
    }
  },

  onUnload: () => {
    console.log("[BetterCode] Unloading...");
    unpatch?.();
    console.log("[BetterCode] Plugin unloaded");
  },

  settings: Settings,
};