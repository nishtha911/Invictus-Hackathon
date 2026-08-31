import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * React 19 / Next.js hydration-safe mounting hook.
 * Returns false on SSR, true on Client after initial mount.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
