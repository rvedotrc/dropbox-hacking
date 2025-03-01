export interface DeltaMaker<T, D> {
  (previous: T, current: T): D;
}
export interface DeltaApplier<T, D> {
  (value: T, delta: D): T;
}

export type DeltaItem<T, D> =
  | { readonly tag: "initialState"; readonly state: T }
  | { readonly tag: "delta"; readonly delta: D };

export const compress = <T, D>(deltaMaker: DeltaMaker<T, D>) => {
  let previousValue: [T] | undefined = undefined;

  return (value: T): DeltaItem<T, D> => {
    if (previousValue === undefined) {
      previousValue = [value];
      return { tag: "initialState" as const, state: value };
    } else {
      const delta = deltaMaker(previousValue[0], value);
      previousValue = [value];

      return { tag: "delta" as const, delta };
    }
  };
};

export const expand = <T, D>(deltaApplier: DeltaApplier<T, D>) => {
  let previousValue: [T] | undefined = undefined;

  return (item: DeltaItem<T, D>): T => {
    if (previousValue === undefined && item.tag === "initialState") {
      previousValue = [item.state];
    } else if (previousValue !== undefined && item.tag === "delta") {
      previousValue = [deltaApplier(previousValue[0], item.delta)];
    } else {
      throw new Error("Invalid state");
    }

    return previousValue[0];
  };
};

export const expandWithImage = <T, D>(deltaApplier: DeltaApplier<T, D>) => {
  let previousValue: [T] | undefined = undefined;

  return (item: DeltaItem<T, D>): { image: T; delta?: D } => {
    if (previousValue === undefined && item.tag === "initialState") {
      previousValue = [item.state];
      return { image: item.state };
    } else if (previousValue !== undefined && item.tag === "delta") {
      previousValue = [deltaApplier(previousValue[0], item.delta)];
      return { image: previousValue[0], delta: item.delta };
    } else {
      throw new Error("Invalid state");
    }
  };
};
