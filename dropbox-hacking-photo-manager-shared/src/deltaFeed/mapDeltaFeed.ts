import type { DeltaApplier, DeltaMaker } from "./deltaFeed.js";

export type MapDelta<K, V> = readonly (
  | { readonly tag: "added"; readonly key: K; readonly newValue: V }
  | {
      readonly tag: "changed";
      readonly key: K;
      readonly oldValue: V;
      readonly newValue: V;
    }
  | { readonly tag: "deleted"; readonly key: K; readonly oldValue: V }
)[];

export const mapDeltaMaker =
  <K, V>(
    isUnchanged: (a: V, b: V) => boolean,
  ): DeltaMaker<ReadonlyMap<K, V>, MapDelta<K, V>> =>
  (previous: ReadonlyMap<K, V>, current: ReadonlyMap<K, V>) => {
    const deltas: MapDelta<K, V>[number][] = [];
    for (const [key, oldValue] of previous.entries()) {
      if (current.has(key)) {
        const newValue = current.get(key) as V;
        if (!isUnchanged(oldValue, newValue)) {
          deltas.push({ tag: "changed", key, oldValue, newValue });
        }
      } else {
        deltas.push({ tag: "deleted", key, oldValue });
      }
    }

    for (const [key, newValue] of current.entries()) {
      if (!previous.has(key)) {
        deltas.push({ tag: "added", key, newValue });
      }
    }

    return deltas;
  };

export const mapDeltaApplier =
  <K extends string, V>(): DeltaApplier<ReadonlyMap<K, V>, MapDelta<K, V>> =>
  (previousMap: ReadonlyMap<K, V>, delta: MapDelta<K, V>) => {
    const newMap = new Map(previousMap);

    for (const d of delta) {
      if (d.tag === "added" || d.tag === "changed") {
        newMap.set(d.key, d.newValue);
      } else if (d.tag === "deleted") {
        newMap.delete(d.key);
      } else {
        throw new Error("Protocol error");
      }
    }

    return newMap;
  };
