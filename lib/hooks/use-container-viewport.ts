import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

export type Box = "border-box" | "content-box";

export interface ContainerViewport {
  containerRef: RefObject<HTMLDivElement | null>;
  width: number;
  height: number;
}

/**
 * Measures a container's current viewport size using ResizeObserver.
 * - box: "border-box" returns clientWidth/clientHeight (includes padding)
 * - box: "content-box" subtracts computed padding from clientWidth/Height
 */
export function useContainerViewport(
  box: Box = "content-box"
): ContainerViewport {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const computeSize = () => {
      const clientWidth = el.clientWidth;
      const clientHeight = el.clientHeight;

      if (box === "content-box") {
        const styles = getComputedStyle(el);
        const paddingX =
          parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
        const paddingY =
          parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
        const contentWidth = Math.max(0, clientWidth - paddingX);
        const contentHeight = Math.max(0, clientHeight - paddingY);
        setSize({ width: contentWidth, height: contentHeight });
      } else {
        setSize({ width: clientWidth, height: clientHeight });
      }
    };

    computeSize();
    const ro = new ResizeObserver(computeSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [box]);

  return { containerRef, width: size.width, height: size.height };
}
