import { DependencyList, RefObject, useEffect } from "react";

const scrollStationaryTimeout = 200;

const useVisibilityTracking = ({
  parentRef,
  listItemDataAttribute,
  onVisibleItems,
  deps,
}: {
  parentRef: RefObject<HTMLElement | null>;
  listItemDataAttribute: string;
  onVisibleItems: (visible: Set<string>) => void;
  deps: DependencyList | undefined;
}): void =>
  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const onScrollStopped = () => {
      const children = [...parent.childNodes].filter(
        (child) => child.nodeType === Node.ELEMENT_NODE,
      ) as HTMLElement[];

      const queryElement = (element: HTMLElement) => {
        const box = element.getBoundingClientRect();

        const answer =
          box.bottom < 0 ? -1 : box.top > window.innerHeight ? +1 : 0;

        return answer;
      };

      const visibleItems = children
        .filter((child) => queryElement(child) === 0)
        .map((item) => item.getAttribute(listItemDataAttribute) as string);

      onVisibleItems(new Set(visibleItems));
    };

    let timer = window.setTimeout(onScrollStopped, scrollStationaryTimeout);

    const listener = (_event: Event) => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(onScrollStopped, scrollStationaryTimeout);
    };

    window.addEventListener("scroll", listener);
    window.addEventListener("resize", listener);
    parent.addEventListener("resize", listener);

    return () => {
      // console.log("Stop scroll tracking for ", parent);
      window.removeEventListener("scroll", listener);
      window.removeEventListener("resize", listener);
      parent.removeEventListener("resize", listener);
      if (timer) window.clearTimeout(timer);
    };
  }, deps);

export default useVisibilityTracking;
