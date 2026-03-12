/// <reference path="../vendetta.d.ts" />

// BetterCode plugin - Fixed version with correct Vendetta patcher usage
import { storage } from "@vendetta/plugin";
import { after } from "@vendetta/patcher";
import { ReactNative } from "@vendetta/metro/common";
import { findByProps } from "@vendetta/metro";
import { Prism } from "prismjs";

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

/*

type Message = {
  content: any[];
  embeds?: any[];
};

type Row = {
  message: Message;
};

*/

const HASH = Symbol("bettercodeHash");

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
let unpatch2: (() => void) | undefined;
let unpatch3: (() => void) | undefined;

// Check if Prism is loaded properly
console.log("[BetterCode] Prism loaded:", !!Prism?.languages);

function highlightText(text: string, lang: string): unknown[] {
  if (text.length > 8000) {
    console.warn("[BetterCode] Code block too large, skipping highlight");
    return [{ type: "text", content: text }];
  }

  if (!Prism?.languages) {
    console.warn("[BetterCode] Prism not ready");
    return [{ type: "text", content: text }];
  }

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
          return ([] as any[]).concat(...token.map(processToken));
        } else if (token && typeof token === "object") {
          if (token.content && typeof token.content !== "string") {
            return {
              type: token.type,
              content: processToken(token.content),
            };
          }
          
          const style = (token.alias ?? token.type) as string;
          
          if (theme[style]) {
             return { type: "text", content: token.content };
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
              contents.push({ type: "text", content });
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

// src/index.ts
function walkContent(content: any[]): [any[], any[]] {
  const embeds: any[] = [];
  const nodes = Array.isArray(content) ? [...content] : [];

  for (const obj of nodes) {
    // Recursively process nested content
    if (obj && Array.isArray(obj.content)) {
      const [nestedContent, nestedEmbeds] = walkContent(obj.content);
      obj.content = nestedContent;
      embeds.push(...nestedEmbeds);
    }

    // Handle code blocks
    if (obj && ["codeBlock","code","pre"].includes(obj.type) && obj.lang) {
      const langLower = obj.lang.toLowerCase();

      // Check if Prism supports this language (direct or mapped)
      const supported =
        Prism.languages[langLower] ||
        Prism.languages[langList[langLower]?.[0]?.toLowerCase()];

      if (supported) {
        try {
          const langMeta = langList[langLower]?.[0] || obj.lang;
          const iconURL = `${LOGOS_BASE}/${langMeta}.png`;

          const rawContent: any[] = [
            {
              type: "paragraph",
              content: highlightText(typeof obj.content === "string" ? obj.content : String(obj.content ?? ""), langLower)
            }
          ];

          const embed = {
            type: 0,
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
          obj.content = " ";
        } catch (error) {
          console.error("[BetterCode] Code block processing error:", error);
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

      /*

      const DCDChatManager = findByProps("updateRows");
      
      if (!DCDChatManager) {
        console.error("[BetterCode] DCDChatManager not found");
        return;
      }

      console.log("[BetterCode] DCDChatManager found");

      */

      function containsCodeBlock(content: any[]): boolean {
        for (const node of content) {
          if (!node) continue;

          if (["codeBlock","code","pre"].includes(node.type)) {
            return true;
          }

          if (Array.isArray(node.content) && containsCodeBlock(node.content)) {
            return true;
          }
        }

        return false;
      }

      const MessageStore = findByProps("receiveMessage", "getMessage")
      console.log("[BetterCode] MessageStore module:", MessageStore);

      if (!MessageStore) {
        console.error("[BetterCode] MessageStore not found");
        return;
      }

      console.log("[BetterCode] MessageStore found");

      unpatch = after("receiveMessage", MessageStore, (_, message) => {
        console.log("[BetterCode] ReceiveMessage parser patch called");

        try {
          if (!message?.content) return;

          if (!Array.isArray(message.content)) return;

          if (!containsCodeBlock(message.content)) return;

          const contentHash = JSON.stringify(message.content);
          if (message[HASH] === contentHash) return;
          message[HASH] = contentHash;

          const [newContent, newEmbeds] = walkContent(message.content);

          message.content = newContent;

          if (newEmbeds.length) {
              message.embeds = [...(message.embeds ?? []), ...newEmbeds];
              console.log("[BetterCode] New embeds added:", newEmbeds.length);
          }

          console.log("[BetterCode] Row parsed successfully");
        } catch (error) {
          console.error("[BetterCode] ReceiveMessage parsing error:", error);
        }
      })

      unpatch2 = after("updateMessage", MessageStore, (_, message) => {
        console.log("[BetterCode] UpdateMessage parser patch called");
        
        try {
          if (!message?.content) return;

          if (!Array.isArray(message.content)) return;

          if (!containsCodeBlock(message.content)) return;

          const contentHash = JSON.stringify(message.content);
          if (message[HASH] === contentHash) return;
          message[HASH] = contentHash;

          const [newContent, newEmbeds] = walkContent(message.content);

          message.content = newContent;

          if (newEmbeds.length) {
            message.embeds = [...(message.embeds ?? []), ...newEmbeds];
            console.log("[BetterCode] New embeds added:", newEmbeds.length);
          }

          console.log("[BetterCode] Row parsed successfully");
        } catch (error) {
          console.error("[BetterCode] UpdateMessage parsing error:", error);
        }
      });

      unpatch3 = after("loadMessages", MessageStore, (_, data) => {
        console.log("[BetterCode] LoadMessages parser patch called");
        
        try {
          const messages = data?.messages;
          if (!Array.isArray(messages)) return;

          for (const message of messages) {
            try {
              if (!Array.isArray(message?.content)) continue;

              if (!containsCodeBlock(message.content)) continue;

              const contentHash = JSON.stringify(message.content);
              if (message[HASH] === contentHash) continue;
              message[HASH] = contentHash;

              const [newContent, newEmbeds] = walkContent(message.content);

              message.content = newContent;

              if (newEmbeds.length) {
                message.embeds = [...(message.embeds ?? []), ...newEmbeds];
                console.log("[BetterCode] New embeds added:", newEmbeds.length);
              }

              console.log("[BetterCode] Row parsed successfully");
            } catch (error) {
              console.error("[BetterCode] LoadMessages message parsing error:", error);
            }
          }

          console.log("[BetterCode] LoadMessages history parsed:", messages.length);
        } catch (error) {
          console.error("[BetterCode] LoadMessages parsing error:", error);
        }
      });
      
      /*
      
      unpatch = before(
        "updateRows",
        DCDChatManager,
        (args: any[]) => {
          console.log("[BetterCode] before() called");
          
          const data = args[0];

          if (!data || !Array.isArray(data.rows)) {
            console.warn("[BetterCode] Invalid args format");
            return;
          }

          const rows = data.rows;

          for (const row of rows) {
            if (row?.message?.content && Array.isArray(row.message.content)) {
              const [newContent, newEmbeds] = walkContent(row.message.content);
              
              row.message.content = newContent;

              if (row.message.embeds) {
                row.message.embeds.push(...newEmbeds);
              } else {
                row.message.embeds = newEmbeds;
              }

              console.log("[BetterCode] Processed a row, new embeds added:", newEmbeds.length);
            }
          }

          console.log("[BetterCode] Successfully processed rows");
        }) as any
      );

      */

      console.log("[BetterCode] Plugin loaded! ReceiveMessage patching active. unpatch:", typeof unpatch);
      console.log("[BetterCode] Plugin loaded! UpdateMessage patching active. unpatch2:", typeof unpatch2);
      console.log("[BetterCode] Plugin loaded! LoadMessages patching active. unpatch3:", typeof unpatch3);
    } catch (error) {
      console.error("[BetterCode] onLoad error:", error);
    }
  },

  onUnload: () => {
    console.log("[BetterCode] Unloading...");
    unpatch?.();
    unpatch2?.();
    unpatch3?.();
    console.log("[BetterCode] Plugin unloaded");
  },

  settings: Settings,
};