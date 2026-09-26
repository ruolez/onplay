import { useCallback, useEffect, useRef, useState } from "react";

export type AnchoredMenuPosition = {
  right: number;
  top?: number;
  bottom?: number;
};

// Spread on every trigger button: a mousedown on a trigger must not count as
// an outside click, or the trigger's own click would reopen the menu it closed
export const menuTriggerProps = { "data-menu-trigger": "" } as const;

/**
 * State for a dropdown rendered as a fixed-position portal next to a trigger.
 * A portal can't be clipped by scroll containers or painted under the
 * persistent player bar, but it doesn't follow its trigger, so the menu closes
 * on scroll and resize (and on outside click or Escape). It opens upward when
 * the space between the trigger and the player bar can't fit `menuHeight`.
 */
export function useAnchoredMenu(menuHeight = 256) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [pos, setPos] = useState<AnchoredMenuPosition | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpenId(null), []);

  const toggle = useCallback(
    (id: string, trigger: HTMLElement) => {
      const rect = trigger.getBoundingClientRect();
      const playerBarHeight =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--mini-player-height",
          ),
        ) || 0;
      const opensUp =
        window.innerHeight - playerBarHeight - rect.bottom < menuHeight;
      setPos({
        right: window.innerWidth - rect.right,
        ...(opensUp
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
      setOpenId((prev) => (prev === id ? null : id));
    },
    [menuHeight],
  );

  useEffect(() => {
    if (!openId) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Element;
      if (
        dropdownRef.current?.contains(target) ||
        target.closest?.("[data-menu-trigger]")
      ) {
        return;
      }
      close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [openId, close]);

  return { openId, pos, dropdownRef, toggle, close };
}
