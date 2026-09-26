import { useEffect, useRef } from "react";

/**
 * Global tracking of active modal count to safely support nested and sequential modals
 * without accidentally wiping out body overflow styles or permanently locking scrolling.
 */
let activeModalsCount = 0;
let initialScrollY = 0;

export interface UseModalScrollLockOptions {
  restoreScroll?: boolean;
  scrollToTopOnClose?: boolean;
}

/**
 * Forcibly resets body and html scroll styles to normal (unlocked).
 * Safe to call upon route navigation or modal teardown as a failsafe.
 */
export function forceUnlockBodyScroll() {
  activeModalsCount = 0;
  if (typeof document === "undefined") return;
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  document.documentElement.style.overflow = "";
}

/**
 * Custom hook to safely manage body scroll locking, scroll position preservation,
 * and prevent focus/scroll jumps when modals open and close.
 */
export function useModalScrollLock(
  isOpen: boolean,
  onClose?: () => void,
  options?: UseModalScrollLockOptions,
) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const scrollYRef = useRef<number>(0);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined" || typeof document === "undefined") return;

    // 1. Capture current scroll position and active element before modal takes over
    const currentY =
      window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    scrollYRef.current = currentY;

    if (document.activeElement instanceof HTMLElement) {
      previousActiveElementRef.current = document.activeElement;
    }

    // 2. Lock body scroll with reference counting so nested modals don't conflict
    if (activeModalsCount === 0) {
      initialScrollY = currentY;
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
    }
    activeModalsCount++;

    // 3. Handle escape key to close if onClose provided
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onCloseRef.current) {
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      // 4. Unlock body scroll when all modals have closed
      activeModalsCount = Math.max(0, activeModalsCount - 1);
      if (activeModalsCount === 0) {
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
        document.documentElement.style.overflow = "";
      }

      // 5. Safely restore focus to previous trigger element without blur() on active element
      if (
        previousActiveElementRef.current &&
        document.body.contains(previousActiveElementRef.current)
      ) {
        try {
          previousActiveElementRef.current.focus({ preventScroll: true });
        } catch {
          // Ignore focus errors
        }
      }

      // 6. Handle scroll position restoration
      const opt = optionsRef.current;
      if (opt?.scrollToTopOnClose) {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "smooth",
        });
      } else if (opt?.restoreScroll === false) {
        // Intentionally keep current position
      } else if (activeModalsCount === 0) {
        // Restore scroll position cleanly when the last modal closes
        const targetY = scrollYRef.current || initialScrollY;
        window.scrollTo({
          top: targetY,
          left: 0,
          behavior: "instant" as ScrollBehavior,
        });
      }
    };
  }, [isOpen]);
}
