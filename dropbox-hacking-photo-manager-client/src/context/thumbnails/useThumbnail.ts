import { useEffect, useReducer } from "react";
import type { ThumbnailLoader } from "./types";

type R = string | null;

type T =
  | { state: "idle"; visible: false; thumbnail: null }
  | { state: "loading"; visible: boolean; thumbnail: null }
  | { state: "loaded"; visible: true; thumbnail: R }
  | { state: "expiring"; visible: false; thumbnail: R; expiry: NodeJS.Timeout };

type A =
  | { action: "set_visibility"; visible: boolean }
  | { action: "loaded"; thumbnail: R }
  | { action: "expired" };

export const useThumbnail = (rev: string, loader: ThumbnailLoader) => {
  const [state, dispatch] = useReducer(
    (s: T, a: A): T => {
      if (s.state === "idle") {
        if (a.action === "set_visibility" && a.visible) {
          loader
            .getThumbnail(rev)
            .then((t) => dispatch({ action: "loaded", thumbnail: t }));
          return { state: "loading", visible: true, thumbnail: null };
        }
      }

      if (s.state === "loading") {
        if (a.action === "loaded") {
          return { state: "loaded", visible: true, thumbnail: a.thumbnail };
        } else if (a.action === "set_visibility" && !a.visible) {
          return { state: "loading", visible: false, thumbnail: null };
        }
      }

      if (s.state === "loaded") {
        if (a.action === "set_visibility" && !a.visible) {
          return {
            state: "expiring",
            visible: false,
            thumbnail: s.thumbnail,
            expiry: setTimeout(() => dispatch({ action: "expired" }), 30_000),
          };
        }
      }

      if (s.state === "expiring") {
        if (a.action === "expired") {
          return { state: "idle", visible: false, thumbnail: null };
        } else if (a.action === "set_visibility" && a.visible) {
          clearTimeout(s.expiry);
          return { state: "loaded", visible: true, thumbnail: s.thumbnail };
        }
      }

      return s;
    },
    {
      state: "idle",
      visible: false,
      thumbnail: null,
    },
  );

  return (isVisible: boolean): R => {
    useEffect(() => {
      if (isVisible !== state.visible)
        dispatch({ action: "set_visibility", visible: isVisible });
    });

    return state.thumbnail;
  };
};
