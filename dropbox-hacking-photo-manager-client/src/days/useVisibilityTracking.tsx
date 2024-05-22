import { DependencyList, RefObject, useEffect } from "react";

const useVisibilityTracking = ({
  parentRef,
  listItemDataAttribute,
  onVisibleItems,
  deps,
}: {
  parentRef: RefObject<HTMLElement>;
  listItemDataAttribute: string;
  onVisibleItems: (visible: Set<string>) => void;
  deps?: DependencyList | undefined;
}) =>
  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    console.log("Start scroll tracking for ", parent);

    const onScrollStopped = () => {
      // console.log("scroll has stopped");
      // console.log(
      //   `window sY=${window.scrollY} sT=${window.screenTop} iH=${window.innerHeight} oH=${window.outerHeight}`,
      // );

      // const body = document.body;
      // console.log(
      //   `body oH/T=${body.offsetHeight}/${body.offsetTop} sH/T=${body.scrollHeight}/${body.scrollTop} cH/T=${body.clientHeight}/${body.clientTop}`,
      // );

      // console.log(
      //   `ol oH/T=${ol.offsetHeight}/${ol.offsetTop} sH/T=${ol.scrollHeight}/${ol.scrollTop} cH/T=${ol.clientHeight}/${ol.clientTop}`,
      // );

      const children = [...parent.childNodes].filter(
        (child) => child.nodeType === Node.ELEMENT_NODE,
      ) as HTMLElement[];

      // Each item is either above the viewport, or below it, or overlapping.
      // Above, overlapping, below, in that order.
      // We need to find the ones which are overlapping.

      const queryElement = (element: HTMLElement) => {
        const box = element.getBoundingClientRect();

        const answer =
          box.bottom < 0 ? -1 : box.top > window.innerHeight ? +1 : 0;

        // console.log(`i=${i} ${answer} date=${countsByDate?.[i].date} box t/b/y/h=${box.top}/${box.bottom}/${box.y}/${box.height}`);
        return answer;
      };

      // console.log(
      //   `window screenY=${window.screenY} screenTop=${window.screenTop} scrollY=${window.scrollY} innerHeight=${window.innerHeight} outerHeight=${window.outerHeight}`,
      // );
      // const v = (window as any).visualViewport;
      // console.log(`v h=${v.height} oT=${v.offsetTop} pageTop=${v.pageTop}`);
      const visibleItems = children
        .filter((child) => queryElement(child) === 0)
        .map((item) => item.getAttribute(listItemDataAttribute) as string);

      onVisibleItems(new Set(visibleItems));
    };

    let timer = window.setTimeout(onScrollStopped, 500);

    const listener = (_event: Event) => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(onScrollStopped, 500);
    };

    window.addEventListener("scroll", listener);
    window.addEventListener("resize", listener);
    parent.addEventListener("resize", listener);

    return () => {
      console.log("Stop scroll tracking for ", parent);
      window.removeEventListener("scroll", listener);
      window.removeEventListener("resize", listener);
      parent.removeEventListener("resize", listener);
      if (timer) window.clearTimeout(timer);
    };
  }, deps);

export default useVisibilityTracking;
