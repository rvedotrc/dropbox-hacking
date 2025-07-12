import type { DeltaApplier, DeltaMaker } from "./deltaFeed.js";

export type RecordDelta<K extends string, V> = (
  | { tag: "added"; key: K; newValue: V }
  | { tag: "changed"; key: K; oldValue: V; newValue: V }
  | { tag: "removed"; key: K; oldValue: V }
)[];

export const recordDeltaMaker =
  <K extends string, V>(
    isUnchanged: (a: V, b: V) => boolean,
  ): DeltaMaker<Record<K, V>, RecordDelta<K, V>> =>
  (previous: Record<K, V>, current: Record<K, V>) => {
    const deltas: RecordDelta<K, V> = [];
    for (const [key, oldValue] of Object.entries(previous) as [K, V][]) {
      if (key in current) {
        const newValue = current[key];
        if (!isUnchanged(oldValue, newValue)) {
          deltas.push({ tag: "changed", key, oldValue, newValue });
        }
      } else {
        deltas.push({ tag: "removed", key, oldValue });
      }
    }

    for (const [key, newValue] of Object.entries(current) as [K, V][]) {
      if (!(key in previous)) {
        deltas.push({ tag: "added", key, newValue });
      }
    }

    return deltas;
  };

export const recordDeltaApplier =
  <K extends string, V>(): DeltaApplier<Record<K, V>, RecordDelta<K, V>> =>
  (previousRecord: Record<K, V>, delta: RecordDelta<K, V>) => {
    const newRecord = { ...previousRecord };

    for (const d of delta) {
      if (d.tag === "added" || d.tag === "changed") {
        newRecord[d.key] = d.newValue;
      } else if (d.tag === "removed") {
        delete newRecord[d.key];
      } else {
        throw new Error("Protocol error");
      }
    }

    return newRecord;
  };
