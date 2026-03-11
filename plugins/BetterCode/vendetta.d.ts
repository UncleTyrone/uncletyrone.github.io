/* Vendetta/Rain plugin runtime - provided by the host, not bundled */
declare module "@vendetta/plugin" {
  export const storage: Record<string, unknown>;
}
declare module "@vendetta/patcher" {
  export function before<T extends unknown[]>(obj: unknown, method: string, cb: (...args: T) => void): () => void;
  export function instead(...args: unknown[]): () => void;
}
declare module "@vendetta/metro" {
  interface DCDChatManager {
    updateRows?: (...args: unknown[]) => void;
  }
  interface ViewNativeModules {
    DCDChatManager?: DCDChatManager;
    [key: string]: unknown;
  }
  export function findByProps(...props: string[]): Record<string, unknown> & { NativeModules?: ViewNativeModules };
}
declare module "@vendetta/metro/common" {
  export const ReactNative: { processColor?: (color: string) => number };
  export const Linking: { openURL: (url: string) => void };
}
declare module "@vendetta/ui/components" {
  export const Forms: Record<string, unknown>;
  export const General: Record<string, unknown>;
}
declare module "@vendetta/ui/assets" {
  export function getAssetIDByName(name: string): unknown;
}
declare module "@vendetta/storage" {
  export function useProxy(storage: unknown): void;
}

declare module "prismjs" {
  const Prism: { highlight: (...args: unknown[]) => string | unknown[]; languages: Record<string, unknown> };
  export default Prism;
}
