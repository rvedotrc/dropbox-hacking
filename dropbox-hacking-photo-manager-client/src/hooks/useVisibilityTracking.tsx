import { RefObject, useEffect, useMemo } from "react";
import { type Observable, ReplaySubject } from "rxjs";

const scrollStationaryTimeout = 200;

const useVisibilityTracking = ({
  parentRef,
  listItemDataAttribute,
}: {
  parentRef: RefObject<HTMLElement | null>;
  listItemDataAttribute: string;
}): Observable<ReadonlySet<string>> => {
  const subject = useMemo(() => new ReplaySubject<ReadonlySet<string>>(1), []);

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

      subject.next(new Set(visibleItems));
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
      window.removeEventListener("scroll", listener);
      window.removeEventListener("resize", listener);
      parent.removeEventListener("resize", listener);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return subject;
};

export default useVisibilityTracking;
