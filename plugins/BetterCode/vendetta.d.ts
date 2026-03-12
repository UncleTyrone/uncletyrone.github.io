declare module "@vendetta/plugin" {
  export const storage: Record<string, any>;
}

declare module "@vendetta/patcher" {
  export type Unpatch = () => void;

  export function before(
    func: string,
    parent: any,
    callback: (args: any[]) => void | any
  ): Unpatch;

  export function after(
    func: string,
    parent: any,
    callback: (args: any[], ret: any) => void | any
  ): Unpatch;

  export function instead(
    func: string,
    parent: any,
    callback: (args: any[], orig: Function) => any
  ): Unpatch;
}

declare module "@vendetta/metro" {
  export function findByProps(...props: string[]): any;
  export function findByName(name: string, defaultExport?: boolean): any;
}

declare module "@vendetta/metro/common" {
  export const ReactNative: {
    processColor?: (color: string) => number;
  };

  export const Linking: {
    openURL(url: string): void;
  };

  export const moment: any;
}

declare module "@vendetta/ui/components" {
  export const Forms: any;
  export const General: any;
  export const Text: any;
  export const View: any;
}

declare module "@vendetta/ui/assets" {
  export function getAssetIDByName(name: string): number;
}

declare module "@vendetta/storage" {
  export function useProxy(storage: any): void;
}

declare module "prismjs" {
  const Prism: {
    highlight(code: string, grammar: any, lang: string): string;
    tokenize(code: string, grammar: any): any[];
    languages: Record<string, any>;
  };

  export default Prism;
}