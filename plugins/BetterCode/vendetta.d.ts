/* Vendetta/Rain plugin runtime - provided by the host, not bundled */
declare module "@vendetta/plugin" {
  export const storage: Record<string, unknown>;
}

declare module "@vendetta/patcher" {
  export function before<T extends unknown[]>(
    func: string, 
    parent: any, 
    cb: (args: T, ret?: any) => void | unknown | unknown[]
  ): () => void;
  
  export function after<T extends unknown[]>(
    func: string, 
    parent: any, 
    cb: (args: T, ret: any) => void | unknown | unknown[]
  ): () => void;
  
  export function instead<T extends unknown[]>(
    func: string, 
    parent: any, 
    cb: (args: T, origFunc: Function) => void | unknown | unknown[]
  ): () => void;
}

declare module "@vendetta/metro" {
  interface DCDChatManager {
    updateRows?: (...args: unknown[]) => void;
    clearRows?: (...args: unknown[]) => void;
    fadeIn?: (...args: unknown[]) => void;
    scrollToBottom?: (...args: unknown[]) => void;
    scrollToTop?: (...args: unknown[]) => void;
    scrollToRelativeOffset?: (...args: unknown[]) => void;
    scrollTo?: (...args: unknown[]) => void;
    scrollIntoView?: (...args: unknown[]) => void;
    customKeyboardWillShow?: (...args: unknown[]) => void;
    customKeyboardWillHide?: (...args: unknown[]) => void;
    focus?: (...args: unknown[]) => void;
    getConstants?: () => Record<string, unknown>;
  }
  
  interface ViewNativeModules {
    DCDChatManager?: DCDChatManager;
    [key: string]: unknown;
  }
  
  export function findByProps(...props: string[]): Record<string, unknown> & { NativeModules?: ViewNativeModules };
  export function findByName(name: string, defaultExp?: boolean): unknown;
}

declare module "@vendetta/metro/common" {
  export const ReactNative: { 
    processColor?: (color: string) => number;
    [key: string]: unknown;
  };
  export const Linking: { openURL: (url: string) => void };
  export const moment: any;
}

declare module "@vendetta/ui/components" {
  export const Forms: Record<string, unknown>;
  export const General: Record<string, unknown>;
  export const Text: Record<string, unknown>;
  export const View: Record<string, unknown>;
}

declare module "@vendetta/ui/assets" {
  export function getAssetIDByName(name: string): unknown;
}

declare module "@vendetta/storage" {
  export function useProxy(storage: unknown): void;
}

declare module "prismjs" {
  const Prism: { 
    highlight: (...args: unknown[]) => string | unknown[];
    languages: Record<string, unknown>;
  };
  export default Prism;
}