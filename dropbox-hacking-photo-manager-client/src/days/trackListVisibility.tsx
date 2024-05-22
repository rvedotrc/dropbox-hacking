import { DependencyList, RefObject, useEffect } from "react";

const useVisibilityTracking = (
  olRef: RefObject<HTMLOListElement>,
  listItemDataAttribute: string,
  setVisibleDates: (range: [string, string]) => void,
  deps?: DependencyList | undefined,
) =>
  useEffect(() => {
    const ol = olRef.current;
    if (!ol) return;

    console.log("Start scroll tracking for ", ol);

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

      const items = [...ol.childNodes] as HTMLLIElement[];

      // Each item is either above the viewport, or below it, or overlapping.
      // Above, overlapping, below, in that order.
      // We need to find the ones which are overlapping.

      const queryItem = (i: number) => {
        // if (i > 20) return +1;

        const element = items[i];
        if (!element) throw "No item";

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
      const q = items.map((_ele, i) => queryItem(i));
      // console.log(`q = ${q.join(" ")}`);
      const min = q.indexOf(0);
      const max = q.lastIndexOf(0);

      setVisibleDates([
        items[min].getAttribute(listItemDataAttribute) as string,
        items[max].getAttribute(listItemDataAttribute) as string,
      ]);
    };

    let timer = window.setTimeout(onScrollStopped, 500);

    const listener = (_event: Event) => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(onScrollStopped, 500);
    };

    window.addEventListener("scroll", listener);
    window.addEventListener("resize", listener);
    ol.addEventListener("resize", listener);

    return () => {
      console.log("Stop scroll tracking for ", ol);
      window.removeEventListener("scroll", listener);
      window.removeEventListener("resize", listener);
      ol.removeEventListener("resize", listener);
      if (timer) window.clearTimeout(timer);
    };
  }, deps);

export default useVisibilityTracking;
