import { useLayoutEffect, type RefObject } from "react";

// Publishes an element's measured height as a root CSS variable so other
// fixed elements (bottom nav, mini player, page padding) can stack without
// hardcoded pixel constants. Resolves to 0px when disabled or unmounted.
export function useHeightVar(
  ref: RefObject<HTMLElement | null>,
  varName: string,
  enabled = true,
) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const el = ref.current;
    if (!enabled || !el) {
      root.style.setProperty(varName, "0px");
      return;
    }
    const update = () =>
      root.style.setProperty(varName, `${el.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.setProperty(varName, "0px");
    };
  }, [ref, varName, enabled]);
}
