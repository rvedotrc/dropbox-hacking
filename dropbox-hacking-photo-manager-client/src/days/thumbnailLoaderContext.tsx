import * as React from "react";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import {
  ThumbnailsByRevResponse,
  type ThumbnailRequest,
  type ThumbnailResponse,
} from "dropbox-hacking-photo-manager-shared";
import { useWebsocket } from "../context/websocket";

export type ThumbnailLoader = {
  setWanted: (revs: string[]) => void;
  setUnwanted: (revs: string[]) => void;
  getThumbnail: (rev: string) => string | undefined;
};

const context = createContext<ThumbnailLoader | undefined>(undefined);

export const useThumbnailLoader = () => useContext(context);

type State = {
  cache: Map<string, string | undefined>;
  requesting: Set<string>;
  wanted: Set<string>;
};

const initialState = (): State => ({
  cache: new Map(),
  requesting: new Set(),
  wanted: new Set(),
});

const DISCARD_INVISIBLE_AFTER = 30000;

type Action =
  | never
  | { action: "set_wanted"; revs: string[]; wanted: boolean }
  | { action: "set_requesting"; revs: string[]; requesting: boolean }
  | {
      action: "store_thumbnails";
      items: { rev: string; thumbnail: string | undefined }[];
    }
  | { action: "discard_thumbnails"; revs: string[] };

const defaultThumbnailLoaderProvider = (props: PropsWithChildren<object>) => {
  const ws = useWebsocket();

  const [state, dispatch] = useReducer(
    (before: State, action: Action): State => {
      if (action.action === "set_wanted") {
        if (
          action.revs.every((rev) => before.wanted.has(rev) === action.wanted)
        )
          return before;

        const copy: State = { ...before, wanted: new Set(before.wanted) };
        action.revs.forEach((rev) =>
          action.wanted ? copy.wanted.add(rev) : copy.wanted.delete(rev),
        );
        return copy;
      } else if (action.action === "set_requesting") {
        if (action.revs.every((rev) => before.requesting.has(rev)))
          return before;

        const copy: State = {
          ...before,
          requesting: new Set(before.requesting),
        };
        action.revs.forEach((rev) =>
          action.requesting
            ? copy.requesting.add(rev)
            : copy.requesting.delete(rev),
        );
        return copy;
      } else if (action.action === "store_thumbnails") {
        if (action.items.length === 0) return before;

        const copy: State = { ...before, cache: new Map(before.cache) };
        action.items.forEach((item) =>
          copy.cache.set(item.rev, item.thumbnail),
        );
        return copy;
      } else if (action.action === "discard_thumbnails") {
        if (action.revs.length === 0) return before;

        const copy: State = { ...before, cache: new Map(before.cache) };
        action.revs.forEach((rev) => copy.cache.delete(rev));
        return copy;
      }

      throw `Huh? got ${action}`;
    },
    initialState(),
  );

  const loader: ThumbnailLoader = useMemo(
    () => ({
      setWanted: (revs: string[]) =>
        dispatch({ action: "set_wanted", revs, wanted: true }),
      setUnwanted: (revs: string[]) =>
        dispatch({ action: "set_wanted", revs, wanted: false }),
      getThumbnail: (rev: string): string | undefined =>
        state.cache.get(rev) ||
        // window.localStorage.getItem(`v1:t:128:${rev}`) ||
        undefined,
    }),
    [state],
  );

  // console.log("render loader ", loader, state);

  useEffect(() => {
    // console.log("loader effect");

    const shouldRequest = [...state.wanted]
      .filter((rev) => !state.requesting.has(rev))
      .filter((rev) => !state.cache.has(rev))
      // .filter((rev) => !window.localStorage[`v1:t:128:${rev}`])
      .sort();

    if (shouldRequest.length > 25) shouldRequest.splice(25);

    if (shouldRequest.length > 0) {
      console.log("Requesting ", shouldRequest);

      for (const rev of shouldRequest) {
        ws
          ?.simpleRequest<
            ThumbnailRequest,
            ThumbnailResponse
          >({ verb: "getThumbnail", rev, size: 128 })
          .then(
            (value) => {
              console.error(`Thumbnail ${rev} resolved:`, value);
            },
            (error) => {
              console.error(`Thumbnail ${rev} rejected:`, error);
            },
          );
      }

      fetch(`/api/thumbnail/128/revs/${shouldRequest.join(",")}`)
        .then((res) => res.json() as Promise<ThumbnailsByRevResponse>)
        .then((data) => {
          dispatch({
            action: "set_requesting",
            revs: shouldRequest,
            requesting: false,
          });
          dispatch({
            action: "store_thumbnails",
            items: shouldRequest.map((rev) => ({ rev, thumbnail: undefined })),
          });
          dispatch({
            action: "store_thumbnails",
            items: data.thumbnails_by_rev,
          });
          // for (const t of data.thumbnails_by_rev) {
          //   window.localStorage.setItem(`v1:t:128:${t.rev}`, t.thumbnail);
          // }
        });

      dispatch({
        action: "set_requesting",
        revs: shouldRequest,
        requesting: true,
      });
    }

    const shouldDiscard = [...state.cache.keys()]
      .filter((rev) => !state.wanted.has(rev))
      .sort();
    const t = setTimeout(() => {
      console.log("Discarding ", shouldDiscard);
      dispatch({ action: "discard_thumbnails", revs: shouldDiscard });
    }, DISCARD_INVISIBLE_AFTER);
    return () => clearTimeout(t);
  });

  return <context.Provider value={loader}>{props.children}</context.Provider>;
};

export default defaultThumbnailLoaderProvider;
